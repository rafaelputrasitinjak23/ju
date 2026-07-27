'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Cloud, Download, Eye, Lock, FileText, Film, Music, Image as ImageIcon, File, Send, Copy, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle, QrCode, X, Share2, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { parseJsonResponse } from '@/lib/utils';

interface FileDetails {
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
  rawUrl: string;
  downloadUrl: string;
  fullShareUrl: string;
}

export default function FilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const fileId = resolvedParams.id;

  const [file, setFile] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password unlock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchFileDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/file/${fileId}`);
        const data = await parseJsonResponse(res);
        if (!ignore) {
          if (data.success) {
            setFile(data.file);
            if (!data.file.isProtected) {
              setIsUnlocked(true);
            }
          } else {
            setError(data.error || 'File tidak ditemukan.');
          }
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Gagal memuat detail file.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchFileDetails();
    return () => {
      ignore = true;
    };
  }, [fileId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setUnlocking(true);
    setUnlockError(null);

    try {
      const res = await fetch(`/api/file/${fileId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await parseJsonResponse(res);

      if (data.success && data.unlocked) {
        setIsUnlocked(true);
      } else {
        setUnlockError(data.error || 'Password salah.');
      }
    } catch (err: any) {
      setUnlockError(err.message || 'Gagal verifikasi password.');
    } finally {
      setUnlocking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(label);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-sky-600" />;
    if (mime.startsWith('video/')) return <Film className="w-8 h-8 text-indigo-600" />;
    if (mime.startsWith('audio/')) return <Music className="w-8 h-8 text-purple-600" />;
    if (mime.includes('pdf') || mime.includes('text')) return <FileText className="w-8 h-8 text-emerald-600" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-3" />
        <p className="text-sm font-outfit text-slate-400">Menghubungkan ke Cloud Storage...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-900/60 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold font-serif-elegant text-white">File Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 font-outfit leading-relaxed">
            {error || 'Berkas yang Anda cari mungkin telah dihapus atau ID file tidak valid.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition-all mt-2 shadow-lg shadow-sky-500/20"
          >
            <ArrowLeft className="w-4 h-4 text-slate-950" />
            <span>Kembali ke Beranda RafaelXD</span>
          </Link>
        </div>
      </div>
    );
  }

  const rawAccessUrl = file.isProtected ? `${file.rawUrl}?pwd=${encodeURIComponent(password)}` : file.rawUrl;
  const downloadAccessUrl = file.isProtected ? `${file.downloadUrl}&pwd=${encodeURIComponent(password)}` : file.downloadUrl;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Outfit',sans-serif] flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden bg-slate-950 group-hover:border-slate-700 transition-colors shadow-xs">
              <img
                src="https://rafaelxd.my.id/raw/exnqacv9"
                alt="RafaelXD Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-serif-elegant text-lg font-bold text-white tracking-tight">RafaelXD</span>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-100 flex items-center gap-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload File Lain</span>
          </Link>
        </div>
      </header>

      {/* Content Main Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Password Protection Gate */}
        {file.isProtected && !isUnlocked ? (
          <div className="bg-slate-900 border border-amber-900/60 rounded-3xl p-8 max-w-md mx-auto text-center space-y-6 shadow-2xl animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold font-serif-elegant text-white">File Dilindungi Password</h2>
              <p className="text-xs text-slate-400 font-outfit">
                Masukkan kata sandi untuk mengunduh atau melihat file ini.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-center text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono-code"
              />

              {unlockError && (
                <p className="text-xs text-rose-300 bg-rose-950/60 p-2.5 rounded-lg border border-rose-800/80">
                  {unlockError}
                </p>
              )}

              <button
                type="submit"
                disabled={unlocking}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                {unlocking ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Lock className="w-4 h-4 text-slate-950" />}
                <span>Buka Akses File</span>
              </button>
            </form>
          </div>
        ) : (
          /* Main File Preview & Download Card */
          <div className="space-y-6 animate-fade-in">
            {/* Top File Title Banner */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold font-serif-elegant text-white break-words">
                      {file.originalName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-mono-code text-slate-400">
                      <span>Ukuran: {formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>Diupload: {new Date(file.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Download Main CTA & QR Code */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-2xl border border-slate-700 transition-all flex items-center gap-2 shadow-xs"
                    title="Tampilkan QR Code"
                  >
                    <QrCode className="w-4 h-4 text-sky-400" />
                    <span>QR Code</span>
                  </button>

                  <a
                    href={downloadAccessUrl}
                    download
                    className="px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2.5"
                  >
                    <Download className="w-5 h-5 text-slate-950" />
                    <span>Unduh File</span>
                  </a>
                </div>
              </div>

              {/* Stats & Telegram Storage Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <Eye className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-mono-code">Dilihat</span>
                    <span className="text-sm font-bold text-slate-100 font-mono-code">{file.viewsCount} kali</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <Download className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-mono-code">Diunduh</span>
                    <span className="text-sm font-bold text-slate-100 font-mono-code">{file.downloadsCount} kali</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[10px] text-slate-500 uppercase font-mono-code">Cloud Storage</span>
                    <span className="text-xs font-bold text-slate-100 font-mono-code truncate block">
                      Msg #{file.telegramMessageId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Media Viewer Component */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <h3 className="text-sm font-bold font-serif-elegant text-white">Pratinjau Berkas</h3>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 min-h-[220px] flex items-center justify-center overflow-hidden">
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={rawAccessUrl}
                    alt={file.originalName}
                    className="max-h-[500px] w-auto object-contain rounded-xl shadow-md"
                  />
                ) : file.mimeType.startsWith('video/') ? (
                  <video
                    src={rawAccessUrl}
                    controls
                    className="w-full max-h-[500px] rounded-xl"
                  >
                    Browser Anda tidak mendukung pemutar video HTML5.
                  </video>
                ) : file.mimeType.startsWith('audio/') ? (
                  <div className="w-full max-w-md py-6 space-y-3 text-center">
                    <Music className="w-12 h-12 text-purple-400 mx-auto" />
                    <audio src={rawAccessUrl} controls className="w-full" />
                  </div>
                ) : file.mimeType.includes('pdf') ? (
                  <iframe
                    src={rawAccessUrl}
                    className="w-full h-[500px] rounded-xl border border-slate-800 bg-white"
                  />
                ) : (
                  <div className="text-center py-8 space-y-3">
                    <File className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-outfit max-w-xs mx-auto">
                      Format file ini tidak mendukung pratinjau langsung di browser. Gunakan tombol unduh di atas untuk menyimpan file.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Share Links Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-serif-elegant text-white">Bagikan Link Berkas</h3>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>QR Code Seluler</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Direct URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/raw/${file.id}${file.isProtected && password ? `?pwd=${encodeURIComponent(password)}` : ''}` : `/raw/${file.id}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono-code focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/raw/${file.id}${file.isProtected && password ? `?pwd=${encodeURIComponent(password)}` : ''}` : `/raw/${file.id}`, 'raw')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{copiedType === 'raw' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Halaman Utama Share URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={file.fullShareUrl}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono-code focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(file.fullShareUrl, 'share')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{copiedType === 'share' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Direct Download Attachment URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}${downloadAccessUrl}` : downloadAccessUrl}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono-code focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}${downloadAccessUrl}` : downloadAccessUrl, 'direct')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all shrink-0 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>{copiedType === 'direct' ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {showQrModal && file && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-6 shadow-2xl relative text-center">
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 mx-auto mb-3">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold font-serif-elegant text-white">Scan QR Code</h3>
                <p className="text-xs text-slate-400 font-outfit">
                  Pindai dengan kamera HP Anda untuk membuka file secara praktis di perangkat seluler.
                </p>
              </div>

              {/* QR Code Canvas/SVG Box */}
              <div className="bg-white p-5 rounded-2xl inline-block border-2 border-slate-700 shadow-sm mx-auto">
                <QRCodeSVG
                  value={file.fullShareUrl}
                  size={180}
                  bgColor="#FFFFFF"
                  fgColor="#0F172A"
                  level="M"
                />
              </div>

              <div className="space-y-3 pt-1">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left">
                  <p className="text-[10px] text-slate-500 font-mono-code uppercase">Nama File:</p>
                  <p className="text-xs font-semibold text-slate-200 truncate font-outfit">{file.originalName}</p>
                  <p className="text-[10px] text-slate-400 font-mono-code mt-0.5">{formatBytes(file.size)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(file.fullShareUrl, 'qr_share')}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>{copiedType === 'qr_share' ? 'Tersalin!' : 'Salin URL'}</span>
                  </button>

                  <button
                    onClick={() => setShowQrModal(false)}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 px-4 text-xs text-zinc-400 font-outfit bg-zinc-900/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-zinc-400 text-xs">
            <span className="text-zinc-100 font-bold font-serif-elegant">RafaelXD File Host</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://whatsapp.com/channel/0029VbAjoElLI8YVzXxn7H0j"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-[#25D366] hover:border-[#25D366]/50 transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.011 2C6.5 2 2.022 6.478 2.022 11.989c0 1.942.556 3.75 1.517 5.283L2 22l4.889-1.511a9.92 9.92 0 0 0 5.122 1.489C17.522 21.978 22 17.5 22 11.989 22 6.478 17.522 2 12.011 2zm0 18.178c-1.633 0-3.156-.444-4.467-1.222l-.322-.189-3.3.889.889-3.211-.211-.333A8.15 8.15 0 0 1 3.844 11.99c0-4.5 3.656-8.156 8.167-8.156 4.5 0 8.156 3.656 8.156 8.156s-3.656 8.189-8.156 8.189zm4.489-6.133c-.244-.122-1.456-.722-1.678-.8-.222-.089-.389-.122-.556.122-.167.244-.656.822-.8 1-.144.178-.289.2-.533.078-.244-.122-1.033-.378-1.967-1.211-.722-.644-1.211-1.444-1.356-1.689-.144-.244-.011-.378.111-.5.111-.111.244-.289.367-.433.122-.144.167-.244.244-.4.078-.167.044-.311-.022-.433-.067-.122-.556-1.333-.756-1.833-.2-.489-.4-.422-.556-.433h-.478c-.167 0-.444.067-.678.322-.233.256-.889.867-.889 2.111 0 1.244.911 2.444 1.033 2.611.122.167 1.789 2.733 4.333 3.833.611.267 1.089.422 1.456.544.611.189 1.167.167 1.611.1.489-.078 1.456-.589 1.667-1.156.211-.567.211-1.056.144-1.156-.067-.1-.233-.167-.478-.289z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@RafaelXD_offc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-[#FF0000] hover:border-[#FF0000]/50 transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/rafaelputrasitinjak/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-[#E4405F] hover:border-[#E4405F]/50 transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
