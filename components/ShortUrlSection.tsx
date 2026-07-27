'use client';

import { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Sparkles,
  BarChart2,
  RefreshCw,
  Search,
  Globe,
  Tag,
  ArrowRight,
  ShieldCheck,
  Share2,
  QrCode,
  X,
  Smartphone,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { parseJsonResponse } from '@/lib/utils';
import { ShortUrlRecord } from '@/lib/types';

interface ShortUrlSectionProps {
  showList?: boolean;
}

export default function ShortUrlSection({ showList = true }: ShortUrlSectionProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const [shortUrls, setShortUrls] = useState<ShortUrlRecord[]>([]);
  const [fetchingList, setFetchingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://domain-anda.com';
  };

  const domain = getDomain();

  const fetchShortUrls = async () => {
    if (!showList) return;
    setFetchingList(true);
    try {
      const res = await fetch('/api/shorten');
      const data = await parseJsonResponse(res);
      if (data.success && Array.isArray(data.shortUrls)) {
        setShortUrls(data.shortUrls);
      }
    } catch (err) {
      console.error('Error fetching short URLs:', err);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    if (!showList) return;
    let ignore = false;
    const loadData = async () => {
      setFetchingList(true);
      try {
        const res = await fetch('/api/shorten');
        const data = await parseJsonResponse(res);
        if (!ignore && data.success && Array.isArray(data.shortUrls)) {
          setShortUrls(data.shortUrls);
        }
      } catch (err) {
        console.error('Error fetching short URLs:', err);
      } finally {
        if (!ignore) setFetchingList(false);
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, [showList]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setCreatedUrl(null);

    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          customAlias,
          title,
        }),
      });

      const data = await parseJsonResponse(res);

      if (data.success) {
        setCreatedUrl(data.shortUrl);
        setTargetUrl('');
        setCustomAlias('');
        setTitle('');
        fetchShortUrls();
      } else {
        setErrorMsg(data.error || 'Gagal memproses Short URL.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus Short URL ini?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/shorten?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await parseJsonResponse(res);
      if (data.success) {
        setShortUrls((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(data.error || 'Gagal menghapus Short URL.');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredList = shortUrls.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.id.toLowerCase().includes(q) ||
      item.targetUrl.toLowerCase().includes(q) ||
      (item.title && item.title.toLowerCase().includes(q))
    );
  });

  const totalClicks = shortUrls.reduce((acc, curr) => acc + (curr.clicksCount || 0), 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in font-['Outfit',sans-serif]">
      {/* Hero Card / Creator Form */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-sm">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-serif-elegant text-zinc-100">Pembuat Short URL</h2>
              <p className="text-xs md:text-sm text-zinc-400 font-outfit mt-0.5">
                Ubah URL yang panjang menjadi link pendek yang elegan dan mudah dibagikan.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3.5 py-1.5 rounded-xl text-xs font-mono-code text-zinc-400">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span>Total Klik: <strong className="text-zinc-100 font-bold">{totalClicks}</strong></span>
          </div>
        </div>

        {/* Shorten Form */}
        <form onSubmit={handleShorten} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 font-mono-code">
              URL Tujuan (Target URL) <span className="text-rose-400">*</span>:
            </label>
            <div className="relative">
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://domain-anda.com/halaman-panjang-atau-file-pilihan..."
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs md:text-sm text-zinc-100 placeholder:text-zinc-500 font-mono-code focus:outline-none focus:border-zinc-600 transition-all"
              />
              <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 font-mono-code">
                Custom Alias (Opsional):
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-zinc-500 font-mono-code select-none pointer-events-none">
                  /s/
                </span>
                <input
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  placeholder="contoh: file-laporan-2026"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 font-mono-code focus:outline-none focus:border-zinc-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 font-mono-code">
                Judul / Label Link (Opsional):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Dokumen Proyek A"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 font-outfit focus:outline-none focus:border-zinc-600 transition-all"
                />
                <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-outfit">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !targetUrl.trim()}
            className="w-full py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Memproses Short URL...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-zinc-950" />
                <span>Buat Short URL Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Newly Created Result Highlight Card */}
        {createdUrl && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 font-serif-elegant flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Short URL Berhasil Dibuat!
              </span>
              <span className="text-[10px] text-zinc-400 font-mono-code">Siap dibagikan</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdUrl}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono-code focus:outline-none"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  title="Lihat QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 text-zinc-300" />
                  <span>QR Code</span>
                </button>

                <button
                  onClick={() => handleCopy(createdUrl, 'created')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {copiedId === 'created' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Link</span>
                    </>
                  )}
                </button>

                <a
                  href={createdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  title="Buka Link di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal for Short URL */}
        {showQrModal && createdUrl && (
          <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-6 shadow-2xl relative text-center">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 mx-auto mb-3">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-serif-elegant text-zinc-100">Scan QR Short URL</h3>
                <p className="text-xs text-zinc-400 font-outfit">
                  Pindai untuk membuka Short URL di ponsel.
                </p>
              </div>

              {/* QR Code Display */}
              <div className="bg-white p-5 rounded-2xl inline-block border-2 border-zinc-700 shadow-lg mx-auto">
                <QRCodeSVG
                  value={createdUrl}
                  size={180}
                  bgColor="#FFFFFF"
                  fgColor="#18181B"
                  level="M"
                />
              </div>

              <div className="space-y-3 pt-1">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-left">
                  <p className="text-[10px] text-zinc-500 font-mono-code uppercase">Target URL:</p>
                  <p className="text-xs font-semibold text-zinc-200 truncate font-outfit">{targetUrl}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(createdUrl, 'created_qr')}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{copiedId === 'created_qr' ? 'Tersalin!' : 'Salin Short URL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Short URLs Management Table/List */}
      {showList && (
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-lg font-bold font-serif-elegant text-zinc-100 flex items-center gap-2">
                <span>Daftar Short URL</span>
                <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {shortUrls.length}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-outfit mt-0.5">
                Kelola link pendek yang telah dibuat dan pantau statistik klik.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari short URL..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 font-outfit focus:outline-none focus:border-zinc-600"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={fetchShortUrls}
                disabled={fetchingList}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 text-xs transition-all shrink-0"
                title="Refresh Daftar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingList ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Short URLs List */}
          {fetchingList && shortUrls.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-mono-code flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-zinc-300" />
              <span>Memuat data Short URL...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl space-y-2">
              <LinkIcon className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-outfit">
                {searchQuery ? 'Tidak ada Short URL yang cocok dengan pencarian.' : 'Belum ada Short URL yang dibuat.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => {
                const fullShortLink = `${domain}/s/${item.id}`;
                return (
                  <div
                    key={item.id}
                    className="bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono-code text-xs font-bold shrink-0">
                          /s/{item.id}
                        </span>
                        {item.title && (
                          <span className="text-sm font-bold text-zinc-100 font-serif-elegant truncate">
                            {item.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono-code text-zinc-400 shrink-0">
                        <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                          <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-zinc-100 font-bold">{item.clicksCount || 0}</span>
                          <span>klik</span>
                        </div>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Target & Link Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-code">
                      <div className="flex items-center gap-2 overflow-hidden text-zinc-400 truncate">
                        <span className="text-zinc-500 shrink-0">Tujuan:</span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-zinc-200 text-zinc-300 underline underline-offset-2 truncate transition-colors"
                          title={item.targetUrl}
                        >
                          {item.targetUrl}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopy(fullShortLink, item.id)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-all flex items-center gap-1.5"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>

                        <a
                          href={fullShortLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-all"
                          title="Buka Short URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="p-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/60 transition-all disabled:opacity-50"
                          title="Hapus Short URL"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
