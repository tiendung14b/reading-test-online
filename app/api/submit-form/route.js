import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { formUrl, payload, fbzx } = await request.json();

    if (!formUrl || typeof formUrl !== 'string') {
      return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 });
    }

    // Standardize URL to /formResponse
    let actionUrl = formUrl.trim().split('?')[0];
    if (actionUrl.endsWith('/viewform')) {
      actionUrl = actionUrl.replace(/\/viewform$/, '/formResponse');
    } else if (actionUrl.endsWith('/edit') || actionUrl.endsWith('/closedform')) {
      actionUrl = actionUrl.replace(/\/(edit|closedform)$/, '/formResponse');
    } else if (!actionUrl.endsWith('/formResponse')) {
      const match = actionUrl.match(/(https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?[^/]+)/);
      if (match) {
        actionUrl = `${match[1]}/formResponse`;
      }
    }

    const formBody = new URLSearchParams();

    // Required Google Form system fields
    formBody.append('fvv', '1');
    formBody.append('pageHistory', '0');
    if (fbzx) {
      formBody.append('fbzx', String(fbzx));
    } else {
      // Generate realistic 19-digit negative fbzx token if missing
      const randomFbzx = '-' + Math.floor(Math.random() * 900000000000000000 + 100000000000000000);
      formBody.append('fbzx', randomFbzx);
    }

    // Append form field values
    if (payload && typeof payload === 'object') {
      Object.entries(payload).forEach(([key, val]) => {
        if (!key.startsWith('entry.')) return;

        if (Array.isArray(val)) {
          val.forEach((item) => formBody.append(key, String(item)));
        } else if (typeof val === 'string') {
          formBody.append(key, val);
        } else if (val !== null && val !== undefined) {
          formBody.append(key, String(val));
        }
      });
    }

    // Server-to-Server POST submission to Google Form
    const response = await fetch(actionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': actionUrl.replace(/\/formResponse$/, '/viewform')
      },
      body: formBody.toString()
    });

    const responseText = await response.text();

    // Check if Google Form responded with success page
    const isSuccess = response.ok || 
                      responseText.includes('ghi nhận') || 
                      responseText.includes('recorded') || 
                      responseText.includes('formResponse');

    if (!isSuccess && response.status >= 400) {
      return NextResponse.json({ 
        error: `Google Form phản hồi HTTP ${response.status}` 
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      message: 'Đã nộp thành công lên Google Form!'
    });

  } catch (error) {
    console.error('Submit Form Server Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server khi nộp Form' }, { status: 500 });
  }
}
