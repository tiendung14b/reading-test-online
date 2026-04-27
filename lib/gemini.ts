import { GoogleGenAI } from '@google/genai';
import { getDb } from '@/lib/db';

const CHEAPEST_MODEL = 'gemini-3-flash-preview';

async function getAvailableTokens() {
  const db = await getDb();
  const result = await db.execute('SELECT * FROM api_keys');
  const tokens = result.rows;
  
  const today = new Date().toISOString().split('T')[0];
  let available = [];
  
  for (let token of tokens) {
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

async function executeWithTokenRotation(action: (ai: GoogleGenAI) => Promise<any>) {
  const availableTokens = await getAvailableTokens();
  
  if (availableTokens.length === 0) {
    throw new Error('NO_TOKENS_AVAILABLE');
  }

  for (let tokenObj of availableTokens) {
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
    } catch (err: any) {
      console.error(`Token ${tokenObj.id} failed:`, err.message);
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
   * @param topic Chủ đề của bài tập (ví dụ: Môi trường, Lịch sử, Công nghệ...)
   * @param difficulty Mức độ khó (ví dụ: Cơ bản, Nâng cao, B1, IELTS 6.0...)
   * @param exerciseType Dạng bài tập (ví dụ: Trắc nghiệm, Điền từ, Đọc hiểu...)
   * @param numberOfQuestions Số lượng câu hỏi muốn tạo
   * @returns JSON chứa nội dung bài tập và đáp án
   */
  async generateExercises(topic: string, difficulty: string, exerciseType: string, numberOfQuestions: number = 5) {
    const prompt = `
Bạn là một chuyên gia ra đề thi tiếng Anh. Hãy tạo một bộ bài tập với các yêu cầu cụ thể sau:
- Chủ đề (Topic): ${topic}
- Mức độ khó (Difficulty): ${difficulty}
- Dạng bài tập (Type): ${exerciseType}
- Số lượng câu hỏi: ${numberOfQuestions} câu

Yêu cầu:
- Tự động sinh ra một đoạn văn bản (Passage) làm nội dung chính của bài tập. Nếu là bài đọc hiểu, viết một đoạn văn. Nếu là cloze test, viết đoạn văn và đục lỗ [1], [2]... Nếu là rewriting, có thể để trống hoặc viết một vài dòng hướng dẫn.
- Đưa ra ${numberOfQuestions} câu hỏi tương ứng. Nếu là trắc nghiệm hoặc cloze, cung cấp 4 lựa chọn A, B, C, D và đáp án đúng.
- Nếu là tự luận/viết lại câu, phần options để trống, và đáp án đúng ghi nội dung câu trả lời.

Hãy trả về định dạng JSON CHÍNH XÁC cấu trúc sau (không có markdown code block, chỉ có JSON thô):
{
  "title": "<Tiêu đề bài tập ngắn gọn>",
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
  }
};
