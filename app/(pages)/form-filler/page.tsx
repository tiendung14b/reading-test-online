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
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
  Trophy
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

export interface SingleQuestion {
  title: string;
  type: 'single';
  entryId: string;
  options: string[] | null;
}

export interface GridRow {
  rowTitle: string;
  entryId: string;
}

export interface GridQuestion {
  title: string;
  type: 'grid';
  columns: string[];
  rows: GridRow[];
}

export type FormQuestion = SingleQuestion | GridQuestion;

export interface ExtractFormResponse {
  success: boolean;
  formTitle?: string;
  questions?: FormQuestion[];
  error?: string;
}

export default function GoogleFormAutoFillerPage() {
  // Current Wizard Step: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Config state
  const [formUrl, setFormUrl] = useState<string>('');
  const [targetCount, setTargetCount] = useState<number>(10);
  const [submitDelay, setSubmitDelay] = useState<number>(1.5);
  
  // Fields state - Default EMPTY as requested by user
  const [fields, setFields] = useState<Field[]>([]);

  // AI Prompt State
  const [formTopic, setFormTopic] = useState<string>('');
  const [persona, setPersona] = useState<string>('Đa dạng sinh viên từ nhiều khoa, 80% hài lòng tích cực, 20% đóng góp ý kiến cải thiện.');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isExtractingForm, setIsExtractingForm] = useState<boolean>(false);

  // Engine state
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [submittedCount, setSubmittedCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString(), message: 'Hệ thống sẵn sàng. Vui lòng dán link Google Form để bắt đầu.', type: 'info' }
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

  // Server Form HTML Extractor (FB_PUBLIC_LOAD_DATA_ Parser)
  const extractFormStructureWithServer = async (urlToParse: string) => {
    const trimmed = urlToParse.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập đường dẫn Google Form!');
      return;
    }

    setIsExtractingForm(true);
    addLog('Đang kết nối Server để trích xuất toàn bộ cấu trúc Form...', 'info');

    try {
      const res = await fetch('/api/extract-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formUrl: trimmed })
      });

      const json: ExtractFormResponse = await res.json();

      if (!res.ok || !json.success || !json.questions) {
        throw new Error(json.error || 'Lỗi khi trích xuất Form');
      }

      if (json.formTitle) {
        setFormTopic(json.formTitle);
      }

      const newFields: Field[] = [];
      let idx = 1;

      json.questions.forEach((q) => {
        if (q.type === 'single') {
          newFields.push({
            id: Date.now().toString() + idx++,
            entryId: q.entryId,
            label: q.title,
            type: q.options && q.options.length > 0 ? 'multiple_choice' : 'short_answer',
            options: q.options ? q.options.join(', ') : ''
          });
        } else if (q.type === 'grid') {
          q.rows.forEach((r) => {
            newFields.push({
              id: Date.now().toString() + idx++,
              entryId: r.entryId,
              label: `${q.title} - ${r.rowTitle}`,
              type: 'multiple_choice_grid',
              options: q.columns.join(', ')
            });
          });
        }
      });

      // Set Form POST action URL
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

      if (newFields.length > 0) {
        setFields(newFields);
        addLog(`🎉 Đã trích xuất ${newFields.length} câu hỏi từ Google Form!`, 'success');
        toast.success(`Đã trích xuất ${newFields.length} câu hỏi!`);
      } else {
        toast.error('Không tìm thấy câu hỏi trong Form.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog(`Thông báo trích xuất HTML: ${errMsg}. Đang thử quét URL query...`, 'warn');
      if (trimmed.includes('entry.')) {
        extractEntriesFromUrl(trimmed);
      } else {
        toast.error(`Lỗi trích xuất: ${errMsg}`);
      }
    } finally {
      setIsExtractingForm(false);
    }
  };

  // Extract Entry IDs from pasted Google Form URL
  const extractEntriesFromUrl = (urlToParse: string) => {
    const trimmed = urlToParse.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập đường dẫn Google Form!');
      return;
    }

    try {
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
            type: 'short_answer',
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
      type: data.type || 'short_answer',
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

  // Preset templates with exact Google Form question types
  const loadPresetTemplate = (type: 'student' | 'product' | 'event') => {
    if (type === 'student') {
      setFormUrl('https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_ID_HERE/formResponse');
      setFormTopic('Khảo sát đánh giá trải nghiệm học tập của Sinh viên');
      setFields([
        { id: '1', entryId: 'entry.1000001', label: 'Họ và tên sinh viên', type: 'short_answer' },
        { id: '2', entryId: 'entry.1000002', label: 'Email trường cấp', type: 'short_answer' },
        { id: '3', entryId: 'entry.1000003', label: 'Trường Đại học', type: 'short_answer' },
        { id: '4', entryId: 'entry.1000004', label: 'Giới tính', type: 'multiple_choice', options: 'Nam, Nữ, Khác' },
        { id: '5', entryId: 'entry.1000005', label: 'Năm học', type: 'dropdown', options: 'Năm 1, Năm 2, Năm 3, Năm 4' },
        { id: '6', entryId: 'entry.1000006', label: 'Điểm đánh giá chất lượng (1-5)', type: 'linear_scale', options: '1,5' },
        { id: '7', entryId: 'entry.1000007', label: 'Ý kiến / Góp ý', type: 'paragraph' },
      ]);
      addLog('Đã nạp mẫu: Khảo sát sinh viên', 'info');
    } else if (type === 'product') {
      setFormTopic('Khảo sát ý kiến người dùng về ứng dụng di động');
      setFields([
        { id: '1', entryId: 'entry.2000001', label: 'Họ và tên khách hàng', type: 'short_answer' },
        { id: '2', entryId: 'entry.2000002', label: 'Số điện thoại', type: 'short_answer' },
        { id: '3', entryId: 'entry.2000003', label: 'Tần suất sử dụng', type: 'multiple_choice', options: 'Hàng ngày, Hàng tuần, Hàng tháng, Hiếm khi' },
        { id: '4', entryId: 'entry.2000004', label: 'Tính năng thường dùng', type: 'checkboxes', options: 'Tra cứu, Luyện tập, Xem báo cáo, Đặt lịch' },
        { id: '5', entryId: 'entry.2000005', label: 'Mức độ hài lòng (1-5 sao)', type: 'rating' },
        { id: '6', entryId: 'entry.2000006', label: 'Cần bổ sung tính năng gì', type: 'paragraph' },
      ]);
      addLog('Đã nạp mẫu: Đánh giá sản phẩm', 'info');
    } else if (type === 'event') {
      setFormTopic('Đăng ký tham gia Workshop công nghệ AI 2026');
      setFields([
        { id: '1', entryId: 'entry.3000001', label: 'Họ và tên người tham gia', type: 'short_answer' },
        { id: '2', entryId: 'entry.3000002', label: 'Email nhận vé', type: 'short_answer' },
        { id: '3', entryId: 'entry.3000003', label: 'Hình thức tham gia', type: 'multiple_choice', options: 'Trực tiếp (Offline), Trực tuyến (Online Zoom)' },
        { id: '4', entryId: 'entry.3000004', label: 'Ngày đăng ký dự kiến', type: 'date' },
        { id: '5', entryId: 'entry.3000005', label: 'Giờ có mặt dự kiến', type: 'time' },
        { id: '6', entryId: 'entry.3000006', label: 'Câu hỏi dành cho diễn giả', type: 'paragraph' },
      ]);
      addLog('Đã nạp mẫu: Đăng ký sự kiện', 'info');
    }
  };

  // Local Fast Generation Engine for Google Form Question Types
  const generateLocalRowValue = (field: Field, rowDataRecord: Record<string, string>): string => {
    switch (field.type) {
      case 'short_answer': {
        const lowerLabel = (field.label || '').toLowerCase();
        if (lowerLabel.includes('họ') || lowerLabel.includes('tên') || lowerLabel.includes('name')) {
          return generateVietnameseName();
        }
        if (lowerLabel.includes('email')) {
          const nameVal = rowDataRecord['name'] || generateVietnameseName();
          return generateEmail(nameVal);
        }
        if (lowerLabel.includes('thoại') || lowerLabel.includes('phone') || lowerLabel.includes('sđt')) {
          return generatePhone();
        }
        if (lowerLabel.includes('trường') || lowerLabel.includes('uni') || lowerLabel.includes('học')) {
          return getRandomArr(UNIVERSITIES);
        }
        return generateVietnameseName();
      }
      case 'paragraph':
        return getRandomArr(COMMENTS);
      case 'multiple_choice':
      case 'dropdown':
      case 'multiple_choice_grid': {
        const choices = (field.options || 'Chưa tốt, Trung bình, Tốt').split(',').map(s => s.trim());
        return getRandomArr(choices);
      }
      case 'checkboxes':
      case 'checkbox_grid': {
        const choices = (field.options || 'Chưa tốt, Trung bình, Tốt').split(',').map(s => s.trim());
        return getRandomArr(choices);
      }
      case 'linear_scale': {
        const parts = (field.options || '1,5').split(',').map(n => parseInt(n.trim()) || 1);
        return String(getRandomInt(parts[0] || 1, parts[1] || 5));
      }
      case 'rating': {
        const maxStar = Math.min(Math.max(parseInt(field.options || '5') || 5, 3), 10);
        return String(getRandomInt(1, maxStar));
      }
      case 'date': {
        const y = getRandomInt(2025, 2026);
        const m = String(getRandomInt(1, 12)).padStart(2, '0');
        const d = String(getRandomInt(1, 28)).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      case 'time': {
        const h = String(getRandomInt(8, 20)).padStart(2, '0');
        const min = String(getRandomInt(0, 59)).padStart(2, '0');
        return `${h}:${min}`;
      }
      default:
        return 'Dữ liệu ảo';
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
        if (f.type === 'short_answer' && (f.label.toLowerCase().includes('tên') || f.label.toLowerCase().includes('họ'))) {
          row['name'] = val;
        }
        row[f.entryId] = val;
      });
      newRows.push(row);
    }
    setPreviewRows(newRows);
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
          formTopic: formTopic || 'Khảo sát chung',
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

  // Step 1 Validation & Navigation
  const goToStep2 = () => {
    const url = formUrl.trim();
    if (!url || !url.includes('/formResponse')) {
      toast.error('Google Form URL phải chứa "/formResponse" ở cuối!');
      return;
    }
    if (fields.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 câu hỏi (Entry ID)!');
      return;
    }
    for (let f of fields) {
      if (!f.entryId.startsWith('entry.')) {
        toast.error(`Entry ID "${f.entryId}" phải bắt đầu bằng entry.`);
        return;
      }
    }

    if (previewRows.length === 0) {
      generateLocalPreviewData(targetCount);
    }

    setCurrentStep(2);
  };

  // Step 2 Validation & Start Submission (Go to Step 3)
  const goToStep3AndStart = () => {
    let currentRows = [...previewRows];
    if (currentRows.length === 0) {
      const generated: Record<string, string>[] = [];
      for (let i = 0; i < targetCount; i++) {
        const row: Record<string, string> = {};
        fields.forEach(f => {
          const val = generateLocalRowValue(f, row);
          if (f.type === 'short_answer' && (f.label.toLowerCase().includes('tên') || f.label.toLowerCase().includes('họ'))) {
            row['name'] = val;
          }
          row[f.entryId] = val;
        });
        generated.push(row);
      }
      currentRows = generated;
      setPreviewRows(currentRows);
    }

    setCurrentStep(3);

    isRunningRef.current = true;
    submittedCountRef.current = 0;
    targetCountRef.current = targetCount;

    setIsRunning(true);
    setSubmittedCount(0);
    setErrorCount(0);
    addLog(`=== Bắt đầu tiến trình tự động nộp ${targetCount} câu trả lời ===`, 'warn');
    toast.success('Đã kích hoạt nộp Form tự động!');

    runSubmissionLoop(formUrl.trim(), submitDelay * 1000, currentRows);
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
      setTimeout(() => setCurrentStep(4), 600);
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
        if (f.type === 'short_answer' && (f.label.toLowerCase().includes('tên') || f.label.toLowerCase().includes('họ'))) {
          rowData['name'] = val;
        }
        rowData[f.entryId] = val;
      });
    }

    const logSummary: string[] = [];
    const formBody = new URLSearchParams();

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

    try {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      }).catch(() => {
        setErrorCount(prev => prev + 1);
      });
    } catch (e) {}

    document.body.appendChild(form);

    try {
      form.submit();
      addLog(`[${nextCount}/${targetCountRef.current}] Gửi thành công: ${logSummary.slice(0, 2).join(' | ')}...`, 'success');
    } catch (err: unknown) {
      setErrorCount(prev => prev + 1);
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

  const resumeAutoSubmit = () => {
    if (submittedCountRef.current >= targetCountRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    addLog('Tiếp tục tiến trình tự động...', 'info');
    runSubmissionLoop(formUrl.trim(), submitDelay * 1000, previewRows);
  };

  const resetAllAndStartOver = () => {
    stopAutoSubmit();
    setSubmittedCount(0);
    setErrorCount(0);
    setCurrentStep(1);
  };

  const progressPercent = Math.min(100, Math.round((submittedCount / (targetCount || 1)) * 100));

  const stepsList = [
    { num: 1, title: '1. Cấu hình dữ liệu', desc: 'Form URL & Câu hỏi' },
    { num: 2, title: '2. Generate Data', desc: 'Sinh dữ liệu AI / JS' },
    { num: 3, title: '3. Trạng thái gửi', desc: 'Tiến trình gửi Form' },
    { num: 4, title: '4. Thành công', desc: 'Báo cáo & Tổng kết' },
  ];

  return (
    <div className="p-3 sm:p-5 max-w-6xl mx-auto space-y-4 relative">
      
      {/* Stepper Navigation Bar & Integrated Inline Help Button at Top */}
      <div className="card-glass rounded-2xl p-3 shadow-lg border-accent/20 flex flex-col md:flex-row items-center gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 w-full">
          {stepsList.map(step => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            return (
              <button
                key={step.num}
                onClick={() => {
                  if (step.num === 1 || (step.num === 2 && fields.length > 0) || (step.num === 3 && isRunning) || (step.num === 4 && submittedCount >= targetCount)) {
                    setCurrentStep(step.num);
                  }
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-accent/15 border-accent text-accent shadow-md shadow-accent/10'
                    : isCompleted
                    ? 'bg-white/[0.04] border-emerald-500/30 text-emerald-400'
                    : 'bg-white/[0.02] border-white/5 text-text-muted hover:bg-white/5'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isActive
                    ? 'bg-accent text-on-accent'
                    : isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/10 text-text-muted'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <div className="overflow-hidden">
                  <div className="font-black text-xs truncate" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {step.title}
                  </div>
                  <div className="text-[10px] text-text-muted truncate">{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Clean Help Button inside Stepper Bar - No overlay issues */}
        <button
          onClick={() => setShowHelperModal(true)}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold transition flex items-center gap-1.5 shrink-0 text-accent hover:border-accent/40 w-full md:w-auto justify-center"
          title="Hướng dẫn lấy Link điền sẵn"
        >
          <HelpCircle className="w-4 h-4 text-accent" />
          <span>Trợ giúp</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: NHẬP CÁC DỮ LIỆU CẦN THIẾT */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Box: Form URL & Submit Config (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg border-accent/20">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-accent">
                    <LinkIcon className="w-3.5 h-3.5" /> 1. Google Form URL / Pre-filled Link
                  </h2>
                  <span className="badge-teal text-[10px]">Tự động trích xuất</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                        Dán Form URL hoặc Pre-filled Link:
                      </label>
                      <button
                        onClick={() => extractFormStructureWithServer(formUrl)}
                        disabled={isExtractingForm}
                        className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                        title="Phân tích tự động HTML trang Form để lấy tiêu đề, câu hỏi đơn & câu hỏi dạng Lưới"
                      >
                        {isExtractingForm ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                        Trích xuất tự động (Full HTML)
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formUrl}
                      onChange={(e) => handleUrlInputChange(e.target.value)}
                      placeholder="Dán link tại đây (vd: https://docs.google.com/forms/d/e/.../viewform?entry.12345=A)"
                      className="w-full text-xs input-dark p-2.5 rounded-xl font-mono focus:ring-2 focus:ring-accent"
                    />
                    <p className="text-[10px] text-text-muted mt-1">
                      💡 Dán Pre-filled link để hệ thống tự động bóc tách các mã <code className="text-accent">entry.XXXXX</code>!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div>
                      <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Số lượng mẫu nộp:
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
            </div>

            {/* Right Box: Question Fields List Manager (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
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

                {/* Scrollable question list */}
                <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1 custom-scrollbar">
                  {fields.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-text-muted text-xs">
                      Chưa có câu hỏi nào. Dán link điền sẵn ở trên hoặc bấm &quot;Thêm câu hỏi&quot;!
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
                            placeholder="Tên câu hỏi (Tùy chọn)"
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
                            <option value="short_answer" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Short answer (Trả lời ngắn)</option>
                            <option value="paragraph" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Paragraph (Đoạn văn)</option>
                            <option value="multiple_choice" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Multiple choice (Trắc nghiệm)</option>
                            <option value="checkboxes" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Checkboxes (Hộp kiểm)</option>
                            <option value="dropdown" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Dropdown (Menu thả xuống)</option>
                            <option value="multiple_choice_grid" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Multiple choice grid (Lưới trắc nghiệm)</option>
                            <option value="checkbox_grid" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Checkbox grid (Lưới hộp kiểm)</option>
                            <option value="linear_scale" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Linear scale (Thang đo)</option>
                            <option value="rating" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Rating (Đánh giá sao)</option>
                            <option value="date" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Date (Ngày tháng)</option>
                            <option value="time" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Time (Giờ giấc)</option>
                          </select>
                        </div>

                        {['multiple_choice', 'checkboxes', 'dropdown', 'multiple_choice_grid', 'checkbox_grid'].includes(f.type) && (
                          <input
                            type="text"
                            value={f.options || ''}
                            onChange={(e) => updateField(f.id, 'options', e.target.value)}
                            placeholder="Các giá trị cột, phân cách bằng dấu phẩy (vd: Chưa tốt, Trung bình, Tốt)"
                            className="w-full text-xs input-dark p-1.5 rounded-lg"
                          />
                        )}

                        {f.type === 'linear_scale' && (
                          <input
                            type="text"
                            value={f.options || '1,5'}
                            onChange={(e) => updateField(f.id, 'options', e.target.value)}
                            placeholder="Khoảng Min,Max (vd: 1,5 hoặc 1,10)"
                            className="w-full text-xs input-dark p-1.5 rounded-lg"
                          />
                        )}

                        {f.type === 'rating' && (
                          <select
                            value={f.options || '5'}
                            onChange={(e) => updateField(f.id, 'options', e.target.value)}
                            className="w-full text-xs input-dark p-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] font-bold"
                          >
                            <option value="3" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">3 sao (Thang 1 - 3 sao)</option>
                            <option value="4" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">4 sao (Thang 1 - 4 sao)</option>
                            <option value="5" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">5 sao (Thang 1 - 5 sao) [Mặc định]</option>
                            <option value="6" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">6 sao (Thang 1 - 6 sao)</option>
                            <option value="7" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">7 sao (Thang 1 - 7 sao)</option>
                            <option value="8" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">8 sao (Thang 1 - 8 sao)</option>
                            <option value="9" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">9 sao (Thang 1 - 9 sao)</option>
                            <option value="10" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">10 sao (Thang 1 - 10 sao)</option>
                          </select>
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
          </div>

          {/* Bottom Bar: Step 1 Navigation */}
          <div className="flex justify-end pt-2">
            <button
              onClick={goToStep2}
              className="px-6 py-3 btn-primary text-xs font-black rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              Chuyển sang Bước 2: Generate Data <ArrowRight className="w-4 h-4 text-on-accent" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: GENERATE DATA (AI / LOCAL JS) */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Card 1: AI Prompt Config */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg border-accent/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="font-black text-xs uppercase tracking-wider flex items-center gap-1.5 text-accent">
                <Sparkles className="w-3.5 h-3.5" /> Sinh dữ liệu câu trả lời cho {targetCount} người điền Form
              </h2>
              <span className="badge-purple text-[10px]">Gemini 3.6 AI</span>
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
                    placeholder="Ví dụ: Khảo sát trải nghiệm học trực tuyến..."
                    className="w-full text-xs input-dark p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Đặc điểm đối tượng (Persona):
                  </label>
                  <input
                    type="text"
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    placeholder="Ví dụ: 80% khen ngợi tích cực, 20% góp ý thẳng thắn..."
                    className="w-full text-xs input-dark p-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={generateAiPreviewData}
                  disabled={isAiGenerating}
                  className="flex-1 py-2.5 btn-primary text-xs font-black rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-on-accent" />
                      Gemini AI đang suy nghĩ & tạo câu trả lời...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-on-accent" />
                      Sinh {targetCount} mẫu bằng Gemini AI
                    </>
                  )}
                </button>

                <button
                  onClick={() => generateLocalPreviewData(targetCount)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-accent" /> Sinh nhanh bằng JS (Offline)
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Generated Data Preview Table */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-black text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5" /> Bảng dữ liệu xem trước ({previewRows.length} dòng)
              </h3>
              {previewRows.length > 0 && (
                <button onClick={() => setPreviewRows([])} className="text-[11px] text-danger hover:underline font-bold">
                  Xóa dữ liệu
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-[300px] custom-scrollbar border border-white/5 rounded-xl">
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
                      <td colSpan={fields.length + 1} className="p-8 text-center text-text-muted">
                        Chưa có dữ liệu. Nhấn nút &quot;Sinh mẫu bằng Gemini AI&quot; hoặc &quot;Sinh nhanh bằng JS&quot; ở trên!
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
          </div>

          {/* Bottom Bar: Step 2 Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Bước 1
            </button>

            <button
              onClick={goToStep3AndStart}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" /> Bắt đầu nộp Form (Sang Bước 3) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: TRANG CẬP NHẬT TRẠNG THÁI GỬI */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          
          {/* Main Dashboard Card */}
          <div className="card-glass rounded-2xl p-5 space-y-4 shadow-xl border-accent/20">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h2 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
                  Trạng thái nộp Google Form tự động
                </h2>
                <p className="text-xs text-text-muted font-mono truncate max-w-md">
                  Target: {formUrl}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isRunning ? (
                  <button
                    onClick={stopAutoSubmit}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-rose-900/30 flex items-center gap-1.5 animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" /> Dừng tiến trình
                  </button>
                ) : (
                  <button
                    onClick={resumeAutoSubmit}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Tiếp tục gửi
                  </button>
                )}
              </div>
            </div>

            {/* Progress Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  Trạng thái: 
                  {isRunning ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang tiến hành nộp Form...
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Đã tạm dừng
                    </span>
                  )}
                </span>
                <span className="font-mono text-accent font-black text-sm">{submittedCount} / {targetCount} ({progressPercent}%)</span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-accent via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="block text-[10px] text-text-muted">Đã gửi thành công</span>
                  <span className="font-black text-base text-emerald-400 font-mono">{submittedCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="block text-[10px] text-text-muted">Lỗi</span>
                  <span className="font-black text-base text-rose-400 font-mono">{errorCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="block text-[10px] text-text-muted">Độ trễ mỗi lượt</span>
                  <span className="font-black text-base text-accent font-mono">{submitDelay}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs Console */}
          <div className="card-glass rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-black text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Nhật ký hoạt động chi tiết (Logs)
              </h3>
              <button onClick={clearLogs} className="text-[11px] text-text-muted hover:text-text-primary">
                Xóa log
              </button>
            </div>

            <div className="bg-black/50 rounded-xl p-3.5 font-mono text-xs overflow-y-auto max-h-[300px] border border-white/5 space-y-1.5 custom-scrollbar">
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
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Xem trước dữ liệu
            </button>

            {submittedCount >= targetCount && (
              <button
                onClick={() => setCurrentStep(4)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow-lg flex items-center gap-2"
              >
                Xem báo cáo thành công <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: THÀNH CÔNG */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="card-glass rounded-3xl p-8 text-center space-y-6 shadow-2xl border-emerald-500/30 max-w-2xl mx-auto">
            
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/20 animate-bounce-subtle">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-emerald-400">
                🎉 HOÀN THÀNH XUẤT SẮC!
              </h2>
              <p className="text-sm text-text-secondary">
                Đã tự động nộp thành công đủ <b className="text-accent">{submittedCount} / {targetCount}</b> lượt câu trả lời vào Google Form!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div>
                <span className="block text-[11px] text-text-muted">Tổng số lượt gửi</span>
                <span className="font-black text-lg text-emerald-400 font-mono">{submittedCount}</span>
              </div>
              <div>
                <span className="block text-[11px] text-text-muted">Số câu hỏi / mẫu</span>
                <span className="font-black text-lg text-accent font-mono">{fields.length}</span>
              </div>
              <div>
                <span className="block text-[11px] text-text-muted">Trạng thái</span>
                <span className="font-black text-xs text-emerald-400">Hoàn tất 100%</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={resetAllAndStartOver}
                className="px-6 py-3 btn-primary text-xs font-black rounded-xl transition flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4 text-on-accent" /> Nộp lượt mới từ đầu
              </button>

              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl transition flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Terminal className="w-4 h-4 text-accent" /> Xem lại nhật ký (Logs)
              </button>
            </div>
          </div>
        </div>
      )}

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
