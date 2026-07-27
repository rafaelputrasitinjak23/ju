'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Key, Send, Database, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft, Lock, ExternalLink, Server, HardDrive, Link as LinkIcon, Settings, User } from 'lucide-react';
import { parseJsonResponse } from '@/lib/utils';
import FileExplorer from '@/components/FileExplorer';
import ShortUrlSection from '@/components/ShortUrlSection';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'files' | 'shortener'>('settings');
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
        alert('Gagal menyimpan: ' + data.error);
      }
    } catch (e: any) {
      alert('Terjadi kesalahan: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Outfit',sans-serif] flex flex-col selection:bg-slate-800 selection:text-slate-100">
      {/* Admin Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md py-4 px-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center shadow-xs overflow-hidden bg-slate-950 shrink-0">
              <img
                src="https://rafaelxd.my.id/raw/exnqacv9"
                alt="RafaelXD Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-serif-elegant">Panel Kontrol Admin</h1>
              <p className="text-xs text-slate-400 font-outfit">Pengaturan Server, Storage Bot, & Database MongoDB</p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all shadow-xs"
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
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-6 md:p-10 shadow-2xl space-y-6 mt-8 max-w-md mx-auto animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 mx-auto flex items-center justify-center text-slate-100 shadow-xs">
                <Shield className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold font-serif-elegant text-white">Autentikasi Administrator</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-outfit">
                Area khusus pemilik server untuk mengelola Token Telegram Bot, ID Channel Storage, dan URI MongoDB.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-outfit flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Username Admin:</span>
                </label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono-code font-bold focus:outline-none focus:border-sky-500 transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-outfit flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kata Sandi (Password):</span>
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono-code font-bold focus:outline-none focus:border-sky-500 transition-all shadow-xs"
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
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loggingIn ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Key className="w-4 h-4 text-slate-950" />}
                <span>{loggingIn ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Navigation Tabs in Admin */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-xs">
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Server & Storage</span>
              </button>

              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'files'
                    ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-4 h-4 text-sky-400" />
                <span>Kelola Semua Berkas</span>
              </button>

              <button
                onClick={() => setActiveTab('shortener')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'shortener'
                    ? 'bg-slate-800 text-sky-400 border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-amber-400" />
                <span>Kelola Short URL</span>
              </button>
            </div>

            {/* Tab 1: Settings */}
            {activeTab === 'settings' && (
              loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
                  <p className="text-xs font-mono-code">Memuat data konfigurasi server...</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Status Overview Header Card */}
                  <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300">
                          <Server className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold font-serif-elegant text-white">Status Layanan Backend</h3>
                          <p className="text-xs text-slate-400">Pemeriksaan status koneksi Cloud Storage Bot & DB</p>
                        </div>
                      </div>
                      <button
                        onClick={fetchSettings}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                        title="Refresh Status"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Cek Ulang</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-mono-code text-slate-500 block">Telegram Bot Storage</span>
                          <span className="text-sm font-bold text-slate-100 font-outfit mt-0.5 block">
                            {tgTestStatus.ok ? (tgTestStatus.botName ? `@${tgTestStatus.botName}` : 'Terhubung') : 'Penyimpanan Aktif'}
                          </span>
                        </div>
                        <span className={`w-3 h-3 rounded-full ${tgTestStatus.ok ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-mono-code text-slate-500 block">MongoDB Database</span>
                          <span className="text-sm font-bold text-slate-100 font-outfit mt-0.5 block">
                            {mongoTestStatus.ok ? 'MongoDB Terhubung' : 'Lokal Database Online'}
                          </span>
                        </div>
                        <span className={`w-3 h-3 rounded-full ${mongoTestStatus.ok ? 'bg-emerald-400' : 'bg-emerald-400'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Telegram Configuration Card */}
                  <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-serif-elegant text-white">Penyimpanan Cloud Storage Bot</h3>
                        <p className="text-xs text-slate-400">Set Bot Token & ID Channel untuk media penyimpanan tak terbatas.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono-code">
                          Telegram Bot Token:
                        </label>
                        <input
                          type="text"
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono-code focus:outline-none focus:border-sky-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono-code">
                          Telegram Channel / Chat ID:
                        </label>
                        <input
                          type="text"
                          value={chatId}
                          onChange={(e) => setChatId(e.target.value)}
                          placeholder="Contoh: -1001234567890"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono-code focus:outline-none focus:border-sky-500 transition-all"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <button
                          onClick={handleTestTelegram}
                          disabled={testingTg || !botToken}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
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
                  <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                      <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold font-serif-elegant text-white">Database Index (MongoDB)</h3>
                        <p className="text-xs text-slate-400">URI MongoDB Atlas untuk mengindeks metadata file secara permanen.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono-code">
                          MongoDB Connection String (URI):
                        </label>
                        <input
                          type="password"
                          value={mongoUri}
                          onChange={(e) => setMongoUri(e.target.value)}
                          placeholder="mongodb+srv://user:password@cluster.mongodb.net/dbname"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono-code focus:outline-none focus:border-sky-500 transition-all"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <button
                          onClick={handleTestMongo}
                          disabled={testingMongo || !mongoUri}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
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
                      className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>Menyimpan Pengaturan...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
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
                  <p className="text-xs text-slate-400 font-outfit">
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
          </div>
        )}
      </main>
    </div>
  );
}

