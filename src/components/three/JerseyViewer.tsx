/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, MouseEvent } from "react";
import { Shirt, Sparkles, Shield, Trophy } from "lucide-react";

interface JerseyViewerProps {
  colorHex?: string;
  accentHex?: string;
  nickname?: string;
  number?: number;
  teamName?: string;
}

export default function JerseyViewer({
  colorHex = "#DA251D",
  accentHex = "#FFFF00",
  nickname = "",
  number = 10,
  teamName = "Vietnam 🇻🇳"
}: JerseyViewerProps) {
  const [isFront, setIsFront] = useState(false); // Back is customizable by default so let's show back or toggle
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<string>("");

  // Clean normalizing of team name
  const originalTeamNormalized = teamName.toLowerCase();
  
  // Detect if Away jersey based on color context (usually whites or secondary color)
  const isAway = colorHex.toLowerCase() === "#efefef" || colorHex.toLowerCase() === "#ffffff" || colorHex.toLowerCase() === "#ffffff";

  // Determine official team config
  let teamDetails = {
    displayName: "Việt Nam",
    flag: "🇻🇳",
    badgeUrl: null,
    baseColor: "#DA251D",       
    accentColor: "#FFFF00",     
    textColor: "#FFFF00",       
    hasStripes: false,
    hasShoulderStripes: false,
    hasChestStar: true,
    fontFamily: "Impact, sans-serif",
  };

  if (originalTeamNormalized.includes("vietnam")) {
    teamDetails = {
      displayName: "Việt Nam",
      flag: "🇻🇳",
      badgeUrl: null,
      baseColor: isAway ? "#FFFFFF" : "#DA251D",
      accentColor: isAway ? "#DA251D" : "#FFFF00",
      textColor: isAway ? "#DA251D" : "#FFFF00",
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: true,
      fontFamily: "Impact, sans-serif",
    };
  } else if (originalTeamNormalized.includes("argentina")) {
    teamDetails = {
      displayName: "Argentina",
      flag: "🇦🇷",
      badgeUrl: null,
      baseColor: isAway ? "#0F2240" : "#75AADB",
      accentColor: isAway ? "#91B9DF" : "#FFFFFF",
      textColor: isAway ? "#FFFFFF" : "#000000",
      hasStripes: !isAway, // Vertical sky blue and white stripes
      hasShoulderStripes: true,
      hasChestStar: false,
      fontFamily: "'Trebuchet MS', 'Arial Black', sans-serif",
    };
  } else if (originalTeamNormalized.includes("brazil")) {
    teamDetails = {
      displayName: "Brazil",
      flag: "🇧🇷",
      baseColor: isAway ? "#002D62" : "#FDD116",
      accentColor: isAway ? "#FDD116" : "#009C3B",
      textColor: isAway ? "#FFFFFF" : "#002D62",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
      fontFamily: "Impact, sans-serif",
    };
  } else if (originalTeamNormalized.includes("france")) {
    teamDetails = {
      displayName: "Pháp",
      flag: "🇫🇷",
      baseColor: isAway ? "#FFFFFF" : "#0F2148",
      accentColor: isAway ? "#0F2148" : "#C61B21",
      textColor: isAway ? "#0F2148" : "#FDD116",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
      fontFamily: "Impact, Georgia, serif",
    };
  } else if (originalTeamNormalized.includes("germany")) {
    teamDetails = {
      displayName: "Đức",
      flag: "🇩🇪",
      baseColor: isAway ? "#1E1E1E" : "#FFFFFF",
      accentColor: isAway ? "#EA1824" : "#111111",
      textColor: isAway ? "#FFFFFF" : "#111111",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: true, // Black-Red-Gold shoulder stripes
      hasChestStar: false,
      fontFamily: "'Century Gothic', Arial, sans-serif",
    };
  } else if (originalTeamNormalized.includes("japan")) {
    teamDetails = {
      displayName: "Nhật Bản",
      flag: "🇯🇵",
      baseColor: isAway ? "#FFFFFF" : "#0F2248",
      accentColor: isAway ? "#0F2248" : "#E2001A",
      textColor: isAway ? "#0F2248" : "#FFFFFF",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
      fontFamily: "sans-serif",
    };
  } else if (originalTeamNormalized.includes("spain")) {
    teamDetails = {
      displayName: "Tây Ban Nha",
      flag: "🇪🇸",
      baseColor: isAway ? "#F9F6E7" : "#C61B21",
      accentColor: isAway ? "#C61B21" : "#FDD116",
      textColor: isAway ? "#C61B21" : "#FDD116",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: true,
      hasChestStar: false,
      fontFamily: "Impact, sans-serif",
    };
  } else if (originalTeamNormalized.includes("portugal")) {
    teamDetails = {
      displayName: "Bồ Đào Nha",
      flag: "🇵🇹",
      baseColor: isAway ? "#F3EBE1" : "#8B0000",
      accentColor: isAway ? "#008000" : "#FDD116",
      textColor: isAway ? "#8B0000" : "#FFFFFF",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
      fontFamily: "Impact, sans-serif",
    };
  } else if (originalTeamNormalized.includes("korea")) {
    teamDetails = {
      displayName: "Hàn Quốc",
      flag: "🇰🇷",
      baseColor: isAway ? "#EBEBEB" : "#FF3B47",
      accentColor: isAway ? "#FF3B47" : "#1E1E2D",
      textColor: isAway ? "#1E1E2D" : "#EBEBEB",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
      fontFamily: "'Courier New', Courier, monospace",
    };
  } else if (originalTeamNormalized.includes("england")) {
    teamDetails = {
      displayName: "Anh",
      flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      baseColor: isAway ? "#0F1A35" : "#FFFFFF",
      accentColor: isAway ? "#E61B27" : "#0F1A35",
      textColor: isAway ? "#FFFFFF" : "#0F1A35",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
      fontFamily: "Arial, Helvetica, sans-serif",
    };
  } else {
    // Standard User Customizable Fallback matching the color picks perfectly
    teamDetails = {
      displayName: teamName.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim(),
      flag: "⚽",
      baseColor: colorHex,
      accentColor: accentHex,
      textColor: "#FFFFFF",
      badgeUrl: null,
      hasStripes: false,
      hasShoulderStripes: false,
      hasChestStar: false,
      fontFamily: "Impact, sans-serif",
    };
  }

  // --- Dynamic 2.5D Mouse Interactive Tilt Calculation ---
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position in client rect
    const y = e.clientY - rect.top;  // y position in client rect
    const px = x / rect.width;       // percentage x
    const py = y / rect.height;      // percentage y

    // Calculate rotation (-15 to 15 deg based on hover ratio)
    const rX = (0.5 - py) * 20; 
    const rY = (px - 0.5) * 20;

    // Soft expansion shadow and light source simulation
    const shadowX = (0.5 - px) * 25;
    const shadowY = (0.5 - py) * 25;

    setTiltStyle(`perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.02, 1.02, 1.02)`);
    card.style.setProperty("--sx", `${shadowX}px`);
    card.style.setProperty("--sy", `${shadowY}px`);
    card.style.setProperty("--px", `${px * 100}%`);
    card.style.setProperty("--py", `${py * 100}%`);
  };

  const handleMouseLeave = () => {
    setTiltStyle("");
    if (cardRef.current) {
      cardRef.current.style.setProperty("--sx", "0px");
      cardRef.current.style.setProperty("--sy", "10px");
      cardRef.current.style.setProperty("--px", "50%");
      cardRef.current.style.setProperty("--py", "50%");
    }
  };

  // Modern symmetrical jersey drawing path based on the realistic wide athletic fit in the user's photo (widened per request)
  const outerContour = "M 160,82 C 160,82 190,68 220,68 C 250,68 280,82 280,82 L 410,125 C 413,126 414,132 411,136 L 375,235 C 372,243 363,243 358,236 L 326,185 L 326,465 C 326,473 316,478 306,478 L 134,478 C 124,478 114,473 114,465 L 114,185 L 82,236 C 77,243 68,243 65,235 L 29,136 C 26,132 27,126 30,125 L 160,82 Z";

  const renderJerseySVG = (face: "front" | "back") => {
    const isBack = face === "back";
    const bg = teamDetails.baseColor;
    const acc = teamDetails.accentColor;
    const textCol = teamDetails.textColor;

    return (
      <svg 
        viewBox="10 50 420 440" 
        className="w-full h-full drop-shadow-[0_20px_25px_rgba(0,0,0,0.6)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="shirt-shape">
            <path d={outerContour} />
          </clipPath>

          {/* Realistic Fabric blur filters for ambient shadows and highlights */}
          <filter id="soft-blur" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
          <filter id="micro-blur" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="1.0" />
          </filter>

          {/* Athletic polyester breathable knit mesh structure */}
          <pattern id="fabric-weave" width="3" height="3" patternUnits="userSpaceOnUse">
            <rect width="3" height="3" fill="none" />
            <circle cx="1.5" cy="1.5" r="0.4" fill="#000000" opacity="0.08" />
            <circle cx="0" cy="0" r="0.25" fill="#ffffff" opacity="0.09" />
            <circle cx="3" cy="0" r="0.25" fill="#ffffff" opacity="0.09" />
            <circle cx="0" cy="3" r="0.25" fill="#ffffff" opacity="0.09" />
            <circle cx="3" cy="3" r="0.25" fill="#ffffff" opacity="0.09" />
          </pattern>

          {/* 3D Body shape chest volume and roundness gradient */}
          <radialGradient id="body-volume" cx="50%" cy="28%" r="65%" fx="50%" fy="18%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.30" />
          </radialGradient>

          {/* Collar shadow layer */}
          <radialGradient id="collar-shade" cx="50%" cy="13%" r="18%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.48" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
          </radialGradient>

          {/* Symmetrical shadow layout representing organic mesh wrinkles & fabric creases */}
          <linearGradient id="fold-shadow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
            <stop offset="15%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="35%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#000" stopOpacity="0.32" />
            <stop offset="65%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="85%" stopColor="#000" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="subtle-hem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.15" />
            <stop offset="90%" stopColor="#000" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.65" />
          </linearGradient>

          {/* Pattern of Argentina Sky Blue Stripes */}
          <pattern id="argentina-stripes" width="90" height="500" patternUnits="userSpaceOnUse">
            <rect width="90" height="500" fill="#FFFFFF" />
            <rect x="0" width="30" height="500" fill="#75AADB" />
            <rect x="60" width="30" height="500" fill="#75AADB" />
          </pattern>
        </defs>

        {/* 1. Base Layer (Solid Base Color or Stripes Pattern) */}
        <path 
          d={outerContour} 
          fill={teamDetails.hasStripes ? "url(#argentina-stripes)" : bg}
          className="transition-all duration-300"
        />

        {/* 2. Team Pattern Details / Custom Graphics inside the Clip Mask */}
        <g clipPath="url(#shirt-shape)">
          
          {/* Multi-colored thin vertical stripes matching the Japan Kenzo photo */}
          {((originalTeamNormalized.includes("japan") && isAway) || (isAway && colorHex.toLowerCase() === "#ffffff")) && (
            <g opacity="0.85" strokeWidth="2.2" strokeLinecap="round">
              <line x1="130" y1="80" x2="130" y2="470" stroke="#4A90E2" />
              <line x1="150" y1="80" x2="150" y2="470" stroke="#FF5A5F" />
              <line x1="170" y1="80" x2="170" y2="470" stroke="#FFB400" />
              <line x1="190" y1="80" x2="190" y2="470" stroke="#8CE071" strokeDasharray="140,5" />
              <line x1="210" y1="80" x2="210" y2="470" stroke="#00D1C1" />
              <line x1="220" y1="80" x2="220" y2="470" stroke="#3B5998" />
              <line x1="230" y1="80" x2="230" y2="470" stroke="#8B572A" />
              <line x1="250" y1="80" x2="250" y2="470" stroke="#9C27B0" strokeDasharray="180,8" />
              <line x1="270" y1="80" x2="270" y2="470" stroke="#E91E63" />
              <line x1="290" y1="80" x2="290" y2="470" stroke="#50E3C2" />
              
              <line x1="60" y1="140" x2="110" y2="210" stroke="#FF5A5F" />
              <line x1="75" y1="130" x2="125" y2="200" stroke="#FFB400" />
              <line x1="90" y1="120" x2="140" y2="190" stroke="#8CE071" />

              <line x1="380" y1="140" x2="330" y2="210" stroke="#E91E63" />
              <line x1="365" y1="130" x2="315" y2="200" stroke="#9C27B0" />
              <line x1="350" y1="120" x2="300" y2="190" stroke="#3B5998" />
            </g>
          )}

          {/* Symmetrical vertical team trims (e.g. elegant side border stripes) */}
          <path d="M 114,185 L 114,465" stroke={acc} strokeWidth="10" strokeOpacity="0.85" className="transition-all duration-300" />
          <path d="M 326,185 L 326,465" stroke={acc} strokeWidth="10" strokeOpacity="0.85" className="transition-all duration-300" />

          {/* Symmetrical ribbed cuff bands with striped black-and-white accents matching your photo */}
          <path d="M 29,136 L 82,236" stroke={acc} strokeWidth="14" strokeLinecap="square" className="transition-all duration-300" />
          <path d="M 29,136 L 82,236" stroke="#000000" strokeWidth="8" strokeLinecap="square" />
          <path d="M 29,136 L 82,236" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square" />

          <path d="M 411,136 L 375,235" stroke={acc} strokeWidth="14" strokeLinecap="square" className="transition-all duration-300" />
          <path d="M 411,136 L 375,235" stroke="#000000" strokeWidth="8" strokeLinecap="square" />
          <path d="M 411,136 L 375,235" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square" />

          {/* Multi-ribbed striped neck collar representing the premium jersey from your photo */}
          <path 
            d="M 160,82 C 160,82 195,115 220,115 C 245,115 280,82 280,82" 
            fill="none" 
            stroke={acc} 
            strokeWidth="16" 
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          <path 
            d="M 160,82 C 160,82 195,115 220,115 C 245,115 280,82 280,82" 
            fill="none" 
            stroke="#000000" 
            strokeWidth="10" 
            strokeLinecap="round"
          />
          <path 
            d="M 160,82 C 160,82 195,115 220,115 C 245,115 280,82 280,82" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="4" 
            strokeLinecap="round"
          />

          {/* Germany Flag shoulder trims */}
          {teamDetails.hasShoulderStripes && originalTeamNormalized.includes("germany") && (
            <g opacity="0.9">
              {/* Left Shoulders Flag */}
              <line x1="100" y1="125" x2="145" y2="175" stroke="#FF0000" strokeWidth="5" />
              <line x1="94" y1="129" x2="139" y2="179" stroke="#111111" strokeWidth="5" />
              <line x1="106" y1="121" x2="151" y2="171" stroke="#FFCC00" strokeWidth="5" />
              {/* Right Shoulders Flag */}
              <line x1="340" y1="125" x2="295" y2="175" stroke="#FF0000" strokeWidth="5" />
              <line x1="346" y1="129" x2="301" y2="179" stroke="#111111" strokeWidth="5" />
              <line x1="334" y1="121" x2="289" y2="171" stroke="#FFCC00" strokeWidth="5" />
            </g>
          )}

          {/* Argentina Gold Sun on back or front */}
          {originalTeamNormalized.includes("argentina") && !isBack && (
            <circle cx="220" cy="145" r="11" fill="#FFCC00" stroke="#E59800" strokeWidth="1" />
          )}

          {/* Brand/Team logo & Star Details on front collar */}
          {!isBack && (
            <g>
              {/* National Crest Badge (Left side on viewer's right chest) */}
              <g transform="translate(290, 165) scale(1.15)">
                <path 
                  d="M -16,-18 L 16,-18 C 16,-18 20,12 0,24 C -20,12 -16,-18 -16,-18 Z" 
                  fill="#0d0e14" 
                  stroke={acc} 
                  strokeWidth="2.5" 
                />
                <circle cx="0" cy="2" r="5" fill="#C61B21" />
                <polygon points="0,-24 2,-20 6,-20 3,-18 4,-14 0,-16 -4,-14 -3,-18 -6,-20 -2,-20" fill="#FFD700" />
                <text 
                  x="0" 
                  y="-8" 
                  fill="#FFFFFF" 
                  fontSize="6.5" 
                  fontWeight="900" 
                  fontFamily="sans-serif" 
                  textAnchor="middle" 
                  letterSpacing="0.5"
                >
                  {teamDetails.displayName.substring(0, 5).toUpperCase()}
                </text>
              </g>

              {/* Trefoil Brand Clover Logo (Right side on viewer's left chest) */}
              <g transform="translate(150, 165) scale(1.15)">
                {teamDetails.hasChestStar ? (
                  <polygon 
                    points="0,-16 4,-4 16,-4 6,3 10,15 0,7 -10,15 -6,3 -16,-4 -4,-4" 
                    fill="#FFFF00" 
                    stroke="#D4AC0D"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
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

              {/* Sponsor Chest Logo placeholder center */}
              <text 
                x="220" 
                y="320" 
                fill={textCol} 
                fontFamily="Impact, sans-serif" 
                fontSize="20" 
                fontWeight="black" 
                letterSpacing="4" 
                textAnchor="middle" 
                opacity="0.3"
                className="transition-all duration-300"
              >
                KITS PRO
              </text>
            </g>
          )}

          {/* CUSTOM PLAYER DETAILS: NAME & NUMBER AT THE BACK */}
          {isBack && (
            <g transform="translate(220, 255)">
              {/* Majestic Player Name */}
              <text
                x="0"
                y="-90"
                textAnchor="middle"
                fill={textCol}
                stroke={bg.toLowerCase() === "#ffffff" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"}
                strokeWidth="1"
                fontFamily={teamDetails.fontFamily}
                fontSize="27"
                fontWeight="900"
                letterSpacing="4"
                className="uppercase select-none transition-all duration-300"
                style={{ filter: "drop-shadow(0px 3px 4px rgba(0,0,0,0.4))" }}
              >
                {(nickname || "CHAMPION").toUpperCase()}
              </text>

              {/* Giant Majestic 3D Jersey Number */}
              <text
                x="0"
                y="55"
                textAnchor="middle"
                fill={textCol}
                stroke={bg.toLowerCase() === "#ffffff" ? "#111" : "#fff"}
                strokeWidth="1.5"
                fontFamily={teamDetails.fontFamily}
                fontSize="160"
                fontWeight="900"
                className="select-none transition-all duration-300 text-center"
                style={{ 
                  filter: "drop-shadow(0px 9px 12px rgba(0,0,0,0.6))",
                  fontStyle: "italic"
                }}
              >
                {number}
              </text>

              {/* National flag printed beautifully below collar neck back */}
              <g transform="translate(0, -114)">
                {originalTeamNormalized.includes("japan") ? (
                  <g>
                    <rect x="-14" y="-8" width="28" height="16" fill="#FFFFFF" stroke="#111111" strokeWidth="0.5" rx="1" />
                    <circle cx="0" cy="0" r="4.5" fill="#C61B21" />
                  </g>
                ) : originalTeamNormalized.includes("vietnam") ? (
                  <g>
                    <rect x="-14" y="-8" width="28" height="16" fill="#DA251D" stroke="#FFFF00" strokeWidth="0.5" rx="1" />
                    <polygon points="0,-4 1.2,-1 4.5,-1 1.8,1 2.8,4.2 0,2.2 -2.8,4.2 -1.8,1 -4.5,-1 -1.2,-1" fill="#FFFF00" />
                  </g>
                ) : (
                  /* Gold Champion Star Badge */
                  <polygon 
                    points="0,-10 2.5,-3 10,-3 4,-1 6,6 0,2 -6,6 -4,-1 -10,-3 -2.5,-3" 
                    fill="#FFD700" 
                  />
                )}
              </g>
            </g>
          )}

          {/* FRONT MINIMALIST NUMBER PRINT */}
          {!isBack && (
            <text
              x="220"
              y="245"
              textAnchor="middle"
              fill={textCol}
              fontFamily={teamDetails.fontFamily}
              fontSize="48"
              fontWeight="900"
              opacity="0.95"
              className="select-none transition-all duration-300"
              style={{ filter: "drop-shadow(0px 3px 5px rgba(0,0,0,0.35))" }}
            >
              {number}
            </text>
          )}

          {/* 3. 2.5D Shading & Mesh Texture Fabric Overlays (Provides hyper-realistic textile feels!) */}
          
          {/* A. Athletic Polyester Breathable knit weave pattern overlay */}
          <path 
            d={outerContour} 
            fill="url(#fabric-weave)" 
            style={{ mixBlendMode: "overlay" }} 
            opacity="0.40" 
            pointerEvents="none" 
          />

          {/* B. Symmetrical Athletic Flatlock Seam Stitching Details */}
          <g opacity="0.48" pointerEvents="none">
            {/* Left armhole sleeve seam */}
            <path d="M 160,82 Q 137,134 114,185" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" strokeDasharray="3,2" />
            <path d="M 162,82 Q 139,134 116,185" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,2" />

            {/* Right armhole sleeve seam */}
            <path d="M 280,82 Q 303,134 326,185" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" strokeDasharray="3,2" />
            <path d="M 278,82 Q 301,134 324,185" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3,2" />

            {/* Left side panel seam */}
            <path d="M 114,185 L 114,465" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" strokeDasharray="3,2" />
            <path d="M 116,185 L 116,465" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,2" />

            {/* Right side panel seam */}
            <path d="M 326,185 L 326,465" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" strokeDasharray="3,2" />
            <path d="M 324,185 L 324,465" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3,2" />

            {/* Bottom double coverstitch */}
            <path d="M 114,457 C 121,462 125,464 130,464 L 310,464 C 315,464 319,462 326,457" fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="0.8" strokeDasharray="3,2" />
            <path d="M 114,459 C 121,464 125,466 130,466 L 310,466 C 315,466 319,464 326,459" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" strokeDasharray="3,2" />

            {/* Left sleeve cuff stitching */}
            <path d="M 33,141 L 86,241" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" strokeDasharray="3,1.5" />
            <path d="M 34.5,142.5 L 87.5,242.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" strokeDasharray="3,1.5" />

            {/* Right sleeve cuff stitching */}
            <path d="M 407,141 L 371,240" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" strokeDasharray="3,1.5" />
            <path d="M 405.5,139.5 L 369.5,238.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" strokeDasharray="3,1.5" />
          </g>

          {/* C. Organic realistically rendered creases, folds, and fabric drape shadows */}
          <g strokeLinecap="round" pointerEvents="none">
            {/* Collar micro drop-shadow (gives three-dimensional depth to collar edge) */}
            <path 
              d="M 160,82 C 160,82 195,115 220,115 C 245,115 280,82 280,82" 
              fill="none" 
              stroke="#000000" 
              strokeWidth="11" 
              opacity="0.25" 
              filter="url(#soft-blur)" 
            />

            {/* Left Armpit Tension Shadow & Crease */}
            <path d="M 114,200 Q 165,230 195,250" fill="none" stroke="#000000" strokeWidth="6" opacity="0.16" filter="url(#soft-blur)" />
            <path d="M 116,199 Q 167,229 197,249" fill="none" stroke="#ffffff" strokeWidth="4.5" opacity="0.12" filter="url(#soft-blur)" />

            {/* Right Armpit Tension Shadow & Crease */}
            <path d="M 326,200 Q 275,230 245,250" fill="none" stroke="#000000" strokeWidth="6" opacity="0.16" filter="url(#soft-blur)" />
            <path d="M 324,199 Q 273,229 243,249" fill="none" stroke="#ffffff" strokeWidth="4.5" opacity="0.12" filter="url(#soft-blur)" />

            {/* Symmetrical chest compression tension (creates realistic pull folds between badges and chest stars) */}
            <path d="M 114,145 Q 162,175 210,205" fill="none" stroke="#000000" strokeWidth="5.5" opacity="0.13" filter="url(#soft-blur)" />
            <path d="M 116,144 Q 164,174 212,204" fill="none" stroke="#ffffff" strokeWidth="3.5" opacity="0.11" filter="url(#soft-blur)" />

            <path d="M 326,145 Q 278,175 230,205" fill="none" stroke="#000000" strokeWidth="5.5" opacity="0.13" filter="url(#soft-blur)" />
            <path d="M 324,144 Q 276,174 228,204" fill="none" stroke="#ffffff" strokeWidth="3.5" opacity="0.11" filter="url(#soft-blur)" />

            {/* Waist hanging folds and drapes representing the jersey hanging with natural weight */}
            <path d="M 138,340 Q 178,370 176,435" fill="none" stroke="#000000" strokeWidth="7" opacity="0.18" filter="url(#soft-blur)" />
            <path d="M 140,340 Q 180,370 178,435" fill="none" stroke="#ffffff" strokeWidth="5" opacity="0.12" filter="url(#soft-blur)" />

            <path d="M 302,340 Q 262,370 264,435" fill="none" stroke="#000000" strokeWidth="7" opacity="0.18" filter="url(#soft-blur)" />
            <path d="M 300,340 Q 260,370 262,435" fill="none" stroke="#ffffff" strokeWidth="5" opacity="0.12" filter="url(#soft-blur)" />

            {/* Lateral mid-stomach curvature wear tension stretch curves */}
            <path d="M 114,300 Q 220,320 326,280" fill="none" stroke="#000000" strokeWidth="6.5" opacity="0.15" filter="url(#soft-blur)" />
            <path d="M 114,302 Q 220,322 326,282" fill="none" stroke="#ffffff" strokeWidth="4.5" opacity="0.13" filter="url(#soft-blur)" />
          </g>

          {/* D. Full-Body Specular Shading & Volumetric Roundness */}
          <path 
            d={outerContour} 
            fill="url(#body-volume)" 
            style={{ mixBlendMode: "overlay" }} 
            opacity="0.28" 
            pointerEvents="none" 
          />

          {/* E. Classic Global 2.5D Silhouette Depth Shadows */}
          <path 
            d={outerContour} 
            fill="url(#fold-shadow)" 
            style={{ mixBlendMode: "multiply" }} 
            opacity="0.45" 
            pointerEvents="none" 
          />

          <path 
            d={outerContour} 
            fill="url(#subtle-hem)" 
            style={{ mixBlendMode: "overlay" }} 
            opacity="0.3" 
            pointerEvents="none" 
          />

        </g>

        {/* 4. Beautiful Athletic Outer Hem Border outline */}
        <path 
          d={outerContour} 
          fill="none" 
          stroke="rgba(0,0,0,0.3)" 
          strokeWidth="3.5" 
          pointerEvents="none" 
        />
      </svg>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[580px] md:min-h-[660px] lg:min-h-[740px] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0b0c10] to-[#040406] rounded-3xl border border-zinc-800 shadow-2xl p-6 select-none">
      
      {/* Live Badge and Indicators */}
      <div className="flex justify-between items-center z-10 w-full mb-2">
        <div className="bg-[#111118]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-yellow-500/20 flex items-center gap-2 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase tracking-wider text-green-400">Xem Áo 2.5D Studio</span>
        </div>

        {/* Rotator toggles */}
        <div className="flex gap-1.5 bg-black/60 p-1.5 rounded-xl border border-zinc-800">
          <button
            id="btn-rotate-front"
            onClick={() => setIsFront(true)}
            className={`px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
              isFront
                ? "bg-yellow-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Mặt Trước
          </button>
          <button
            id="btn-rotate-back"
            onClick={() => setIsFront(false)}
            className={`px-3 py-1 text-[10px] sm:text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
              !isFront
                ? "bg-yellow-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Mặt Sau
          </button>
        </div>
      </div>

      {/* Main 2.5D Flipping Card with interactive cursor perspective tilt */}
      <div className="flex-grow w-full flex items-center justify-center py-6 relative">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-[360px] md:max-w-[440px] lg:max-w-[480px] aspect-[4/5] cursor-grab active:cursor-grabbing transition-transform duration-200 ease-out"
          style={{ 
            transform: tiltStyle,
            transformStyle: "preserve-3d",
            transition: tiltStyle ? "none" : "all 0.5s ease"
          }}
        >
          {/* Card Glass Sheen Overlay simulation */}
          <div 
            className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-20 z-20 mix-blend-overlay transition-all duration-300"
            style={{
              background: `radial-gradient(circle at var(--px, 50%) var(--py, 50%), rgba(255,255,255,0.8) 0%, transparent 60%)`
            }}
          />

          {/* Symmetrical dynamic 3D drop shadow simulation based on mouse direction */}
          <div 
            className="absolute -inset-2 rounded-[2.5rem] bg-black/40 blur-2xl -z-10 transition-all duration-300"
            style={{
              transform: `translate3d(var(--sx, 0px), var(--sy, 12px), -20px)`
            }}
          />

          {/* Render face */}
          <div className="w-full h-full flex items-center justify-center scale-95 sm:scale-100 transition-transform duration-300">
            {isFront ? renderJerseySVG("front") : renderJerseySVG("back")}
          </div>

        </div>
      </div>

      {/* Instruction Overlay */}
      <div className="w-full flex items-center justify-between text-[11px] text-zinc-400 mt-2 z-10 border-t border-zinc-900 pt-4 bg-transparent">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-500">
          <Shield className="w-3.5 h-3.5 text-yellow-500/80" />
          <span>{teamDetails.displayName} {teamDetails.flag}</span>
        </div>
        <p className="text-zinc-500 select-none font-medium text-right text-[10px] leading-tight">
          Rao chuột qua áo để tương tác xoay 2.5D • In chuyển nhiệt 3D
        </p>
      </div>

    </div>
  );
}
