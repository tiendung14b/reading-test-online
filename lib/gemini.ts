import { GoogleGenAI } from '@google/genai';
import { getDb } from '@/lib/db';

const CHEAPEST_MODEL = 'gemini-3-flash-preview';

async function getAvailableTokens() {
  const db = await getDb();
  const result = await db.execute('SELECT * FROM api_keys');
  const tokens = result.rows;
  
  const today = new Date().toISOString().split('T')[0];
  const available = [];
  
  for (const token of tokens) {
    let usage = token.usage_count;
    if (token.last_access_date !== today) {
      // Reset usage if it's a new day
      await db.execute({
        sql: 'UPDATE api_keys SET usage_count = 0, last_access_date = ? WHERE id = ?',
        args: [today, token.id]
      });
      usage = 0;
    }
    if (usage < token.daily_limit) {
      available.push({ ...token, usage_count: usage });
    }
  }
  
  return available;
}

async function executeWithTokenRotation(action: (ai: GoogleGenAI) => Promise<unknown>) {
  const availableTokens = await getAvailableTokens();
  
  if (availableTokens.length === 0) {
    throw new Error('NO_TOKENS_AVAILABLE');
  }

  for (const tokenObj of availableTokens) {
    try {
      const ai = new GoogleGenAI({ apiKey: tokenObj.token as string });
      const result = await action(ai);
      
      // Update usage
      const db = await getDb();
      await db.execute({
        sql: 'UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = ?',
        args: [tokenObj.id]
      });

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Token ${tokenObj.id} failed:`, errorMessage);
      // If it's the last token, throw
      if (tokenObj === availableTokens[availableTokens.length - 1]) {
        throw new Error('ALL_TOKENS_FAILED');
      }
    }
  }
}


export const AIService = {
  /**
   * Hỗ trợ chấm bài tập cho một danh sách câu trả lời
   * @param submissions Danh sách các câu hỏi và câu trả lời tương ứng (có thể kèm đáp án tham khảo)
   * @returns Mảng kết quả chấm điểm (score: boolean, feedback, corrections)
   */
  async gradeExercises(submissions: { question: string, studentAnswer: string, referenceAnswer?: string }[]) {
    const prompt = `
Các bài tập viết lại câu, hãy linh hoạt: nếu câu trả lời đúng về ngữ pháp và giữ nguyên ý nghĩa của câu gốc/đáp án (nếu có) thì vẫn tính là đúng (score: true).

Danh sách cần chấm:
${submissions.map((s, i) => `
STT: ${i + 1}
Câu hỏi: ${s.question}
Câu trả lời của học sinh: ${s.studentAnswer}
${s.referenceAnswer ? `Đáp án tham khảo: ${s.referenceAnswer}` : ''}
`).join('\n---\n')}

Trả về kết quả là một mảng các đối tượng khớp với thứ tự đầu vào:
[
  {
    "score": <true nếu đúng, false nếu sai>,
    "correction": <html đánh dấu câu trả lời sai và gợi ý cách sửa (nếu sai)>. Nếu câu trả lời đúng thì correction để trống.
  },
]
`;
    
    try {
      return await executeWithTokenRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: CHEAPEST_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });
        return JSON.parse(response.text || '[]');
      });
    } catch (error) {
      console.error("Lỗi khi chấm bài bằng AI:", error);
      throw error;
    }
  },

  /**
   * Tạo ra các dạng bài tập mới
  /**
   * Tạo ra các dạng bài tập mới
   * @param topic Chủ đề của bài tập (ví dụ: Môi trường, Lịch sử, Công nghệ...)
   * @param difficulty Mức độ khó (ví dụ: Cơ bản, Nâng cao, B1, IELTS 6.0...)
   * @param exerciseType Dạng bài tập (ví dụ: Trắc nghiệm, Điền từ, Đọc hiểu...)
   * @param numberOfQuestions Số lượng câu hỏi muốn tạo
   * @param description Mô tả chi tiết yêu cầu
   * @returns JSON chứa nội dung bài tập và đáp án
   */
  async generateExercises(topic: string, difficulty: string, exerciseType: string, numberOfQuestions: number = 5, description: string = '') {
    const prompt = `
Bạn là một chuyên gia ra đề thi tiếng Anh. Hãy tạo một bộ bài tập với các yêu cầu cụ thể sau:
- Chủ đề (Topic): ${topic}
- Mức độ khó (Difficulty): ${difficulty}
- Dạng bài tập (Type): ${exerciseType}
- Số lượng câu hỏi: ${numberOfQuestions} câu
${description ? `- Yêu cầu bổ sung: ${description}` : ''}

Yêu cầu:
- Tự động sinh ra một đoạn văn bản (Passage) làm nội dung chính của bài tập. Nếu là bài đọc hiểu, viết một đoạn văn. Nếu là cloze test, viết đoạn văn và đục lỗ [1], [2]... Nếu là rewriting, có thể để trống hoặc viết một vài dòng hướng dẫn.
- Đưa ra ${numberOfQuestions} câu hỏi tương ứng. Nếu là trắc nghiệm hoặc cloze, cung cấp 4 lựa chọn A, B, C, D và đáp án đúng.
- Nếu là tự luận/viết lại câu, phần options để trống, và đáp án đúng ghi nội dung câu trả lời.

Hãy trả về định dạng JSON CHÍNH XÁC cấu trúc sau (không có markdown code block, chỉ có JSON thô):
{
  "title": "${topic}",
  "content": "<Nội dung đoạn văn / bài đọc (nếu có)>",
  "questions": [
    {
      "question_text": "<Nội dung câu hỏi hoặc phần đầu của câu viết lại>",
      "options": {
        "A": "<đáp án A>",
        "B": "<đáp án B>",
        "C": "<đáp án C>",
        "D": "<đáp án D>"
      },
      "correct_answer": "<A, B, C, D hoặc nội dung câu đúng nếu không phải trắc nghiệm>"
    }
  ]
}
`;

    try {
      return await executeWithTokenRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: CHEAPEST_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7, // Tăng nhẹ để đa dạng hóa nội dung bài tập
          }
        });
        return JSON.parse(response.text || '{}');
      });
    } catch (error) {
      console.error("Lỗi khi tạo bài tập bằng AI:", error);
      throw error;
    }
  },

  /**
   * Kiểm tra xem còn token nào khả dụng không
   */
  async hasAvailableTokens() {
    try {
      const availableTokens = await getAvailableTokens();
      return availableTokens.length > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Chat với AI về bài tập
   */
  async chatWithExerciseContext(exerciseContext: string, history: {role: string, text: string}[], message: string) {
    const systemPrompt = `Bạn là một gia sư tiếng Anh thân thiện, nhiệt tình và chuyên nghiệp. Học sinh đang hỏi bạn về bài tập họ vừa làm.
Hãy trả lời ngắn gọn, dễ hiểu, tập trung trực tiếp vào câu hỏi. Khuyến khích người học.

Sử dụng định dạng Markdown để làm nổi bật nội dung:
- Dùng **chữ đậm** cho các từ vựng quan trọng hoặc điểm ngữ pháp cần lưu ý.
- Dùng \`mã cố định\` cho các ví dụ câu hoặc cấu trúc cụ thể.
- Có thể dùng danh sách (bullet points) nếu cần giải thích nhiều ý.

Dưới đây là chi tiết bài tập (Nội dung, Câu hỏi, Đáp án của học sinh, Đáp án đúng):
====================
${exerciseContext}
====================

Dựa vào thông tin bài tập trên, hãy trả lời câu hỏi của học sinh.`;

    // Convert history format to genai contents
    // If history is empty, we prepend systemPrompt to the new message.
    // If history is not empty, we need to ensure the first message contains the systemPrompt.
    
    const contents: { role: string; parts: { text: string }[] }[] = [];
    
    if (history.length === 0) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt + '\n\nCâu hỏi của học sinh: ' + message }] });
    } else {
      // Build history
      for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        if (i === 0 && msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: systemPrompt + '\n\nCâu hỏi của học sinh: ' + msg.text }] });
        } else {
          contents.push({ role: msg.role === 'ai' ? 'model' : 'user', parts: [{ text: msg.text }] });
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    try {
      return await executeWithTokenRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: CHEAPEST_MODEL,
          contents: contents,
          config: {
            temperature: 0.7,
          }
        });
        return response.text;
      });
    } catch (error) {
      console.error("Lỗi khi chat với AI:", error);
      throw error;
    }
  },

  /**
   * Tạo nội dung bài học (Lesson) bằng AI
   * @param topic Chủ đề bài học
   * @param lessonType Loại bài học (Ví dụ: Viết thư, Làm văn, Đọc hiểu, Ngữ pháp...)
   * @param difficulty Mức độ (Cơ bản, Nâng cao, B1, IELTS...)
   * @param instructions Các yêu cầu bổ sung khác
   * @param language Ngôn ngữ của bài giảng (Vietnamese hoặc English)
   * @returns JSON chứa title, topic và content (HTML)
   */
  async generateLessonContent(topic: string, lessonType: string, difficulty: string, instructions: string = '', language: string = 'Vietnamese') {
    const prompt = `
Bạn là một chuyên gia soạn giáo trình tiếng Anh chuyên nghiệp. Hãy soạn một bài học chất lượng cao bằng ngôn ngữ ${language} dựa trên các thông tin sau:
- Chủ đề: ${topic}
- Loại bài học: ${lessonType}
- Mức độ: ${difficulty}
- Ngôn ngữ giảng dạy chính: ${language}
${instructions ? `- Yêu cầu cụ thể: ${instructions}` : ''}

Yêu cầu về nội dung:
1. Toàn bộ bài giảng (giải thích, hướng dẫn, phân tích) phải được viết bằng ${language}. Tuy nhiên, các ví dụ, từ vựng, bài mẫu (nếu là tiếng Anh) thì phải giữ nguyên tiếng Anh kèm theo dịch nghĩa/giải thích bằng ${language} nếu cần.
2. Nội dung phải chuyên sâu, trình bày khoa học và dễ hiểu.
2. Nếu là dạng bài viết (Thư, Essay), hãy bao gồm:
   - Cấu trúc (Structure) của dạng bài đó.
   - Các từ vựng/mẫu câu hữu ích (Useful language).
   - Một bài mẫu hoàn chỉnh (Model answer/Sample).
3. Nếu là dạng kiến thức (Ngữ pháp, Reading), hãy bao gồm các phần giải thích rõ ràng kèm ví dụ minh họa.

Yêu cầu về định dạng:
- TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON CHÍNH XÁC (không có markdown code block).
- Trường 'content' phải là nội dung HTML hoàn chỉnh, sử dụng các thẻ:
  - <h1>, <h2>, <h3> cho các tiêu đề.
  - <p> cho đoạn văn.
  - <ul>, <li> cho danh sách.
  - <blockquote> cho các ghi chú hoặc lời khuyên quan trọng.
  - <b> hoặc <i> cho các từ vựng hoặc cấu trúc ngắn.
  - <table> nếu cần so sánh hoặc liệt kê có cấu trúc.
- Nội dung HTML phải ĐẸP và CHUẨN tiptap để hiển thị trực tiếp.

Cấu trúc JSON:
{
  "title": "<Tiêu đề bài học hấp dẫn>",
  "topic": "${topic}",
  "content": "<Nội dung HTML hoàn chỉnh>"
}
`;

    try {
      return await executeWithTokenRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: CHEAPEST_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.8,
          }
        });
        return JSON.parse(response.text || '{}');
      });
    } catch (error) {
      console.error("Lỗi khi tạo bài học bằng AI:", error);
      throw error;
    }
  },

  /**
   * Sinh hàng loạt dữ liệu câu trả lời cho Google Form dựa trên ngữ cảnh và cấu hình trường
   */
  async generateFormResponses(
    formTopic: string,
    persona: string,
    fields: { id: string; entryId: string; label: string; type: string; options?: string }[],
    count: number = 5
  ) {
    const fieldsDesc = fields.map((f, i) => {
      let typeInfo = f.type;
      if (f.type === 'custom_choice') typeInfo += ` (Các lựa chọn có sẵn: ${f.options || 'Lựa chọn 1, Lựa chọn 2'})`;
      if (f.type === 'number_range') typeInfo += ` (Khoảng số: ${f.options || '1,5'})`;
      return `- Trường #${i + 1} [Entry ID: ${f.entryId}]: "${f.label || f.entryId}" | Loại: ${typeInfo}`;
    }).join('\n');

    const prompt = `
Bạn là một trợ lý AI chuyên tạo dữ liệu ảo thực tế cho các cuộc khảo sát Google Form bằng tiếng Việt.
Chủ đề / Ngữ cảnh khảo sát: ${formTopic || 'Khảo sát chung'}
Yêu cầu về đối tượng / Thái độ / Persona: ${persona || 'Đa dạng, tự nhiên, chân thực'}

Danh sách các trường cần sinh dữ liệu (${fields.length} trường):
${fieldsDesc}

Yêu cầu:
1. Hãy sinh đúng ${count} dòng dữ liệu (mỗi dòng đại diện cho 1 câu trả lời đầy đủ của 1 người tham gia khảo sát).
2. Tên người Việt Nam, Email, Số điện thoại phải thực tế và hợp lý. Email nên tương ứng với tên.
3. Các ý kiến/nhận xét/góp ý (trường dạng comment/dạng chữ tự do) phải viết phong phú, tự nhiên, đúng ngữ cảnh chủ đề, tránh trùng lặp từ ngữ giữa các người điền.
4. Với các trường trắc nghiệm (custom_choice), CHỈ CHỌN 1 trong các lựa chọn có sẵn đã liệt kê.
5. Với các trường khoảng số (number_range), CHỈ ĐƯA RA giá trị nằm trong khoảng quy định.
6. Kết quả trả về là một mảng JSON CHÍNH XÁC chứa ${count} đối tượng. Mỗi đối tượng là key-value với key là "entryId" (ví dụ: "entry.1000001") và value là giá trị trả lời tương ứng.

Cấu trúc JSON mong muốn:
[
  {
    "${fields[0]?.entryId || 'entry.1'}": "<Giá trị tương ứng>",
    ...
  }
]
`;

    try {
      return await executeWithTokenRotation(async (ai) => {
        const response = await ai.models.generateContent({
          model: CHEAPEST_MODEL,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.85,
          }
        });
        return JSON.parse(response.text || '[]');
      });
    } catch (error) {
      console.error("Lỗi khi sinh dữ liệu form bằng AI:", error);
      throw error;
    }
  }
};
