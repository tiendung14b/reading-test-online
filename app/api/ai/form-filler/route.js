import { NextResponse } from 'next/server';
import { AIService } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { formTopic, persona, fields, count } = await request.json();

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'Danh sách các trường (fields) không được để trống' },
        { status: 400 }
      );
    }

    const numCount = Math.min(Math.max(parseInt(count) || 5, 1), 50);

    const generatedData = await AIService.generateFormResponses(
      formTopic || '',
      persona || '',
      fields,
      numCount
    );

    return NextResponse.json({ success: true, data: generatedData });
  } catch (error) {
    console.error('Form Filler AI Error:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi khi sinh dữ liệu bằng AI' },
      { status: 500 }
    );
  }
}
