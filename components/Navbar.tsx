'use client';

import { useState, Dispatch, SetStateAction } from 'react';
import { HardDrive, UploadCloud, Settings, Cloud, HelpCircle, Menu, X, Link as LinkIcon, Heart } from 'lucide-react';
import { ActiveTab } from '@/lib/types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: Dispatch<SetStateAction<ActiveTab>> | ((tab: ActiveTab) => void);
  onOpenSettings: () => void;
  isTelegramConnected: boolean;
  isMongoConnected: boolean;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isTelegramConnected,
  isMongoConnected,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-12 py-3.5 transition-all shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center shadow-xs overflow-hidden bg-zinc-950 shrink-0">
            <img
              src="https://rafaelxd.my.id/raw/exnqacv9"
              alt="RafaelXD Logo"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-elegant text-xl font-bold tracking-tight text-zinc-100">RafaelXD</span>
              <span className="text-[10px] font-mono-code font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-outfit hidden sm:block">
              Host File
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <UploadCloud className={`w-4 h-4 ${activeTab === 'upload' ? 'text-zinc-100' : 'text-zinc-400'}`} />
            <span>Uploader</span>
          </button>

          <button
            onClick={() => setActiveTab('shortener')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'shortener'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <LinkIcon className={`w-4 h-4 ${activeTab === 'shortener' ? 'text-zinc-100' : 'text-zinc-400'}`} />
            <span>Short URL</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'guide'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <HelpCircle className={`w-4 h-4 ${activeTab === 'guide' ? 'text-zinc-100' : 'text-zinc-400'}`} />
            <span>Dokumentasi</span>
          </button>

          <button
            onClick={() => setActiveTab('donation')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'donation'
                ? 'bg-zinc-800 text-rose-300 border border-rose-800/80 shadow-sm font-bold'
                : 'text-zinc-400 hover:text-rose-300 hover:bg-zinc-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'donation' ? 'text-rose-400 fill-rose-500/30' : 'text-zinc-400'}`} />
            <span>Donasi</span>
          </button>
        </nav>

        {/* Desktop Status Badges */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs font-mono-code bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2" title="Status Storage Cloud">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">Storage:</span>
              <span className="text-zinc-200 font-semibold">Ready</span>
            </div>

            <span className="text-zinc-800">|</span>

            <div className="flex items-center gap-2" title="Status Database">
              <span className={`w-2 h-2 rounded-full ${isMongoConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              <span className="text-zinc-400">DB:</span>
              <span className={isMongoConnected ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}>
                {isMongoConnected ? 'Connected' : 'Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Hamburger Toggle Button */}
        <div className="flex lg:hidden items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 transition-all"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-zinc-100" /> : <Menu className="w-5 h-5 text-zinc-100" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-4 pt-4 border-t border-zinc-800 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
            <button
              onClick={() => handleTabClick('upload')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <UploadCloud className={`w-4 h-4 ${activeTab === 'upload' ? 'text-zinc-100' : 'text-zinc-400'}`} />
              <span>Uploader</span>
            </button>

            <button
              onClick={() => handleTabClick('shortener')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'shortener'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <LinkIcon className={`w-4 h-4 ${activeTab === 'shortener' ? 'text-zinc-100' : 'text-zinc-400'}`} />
              <span>Short URL</span>
            </button>

            <button
              onClick={() => handleTabClick('guide')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <HelpCircle className={`w-4 h-4 ${activeTab === 'guide' ? 'text-zinc-100' : 'text-zinc-400'}`} />
              <span>Dokumentasi</span>
            </button>

            <button
              onClick={() => handleTabClick('donation')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'donation'
                  ? 'bg-zinc-800 text-rose-300 border border-rose-800/80 font-bold'
                  : 'text-zinc-400 hover:text-rose-300 hover:bg-zinc-900'
              }`}
            >
              <Heart className={`w-4 h-4 ${activeTab === 'donation' ? 'text-rose-400 fill-rose-500/30' : 'text-zinc-400'}`} />
              <span>Donasi</span>
            </button>
          </nav>

          {/* Mobile Status Indicators */}
          <div className="flex items-center justify-between text-xs font-mono-code bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-400">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isTelegramConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-zinc-500">Bot:</span>
              <span className={isTelegramConnected ? 'text-zinc-200 font-semibold' : 'text-amber-400 font-semibold'}>
                {isTelegramConnected ? 'Active' : 'Setup'}
              </span>
            </div>
            <span className="text-zinc-800">|</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isMongoConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
              <span className="text-zinc-500">DB:</span>
              <span className={isMongoConnected ? 'text-zinc-200 font-semibold' : 'text-zinc-400'}>
                {isMongoConnected ? 'Connected' : 'Local'}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

