'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Film, Music, Image as ImageIcon, Archive, File, Copy, Download, Eye, Trash2, ExternalLink, Lock, RefreshCw, Send, Database, Filter, Link as LinkIcon, Check, Cloud } from 'lucide-react';
import { parseJsonResponse } from '@/lib/utils';
import ConfirmModal from '@/components/ConfirmModal';

interface FileExplorerProps {
  onRefreshTrigger?: number;
}

interface FileItem {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  telegramChatId: string;
  telegramMessageId: number;
  viewsCount: number;
  downloadsCount: number;
  isProtected: boolean;
  createdAt: string;
}

export default function FileExplorer({ onRefreshTrigger }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedShortId, setCopiedShortId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [modalNotice, setModalNotice] = useState<{ isOpen: boolean; message: string; type?: 'danger' | 'warning' | 'info' | 'success' }>({
    isOpen: false,
    message: '',
    type: 'info'
  });
  const [isMongoUsed, setIsMongoUsed] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('q', search);
      if (category !== 'all') query.set('category', category);

      const res = await fetch(`/api/files?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
        setIsMongoUsed(!!data.isMongoUsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const loadFiles = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (search) query.set('q', search);
        if (category !== 'all') query.set('category', category);

        const res = await fetch(`/api/files?${query.toString()}`);
        const data = await parseJsonResponse(res);
        if (!ignore && data.success) {
          setFiles(data.files || []);
          setIsMongoUsed(!!data.isMongoUsed);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadFiles();
    return () => {
      ignore = true;
    };
  }, [search, category, onRefreshTrigger]);

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/files?id=${id}`, { method: 'DELETE' });
      const data = await parseJsonResponse(res);
      if (data.success) {
        setFiles((prev) => prev.filter((f) => f.id !== id));
      } else {
        setModalNotice({ isOpen: true, message: data.error || 'Gagal menghapus file.', type: 'danger' });
      }
    } catch (e: any) {
      setModalNotice({ isOpen: true, message: 'Error: ' + e.message, type: 'danger' });
    } finally {
      setDeletingId(null);
    }
  };

  const copyShareUrl = (id: string) => {
    const url = `${window.location.origin}/f/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyShortUrl = (id: string) => {
    const url = `${window.location.origin}/s/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedShortId(id);
    setTimeout(() => setCopiedShortId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-zinc-300" />;
    if (mime.startsWith('video/')) return <Film className="w-5 h-5 text-zinc-300" />;
    if (mime.startsWith('audio/')) return <Music className="w-5 h-5 text-zinc-300" />;
    if (mime.includes('pdf') || mime.includes('text')) return <FileText className="w-5 h-5 text-zinc-300" />;
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return <Archive className="w-5 h-5 text-zinc-300" />;
    return <File className="w-5 h-5 text-zinc-400" />;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-outfit">
      {/* Search & Category Filter Header */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama file..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-outfit transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={fetchFiles}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-all shadow-xs"
              title="Refresh Daftar File"
            >
              <RefreshCw className="w-4 h-4 text-zinc-300" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium no-scrollbar">
          {[
            { id: 'all', label: 'Semua File' },
            { id: 'images', label: 'Gambar' },
            { id: 'videos', label: 'Video' },
            { id: 'audio', label: 'Audio' },
            { id: 'documents', label: 'Dokumen' },
            { id: 'archives', label: 'Arsip' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl border transition-all shrink-0 font-bold ${
                category === cat.id
                  ? 'bg-zinc-100 text-zinc-950 border-zinc-200 shadow-xs'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* File List Grid */}
      {loading ? (
        <div className="py-16 text-center text-zinc-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-zinc-300" />
          <p className="text-xs font-mono-code">Memuat berkas tersimpan...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-12 text-center text-zinc-400 space-y-3 shadow-2xl">
          <File className="w-10 h-10 mx-auto text-zinc-600" />
          <h3 className="text-base font-bold text-zinc-100 font-serif-elegant">Belum Ada File Terdaftar</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto font-outfit">
            Gunakan tab Uploader untuk mulai mengunggah file ke Cloud Storage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-5 transition-all hover:shadow-2xl flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* File Header Icon & Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-zinc-100 truncate font-outfit group-hover:text-zinc-300 transition-colors" title={file.originalName}>
                      {file.originalName}
                    </h4>
                    <p className="text-[11px] font-mono-code text-zinc-400 mt-0.5">
                      {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>

                  {file.isProtected && (
                    <span className="p-1.5 bg-amber-950/60 text-amber-300 rounded-lg border border-amber-800 shrink-0" title="Dilindungi Password">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Storage Info */}
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] font-mono-code text-zinc-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <Cloud className="w-3 h-3 text-zinc-400" />
                    <span>Msg #{file.telegramMessageId}</span>
                  </span>
                  <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Direct Stream
                  </span>
                </div>

                {/* Access Stats */}
                <div className="flex items-center gap-4 text-xs font-mono-code text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{file.viewsCount || 0} views</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{file.downloadsCount || 0} unduhan</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => copyShareUrl(file.id)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    title="Salin Share Link (/f/...)"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{copiedId === file.id ? 'Tersalin!' : 'Link Share'}</span>
                  </button>

                  <button
                    onClick={() => copyShortUrl(file.id)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    title="Salin Short URL (/s/...)"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{copiedShortId === file.id ? 'Tersalin!' : 'Short URL'}</span>
                  </button>

                  <a
                    href={`/f/${file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 transition-all shadow-xs"
                    title="Buka Halaman File"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
                  </a>
                </div>

                <button
                  onClick={() => handleDelete(file.id, file.originalName)}
                  disabled={deletingId === file.id}
                  className="p-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded-xl border border-rose-800/60 transition-all shadow-xs"
                  title="Hapus File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Hapus File Permanen"
        message={`Hapus file "${deleteConfirm?.name || ''}" secara permanen?`}
        description="Data file di Cloud Storage & MongoDB akan terhapus dan tidak bisa dikembalikan."
        confirmText="Ya, Hapus File"
        cancelText="Batal"
        type="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Notice Alert Modal */}
      <ConfirmModal
        isOpen={modalNotice.isOpen}
        title="Pemberitahuan"
        message={modalNotice.message}
        confirmText="Mengerti"
        type={modalNotice.type || 'info'}
        showCancel={false}
        onConfirm={() => setModalNotice({ isOpen: false, message: '' })}
        onCancel={() => setModalNotice({ isOpen: false, message: '' })}
      />
    </div>
  );
}
