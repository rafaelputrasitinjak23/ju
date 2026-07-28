'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  Link as LinkIcon,
  HelpCircle,
  Heart,
  Settings,
  X,
  Lock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function SecurityProtection() {
  const router = useRouter();
  const pathname = usePathname();

  // Context Menu state
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Warning Toast state for devtools keypresses
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  const triggerWarning = (msg: string) => {
    setWarningMessage(msg);
    setShowWarning(true);
    setTimeout(() => {
      setShowWarning(false);
    }, 3000);
  };

  const handleSelectMenu = (tabKey: 'upload' | 'shortener' | 'guide' | 'donation') => {
    setMenuPosition(null);

    if (pathname !== '/') {
      router.push(`/?tab=${tabKey}`);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('change-tab', { detail: tabKey }));
      }, 100);
    } else {
      window.dispatchEvent(new CustomEvent('change-tab', { detail: tabKey }));
    }
  };

  useEffect(() => {
    // Custom Right Click Context Menu Handler
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      // Calculate position within viewport limits
      const menuWidth = 240;
      const menuHeight = 310;
      const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
      const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

      setMenuPosition({ x: Math.max(10, x), y: Math.max(10, y) });
    };

    // Close menu when clicking outside or pressing Escape or scrolling
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPosition(null);
      }
    };

    const handleScrollOrResize = () => {
      setMenuPosition(null);
    };

    // Disable Key Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuPosition(null);
        return;
      }

      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        setMenuPosition(null);
        triggerWarning('Akses DevTools (F12) dinonaktifkan.');
        return false;
      }

      if (ctrlOrCmd) {
        // Ctrl+Shift+I / J / C (DevTools & Inspector)
        if (
          e.shiftKey &&
          (e.key === 'I' ||
            e.key === 'i' ||
            e.key === 'J' ||
            e.key === 'j' ||
            e.key === 'C' ||
            e.key === 'c' ||
            e.keyCode === 73 ||
            e.keyCode === 74 ||
            e.keyCode === 67)
        ) {
          e.preventDefault();
          setMenuPosition(null);
          triggerWarning('Pemeriksa Elemen / DevTools dinonaktifkan.');
          return false;
        }

        // Ctrl+U (View Source)
        if (e.key === 'u' || e.key === 'U' || e.keyCode === 85) {
          e.preventDefault();
          setMenuPosition(null);
          triggerWarning('Lihat Kode Sumber (View Source) dinonaktifkan.');
          return false;
        }

        // Ctrl+S (Save Page)
        if (e.key === 's' || e.key === 'S' || e.keyCode === 83) {
          e.preventDefault();
          setMenuPosition(null);
          triggerWarning('Menyimpan halaman dinonaktifkan.');
          return false;
        }
      }
    };

    // Console warning message
    console.clear();
    console.log(
      '%cRAFAELXD SECURE SYSTEM',
      'color: #10b981; font-size: 26px; font-weight: bold; font-family: sans-serif;'
    );
    console.log(
      '%cAplikasi ini dilindungi oleh RafaelXD Security. Semua akses klik kanan dialihkan ke Menu Khusus.',
      'color: #a1a1aa; font-size: 13px;'
    );

    // Attach Event Listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname]);

  return (
    <>
      {/* Custom Context Menu "RafaelXD Secure" */}
      {menuPosition && (
        <div
          ref={menuRef}
          style={{ top: `${menuPosition.y}px`, left: `${menuPosition.x}px` }}
          className="fixed z-50 w-60 bg-zinc-900/95 border border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-2 text-zinc-100 font-['Outfit',sans-serif] animate-fade-in divide-y divide-zinc-800/60 select-none overflow-hidden"
        >
          {/* Header Card */}
          <div className="pb-2 px-2 pt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-zinc-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white font-serif-elegant flex items-center gap-1">
                  <span>RafaelXD Secure</span>
                  <Sparkles className="w-3 h-3 text-zinc-400" />
                </h3>
                <p className="text-[10px] text-zinc-400 font-outfit">Navigasi Cepat & Aman</p>
              </div>
            </div>
            <button
              onClick={() => setMenuPosition(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-1.5 space-y-0.5">
            <button
              onClick={() => handleSelectMenu('upload')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/90 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-4 h-4 text-zinc-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span>Uploader File</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </button>

            <button
              onClick={() => handleSelectMenu('shortener')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/90 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <LinkIcon className="w-4 h-4 text-zinc-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span>Short URL</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </button>

            <button
              onClick={() => handleSelectMenu('guide')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/90 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span>Dokumentasi</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </button>

            <button
              onClick={() => handleSelectMenu('donation')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-800/90 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-zinc-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span>Donasi</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </button>
          </div>

          {/* Footer Badge */}
          <div className="pt-2 px-2 pb-0.5 flex items-center justify-between text-[10px] text-zinc-500">
            <span className="flex items-center gap-1 font-mono-code">
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>System Protected</span>
            </span>
            <span className="font-outfit font-bold text-zinc-400">v1.0.0</span>
          </div>
        </div>
      )}

      {/* Warning Toast for DevTools Shortcuts */}
      {showWarning && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in max-w-sm">
          <div className="bg-zinc-900/95 border border-red-500/50 text-zinc-100 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center shrink-0 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-red-400 font-serif-elegant">Akses Ditolak</h4>
              <p className="text-[11px] text-zinc-300 leading-snug">{warningMessage}</p>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
