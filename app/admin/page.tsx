'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Key, Send, Database, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft, Lock, ExternalLink, Server, HardDrive, Link as LinkIcon, Settings, User, FileCode, Copy, Check, QrCode } from 'lucide-react';
import { parseJsonResponse } from '@/lib/utils';
import FileExplorer from '@/components/FileExplorer';
import ShortUrlSection from '@/components/ShortUrlSection';
import ConfirmModal from '@/components/ConfirmModal';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'files' | 'shortener' | 'rawtext'>('settings');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_authenticated') === 'true';
    }
    return false;
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [mongoUri, setMongoUri] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const [tgTestStatus, setTgTestStatus] = useState<{ ok?: boolean; message?: string; botName?: string }>({});
  const [mongoTestStatus, setMongoTestStatus] = useState<{ ok?: boolean; message?: string }>({});

  const [testingTg, setTestingTg] = useState(false);
  const [testingMongo, setTestingMongo] = useState(false);
  const [adminErrorModal, setAdminErrorModal] = useState<string | null>(null);

  // Raw Text Creator State (Admin Only)
  const [rawTitle, setRawTitle] = useState('paste.txt');
  const [rawMimeType, setRawMimeType] = useState('text/plain');
  const [rawPassword, setRawPassword] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [publishingRaw, setPublishingRaw] = useState(false);
  const [rawSuccessResult, setRawSuccessResult] = useState<{
    fileId: string;
    rawUrl: string;
    shareUrl: string;
    downloadUrl: string;
    originalName: string;
    size: number;
  } | null>(null);
  const [rawCopiedType, setRawCopiedType] = useState<string | null>(null);

  const handleCreateRawText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawContent.trim()) {
      setAdminErrorModal('Isi teks raw tidak boleh kosong.');
      return;
    }

    setPublishingRaw(true);
    setRawSuccessResult(null);
    try {
      const fileName = rawTitle.trim() || 'paste.txt';
      const blob = new Blob([rawContent], { type: rawMimeType || 'text/plain' });
      const formData = new FormData();
      formData.append('file', blob, fileName);
      if (rawPassword.trim()) {
        formData.append('password', rawPassword.trim());
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await parseJsonResponse(res);

      if (data.success && data.file) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const rawLink = `${origin}/raw/${data.file.id}`;
        const shareLink = `${origin}/f/${data.file.id}`;
        const downloadLink = `${origin}/api/raw/${data.file.id}?download=true`;

        setRawSuccessResult({
          fileId: data.file.id,
          rawUrl: rawLink,
          shareUrl: shareLink,
          downloadUrl: downloadLink,
          originalName: data.file.originalName || fileName,
          size: data.file.size || blob.size,
        });

        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(rawLink);
            setRawCopiedType('auto_raw');
            setTimeout(() => setRawCopiedType(null), 3500);
          } catch (cErr) {
            console.error(cErr);
          }
        }
      } else {
        setAdminErrorModal(data.error || 'Gagal membuat raw text.');
      }
    } catch (err: any) {
      setAdminErrorModal(err.message || 'Terjadi kesalahan saat membuat raw text.');
    } finally {
      setPublishingRaw(false);
    }
  };

  const copyRawTextUrl = (url: string, typeKey: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setRawCopiedType(typeKey);
      setTimeout(() => setRawCopiedType(null), 2000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPin) {
      setPinError('Harap isi username dan kata sandi admin.');
      return;
    }
    setLoggingIn(true);
    setPinError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPin,
        }),
      });
      const data = await parseJsonResponse(res);
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
        setPinError('');
      } else {
        setPinError(data.error || 'Username atau kata sandi admin tidak sesuai.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Gagal menghubungi server autentikasi.');
    } finally {
      setLoggingIn(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await parseJsonResponse(res);
      if (data.success) {
        setBotToken(data.config.telegramBotTokenMasked || '');
        setChatId(data.config.telegramChatId || '');
        setMongoUri(data.config.mongodbUriMasked || '');

        if (data.status?.telegram) {
          setTgTestStatus({
            ok: data.status.telegram.ok,
            message: data.status.telegram.error || `Terhubung sebagai @${data.status.telegram.botUsername || 'Bot'}`,
            botName: data.status.telegram.botUsername,
          });
        }
        if (data.status?.mongodb) {
          setMongoTestStatus({
            ok: data.status.mongodb.success,
            message: data.status.mongodb.message,
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let ignore = false;
    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/settings');
        const data = await parseJsonResponse(res);
        if (!ignore && data.success) {
          setBotToken(data.config.telegramBotTokenMasked || '');
          setChatId(data.config.telegramChatId || '');
          setMongoUri(data.config.mongodbUriMasked || '');

          if (data.status?.telegram) {
            setTgTestStatus({
              ok: data.status.telegram.ok,
              message: data.status.telegram.error || `Terhubung sebagai @${data.status.telegram.botUsername || 'Bot'}`,
              botName: data.status.telegram.botUsername,
            });
          }
          if (data.status?.mongodb) {
            setMongoTestStatus({
              ok: data.status.mongodb.success,
              message: data.status.mongodb.message,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    loadSettings();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  const handleTestTelegram = async () => {
    setTestingTg(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_telegram',
          telegramBotToken: botToken,
          telegramChatId: chatId,
        }),
      });
      const data = await parseJsonResponse(res);
      setTgTestStatus({
        ok: data.ok,
        message: data.error || `Berhasil terhubung dengan bot @${data.botUsername || 'Bot'}!`,
        botName: data.botUsername,
      });
    } catch (e: any) {
      setTgTestStatus({ ok: false, message: e.message || 'Gagal menguji koneksi bot Telegram.' });
    } finally {
      setTestingTg(false);
    }
  };

  const handleTestMongo = async () => {
    setTestingMongo(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_mongodb',
          mongodbUri: mongoUri,
        }),
      });
      const data = await parseJsonResponse(res);
      setMongoTestStatus({
        ok: data.success,
        message: data.message || (data.success ? 'Koneksi MongoDB Berhasil!' : 'Gagal terhubung ke MongoDB.'),
      });
    } catch (e: any) {
      setMongoTestStatus({ ok: false, message: e.message || 'Gagal menguji MongoDB.' });
    } finally {
      setTestingMongo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          telegramBotToken: botToken,
          telegramChatId: chatId,
          mongodbUri: mongoUri,
        }),
      });
      const data = await parseJsonResponse(res);
      if (data.success) {
        setSaveSuccess('Konfigurasi server berhasil disimpan!');
        fetchSettings();
      } else {
        setAdminErrorModal('Gagal menyimpan: ' + data.error);
      }
    } catch (e: any) {
      setAdminErrorModal('Terjadi kesalahan: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-zinc-100 font-['Outfit',sans-serif] flex flex-col selection:bg-zinc-800 selection:text-zinc-100">
      {/* Admin Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md py-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://rafaelxd.my.id/raw/sefqmrht"
              alt="RafaelXD Logo"
              className="h-10 sm:h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg font-bold text-white font-serif-elegant">Panel Kontrol Admin</h1>
              <p className="text-xs text-zinc-400 font-outfit">Pengaturan Server, Storage Bot, & Database MongoDB</p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Situs</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 space-y-6">
        {!isAuthenticated ? (
          /* Login Authentication Card */
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6 mt-8 max-w-md mx-auto animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-100 shadow-xs">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold font-serif-elegant text-white">Autentikasi Administrator</h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto font-outfit">
                Area khusus pemilik server untuk mengelola Token Telegram Bot, ID Channel Storage, dan URI MongoDB.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-outfit flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Username Admin:</span>
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono-code font-bold focus:outline-none focus:border-zinc-600 transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-outfit flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Kata Sandi (Password):</span>
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono-code font-bold focus:outline-none focus:border-zinc-600 transition-all shadow-xs"
                  required
                />
              </div>

              {pinError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 font-outfit flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> : <Key className="w-4 h-4 text-zinc-950" />}
                <span>{loggingIn ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Navigation Tabs in Admin */}
            <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800/80 shadow-xs">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Server & Storage</span>
              </button>

              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'files'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <HardDrive className="w-4 h-4 text-sky-400" />
                <span>Kelola Semua Berkas</span>
              </button>

              <button
                onClick={() => setActiveTab('shortener')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'shortener'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-amber-400" />
                <span>Kelola Short URL</span>
              </button>

              <button
                onClick={() => setActiveTab('rawtext')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rawtext'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>Buat Raw Text / Paste</span>
              </button>
            </div>

            {/* Tab 1: Settings */}
            {activeTab === 'settings' && (
              loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-zinc-300" />
                  <p className="text-xs font-mono-code">Memuat data konfigurasi server...</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Status Overview Header Card */}
                  <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold font-serif-elegant text-white">Status Layanan Backend</h3>
                          <p className="text-xs text-zinc-400">Pemeriksaan status koneksi Cloud Storage Bot & DB</p>
                        </div>
                      </div>
                      <button
                        onClick={fetchSettings}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                        title="Refresh Status"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Cek Ulang</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-mono-code text-zinc-500 block">Telegram Bot Storage</span>
                          <span className="text-sm font-bold text-zinc-100 font-outfit mt-0.5 block">
                            {tgTestStatus.ok ? (tgTestStatus.botName ? `@${tgTestStatus.botName}` : 'Terhubung') : 'Penyimpanan Aktif'}
                          </span>
                        </div>
                        <span className={`w-3 h-3 rounded-full ${tgTestStatus.ok ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
                      </div>

                      <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-mono-code text-zinc-500 block">MongoDB Database</span>
                          <span className="text-sm font-bold text-zinc-100 font-outfit mt-0.5 block">
                            {mongoTestStatus.ok ? 'MongoDB Terhubung' : 'Lokal Database Online'}
                          </span>
                        </div>
                        <span className={`w-3 h-3 rounded-full ${mongoTestStatus.ok ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Telegram Configuration Card */}
                  <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                      <div className="w-9 h-9 rounded-xl bg-sky-950/80 border border-sky-800/80 flex items-center justify-center text-sky-400">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-serif-elegant text-white">Penyimpanan Cloud Storage Bot</h3>
                        <p className="text-xs text-zinc-400">Set Bot Token & ID Channel untuk media penyimpanan tak terbatas.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-mono-code">
                          Telegram Bot Token:
                        </label>
                        <input
                          type="text"
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono-code focus:outline-none focus:border-zinc-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-mono-code">
                          Telegram Channel / Chat ID:
                        </label>
                        <input
                          type="text"
                          value={chatId}
                          onChange={(e) => setChatId(e.target.value)}
                          placeholder="Contoh: -1001234567890"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono-code focus:outline-none focus:border-zinc-600 transition-all"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <button
                          onClick={handleTestTelegram}
                          disabled={testingTg || !botToken}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
                        >
                          {testingTg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-sky-400" />}
                          <span>Uji Koneksi Bot</span>
                        </button>

                        {tgTestStatus.message && (
                          <span className={`text-xs font-mono-code ${tgTestStatus.ok ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}`}>
                            {tgTestStatus.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MongoDB Configuration Card */}
                  <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                      <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-serif-elegant text-white">Database Index (MongoDB)</h3>
                        <p className="text-xs text-zinc-400">URI MongoDB Atlas untuk mengindeks metadata file secara permanen.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-mono-code">
                          MongoDB Connection String (URI):
                        </label>
                        <input
                          type="password"
                          value={mongoUri}
                          onChange={(e) => setMongoUri(e.target.value)}
                          placeholder="mongodb+srv://user:password@cluster.mongodb.net/dbname"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono-code focus:outline-none focus:border-zinc-600 transition-all"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <button
                          onClick={handleTestMongo}
                          disabled={testingMongo || !mongoUri}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
                        >
                          {testingMongo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-emerald-400" />}
                          <span>Uji Koneksi MongoDB</span>
                        </button>

                        {mongoTestStatus.message && (
                          <span className={`text-xs font-mono-code ${mongoTestStatus.ok ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}`}>
                            {mongoTestStatus.message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  {saveSuccess && (
                    <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-outfit shadow-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{saveSuccess}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full sm:w-auto px-8 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                          <span>Menyimpan Pengaturan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-zinc-950" />
                          <span>Simpan Perubahan Konfigurasi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Tab 2: Files Management */}
            {activeTab === 'files' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold font-serif-elegant text-white">Kelola Berkas Terkini</h2>
                  <p className="text-xs text-zinc-400 font-outfit">
                    Daftar semua file yang terindeks di server dan cloud storage.
                  </p>
                </div>
                <FileExplorer />
              </div>
            )}

            {/* Tab 3: Short URL Management */}
            {activeTab === 'shortener' && (
              <ShortUrlSection />
            )}

            {/* Tab 4: Raw Text / Paste Creator (Admin Only) */}
            {activeTab === 'rawtext' && (
              <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
                <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-800/80 flex items-center justify-center text-purple-400 shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-serif-elegant text-white">Buat Raw Text / Paste</h2>
                      <p className="text-xs text-zinc-400 font-outfit">
                        Fitur khusus Admin untuk membuat file teks mentah, kode, JSON, atau skrip langsung dengan Direct Raw URL.
                      </p>
                    </div>
                  </div>

                  {rawCopiedType === 'auto_raw' && (
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

                  <form onSubmit={handleCreateRawText} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Filename Input */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-outfit">
                          Nama File / Judul Paste:
                        </label>
                        <input
                          type="text"
                          value={rawTitle}
                          onChange={(e) => setRawTitle(e.target.value)}
                          placeholder="Contoh: paste.txt, script.js, config.json"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono-code focus:outline-none focus:border-purple-500 transition-all shadow-xs"
                          required
                        />
                      </div>

                      {/* Format / MIME Type Select */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-outfit">
                          Format Teks / Content Type:
                        </label>
                        <select
                          value={rawMimeType}
                          onChange={(e) => setRawMimeType(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono-code focus:outline-none focus:border-purple-500 transition-all shadow-xs cursor-pointer"
                        >
                          <option value="text/plain">Plain Text (.txt)</option>
                          <option value="application/json">JSON (.json)</option>
                          <option value="text/javascript">JavaScript (.js)</option>
                          <option value="text/html">HTML Document (.html)</option>
                          <option value="text/css">CSS Stylesheet (.css)</option>
                          <option value="text/markdown">Markdown (.md)</option>
                          <option value="text/x-python">Python Script (.py)</option>
                          <option value="application/xml">XML Document (.xml)</option>
                        </select>
                      </div>
                    </div>

                    {/* Optional Password Field */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5 font-outfit flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Password Proteksi (Opsional):</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono-code">Biarkan kosong jika bebas akses</span>
                      </label>
                      <input
                        type="password"
                        value={rawPassword}
                        onChange={(e) => setRawPassword(e.target.value)}
                        placeholder="Kata sandi pembuka raw text..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 font-mono-code focus:outline-none focus:border-amber-500 transition-all shadow-xs"
                      />
                    </div>

                    {/* Textarea for Raw Content */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-zinc-300 font-outfit">
                          Isi Teks / Kode Raw:
                        </label>
                        <span className="text-[10px] font-mono-code text-zinc-400">
                          {rawContent.length} Karakter • {rawContent.split('\n').length} Baris
                        </span>
                      </div>
                      <textarea
                        value={rawContent}
                        onChange={(e) => setRawContent(e.target.value)}
                        placeholder="Paste atau ketikkan kode / teks mentah di sini..."
                        rows={14}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-xs font-mono-code text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-all leading-relaxed"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={publishingRaw || !rawContent.trim()}
                      className="w-full py-3.5 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {publishingRaw ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Menerbitkan Raw Text ke Cloud...</span>
                        </>
                      ) : (
                        <>
                          <FileCode className="w-4 h-4 text-white" />
                          <span>Buat & Terbitkan Raw Text</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Success Result Card */}
                  {rawSuccessResult && (
                    <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2.5 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold font-serif-elegant">Raw Text Berhasil Diterbitkan!</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1 font-mono-code">
                            Direct Raw URL (Akses Teks Mentah):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={rawSuccessResult.rawUrl}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-purple-300 font-mono-code focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => copyRawTextUrl(rawSuccessResult.rawUrl, 'res_raw')}
                              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all shrink-0 flex items-center gap-1.5"
                            >
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{rawCopiedType === 'res_raw' ? 'Tersalin!' : 'Salin'}</span>
                            </button>
                            <a
                              href={rawSuccessResult.rawUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Raw</span>
                            </a>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1 font-mono-code">
                            Link Halaman Preview File (/f/...):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={rawSuccessResult.shareUrl}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono-code focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => copyRawTextUrl(rawSuccessResult.shareUrl, 'res_share')}
                              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all shrink-0 flex items-center gap-1.5"
                            >
                              <Copy className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{rawCopiedType === 'res_share' ? 'Tersalin!' : 'Salin'}</span>
                            </button>
                            <a
                              href={rawSuccessResult.shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Buka Page</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer matching Home & File Pages */}
      <footer className="border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md py-8 px-4 text-zinc-400 text-xs font-outfit mt-16 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img
              src="https://rafaelxd.my.id/raw/sefqmrht"
              alt="RafaelXD Logo"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://whatsapp.com/channel/0029VbAjoElLI8YVzXxn7H0j"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Channel"
              className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-[#25D366] hover:border-[#25D366]/50 hover:bg-emerald-950/30 transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.011 2C6.5 2 2.022 6.478 2.022 11.989c0 1.942.556 3.75 1.517 5.283L2 22l4.889-1.511a9.92 9.92 0 0 0 5.122 1.489C17.522 21.978 22 17.5 22 11.989 22 6.478 17.522 2 12.011 2zm0 18.178c-1.633 0-3.156-.444-4.467-1.222l-.322-.189-3.3.889.889-3.211-.211-.333A8.15 8.15 0 0 1 3.844 11.99c0-4.5 3.656-8.156 8.167-8.156 4.5 0 8.156 3.656 8.156 8.156s-3.656 8.189-8.156 8.189zm4.489-6.133c-.244-.122-1.456-.722-1.678-.8-.222-.089-.389-.122-.556.122-.167.244-.656.822-.8 1-.144.178-.289.2-.533.078-.244-.122-1.033-.378-1.967-1.211-.722-.644-1.211-1.444-1.356-1.689-.144-.244-.011-.378.111-.5.111-.111.244-.289.367-.433.122-.144.167-.244.244-.4.078-.167.044-.311-.022-.433-.067-.122-.556-1.333-.756-1.833-.2-.489-.4-.422-.556-.433h-.478c-.167 0-.444.067-.678.322-.233.256-.889.867-.889 2.111 0 1.244.911 2.444 1.033 2.611.122.167 1.789 2.733 4.333 3.833.611.267 1.089.422 1.456.544.611.189 1.167.167 1.611.1.489-.078 1.456-.589 1.667-1.156.211-.567.211-1.056.144-1.156-.067-.1-.233-.167-.478-.289z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@RafaelXD_offc"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube Channel"
              className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-[#FF0000] hover:border-[#FF0000]/50 hover:bg-rose-950/30 transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/rafaelputrasitinjak/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-[#E4405F] hover:border-[#E4405F]/50 hover:bg-pink-950/30 transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

      <ConfirmModal
        isOpen={!!adminErrorModal}
        title="Pemberitahuan Admin"
        message={adminErrorModal || ''}
        confirmText="Tutup"
        type="danger"
        showCancel={false}
        onConfirm={() => setAdminErrorModal(null)}
        onCancel={() => setAdminErrorModal(null)}
      />
    </div>
  );
}

