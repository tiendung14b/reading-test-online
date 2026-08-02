"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Link as LinkIcon, 
  ListChecks, 
  Terminal, 
  Table as TableIcon, 
  HelpCircle, 
  CheckCircle2, 
  Wand2, 
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Field {
  id: string;
  entryId: string;
  label: string;
  type: string;
  options?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

const VIET_NAMES = {
  ho: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'],
  lot: ['Văn', 'Thị', 'Minh', 'Đức', 'Quốc', 'Thành', 'Hoài', 'Thu', 'Ngọc', 'Gia', 'Bảo', 'Khánh', 'Thanh', 'Hữu'],
  ten: ['Anh', 'Bình', 'Cường', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hùng', 'Huy', 'Khoa', 'Linh', 'Long', 'Mai', 'Nam', 'Nghĩa', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Thảo', 'Thắng', 'Trang', 'Tuấn', 'Tùng', 'Vy', 'Yến']
};

const UNIVERSITIES = [
  'Đại học Quốc gia Hà Nội', 'Đại học Bách khoa Hà Nội', 'Đại học Kinh tế Quốc dân', 
  'Đại học Thương mại', 'Đại học Ngoại thương', 'Đại học Sư phạm Hà Nội', 'Đại học Y Hà Nội',
  'ĐH Quốc gia TP.HCM', 'ĐH Bách Khoa TP.HCM', 'ĐH Kinh tế TP.HCM (UEH)', 'ĐH Tôn Đức Thắng', 'ĐH Cần Thơ'
];

const COMMENTS = [
  "Khảo sát rất hữu ích và thực tế.", 
  "Rất đồng ý với các quan điểm trên.", 
  "Cần cải thiện thêm chất lượng dịch vụ và cơ sở vật chất.", 
  "Bài nghiên cứu đề tài rất hay, chúc bạn đạt kết quả cao!",
  "Chưa có thêm ý kiến đóng góp nào.", 
  "Nên mở rộng phạm vi khảo sát hơn nữa.", 
  "Đồng ý hoàn toàn với các định hướng hiện tại.", 
  "Tôi thấy nội dung này mang lại giá trị cao cho người dùng."
];

function getRandomArr<T>(arr: T[]): T { 
  return arr[Math.floor(Math.random() * arr.length)]; 
}

function getRandomInt(min: number, max: number): number { 
  return Math.floor(Math.random() * (max - min + 1)) + min; 
}

function generateVietnameseName(): string {
  return `${getRandomArr(VIET_NAMES.ho)} ${getRandomArr(VIET_NAMES.lot)} ${getRandomArr(VIET_NAMES.ten)}`;
}

function generateEmail(name: string): string {
  const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '');
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'edu.vn'];
  return `${cleanName}${getRandomInt(10, 999)}@${getRandomArr(domains)}`;
}

function generatePhone(): string {
  const prefixes = ['090', '091', '098', '097', '038', '035', '086', '077'];
  return `${getRandomArr(prefixes)}${getRandomInt(1000000, 9999999)}`;
}

