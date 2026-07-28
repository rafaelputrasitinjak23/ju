'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Uploader from '@/components/Uploader';
import ShortUrlSection from '@/components/ShortUrlSection';
import GuideSection from '@/components/GuideSection';
import DonationSection from '@/components/DonationSection';
import { Send, Database, ShieldCheck, Cloud, Heart } from 'lucide-react';

import { parseJsonResponse } from '@/lib/utils';
import { ActiveTab } from '@/lib/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');

  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [isMongoConnected, setIsMongoConnected] = useState(false);

  useEffect(() => {
    const handleTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ActiveTab>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('change-tab', handleTabEvent);
    return () => window.removeEventListener('change-tab', handleTabEvent);
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadStatus = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await parseJsonResponse(res);
        if (!ignore && data.success) {
          setIsTelegramConnected(!!data.status?.telegram?.ok);
          setIsMongoConnected(!!data.status?.mongodb?.success);
        }
      } catch (e) {
        console.error('Failed to fetch settings status:', e);
      }
    };
    loadStatus();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen text-zinc-100 font-['Outfit',sans-serif] flex flex-col selection:bg-zinc-800 selection:text-zinc-100">
      {/* Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => {}}
        isTelegramConnected={isTelegramConnected}
        isMongoConnected={isMongoConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Active View */}
        {activeTab === 'upload' && (
          <div className="space-y-10 animate-fade-in">
            <Uploader
              onUploadSuccess={() => {}}
              onOpenSettings={() => {}}
              isTelegramConfigured={isTelegramConnected}
            />
          </div>
        )}

        {activeTab === 'shortener' && (
          <ShortUrlSection showList={false} />
        )}

        {activeTab === 'guide' && (
          <GuideSection />
        )}

        {activeTab === 'donation' && (
          <DonationSection />
        )}
      </main>

      {/* Footer */}
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
              href="https://www.instagram.com/rafaelputraasitinjak/"
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
    </div>
  );
}
