import JerseyImage from "./JerseyImage";

interface Props {
  jerseyId: string;
  imageUrl: string;
  name: string;
  subtitle?: string;
  /** Printed player name on the back (nickname, falls back to member name). */
  playerName?: string;
  nickname?: string;
  /** Printed team name below the number on the back. */
  teamName?: string;
  jerseyNumber?: string;
}

const FALLBACK_PALETTE: Array<{ base: string; text: string }> = [
  { base: "#0F2148", text: "#FFFFFF" },
  { base: "#C8102E", text: "#FFFFFF" },
  { base: "#FFD700", text: "#0F1115" },
  { base: "#006A4E", text: "#FFFFFF" },
];

function pickPalette(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length];
}

export default function JerseyPreview({
  jerseyId,
  imageUrl,
  name,
  subtitle,
  playerName,
  nickname,
  teamName,
  jerseyNumber,
}: Props) {
  const palette = pickPalette(jerseyId);
  const backName = (nickname || playerName || "TÊN CẦU THỦ")
    .toUpperCase()
    .slice(0, 16);
  const backTeam = (teamName || "TÊN ĐỘI BÓNG").toUpperCase().slice(0, 18);
  const backNumber = (jerseyNumber || "00").toString().slice(0, 3);

  return (
    <section className="bg-surface-3 border border-border-default rounded-xl p-3">
      <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted mb-2">
        Preview mẫu áo
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Pane label="Mặt trước">
          <JerseyImage
            src={imageUrl}
            alt={`${name} (mặt trước)`}
            imgClassName="w-full h-full object-cover rounded-md bg-surface-base"
            wrapperClassName="block w-full h-full"
            overlaySize="sm"
          />
        </Pane>
        <Pane label="Mặt sau">
          <JerseyBack
            base={palette.base}
            text={palette.text}
            name={backName}
            team={backTeam}
            number={backNumber}
          />
        </Pane>
      </div>
      <p className="mt-2 text-[10px] text-text-muted truncate">
        {name}
        {subtitle ? ` · ${subtitle}` : ""}
      </p>
    </section>
  );
}

function Pane({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase font-semibold tracking-wider text-text-muted">
        {label}
      </span>
      <div className="aspect-[4/5] overflow-hidden rounded-md">{children}</div>
    </div>
  );
}

function JerseyBack({
  base,
  text,
  name,
  team,
  number,
}: {
  base: string;
  text: string;
  name: string;
  team: string;
  number: string;
}) {
  // Scale text down a touch as it gets longer so it never spills past the body.
  const nameSize = name.length > 11 ? 13 : 16;
  const teamSize = team.length > 13 ? 11 : 13;

  return (
    <svg
      viewBox="0 0 200 250"
      role="img"
      aria-label={`Mặt sau in: cầu thủ ${name}, số ${number}, đội ${team}`}
      className="w-full h-full bg-surface-base"
    >
      <defs>
        <linearGradient id="jerseyShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={base} stopOpacity="1" />
          <stop offset="100%" stopColor={base} stopOpacity="0.78" />
        </linearGradient>
      </defs>
      <path
        d="M 60,30 C 60,30 75,22 100,22 C 125,22 140,30 140,30 L 188,55 C 192,57 192,62 190,66 L 172,108 C 170,113 164,113 161,108 L 152,90 L 152,228 C 152,232 148,236 144,236 L 56,236 C 52,236 48,232 48,228 L 48,90 L 39,108 C 36,113 30,113 28,108 L 10,66 C 8,62 8,57 12,55 L 60,30 Z"
        fill="url(#jerseyShade)"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1.5"
      />
      {/* Player name — high on the upper back, just under the collar */}
      <text
        x="100"
        y="82"
        textAnchor="middle"
        fontSize={nameSize}
        fontWeight="900"
        fill={text}
        fontFamily="system-ui, sans-serif"
        letterSpacing="1.5"
      >
        {name}
      </text>
      {/* Squad number — dominant, centred */}
      <text
        x="100"
        y="178"
        textAnchor="middle"
        fontSize="82"
        fontWeight="900"
        fill={text}
        fontFamily="system-ui, sans-serif"
      >
        {number}
      </text>
      {/* Team name — below the number */}
      <text
        x="100"
        y="216"
        textAnchor="middle"
        fontSize={teamSize}
        fontWeight="800"
        fill={text}
        fontFamily="system-ui, sans-serif"
        letterSpacing="1.5"
        opacity="0.92"
      >
        {team}
      </text>
    </svg>
  );
}
