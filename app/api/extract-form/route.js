import { NextResponse } from 'next/server';

function normalizeGoogleFormUrl(rawUrl) {
  let url = rawUrl.trim();

  // Shortened forms.gle URL -> fetch directly to let redirect follow it
  if (url.includes('forms.gle')) {
    return url;
  }

  // Remove query parameters
  const base = url.split('?')[0];

  if (base.endsWith('/formResponse') || base.endsWith('/edit') || base.endsWith('/closedform')) {
    return base.replace(/\/(formResponse|edit|closedform)$/, '/viewform');
  }

  if (base.endsWith('/viewform')) {
    return base;
  }

  // Match standard docs.google.com/forms/d/e/{ID}/ or docs.google.com/forms/d/{ID}/
  const match = base.match(/(https:\/\/docs\.google\.com\/forms\/d\/(?:e\/)?[^/]+)/);
  if (match) {
    return `${match[1]}/viewform`;
  }

  return url;
}

export async function POST(request) {
  try {
    const { formUrl } = await request.json();

    if (!formUrl || typeof formUrl !== 'string') {
      return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 });
    }

    const targetUrl = normalizeGoogleFormUrl(formUrl);
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
    };

    let response = await fetch(targetUrl, { headers, redirect: 'follow' });

    // Fallback: If normalized URL returns HTTP 404, try the raw formUrl directly
    if (!response.ok && targetUrl !== formUrl.trim()) {
      response = await fetch(formUrl.trim(), { headers, redirect: 'follow' });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Không thể tải trang Google Form (HTTP ${response.status}). Vui lòng kiểm tra lại đường dẫn Form.` }, { status: 400 });
    }

    const html = await response.text();

    // Find var FB_PUBLIC_LOAD_DATA_
    const match = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);<\/script>/) ||
                  html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*(.+?);/);

    if (!match || !match[1]) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu FB_PUBLIC_LOAD_DATA_ trong trang Google Form. Vui lòng đảm bảo Form ở chế độ Công khai (Public).' }, { status: 400 });
    }

    let loadData;
    try {
      loadData = JSON.parse(match[1]);
    } catch (e) {
      return NextResponse.json({ error: 'Lỗi parse JSON dữ liệu Google Form' }, { status: 400 });
    }

    const formData = loadData[1]; // Form details array
    if (!formData) {
      return NextResponse.json({ error: 'Cấu trúc dữ liệu Form không đúng' }, { status: 400 });
    }

    const formTitle = formData[8] || formData[0] || 'Google Form';
    const rawItems = formData[1] || [];

    const questions = [];

    rawItems.forEach((item) => {
      if (!item || !Array.isArray(item) || item.length < 4 || !item[4]) return;

      const title = item[1] || 'Câu hỏi không tên';
      const questionType = item[3];
      const questionSubItems = item[4];

      if (!Array.isArray(questionSubItems) || questionSubItems.length === 0) return;

      // Check if it's a Grid question (questionType 7 or multiple rows with row titles)
      const isGrid = questionType === 7 || (
        questionSubItems.length > 1 &&
        questionSubItems[0] &&
        Array.isArray(questionSubItems[0][1]) &&
        questionSubItems[0][3] !== undefined
      );

      if (isGrid) {
        // Extract columns from first subitem
        const firstSubItem = questionSubItems[0];
        const columnsRaw = firstSubItem[1] || [];
        const columns = columnsRaw.map((col) => Array.isArray(col) ? col[0] : String(col)).filter(Boolean);

        // Extract rows
        const rows = [];
        questionSubItems.forEach((sub) => {
          if (!sub || !sub[0]) return;
          const entryId = `entry.${sub[0]}`;
          const rowTitle = (sub[3] && sub[3][0]) ? sub[3][0] : (sub[1] ? String(sub[1]) : `Dòng ${rows.length + 1}`);
          rows.push({ rowTitle, entryId });
        });

        if (rows.length > 0) {
          questions.push({
            title,
            type: 'grid',
            columns: columns.length > 0 ? columns : ['Khá', 'Tốt'],
            rows
          });
        }
      } else {
        // Single question
        const sub = questionSubItems[0];
        if (!sub || !sub[0]) return;

        const entryId = `entry.${sub[0]}`;
        const optionsRaw = sub[1];
        let options = null;

        if (Array.isArray(optionsRaw) && optionsRaw.length > 0) {
          options = optionsRaw.map((opt) => Array.isArray(opt) ? opt[0] : String(opt)).filter(Boolean);
        }

        questions.push({
          title,
          type: 'single',
          entryId,
          options
        });
      }
    });

    return NextResponse.json({
      success: true,
      formTitle,
      questions
    });

  } catch (error) {
    console.error('Extract Form Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server khi trích xuất Form' }, { status: 500 });
  }
}
