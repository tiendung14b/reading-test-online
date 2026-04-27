'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, ShieldAlert, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TokensPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState('');
  const [newLimit, setNewLimit] = useState(15);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLimitValue, setEditLimitValue] = useState(15);
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      if (data.success) {
        setTokens(data.tokens);
      }
    } catch (err) {
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return toast.error('Vui lòng nhập API Key');

    setAdding(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken, daily_limit: newLimit })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Thêm token thành công');
        setNewToken('');
        setNewLimit(15);
        fetchTokens();
      } else {
        toast.error(data.error || 'Failed to add token');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteToken = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa token này?')) return;
    try {
      const res = await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa token');
        fetchTokens();
      } else {
        toast.error('Failed to delete token');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleUpdateLimit = async (id: number) => {
    setSavingLimit(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, daily_limit: editLimitValue })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Cập nhật giới hạn thành công');
        setEditingId(null);
        fetchTokens();
      } else {
        toast.error(data.error || 'Failed to update limit');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSavingLimit(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Key className="w-8 h-8 text-accent" />
          Quản lý API Keys
        </h1>
        <p className="text-text-secondary">
          Quản lý danh sách Gemini API Keys để sử dụng cho tính năng Tạo bài tập và Chấm điểm tự động. Hệ thống sẽ tự động chuyển sang token khác nếu một token bị lỗi hoặc hết lượt sử dụng.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleAddToken} className="card-glass p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="font-bold text-lg mb-2">Thêm Token mới</h3>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">API Key</label>
              <input
                type="text"
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="AIzaSy..."
                className="input-dark w-full px-4 py-3 text-sm rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Giới hạn mỗi ngày</label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
                min="1"
                className="input-dark w-full px-4 py-3 text-sm rounded-xl"
              />
            </div>

            <button 
              type="submit" 
              disabled={adding}
              className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 rounded-xl text-sm"
            >
              {adding ? 'Đang thêm...' : <><Plus className="w-4 h-4" /> Thêm Token</>}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="card-glass p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-4">Danh sách Token</h3>
            
            {loading ? (
              <div className="py-8 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : tokens.length === 0 ? (
              <div className="py-8 text-center text-text-muted flex flex-col items-center">
                <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
                <p>Chưa có token nào. Vui lòng thêm token để sử dụng AI.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token: any) => (
                  <div key={token.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-mono text-sm text-text-primary truncate mb-1">
                        {token.token.substring(0, 10)}...{token.token.substring(token.token.length - 5)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span>Đã dùng: <strong className={token.usage_count >= token.daily_limit ? 'text-danger' : 'text-accent'}>{token.usage_count}</strong></span>
                        <span className="flex items-center gap-1">
                          / 
                          {editingId === token.id ? (
                            <input 
                              type="number" 
                              value={editLimitValue}
                              onChange={(e) => setEditLimitValue(Number(e.target.value))}
                              className="input-dark px-1 py-0.5 text-xs w-16 rounded"
                              min="1"
                              autoFocus
                            />
                          ) : (
                            <strong className={token.usage_count >= token.daily_limit ? 'text-danger' : 'text-accent'}>{token.daily_limit}</strong>
                          )}
                        </span>
                        <span>Cập nhật: {token.last_access_date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {editingId === token.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateLimit(token.id)}
                            disabled={savingLimit}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-success hover:bg-success/20 transition-colors"
                            title="Lưu"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            disabled={savingLimit}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-white/10 transition-colors"
                            title="Hủy"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(token.id);
                            setEditLimitValue(token.daily_limit);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
                          title="Sửa giới hạn"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteToken(token.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-danger/20 hover:text-danger transition-colors"
                        title="Xóa token"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
