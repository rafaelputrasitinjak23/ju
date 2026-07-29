'use client';

import { X, AlertTriangle, Trash2, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  showCancel?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  description,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'danger',
  showCancel = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-sky-400" />;
    }
  };

  const getBadgeStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'info':
      default:
        return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    }
  };

  const getConfirmBtnStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20';
      case 'info':
      default:
        return 'bg-zinc-100 hover:bg-white text-zinc-900 shadow-zinc-100/10';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl transition-all scale-100 animate-in zoom-in-95 duration-200 overflow-hidden font-outfit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 blur-3xl opacity-30 rounded-full pointer-events-none ${
          type === 'danger' ? 'bg-rose-500' : type === 'warning' ? 'bg-amber-500' : type === 'success' ? 'bg-emerald-500' : 'bg-sky-500'
        }`} />

        {/* Header with Icon */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${getBadgeStyle()}`}>
            {getIcon()}
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5 mb-6">
          <h3 className="text-base font-bold text-zinc-100 font-serif-elegant">
            {title || (type === 'danger' ? 'Konfirmasi Hapus' : type === 'warning' ? 'Peringatan' : 'Pemberitahuan')}
          </h3>
          <p className="text-sm text-zinc-300 font-medium leading-relaxed">
            {message}
          </p>
          {description && (
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${getConfirmBtnStyle()}`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
