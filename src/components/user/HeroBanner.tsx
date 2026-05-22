/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, Trophy, Search } from "lucide-react";

interface HeroBannerProps {
  onShopNow: () => void;
  onTrackNow: () => void;
}

export default function HeroBanner({ onShopNow, onTrackNow }: HeroBannerProps) {
  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#11111a] via-[#09090d] to-[#11111a] py-16 px-6 sm:px-12 rounded-3xl border border-[#1e1e2d] mb-12 shadow-2xl">
      {/* Visual background lights */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-80 h-80 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* FIFA Golden Badge */}
        <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-4 py-1.5 rounded-full border border-yellow-500/20 text-xs font-semibold uppercase tracking-wider mb-3 animate-pulse">
          <Trophy className="w-4.5 h-4.5 text-yellow-500" />
          FIFA World Cup 2026 Celebration
        </div>

        <div className="text-center mb-6">
          <span className="text-yellow-400 text-xs sm:text-sm font-black tracking-widest uppercase block animate-fade-in">
            From FC TAN MY with love
          </span>
          <span className="text-zinc-500 text-[10px] sm:text-xs font-medium tracking-wider uppercase block mt-1">
            Make by Dan Nguyen
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-[#F8F8FF] tracking-tight leading-none mb-4">
          SỞ HỮU ÁO ĐẤU <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 leading-normal">
            WORLD CUP 2026
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-amber-500/90 font-medium italic mb-6">
          * Chú ý: hình ảnh mẫu áo dưới đây mang tính chất minh họa
        </p>

        <p className="text-gray-400 text-sm sm:text-lg max-w-xl mb-10 leading-relaxed font-sans font-medium">
          Lựa chọn áo đấu Player-version của đội tuyển bạn yêu thích và cá nhân hóa Tên & Số in sắc nét trên mô hình 2.5D chân thực nhất.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            id="btn-hero-shop"
            onClick={onShopNow}
            className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/30 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer transform hover:-translate-y-0.5 active:translate-y-px"
          >
            <Flame className="w-5 h-5 text-black animate-bounce" />
            CHỌN SẢN PHẨM NGAY
          </button>
          
          <button
            id="btn-hero-track"
            onClick={onTrackNow}
            className="w-full sm:w-auto bg-[#111118]/80 text-[#F8F8FF] font-bold px-8 py-4 rounded-xl border border-[#1e1e2d] hover:border-gray-600 transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer hover:bg-[#11111c]"
          >
            <Search className="w-5 h-5 text-gray-400" />
            TRA CỨU ĐƠN HÀNG
          </button>
        </div>
      </div>
    </div>
  );
}
