'use client';

import { useState, useRef, useEffect, useMemo, DragEvent, ChangeEvent } from 'react';
import { Upload, File, Lock, CheckCircle2, Copy, ExternalLink, QrCode, Shield, RefreshCw, AlertCircle, Send, Database, FileText, Film, Music, Image as ImageIcon, Archive, X, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { parseJsonResponse } from '@/lib/utils';

interface UploaderProps {
  onUploadSuccess: () => void;
  onOpenSettings: () => void;
  isTelegramConfigured: boolean;
}

export default function Uploader({ onUploadSuccess, onOpenSettings, isTelegramConfigured }: UploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [uploadResult, setUploadResult] = useState<{
    fileUrl: string;
    downloadUrl: string;
    file: {
      id: string;
      originalName: string;
      size: number;
      mimeType: string;
      telegramChatId: string;
      telegramMessageId: number;
    };
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Ukuran file melebihi batas maksimal 200MB per file.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setErrorMessage(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMessage(null);
    setUploadProgress(15);
    setUploadStage('Membaca file & menyiapkan streaming...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (password.trim()) {
      formData.append('password', password.trim());
    }

    try {
      setUploadProgress(40);
      setUploadStage('Mengirimkan file ke Cloud Storage API...');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);
      setUploadStage('Menyimpan metadata file ke MongoDB...');

      const data = await parseJsonResponse(res);

      if (!data.success) {
        throw new Error(data.error || 'Gagal mengunggah file.');
      }

      if (data.fileUrl && data.fileUrl.includes('MY_APP_URL') && typeof window !== 'undefined') {
        data.fileUrl = data.fileUrl.replace(/MY_APP_URL/g, window.location.origin);
      }
      if (data.downloadUrl && data.downloadUrl.includes('MY_APP_URL') && typeof window !== 'undefined') {
        data.downloadUrl = data.downloadUrl.replace(/MY_APP_URL/g, window.location.origin);
      }

      setUploadProgress(100);
      setUploadResult(data);
      onUploadSuccess();

      // Auto-copy direct raw URL to clipboard immediately after upload succeeds
      const rawLink = data.rawUrl?.startsWith('http')
        ? data.rawUrl
        : (typeof window !== 'undefined' ? `${window.location.origin}${data.rawUrl}` : data.rawUrl);

      if (rawLink && typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(rawLink);
          setCopiedType('auto_raw');
          setTimeout(() => setCopiedType(null), 4000);
        } catch (clipErr) {
          console.error('Auto copy error:', clipErr);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat upload.');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(label);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPassword('');
    setUploadResult(null);
    setErrorMessage(null);
    setUploadProgress(0);
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-zinc-300" />;
    if (mime.startsWith('video/')) return <Film className="w-8 h-8 text-zinc-300" />;
    if (mime.startsWith('audio/')) return <Music className="w-8 h-8 text-zinc-300" />;
    if (mime.includes('pdf') || mime.includes('text')) return <FileText className="w-8 h-8 text-zinc-300" />;
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return <Archive className="w-8 h-8 text-zinc-300" />;
    return <File className="w-8 h-8 text-zinc-400" />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Upload Box / Success State */}
      {!uploadResult ? (
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-light text-zinc-100 tracking-tight font-serif-elegant">
              RafaelXD Host File
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto font-outfit">
              Host your files, and enjoy your best experience.
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => {
              if (!selectedFile) fileInputRef.current?.click();
            }}
            className={`w-full border-2 border-dashed rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center gap-6 transition-all ${
              dragActive
                ? 'border-zinc-500 bg-zinc-800/40 shadow-lg scale-[0.99]'
                : selectedFile
                ? 'border-zinc-800 bg-zinc-950/50 cursor-default'
                : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/40 hover:bg-zinc-950/80 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center py-4">
                <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-md text-zinc-300">
                  <Upload className="w-7 h-7 text-zinc-300" />
                </div>
                <div>
                  <p className="text-lg text-zinc-100 font-semibold">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-zinc-400 mt-1.5 font-outfit">
                    Maximum file size supported: 200MB per file
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4 text-left animate-fade-in" onClick={(e) => e.stopPropagation()}>
                {/* File Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 shrink-0">
                      {getFileIcon(selectedFile.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-zinc-100 truncate max-w-xs md:max-w-md">
                        {selectedFile.name}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono-code mt-0.5">
                        {formatBytes(selectedFile.size)} • {selectedFile.type || 'Format Tidak Diketahui'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-all border border-zinc-700 shadow-xs"
                    >
                      Ganti File
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all border border-zinc-700 shadow-xs"
                      title="Batalkan / Hapus File"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Preview Box */}
                {previewUrl && (
                  <div className="w-full bg-zinc-950/80 rounded-2xl border border-zinc-800 p-4 flex flex-col items-center justify-center">
                    {selectedFile.type.startsWith('image/') ? (
                      <div className="relative w-full max-h-[300px] flex items-center justify-center overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-2 shadow-xs">
                        <img
                          src={previewUrl}
                          alt="Pratinjau Gambar"
                          className="max-h-[280px] max-w-full object-contain rounded-lg"
                        />
                      </div>
                    ) : selectedFile.type.startsWith('video/') ? (
                      <div className="w-full rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-xs">
                        <video
                          src={previewUrl}
                          controls
                          className="max-h-[300px] w-full"
                        />
                      </div>
                    ) : selectedFile.type.startsWith('audio/') ? (
                      <div className="w-full bg-zinc-900 p-4 rounded-xl border border-zinc-800 shadow-xs">
                        <p className="text-xs text-zinc-400 mb-2 font-mono-code font-semibold">Putar Audio Preview:</p>
                        <audio src={previewUrl} controls className="w-full" />
                      </div>
                    ) : selectedFile.type === 'application/pdf' ? (
                      <div className="w-full h-[260px] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xs">
                        <iframe
                          src={previewUrl}
                          className="w-full h-full border-0"
                          title="Pratinjau PDF"
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-zinc-900 p-6 rounded-xl border border-zinc-800 text-center space-y-2 shadow-xs">
                        <div className="inline-flex p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                          {getFileIcon(selectedFile.type)}
                        </div>
                        <p className="text-xs font-semibold text-zinc-100 font-outfit truncate max-w-md mx-auto">
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono-code">
                          File Siap Diunggah • {formatBytes(selectedFile.size)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Password Protection Option */}
          {selectedFile && (
            <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-2 animate-fade-in">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-400" />
                <span>Lindungi dengan Password (Opsional)</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi jika ingin membatasi akses..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 font-mono-code"
              />
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Progress Bar during upload */}
          {uploading && (
            <div className="space-y-2 p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between text-xs font-mono-code text-zinc-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                  {uploadStage}
                </span>
                <span className="font-bold text-zinc-200">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="bg-zinc-200 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleStartUpload}
            disabled={!selectedFile || uploading}
            className="w-full py-3.5 px-8 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Mengunggah File ke Storage...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-zinc-950" />
                <span>Mulai Unggah File</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Upload Success Result Card */
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 text-emerald-400 border-b border-zinc-800 pb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-xl font-bold font-serif-elegant text-zinc-100">File Berhasil Diunggah</h3>
              <p className="text-xs text-zinc-400 font-outfit">
                File telah tersimpan di Cloud Storage & siap dipanggil atau dibagikan.
              </p>
            </div>
          </div>

          {/* Auto-copy Notification Banner */}
          {copiedType === 'auto_raw' && (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Link Direct Raw telah otomatis disalin ke clipboard!</span>
              </span>
              <span className="text-[10px] font-mono-code bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-700">
                Copied
              </span>
            </div>
          )}

          {/* Direct Raw Media Link */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Direct Raw URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/raw/${uploadResult.file.id}` : `/raw/${uploadResult.file.id}`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono-code focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/raw/${uploadResult.file.id}` : `/raw/${uploadResult.file.id}`, 'raw')}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all shrink-0 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>{copiedType === 'raw' ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Public File Page Link */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Link Halaman File:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={
                  uploadResult.fileUrl && uploadResult.fileUrl.startsWith('http') && !uploadResult.fileUrl.includes('MY_APP_URL')
                    ? uploadResult.fileUrl
                    : (typeof window !== 'undefined' ? `${window.location.origin}/f/${uploadResult.file.id}` : `/f/${uploadResult.file.id}`)
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono-code focus:outline-none"
              />
              <button
                onClick={() =>
                  copyToClipboard(
                    uploadResult.fileUrl && uploadResult.fileUrl.startsWith('http') && !uploadResult.fileUrl.includes('MY_APP_URL')
                      ? uploadResult.fileUrl
                      : (typeof window !== 'undefined' ? `${window.location.origin}/f/${uploadResult.file.id}` : `/f/${uploadResult.file.id}`),
                    'public'
                  )
                }
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all shrink-0 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>{copiedType === 'public' ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* File Info Summary */}
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400">Nama File:</span>
              <span className="font-bold text-zinc-100 truncate max-w-xs">{uploadResult.file.originalName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400">Ukuran:</span>
              <span className="font-mono-code text-zinc-300">{formatBytes(uploadResult.file.size)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-400">Status Storage:</span>
              <span className="font-mono-code text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
                Online • Active
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQr(true)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-zinc-300" />
                <span>QR Code</span>
              </button>

              <a
                href={uploadResult.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Buka Halaman File</span>
              </a>
            </div>

            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-950" />
              <span>Upload File Lain</span>
            </button>
          </div>

          {/* QR Code Modal */}
          {showQr && (
            <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-sm w-full space-y-6 shadow-2xl relative text-center">
                <button
                  type="button"
                  onClick={() => setShowQr(false)}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 transition-all"
                  title="Tutup Modal"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1 pt-2">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 mx-auto mb-3">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-serif-elegant text-zinc-100">Scan QR Code File</h3>
                  <p className="text-xs text-zinc-400 font-outfit">
                    Pindai dengan kamera ponsel untuk mengakses file di perangkat seluler.
                  </p>
                </div>

                {/* QR Code Display */}
                <div className="bg-white p-5 rounded-2xl inline-block border-2 border-zinc-700 shadow-lg mx-auto">
                  <QRCodeSVG
                    value={uploadResult.fileUrl}
                    size={180}
                    bgColor="#FFFFFF"
                    fgColor="#18181B"
                    level="M"
                  />
                </div>

                <div className="space-y-3 pt-1">
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 text-left">
                    <p className="text-[10px] text-zinc-500 font-mono-code uppercase">Nama File:</p>
                    <p className="text-xs font-semibold text-zinc-200 truncate font-outfit">{uploadResult.file.originalName}</p>
                    <p className="text-[10px] text-zinc-400 font-mono-code mt-0.5">{formatBytes(uploadResult.file.size)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(uploadResult.fileUrl, 'qr_share')}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{copiedType === 'qr_share' ? 'Tersalin!' : 'Salin URL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowQr(false)}
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
      )}
    </div>
  );
}
