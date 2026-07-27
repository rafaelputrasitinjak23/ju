'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Heart, QrCode, ShieldCheck, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';

const QRIS_STRING = "00020101021126570011ID.DANA.WWW011893600915393854002502099385400250303UMI51440014ID.CO.QRIS.WWW0215ID10254164052370303UMI5204549953033605802ID5919Rafael Toko Digital6010Kota Jambi6105361256304EE06";

export default function DonationSection() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in font-['Outfit',sans-serif]">
      {/* Banner Intro */}
      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-rose-400 shadow-xs">
            <Heart className="w-5 h-5 fill-rose-500/20 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-serif-elegant text-zinc-100 flex items-center gap-2">
              Dukungan & Donasi
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs md:text-sm text-zinc-400 font-outfit mt-0.5">
              Dukung operasional server & pengembangan RafaelXD File Host melalui QRIS All Payment.
            </p>
          </div>
        </div>
      </div>

      {/* Main Donation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* QRIS Card Column */}
        <div className="md:col-span-6 bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-semibold">
            <QrCode className="w-3.5 h-3.5" />
            <span>QRIS Standar Nasional (NMI)</span>
          </div>

          {/* QR Code Container */}
          <div className="p-5 bg-white rounded-2xl shadow-xl border-4 border-zinc-800 relative group transition-transform hover:scale-[1.01]">
            <QRCodeSVG
              value={QRIS_STRING}
              size={220}
              level="H"
              includeMargin={false}
              aria-label="QRIS Code Donasi"
            />
            <div className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between text-[11px] font-mono-code text-zinc-700">
              <span className="font-bold">QRIS ALL PAYMENT</span>
              <span className="text-zinc-500">GPN</span>
            </div>
          </div>

          {/* Merchant Info */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-100 font-serif-elegant">Rafael Toko Digital</h3>
            <p className="text-xs text-zinc-400 font-mono-code">NMID: ID1025416405237 • Kota Jambi</p>
          </div>
        </div>

        {/* Instructions & Supported Payment Methods */}
        <div className="md:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/90 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <Smartphone className="w-5 h-5 text-zinc-300" />
              <h3 className="text-base font-bold font-serif-elegant text-zinc-100">Cara Melakukan Donasi</h3>
            </div>

            <ol className="space-y-3 text-xs text-zinc-300 font-outfit">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <span>Buka aplikasi E-Wallet atau Mobile Banking pilihan Anda (DANA, GoPay, OVO, ShopeePay, BCA, Mandiri, BRI, dll).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <span>Pilih menu <strong>Pindai / Scan QRIS</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <span>Arahkan kamera ke kode QRIS di samping atau upload hasil tangkapan layar (screenshot).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">4</span>
                <span>Masukkan nominal donasi seikhlasnya, lalu selesaikan pembayaran.</span>
              </li>
            </ol>
          </div>

          {/* Supported Apps List */}
          <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-800/80 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono-code flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Mendukung Semua Pembayaran QRIS:
            </h4>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja', 'BCA Mobile', 'Livin by Mandiri', 'BRImo', 'BNI Mobile', 'Seabank', 'Aplikasi Bank Apapun'].map((app) => (
                <span key={app} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