export default function GoogleFormAutoFillerPage() {
  // Config state
  const [formUrl, setFormUrl] = useState<string>('https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_ID_HERE/formResponse');
  const [targetCount, setTargetCount] = useState<number>(10);
  const [submitDelay, setSubmitDelay] = useState<number>(1.5);
  
  // Fields state
  const [fields, setFields] = useState<Field[]>([
    { id: '1', entryId: 'entry.1000001', label: 'Họ và tên', type: 'name' },
    { id: '2', entryId: 'entry.1000002', label: 'Email liên hệ', type: 'email' },
    { id: '3', entryId: 'entry.1000003', label: 'Trường học / Nơi làm việc', type: 'uni' },
    { id: '4', entryId: 'entry.1000004', label: 'Giới tính', type: 'custom_choice', options: 'Nam, Nữ, Khác' },
    { id: '5', entryId: 'entry.1000005', label: 'Mức độ hài lòng (1-5)', type: 'number_range', options: '1,5' },
    { id: '6', entryId: 'entry.1000006', label: 'Ý kiến đóng góp', type: 'comment' },
  ]);

  // AI Prompt State
  const [formTopic, setFormTopic] = useState<string>('Khảo sát trải nghiệm dịch vụ và ứng dụng công nghệ của sinh viên');
  const [persona, setPersona] = useState<string>('Đa dạng sinh viên từ nhiều khoa, 80% hài lòng tích cực, 20% đóng góp ý kiến cải thiện.');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Engine state
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [submittedCount, setSubmittedCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'logs' | 'preview'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), message: 'Hệ thống sẵn sàng. Dán link Google Form hoặc Pre-filled link vào ô URL bên dưới.', type: 'info' }
  ]);
  const [showHelperModal, setShowHelperModal] = useState<boolean>(false);

  // Refs for submission loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const submittedCountRef = useRef<number>(0);
  const targetCountRef = useRef<number>(10);
  const fieldsRef = useRef<Field[]>([]);
  const previewRowsRef = useRef<Record<string, string>[]>([]);
  const formUrlRef = useRef<string>('');

  useEffect(() => {
    isRunningRef.current = isRunning;
    submittedCountRef.current = submittedCount;
    targetCountRef.current = targetCount;
    fieldsRef.current = fields;
    previewRowsRef.current = previewRows;
    formUrlRef.current = formUrl;
  }, [isRunning, submittedCount, targetCount, fields, previewRows, formUrl]);

  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { id: Math.random().toString(), timestamp: time, message, type }]);
  };

  const clearLogs = () => setLogs([]);

  // Extract Entry IDs from pasted Google Form URL
  const extractEntriesFromUrl = (urlToParse: string) => {
    const trimmed = urlToParse.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập đường dẫn Google Form!');
      return;
    }

    try {
      // 1. Format Form Action URL
      let actionUrl = trimmed.split('?')[0];
      if (actionUrl.endsWith('/viewform')) {
        actionUrl = actionUrl.replace(/\/viewform$/, '/formResponse');
      } else if (!actionUrl.endsWith('/formResponse')) {
        const match = actionUrl.match(/(https:\/\/docs\.google\.com\/forms\/d\/e\/[^/]+)/);
        if (match) {
          actionUrl = `${match[1]}/formResponse`;
        }
      }

      setFormUrl(actionUrl);

      // 2. Extract Entry IDs (Only auto-fill Entry ID, user configures label & type)
      const queryString = trimmed.includes('?') ? trimmed.substring(trimmed.indexOf('?') + 1) : '';
      const params = new URLSearchParams(queryString);
      const extractedFields: Field[] = [];

      let idx = 1;
      params.forEach((value, key) => {
        if (key.startsWith('entry.')) {
          extractedFields.push({
            id: Date.now().toString() + idx,
            entryId: key,
            label: `Câu hỏi ${idx}`,
            type: 'name',
            options: ''
          });
          idx++;
        }
      });

      if (extractedFields.length > 0) {
        setFields(extractedFields);
        addLog(`Đã tự động trích xuất ${extractedFields.length} Entry ID từ liên kết!`, 'success');
        toast.success(`Đã trích xuất ${extractedFields.length} Entry ID!`);
      } else {
        addLog(`Đã cập nhật Form URL. Không tìm thấy tham số entry.XXXXX trong link.`, 'info');
        toast.success('Đã cập nhật Form URL!');
      }
    } catch (err) {
      toast.error('Không thể phân tích liên kết. Vui lòng kiểm tra lại URL!');
    }
  };

  const handleUrlInputChange = (val: string) => {
    setFormUrl(val);
    if (val.includes('entry.')) {
      extractEntriesFromUrl(val);
    }
  };

  // Field manipulation
  const addField = (data: Partial<Field> = {}) => {
    const newField: Field = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      entryId: data.entryId || `entry.${getRandomInt(10000000, 99999999)}`,
      label: data.label || 'Câu hỏi mới',
      type: data.type || 'name',
      options: data.options || ''
    };
    setFields(prev => [...prev, newField]);
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: keyof Field, value: string) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const clearAllFields = () => {
    setFields([]);
    setPreviewRows([]);
  };

  // Preset templates
  const loadPresetTemplate = (type: 'student' | 'product' | 'event') => {
    if (type === 'student') {
      setFormUrl('https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_ID_HERE/formResponse');
      setFormTopic('Khảo sát đánh giá trải nghiệm học tập của Sinh viên');
      setFields([
        { id: '1', entryId: 'entry.1000001', label: 'Họ và tên sinh viên', type: 'name' },
        { id: '2', entryId: 'entry.1000002', label: 'Email trường cấp', type: 'email' },
        { id: '3', entryId: 'entry.1000003', label: 'Trường Đại học', type: 'uni' },
        { id: '4', entryId: 'entry.1000004', label: 'Giới tính', type: 'custom_choice', options: 'Nam, Nữ, Khác' },
        { id: '5', entryId: 'entry.1000005', label: 'Năm học', type: 'custom_choice', options: 'Năm 1, Năm 2, Năm 3, Năm 4' },
        { id: '6', entryId: 'entry.1000006', label: 'Điểm đánh giá chất lượng (1-5)', type: 'number_range', options: '1,5' },
        { id: '7', entryId: 'entry.1000007', label: 'Ý kiến / Góp ý', type: 'comment' },
      ]);
      addLog('Đã nạp mẫu: Khảo sát sinh viên', 'info');
    } else if (type === 'product') {
      setFormTopic('Khảo sát ý kiến người dùng về ứng dụng di động');
      setFields([
        { id: '1', entryId: 'entry.2000001', label: 'Họ và tên khách hàng', type: 'name' },
        { id: '2', entryId: 'entry.2000002', label: 'Số điện thoại', type: 'phone' },
        { id: '3', entryId: 'entry.2000003', label: 'Email', type: 'email' },
        { id: '4', entryId: 'entry.2000004', label: 'Tần suất sử dụng', type: 'custom_choice', options: 'Hàng ngày, Hàng tuần, Hàng tháng, Hiếm khi' },
        { id: '5', entryId: 'entry.2000005', label: 'Mức độ hài lòng tính năng (1-10)', type: 'number_range', options: '1,10' },
        { id: '6', entryId: 'entry.2000006', label: 'Cần bổ sung tính năng gì', type: 'comment' },
      ]);
      addLog('Đã nạp mẫu: Đánh giá sản phẩm', 'info');
    } else if (type === 'event') {
      setFormTopic('Đăng ký tham gia Workshop công nghệ AI 2026');
      setFields([
        { id: '1', entryId: 'entry.3000001', label: 'Họ và tên người tham gia', type: 'name' },
        { id: '2', entryId: 'entry.3000002', label: 'Email nhận vé', type: 'email' },
        { id: '3', entryId: 'entry.3000003', label: 'Số điện thoại Zalo', type: 'phone' },
        { id: '4', entryId: 'entry.3000004', label: 'Hình thức tham gia', type: 'custom_choice', options: 'Trực tiếp (Offline), Trực tuyến (Online Zoom)' },
        { id: '5', entryId: 'entry.3000005', label: 'Câu hỏi dành cho diễn giả', type: 'comment' },
      ]);
      addLog('Đã nạp mẫu: Đăng ký sự kiện', 'info');
    }
  };

  // Local Fast Generation Engine
  const generateLocalRowValue = (field: Field, rowDataRecord: Record<string, string>): string => {
    switch (field.type) {
      case 'name':
        return generateVietnameseName();
      case 'email':
        const nameVal = rowDataRecord['name'] || generateVietnameseName();
        return generateEmail(nameVal);
      case 'phone':
        return generatePhone();
      case 'uni':
        return getRandomArr(UNIVERSITIES);
      case 'comment':
        return getRandomArr(COMMENTS);
      case 'number_range':
        const parts = (field.options || '1,5').split(',').map(n => parseInt(n.trim()) || 1);
        return String(getRandomInt(parts[0] || 1, parts[1] || 5));
      case 'custom_choice':
        const choices = (field.options || 'Lựa chọn 1, Lựa chọn 2').split(',').map(s => s.trim());
        return getRandomArr(choices);
      default:
        return 'Dữ liệu thử nghiệm';
    }
  };

  const generateLocalPreviewData = (countToGenerate: number = 5) => {
    if (fields.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 trường (Entry ID)!');
      return;
    }
    const newRows: Record<string, string>[] = [];
    for (let i = 0; i < countToGenerate; i++) {
      const row: Record<string, string> = {};
      fields.forEach(f => {
        const val = generateLocalRowValue(f, row);
        if (f.type === 'name') row['name'] = val;
        row[f.entryId] = val;
      });
      newRows.push(row);
    }
    setPreviewRows(newRows);
    setActiveTab('preview');
    addLog(`Đã sinh ${countToGenerate} dòng dữ liệu ngẫu nhiên bằng JS local.`, 'success');
    toast.success(`Đã tạo ${countToGenerate} mẫu xem trước!`);
  };

  // AI Generation Engine via Gemini API
  const generateAiPreviewData = async () => {
    if (fields.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi!');
      return;
    }

    for (let f of fields) {
      if (!f.entryId || !f.entryId.startsWith('entry.')) {
        toast.error(`Entry ID "${f.entryId || 'Rỗng'}" không đúng định dạng (phải bắt đầu bằng entry.)`);
        return;
      }
    }

    setIsAiGenerating(true);
    addLog(`Đang gửi yêu cầu sinh ${targetCount} mẫu dữ liệu tới Gemini AI...`, 'info');

    try {
      const res = await fetch('/api/ai/form-filler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTopic,
          persona,
          fields,
          count: targetCount
        })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khi gọi API AI');
      }

      const rows: Record<string, string>[] = json.data;
      setPreviewRows(rows);
      setActiveTab('preview');
      addLog(`🎉 Gemini AI đã sinh thành công ${rows.length} dòng dữ liệu chất lượng cao!`, 'success');
      toast.success(`Gemini AI đã tạo ${rows.length} dòng dữ liệu!`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Lỗi sinh dữ liệu AI: ${errMsg}`, 'error');
      toast.error(`Lỗi AI: ${errMsg}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Submission Process Execution
  const startAutoSubmit = () => {
    const url = formUrl.trim();
    if (!url || !url.includes('/formResponse')) {
      toast.error('Google Form URL phải chứa "/formResponse" ở cuối!');
      return;
    }

    if (fields.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi!');
      return;
    }

    for (let f of fields) {
      if (!f.entryId.startsWith('entry.')) {
        toast.error(`Entry ID "${f.entryId}" phải bắt đầu bằng entry.`);
        return;
      }
    }

    let currentRows = [...previewRows];
    if (currentRows.length === 0) {
      const generated: Record<string, string>[] = [];
      for (let i = 0; i < targetCount; i++) {
        const row: Record<string, string> = {};
        fields.forEach(f => {
          const val = generateLocalRowValue(f, row);
          if (f.type === 'name') row['name'] = val;
          row[f.entryId] = val;
        });
        generated.push(row);
      }
      currentRows = generated;
      setPreviewRows(currentRows);
    }

    isRunningRef.current = true;
    submittedCountRef.current = 0;
    targetCountRef.current = targetCount;

    setIsRunning(true);
    setSubmittedCount(0);
    addLog(`=== Bắt đầu tiến trình tự động nộp ${targetCount} câu trả lời ===`, 'warn');
    toast.success('Bắt đầu gửi tự động!');

    runSubmissionLoop(url, submitDelay * 1000, currentRows);
  };

  const runSubmissionLoop = (url: string, delayMs: number, dataRows: Record<string, string>[]) => {
    if (!isRunningRef.current) {
      return;
    }

    if (submittedCountRef.current >= targetCountRef.current) {
      isRunningRef.current = false;
      setIsRunning(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      addLog(`🎉 HOÀN THÀNH: Đã tự động nộp đủ ${targetCountRef.current} câu trả lời!`, 'success');
      toast.success(`Hoàn thành gửi ${targetCountRef.current} lượt!`);
      return;
    }

    const currentIndex = submittedCountRef.current;
    const nextCount = currentIndex + 1;
    submittedCountRef.current = nextCount;
    setSubmittedCount(nextCount);

    let rowData: Record<string, string> = {};
    if (dataRows[currentIndex]) {
      rowData = dataRows[currentIndex];
    } else {
      fieldsRef.current.forEach(f => {
        const val = generateLocalRowValue(f, rowData);
        if (f.type === 'name') rowData['name'] = val;
        rowData[f.entryId] = val;
      });
    }

    const logSummary: string[] = [];
    const formBody = new URLSearchParams();

    // 1. DOM hidden form submit to iframe
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = 'hidden_iframe';
    form.style.display = 'none';

    fieldsRef.current.forEach(f => {
      const val = rowData[f.entryId] || '';
      formBody.append(f.entryId, val);

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = f.entryId;
      input.value = val;
      form.appendChild(input);

      logSummary.push(`${f.label || f.entryId}: "${val}"`);
    });

    // Send dual HTTP request (no-cors fetch + iframe submit) for 100% submission reliability
    try {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      }).catch(() => {});
    } catch (e) {}

    document.body.appendChild(form);

    try {
      form.submit();
      addLog(`[${nextCount}/${targetCountRef.current}] Gửi thành công: ${logSummary.slice(0, 2).join(' | ')}...`, 'success');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Lỗi nộp lượt #${nextCount}: ${errMsg}`, 'error');
    }

    setTimeout(() => {
      if (document.body.contains(form)) {
        document.body.removeChild(form);
      }
    }, 1000);

    timerRef.current = setTimeout(() => {
      runSubmissionLoop(url, delayMs, dataRows);
    }, delayMs);
  };

  const stopAutoSubmit = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    addLog('Đã dừng tiến trình tự động.', 'warn');
  };

  const progressPercent = Math.min(100, Math.round((submittedCount / (targetCount || 1)) * 100));

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">
      {/* Header Banner - Compact for 13" laptop screens */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-indigo-900/40 border border-white/10 p-4 sm:p-5 backdrop-blur-xl shadow-xl">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shadow-md shadow-accent/20 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Google Form <span className="text-accent">AI Auto-Filler</span>
                </h1>
                <span className="badge-teal text-[10px] py-0.5 px-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Gemini Powered
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Tự động trích xuất Entry ID từ link Form & Sinh câu trả lời bằng Gemini AI
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHelperModal(true)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            style={{ color: 'var(--text-primary)' }}
          >
            <HelpCircle className="w-3.5 h-3.5 text-accent" /> Lấy Link điền sẵn
          </button>
        </div>
      </div>

      {/* Main Grid: Responsive 2-column layout optimized for 13" laptop screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left Column: Form Action URL & Question Fields (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Card 1: Combined Form URL & Auto Entry ID Extraction */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg border-accent/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-accent">
                <LinkIcon className="w-3.5 h-3.5" /> 1. Google Form URL / Pre-filled Link
              </h2>
              <span className="text-[10px] text-text-muted">Tự động nhận diện</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Dán URL hoặc Pre-filled Link tại đây:
                  </label>
                  <button
                    onClick={() => extractEntriesFromUrl(formUrl)}
                    className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" /> Trích xuất Entry ID
                  </button>
                </div>
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => handleUrlInputChange(e.target.value)}
                  placeholder="Dán link tại đây (vd: https://docs.google.com/forms/d/e/.../viewform?entry.12345=A&entry.67890=B)"
                  className="w-full text-xs input-dark p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-accent"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  💡 Nếu dán Pre-filled link, hệ thống sẽ <b>tự động trích xuất các mã Entry ID</b> vào danh sách bên dưới!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Số lượng mẫu gửi:
                  </label>
                  <input
                    type="number"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={1000}
                    className="w-full text-xs input-dark p-2 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Độ trễ mỗi lượt (s):
                  </label>
                  <input
                    type="number"
                    value={submitDelay}
                    onChange={(e) => setSubmitDelay(Math.max(0.2, parseFloat(e.target.value) || 1))}
                    step={0.5}
                    min={0.2}
                    className="w-full text-xs input-dark p-2 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Question Fields List */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-accent">
                <ListChecks className="w-3.5 h-3.5" /> 2. Danh sách câu hỏi ({fields.length})
              </h2>
              
              <div className="flex items-center gap-1.5">
                <button onClick={() => loadPresetTemplate('student')} className="text-[10px] text-accent hover:underline font-bold">
                  Mẫu SV
                </button>
                <span className="text-text-muted text-[10px]">|</span>
                <button onClick={() => loadPresetTemplate('product')} className="text-[10px] text-accent hover:underline font-bold">
                  Mẫu SP
                </button>
              </div>
            </div>

            {/* Scrollable list optimized for 13" vertical height */}
            <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
              {fields.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-text-muted text-xs">
                  Chưa có câu hỏi. Dán link điền sẵn ở trên hoặc bấm &quot;Thêm câu hỏi&quot;!
                </div>
              ) : (
                fields.map((f, idx) => (
                  <div key={f.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-accent w-5">#{idx + 1}</span>
                      <input
                        type="text"
                        value={f.label}
                        onChange={(e) => updateField(f.id, 'label', e.target.value)}
                        placeholder="Tên câu hỏi (Tùy chỉnh)"
                        className="flex-1 text-xs input-dark p-1.5 rounded-lg"
                      />
                      <button
                        onClick={() => removeField(f.id)}
                        className="p-1 text-danger hover:bg-danger/10 rounded transition"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={f.entryId}
                        onChange={(e) => updateField(f.id, 'entryId', e.target.value)}
                        placeholder="Entry ID (vd: entry.123)"
                        className="text-xs font-mono input-dark p-1.5 rounded-lg text-accent font-bold"
                      />
                      <select
                        value={f.type}
                        onChange={(e) => updateField(f.id, 'type', e.target.value)}
                        className="text-xs input-dark p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      >
                        <option value="name" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Họ tên Việt Nam</option>
                        <option value="email" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Email ngẫu nhiên</option>
                        <option value="phone" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Số điện thoại</option>
                        <option value="uni" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Trường Đại học</option>
                        <option value="comment" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Ý kiến / Nhận xét</option>
                        <option value="number_range" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Số (Min,Max)</option>
                        <option value="custom_choice" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Trắc nghiệm (Custom)</option>
                      </select>
                    </div>

                    {f.type === 'custom_choice' && (
                      <input
                        type="text"
                        value={f.options || ''}
                        onChange={(e) => updateField(f.id, 'options', e.target.value)}
                        placeholder="Các lựa chọn, phân cách bằng dấu phẩy (vd: Nam, Nữ, Khác)"
                        className="w-full text-xs input-dark p-1.5 rounded-lg"
                      />
                    )}

                    {f.type === 'number_range' && (
                      <input
                        type="text"
                        value={f.options || '1,5'}
                        onChange={(e) => updateField(f.id, 'options', e.target.value)}
                        placeholder="Khoảng Min,Max (vd: 1,5 hoặc 18,60)"
                        className="w-full text-xs input-dark p-1.5 rounded-lg"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                onClick={() => addField()}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
                style={{ color: 'var(--text-primary)' }}
              >
                <Plus className="w-3.5 h-3.5 text-accent" /> Thêm câu hỏi
              </button>
              <button
                onClick={clearAllFields}
                className="px-3 py-2 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-xs font-bold rounded-xl transition"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Generator, Engine Control & Logs/Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">

          {/* Card 3: AI Gemini Smart Data Generator */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg border-accent/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-accent">
                <Sparkles className="w-3.5 h-3.5" /> 3. Sinh dữ liệu bằng Gemini AI
              </h2>
              <span className="badge-purple text-[10px] py-0.5 px-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Auto Persona
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Chủ đề / Ngữ cảnh khảo sát:
                  </label>
                  <input
                    type="text"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Ví dụ: Khảo sát trải nghiệm dịch vụ..."
                    className="w-full text-xs input-dark p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Đặc điểm / Thái độ (Persona):
                  </label>
                  <input
                    type="text"
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    placeholder="Ví dụ: 80% hài lòng, 20% góp ý..."
                    className="w-full text-xs input-dark p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={generateAiPreviewData}
                  disabled={isAiGenerating || isRunning}
                  className="flex-1 py-2.5 btn-primary text-xs font-black rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-on-accent" />
                      Gemini đang sinh câu trả lời...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-on-accent" />
                      Sinh {targetCount} dòng câu trả lời bằng Gemini AI
                    </>
                  )}
                </button>

                <button
                  onClick={() => generateLocalPreviewData(5)}
                  disabled={isRunning}
                  className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-accent" /> Sinh nhanh JS
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Auto Submission Control Box */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h2 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>
                  Bảng điều khiển nộp Form tự động
                </h2>
                <p className="text-[11px] text-text-muted">Nộp dữ liệu trực tiếp vào Google Form</p>
              </div>

              <div className="flex items-center gap-2">
                {!isRunning ? (
                  <button
                    onClick={startAutoSubmit}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Bắt đầu gửi
                  </button>
                ) : (
                  <button
                    onClick={stopAutoSubmit}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-rose-900/30 flex items-center gap-1.5 animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" /> Dừng tiến trình
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Trạng thái: 
                  {isRunning ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Đang gửi...
                    </span>
                  ) : (
                    <span className="text-text-muted flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                    </span>
                  )}
                </span>
                <span className="font-mono text-accent">{submittedCount} / {targetCount} ({progressPercent}%)</span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-accent via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 5: Activity Logs & Preview Table */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`text-xs font-black transition pb-1 border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'text-accent border-accent'
                      : 'text-text-muted border-transparent hover:text-text-primary'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" /> Nhật ký (Logs)
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`text-xs font-black transition pb-1 border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'text-accent border-accent'
                      : 'text-text-muted border-transparent hover:text-text-primary'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" /> Xem trước dữ liệu ({previewRows.length})
                </button>
              </div>

              {activeTab === 'logs' ? (
                <button onClick={clearLogs} className="text-[11px] text-text-muted hover:text-text-primary">
                  Xóa log
                </button>
              ) : (
                <button onClick={() => setPreviewRows([])} className="text-[11px] text-danger hover:underline">
                  Xóa bảng
                </button>
              )}
            </div>

            {/* Tab 1: Logs */}
            {activeTab === 'logs' && (
              <div className="bg-black/40 rounded-xl p-3 font-mono text-xs overflow-y-auto max-h-[240px] border border-white/5 space-y-1.5 custom-scrollbar">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-text-muted shrink-0">[{log.timestamp}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400 font-semibold' :
                      log.type === 'error' ? 'text-rose-400 font-semibold' :
                      log.type === 'warn' ? 'text-amber-400' :
                      'text-text-primary'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Preview Data Table */}
            {activeTab === 'preview' && (
              <div className="overflow-x-auto max-h-[240px] custom-scrollbar border border-white/5 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 text-accent border-b border-white/10 font-bold">
                      <th className="p-2.5 border-r border-white/5 w-10">STT</th>
                      {fields.map(f => (
                        <th key={f.id} className="p-2.5 border-r border-white/5 min-w-[130px]">
                          {f.label || f.entryId}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-text-secondary">
                    {previewRows.length === 0 ? (
                      <tr>
                        <td colSpan={fields.length + 1} className="p-6 text-center text-text-muted">
                          Chưa có dữ liệu. Hãy dán link Google Form hoặc bấm &quot;Sinh dữ liệu bằng Gemini AI&quot;!
                        </td>
                      </tr>
                    ) : (
                      previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/[0.02] transition">
                          <td className="p-2 font-mono font-bold text-text-muted border-r border-white/5">{rIdx + 1}</td>
                          {fields.map(f => (
                            <td key={f.id} className="p-2 border-r border-white/5 max-w-[180px] truncate" title={row[f.entryId] || ''}>
                              {row[f.entryId] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden iframe for background POST submission */}
      <iframe name="hidden_iframe" id="hidden_iframe" style={{ display: 'none' }} />

      {/* Helper Modal: How to get pre-filled link */}
      {showHelperModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-glass max-w-lg w-full rounded-3xl p-5 space-y-4 border border-white/10 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-black text-base text-accent flex items-center gap-2">
                <Info className="w-5 h-5" /> Hướng dẫn lấy Link điền sẵn (Pre-filled link)
              </h3>
              <button
                onClick={() => setShowHelperModal(false)}
                className="text-text-muted hover:text-text-primary text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
              <p>Cách đơn giản nhất để nạp toàn bộ mã Entry ID mà không cần Inspect HTML:</p>
              
              <div className="p-3 rounded-xl bg-white/5 space-y-2 border border-white/5">
                <ol className="list-decimal list-inside space-y-2 pl-1">
                  <li>Mở trang chỉnh sửa Google Form của bạn.</li>
                  <li>Click vào dấu <b>3 chấm ở góc trên bên phải</b> ➔ Chọn <b>&quot;Lấy liên kết được điền sẵn&quot; (Get pre-filled link)</b>.</li>
                  <li>Điền dữ liệu mẫu bất kỳ vào các câu hỏi ➔ Bấm <b>&quot;Lấy liên kết&quot; (Get link)</b> ➔ Chọn <b>Sao chép liên kết</b>.</li>
                  <li>Dán liên kết vừa sao chép vào ô <b>Google Form URL / Pre-filled Link</b> ➔ Mã Entry ID sẽ tự động được trích xuất vào danh sách!</li>
                </ol>
              </div>

              <div className="p-2.5 rounded-lg bg-accent/10 text-accent font-mono text-[11px]">
                Ví dụ link hợp lệ:<br/>
                <span className="text-text-primary">.../viewform?entry.204797745=Tốt&entry.776302461=ok</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelperModal(false)}
                className="px-4 py-2 btn-primary text-xs font-bold rounded-xl"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
