'use client';

import { useState, useEffect } from 'react';
import { X, Send, Database, CheckCircle2, AlertTriangle, RefreshCw, Key, MessageSquare, ExternalLink, ShieldAlert } from 'lucide-react';
import { parseJsonResponse } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: () => void;
}

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }: SettingsModalProps) {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [mongoUri, setMongoUri] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tgTestStatus, setTgTestStatus] = useState<{ ok?: boolean; message?: string; botName?: string }>({});
  const [mongoTestStatus, setMongoTestStatus] = useState<{ ok?: boolean; message?: string }>({});

  const [showTutorial, setShowTutorial] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setBotToken(data.config.telegramBotTokenMasked || '');
        setChatId(data.config.telegramChatId || '');
        setMongoUri(data.config.mongodbUriMasked || '');

        if (data.status?.telegram) {
          setTgTestStatus({
            ok: data.status.telegram.ok,
            message: data.status.telegram.error || `Connected as @${data.status.telegram.botUsername || 'Bot'}`,
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
    let ignore = false;
    if (isOpen) {
      const loadSettings = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/settings');
          const data = await parseJsonResponse(res);
          if (!ignore && data.success && data.config) {
            setBotToken(data.config.telegramBotTokenMasked || '');
            setChatId(data.config.telegramChatId || '');
            setMongoUri(data.config.mongodbUriMasked || '');

            if (data.status?.telegram) {
              setTgTestStatus({
                ok: data.status.telegram.ok,
                message: data.status.telegram.error || `Connected as @${data.status.telegram.botUsername || 'Bot'}`,
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
          if (!ignore) {
            setLoading(false);
          }
        }
      };
      loadSettings();
    }
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const handleTestTelegram = async () => {
    setTgTestStatus({ message: 'Menguji bot Telegram...' });
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
        message: data.ok ? `Berhasil! Bot: @${data.botUsername || 'Bot'}` : data.error || 'Gagal koneksi.',
        botName: data.botUsername,
      });
    } catch (e: any) {
      setTgTestStatus({ ok: false, message: e.message || 'Error koneksi' });
    }
  };

  const handleTestMongo = async () => {
    setMongoTestStatus({ message: 'Menguji koneksi MongoDB...' });
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
        message: data.message || (data.success ? 'MongoDB Terhubung!' : 'Gagal terhubung'),
      });
    } catch (e: any) {
      setMongoTestStatus({ ok: false, message: e.message || 'Error MongoDB' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
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
        onSettingsSaved();
        onClose();
      } else {
        alert(data.error || 'Gagal menyimpan pengaturan.');
      }
    } catch (e: any) {
      alert('Error saat menyimpan: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in font-['Outfit',sans-serif]">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-elegant text-zinc-100">Konfigurasi Storage & Database</h2>
              <p className="text-xs text-zinc-400 font-outfit">
                Hubungkan Cloud Bot API untuk file storage & MongoDB untuk basis data metadata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-all border border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <RefreshCw className="w-6 h-6 animate-spin text-zinc-300" />
              <p className="text-sm">Memuat status konfigurasi...</p>
            </div>
          ) : (
            <>
              {/* Cloud Bot Section */}
              <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-zinc-300" />
                    <h3 className="text-sm font-semibold text-zinc-100 font-serif-elegant">Penyimpanan File Cloud Bot</h3>
                  </div>

                  {tgTestStatus.ok !== undefined && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-md font-mono-code flex items-center gap-1.5 ${
                        tgTestStatus.ok
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {tgTestStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {tgTestStatus.ok ? 'Terhubung' : 'Gagal/Belum Set'}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-zinc-500" />
                      Storage Bot Token
                    </label>
                    <input
                      type="text"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="Contoh: 7892183921:AAFxYz1234567890abcdef..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono-code transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                      Storage Channel ID / Chat ID
                    </label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="Contoh: -1001234567890 atau 123456789"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono-code transition-all"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      ID Channel/Grup tempat bot akan mengirimkan & menyimpan file fisik.
                    </p>
                  </div>

                  {tgTestStatus.message && (
                    <p className={`text-xs p-2.5 rounded-xl border font-mono-code ${
                      tgTestStatus.ok ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-amber-950/80 text-amber-300 border-amber-800'
                    }`}>
                      {tgTestStatus.message}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowTutorial(!showTutorial)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Cara dapatkan Bot Token & Channel ID?
                    </button>

                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <RefreshCw className="w-3 h-3 text-zinc-400" />
                      Uji Koneksi Storage Bot
                    </button>
                  </div>
                </div>
              </div>

              {/* Tutorial Accordion */}
              {showTutorial && (
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl text-xs space-y-2 text-zinc-400">
                  <h4 className="font-bold text-zinc-100 text-sm font-serif-elegant">📖 Tutorial Singkat Setup Storage Bot:</h4>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-zinc-400">
                    <li>Buka aplikasi pengirim pesan, cari bot <strong>@BotFather</strong>.</li>
                    <li>Kirim perintah <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200 border border-zinc-800">/newbot</code> lalu ikuti instruksi untuk membuat bot baru.</li>
                    <li>Salin <strong>HTTP API Token</strong> yang diberikan lalu tempel di kolom &quot;Storage Bot Token&quot; di atas.</li>
                    <li>Buat Channel atau Grup baru, atau gunakan chat pribadi Anda. Tambahkan bot Anda ke dalam grup/channel tersebut sebagai Admin.</li>
                    <li>Cari bot <strong>@userinfobot</strong> atau forwarding pesan ke bot tersebut untuk mendapatkan ID Chat (misal: <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200 border border-zinc-800">-1001234567890</code>).</li>
                  </ol>
                </div>
              )}

              {/* MongoDB Section */}
              <div className="space-y-4 bg-zinc-950 p-5 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-zinc-100 font-serif-elegant">MongoDB Database (Metadata Storage)</h3>
                  </div>

                  {mongoTestStatus.ok !== undefined && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-md font-mono-code flex items-center gap-1.5 ${
                        mongoTestStatus.ok
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}
                    >
                      {mongoTestStatus.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      {mongoTestStatus.ok ? 'MongoDB Connected' : 'Local Fallback'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-zinc-500" />
                    MongoDB Connection URI
                  </label>
                  <input
                    type="text"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    placeholder="mongodb+srv://username:password@cluster.mongodb.net/telecloud"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 font-mono-code transition-all"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Jika tidak diisi, aplikasi akan tetap berjalan dengan penyimpanan metadata lokal otomatis.
                  </p>
                </div>

                {mongoTestStatus.message && (
                  <p className={`text-xs p-2.5 rounded-xl border font-mono-code ${
                    mongoTestStatus.ok ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  }`}>
                    {mongoTestStatus.message}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleTestMongo}
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3 h-3 text-zinc-400" />
                    Uji Koneksi MongoDB
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between gap-3 sticky bottom-0">
          <p className="text-xs text-zinc-500 font-outfit">
            RafaelXD v1.0 • Standar Keamanan Server-Side
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-xl border border-zinc-700 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" /> : null}
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
