/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flame, Trophy, Search } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";

interface HeroBannerProps {
  onShopNow: () => void;
  onTrackNow: () => void;
}

export default function HeroBanner({ onShopNow, onTrackNow }: HeroBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-surface-3 via-surface-2 to-surface-3 py-16 px-6 sm:px-12 rounded-3xl border border-border-default mb-12 shadow-2xl">
      {/* Visual background lights */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-80 h-80 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        {/* FIFA Golden Badge */}
        <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-400 px-4 py-1.5 rounded-full border border-yellow-500/20 text-xs font-semibold uppercase tracking-wider mb-3 animate-pulse">
          <Trophy className="w-4.5 h-4.5 text-yellow-500" />
          {t("hero.badge")}
        </div>

        <div className="text-center mb-6">
          <span className="text-yellow-400 text-xs sm:text-sm font-black tracking-widest uppercase block animate-fade-in">
            {t("hero.fromTeam")}
          </span>
          <span className="text-text-muted text-[10px] sm:text-xs font-medium tracking-wider uppercase block mt-1">
            {t("hero.madeBy")}
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-text-primary tracking-tight leading-none mb-4">
          {t("hero.title1")} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 leading-normal">
            {t("hero.title2")}
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-amber-500/90 font-medium italic mb-6">
          {t("hero.disclaimer")}
        </p>

        <p className="text-text-muted text-sm sm:text-lg max-w-xl mb-10 leading-relaxed font-sans font-medium">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            id="btn-hero-shop"
            onClick={onShopNow}
            className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-yellow-500/30 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer transform hover:-translate-y-0.5 active:translate-y-px"
          >
            <Flame className="w-5 h-5 text-black animate-bounce" />
            {t("hero.ctaShop")}
          </button>

          <button
            id="btn-hero-track"
            onClick={onTrackNow}
            className="w-full sm:w-auto bg-surface-3/80 text-text-primary font-bold px-8 py-4 rounded-xl border border-border-default hover:border-border-strong transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer hover:bg-surface-3"
          >
            <Search className="w-5 h-5 text-text-muted" />
            {t("hero.ctaTrack")}
          </button>
        </div>
      </div>
    </div>
  );
}
