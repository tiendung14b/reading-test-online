import { NextResponse } from 'next/server';
import { AIService } from '@/lib/gemini';

export async function GET() {
  try {
    const isAvailable = await AIService.hasAvailableTokens();
    return NextResponse.json({ success: true, hasTokens: isAvailable });
  } catch (error) {
    return NextResponse.json({ success: false, hasTokens: false });
  }
}
