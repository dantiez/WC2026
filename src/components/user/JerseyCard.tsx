/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "../../types";
import { useTranslation } from "../../i18n/LanguageContext";

interface JerseyCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  key?: string | number;
}

export default function JerseyCard({ product, onSelect }: JerseyCardProps) {
  const { t } = useTranslation();

  // Format price helper
  const formattedPrice = product.price.toLocaleString("vi-VN") + " ₫";

  // Custom tag styling for Jersey selection
  const isHome = product.jerseyType === "home";
  const isAway = !isHome;

  // Symmetrical realistic athletic jersey outline coordinates
  const outerContour = "M 160,82 C 160,82 190,68 220,68 C 250,68 280,82 280,82 L 410,125 C 413,126 414,132 411,136 L 375,235 C 372,243 363,243 358,236 L 326,185 L 326,465 C 326,473 316,478 306,478 L 134,478 C 124,478 114,473 114,465 L 114,185 L 82,236 C 77,243 68,243 65,235 L 29,136 C 26,132 27,126 30,125 L 160,82 Z";

  const countryLower = product.teamCountry.toLowerCase();

  // Match official team details for synchronized vector rendering
  let teamDetails = {
    displayName: t("teams.vietnam"),
    flag: "🇻🇳",
    baseColor: "#DA251D",
    accentColor: "#FFFF00",
    textColor: "#FFFF00",
    hasStripes: false,
    hasShoulderStripes: false,
    hasChestStar: true,
  };

  if (countryLower.includes("vietnam")) {
    teamDetails = {
      displayName: t("teams.vietnam"),
      flag: "🇻🇳",
      baseColor: isAway ? "#FFFFFF" : "#DA251D",
      accentColor: isAway ? "#DA251D" : "#FFFF00",
      textColor: isAway ? "#DA251D" : "#FFFF00",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: true,
    };
  } else if (countryLower.includes("argentina")) {
    teamDetails = {
      displayName: t("teams.argentina"),
      flag: "🇦🇷",
      baseColor: isAway ? "#0F2240" : "#75AADB",
      accentColor: isAway ? "#91B9DF" : "#FFFFFF",
      textColor: isAway ? "#FFFFFF" : "#000000",
      hasStripes: !isAway,
      hasShoulderStripes: true,
      hasChestStar: false,
    };
  } else if (countryLower.includes("brazil")) {
    teamDetails = {
      displayName: t("teams.brazil"),
      flag: "🇧🇷",
      baseColor: isAway ? "#002D62" : "#FDD116",
      accentColor: isAway ? "#FDD116" : "#009C3B",
      textColor: isAway ? "#FFFFFF" : "#002D62",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
    };
  } else if (countryLower.includes("france")) {
    teamDetails = {
      displayName: t("teams.france"),
      flag: "🇫🇷",
      baseColor: isAway ? "#FFFFFF" : "#0F2148",
      accentColor: isAway ? "#0F2148" : "#C61B21",
      textColor: isAway ? "#0F2148" : "#FDD116",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
    };
  } else if (countryLower.includes("germany")) {
    teamDetails = {
      displayName: t("teams.germany"),
      flag: "🇩🇪",
      baseColor: isAway ? "#1E1E1E" : "#FFFFFF",
      accentColor: isAway ? "#EA1824" : "#111111",
      textColor: isAway ? "#FFFFFF" : "#111111",
      hasStripes: false,
      hasShoulderStripes: true,
      hasChestStar: false,
    };
  } else if (countryLower.includes("japan")) {
    teamDetails = {
      displayName: t("teams.japan"),
      flag: "🇯🇵",
      baseColor: isAway ? "#FFFFFF" : "#0F2248",
      accentColor: isAway ? "#0F2248" : "#E2001A",
      textColor: isAway ? "#0F2248" : "#FFFFFF",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
    };
  } else if (countryLower.includes("spain")) {
    teamDetails = {
      displayName: t("teams.spain"),
      flag: "🇪🇸",
      baseColor: isAway ? "#F9F6E7" : "#C61B21",
      accentColor: isAway ? "#C61B21" : "#FDD116",
      textColor: isAway ? "#C61B21" : "#FDD116",
      hasStripes: false,
      hasShoulderStripes: true,
      hasChestStar: false,
    };
  } else if (countryLower.includes("portugal")) {
    teamDetails = {
      displayName: t("teams.portugal"),
      flag: "🇵🇹",
      baseColor: isAway ? "#F3EBE1" : "#8B0000",
      accentColor: isAway ? "#008000" : "#FDD116",
      textColor: isAway ? "#8B0000" : "#FFFFFF",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
    };
  } else if (countryLower.includes("korea")) {
    teamDetails = {
      displayName: t("teams.korea"),
      flag: "🇰🇷",
      baseColor: isAway ? "#EBEBEB" : "#FF3B47",
      accentColor: isAway ? "#FF3B47" : "#1E1E2D",
      textColor: isAway ? "#1E1E2D" : "#EBEBEB",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
    };
  } else if (countryLower.includes("england")) {
    teamDetails = {
      displayName: t("teams.england"),
      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      baseColor: isAway ? "#0F1A35" : "#FFFFFF",
      accentColor: isAway ? "#E61B27" : "#0F1A35",
      textColor: isAway ? "#FFFFFF" : "#0F1A35",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
    };
  } else {
    teamDetails = {
      displayName: product.teamCountry.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim(),
      flag: "⚽",
      baseColor: isAway ? "#FFFFFF" : "#1e40af",
      accentColor: isAway ? "#1e40af" : "#f59e0b",
      textColor: isAway ? "#1e40af" : "#ffffff",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
    };
  }

  const bg = teamDetails.baseColor;
  const acc = teamDetails.accentColor;
  const textCol = teamDetails.textColor;
  const svgId = `card-svg-${product.id}`;

  const isLocalImage = product.imageUrl.startsWith("/images/") || product.imageUrl.startsWith("./images/");

  const jerseySVGFront = (
    <svg
      viewBox="10 50 420 440"
      className="w-[85%] h-[85%] drop-shadow-[0_15px_18px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform duration-500"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={`${svgId}-shirt-shape`}>
          <path d={outerContour} />
        </clipPath>

        <pattern id={`${svgId}-fabric-weave`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="none" />
          <circle cx="2" cy="2" r="0.5" fill="#000000" opacity="0.08" />
          <circle cx="0" cy="0" r="0.3" fill="#ffffff" opacity="0.09" />
          <circle cx="4" cy="0" r="0.3" fill="#ffffff" opacity="0.09" />
          <circle cx="0" cy="4" r="0.3" fill="#ffffff" opacity="0.09" />
          <circle cx="4" cy="4" r="0.3" fill="#ffffff" opacity="0.09" />
        </pattern>

        <radialGradient id={`${svgId}-body-volume`} cx="50%" cy="28%" r="65%" fx="50%" fy="18%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </radialGradient>

        <pattern id={`${svgId}-argentina-stripes`} width="90" height="500" patternUnits="userSpaceOnUse">
          <rect width="90" height="500" fill="#FFFFFF" />
          <rect x="0" width="30" height="500" fill="#75AADB" />
          <rect x="60" width="30" height="500" fill="#75AADB" />
        </pattern>
      </defs>

      <path
        d={outerContour}
        fill={teamDetails.hasStripes ? `url(#${svgId}-argentina-stripes)` : bg}
      />

      <g clipPath={`url(#${svgId}-shirt-shape)`}>
        {countryLower.includes("japan") && isAway && (
          <g opacity="0.75" strokeWidth="2.2">
            <line x1="130" y1="80" x2="130" y2="470" stroke="#4A90E2" />
            <line x1="150" y1="80" x2="150" y2="470" stroke="#FF5A5F" />
            <line x1="170" y1="80" x2="170" y2="470" stroke="#FFB400" />
            <line x1="190" y1="80" x2="190" y2="470" stroke="#8CE071" />
            <line x1="210" y1="80" x2="210" y2="470" stroke="#00D1C1" />
            <line x1="220" y1="80" x2="220" y2="470" stroke="#3B5998" />
            <line x1="230" y1="80" x2="230" y2="470" stroke="#8B572A" />
            <line x1="250" y1="80" x2="250" y2="470" stroke="#9C27B0" />
            <line x1="270" y1="80" x2="270" y2="470" stroke="#E91E63" />
            <line x1="290" y1="80" x2="290" y2="470" stroke="#50E3C2" />
          </g>
        )}

        <path d="M 114,185 L 114,465" stroke={acc} strokeWidth="10" strokeOpacity="0.85" />
        <path d="M 326,185 L 326,465" stroke={acc} strokeWidth="10" strokeOpacity="0.85" />

        <path d="M 29,136 L 82,236" stroke={acc} strokeWidth="14" />
        <path d="M 29,136 L 82,236" stroke="#000000" strokeWidth="6" />
        <path d="M 29,136 L 82,236" stroke="#FFFFFF" strokeWidth="2" />

        <path d="M 411,136 L 375,235" stroke={acc} strokeWidth="14" />
        <path d="M 411,136 L 375,235" stroke="#000000" strokeWidth="6" />
        <path d="M 411,136 L 375,235" stroke="#FFFFFF" strokeWidth="2" />

        <path d="M 160,82 C 160,82 195,115 220,115 C 245,115 280,82 280,82" fill="none" stroke={acc} strokeWidth="16" />
        <path d="M 160,82 C 160,82 195,115 220,115 C 245,115 280,82 280,82" fill="none" stroke="#000000" strokeWidth="10" />
        <path d="M 160,82 C 160,82 195,115 220,115 C 245,115 280,82 280,82" fill="none" stroke="#FFFFFF" strokeWidth="4" />

        {teamDetails.hasShoulderStripes && countryLower.includes("germany") && (
          <g opacity="0.9">
            <line x1="100" y1="125" x2="145" y2="175" stroke="#FF0000" strokeWidth="5" />
            <line x1="94" y1="129" x2="139" y2="179" stroke="#111111" strokeWidth="5" />
            <line x1="106" y1="121" x2="151" y2="171" stroke="#FFCC00" strokeWidth="5" />

            <line x1="340" y1="125" x2="295" y2="175" stroke="#FF0000" strokeWidth="5" />
            <line x1="346" y1="129" x2="301" y2="179" stroke="#111111" strokeWidth="5" />
            <line x1="334" y1="121" x2="289" y2="171" stroke="#FFCC00" strokeWidth="5" />
          </g>
        )}

        {teamDetails.hasShoulderStripes && countryLower.includes("spain") && (
          <g opacity="0.9">
            <line x1="100" y1="125" x2="145" y2="175" stroke="#FDD116" strokeWidth="6" />
            <line x1="94" y1="129" x2="139" y2="179" stroke="#C61B21" strokeWidth="3" />
            <line x1="106" y1="121" x2="151" y2="171" stroke="#C61B21" strokeWidth="3" />

            <line x1="340" y1="125" x2="295" y2="175" stroke="#FDD116" strokeWidth="6" />
            <line x1="346" y1="129" x2="301" y2="179" stroke="#C61B21" strokeWidth="3" />
            <line x1="334" y1="121" x2="289" y2="171" stroke="#C61B21" strokeWidth="3" />
          </g>
        )}

        {countryLower.includes("argentina") && (
          <circle cx="220" cy="145" r="11" fill="#FFCC00" stroke="#E59800" strokeWidth="1" />
        )}

        <g>
          <g transform="translate(290, 165) scale(1.15)">
            <path d="M -16,-18 L 16,-18 C 16,-18 20,12 0,24 C -20,12 -16,-18 -16,-18 Z" fill="#0d0e14" stroke={acc} strokeWidth="2.5" />
            <circle cx="0" cy="2" r="5" fill="#C61B21" />
            <polygon points="0,-24 2,-20 6,-20 3,-18 4,-14 0,-16 -4,-14 -3,-18 -6,-20 -2,-20" fill="#FFD700" />
            <text x="0" y="-8" fill="#FFFFFF" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
              {teamDetails.displayName.substring(0, 5).toUpperCase()}
            </text>
          </g>

          <g transform="translate(150, 165) scale(1.15)">
            {teamDetails.hasChestStar ? (
              <polygon points="0,-16 4,-4 16,-4 6,3 10,15 0,7 -10,15 -6,3 -16,-4 -4,-4" fill="#FFFF00" stroke="#D4AC0D" strokeWidth="1" />
            ) : (
              <g opacity="0.95">
                <ellipse cx="-6" cy="0" rx="4" ry="10" transform="rotate(-30 -6 0)" fill={textCol} />
                <ellipse cx="6" cy="0" rx="4" ry="10" transform="rotate(30 6 0)" fill={textCol} />
                <ellipse cx="0" cy="0" rx="4" ry="12" fill={textCol} />
                <rect x="-12" y="3" width="24" height="2" fill={bg} />
                <rect x="-9" y="6" width="18" height="2" fill={bg} />
              </g>
            )}
          </g>

          <text x="220" y="320" fill={textCol} fontFamily="Impact, sans-serif" fontSize="22" fontWeight="black" letterSpacing="4" textAnchor="middle" opacity="0.3">
            KITS PRO
          </text>
        </g>

        <path d={outerContour} fill={`url(#${svgId}-fabric-weave)`} />
        <path d={outerContour} fill={`url(#${svgId}-body-volume)`} />
      </g>
    </svg>
  );

  return (
    <div className="relative group flex flex-col justify-between overflow-hidden bg-surface-3 border border-border-default hover:border-yellow-500/40 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/5">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
          isHome
            ? "bg-red-500/10 text-red-500 border border-red-500/20"
            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
        }`}>
          {isHome ? t("jerseyCard.badgeHome") : t("jerseyCard.badgeAway")}
        </span>

        {product.stock <= 5 && product.stock > 0 && (
          <span className="bg-amber-600/20 border border-amber-600/40 text-amber-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
            {t("jerseyCard.lowStock")} ({product.stock})
          </span>
        )}
        {product.stock === 0 && (
          <span className="bg-surface-4 text-text-muted text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-border-default">
            {t("jerseyCard.outOfStock")}
          </span>
        )}
      </div>

      {isLocalImage ? (
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-surface-4 to-surface-base">
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent opacity-60 pointer-events-none" />
        </div>
      ) : (
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-surface-2 to-surface-base flex items-center justify-center select-none p-5 sm:p-6">
          <div
            className="absolute w-44 h-44 rounded-full blur-[60px] opacity-20 group-hover:opacity-35 transition-opacity duration-500 pointer-events-none"
            style={{ backgroundColor: bg }}
          />
          {jerseySVGFront}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.03] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent opacity-80 pointer-events-none" />
        </div>
      )}

      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest block mb-1">
            {product.teamCountry}
          </span>
          <h3 className="text-text-primary font-sans font-bold text-sm sm:text-base tracking-tight mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-yellow-400 font-mono font-black text-sm sm:text-base">
              {formattedPrice}
            </span>
            <span className="text-[10px] text-text-muted">
              {t("jerseyCard.stockLabel")}: {product.stock} {t("jerseyCard.stockUnit")}
            </span>
          </div>

          <button
            id={`btn-customize-${product.id}`}
            onClick={() => onSelect(product.id)}
            disabled={product.stock === 0}
            className="w-full bg-surface-4 active:bg-yellow-500 active:text-black group-hover:bg-yellow-500 group-hover:text-black hover:bg-yellow-400 text-text-primary text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer disabled:bg-surface-4 disabled:text-text-muted disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {product.stock === 0 ? t("jerseyCard.outOfStockCta") : t("jerseyCard.customizeCta")}
          </button>
        </div>
      </div>
    </div>
  );
}
