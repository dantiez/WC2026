import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatCountdown, formatTimestamp } from "../../lib/formatDate";

interface Props {
  deadlineIso: string;
  onExpired?: () => void;
  variant?: "compact" | "banner";
  /** Banner heading while counting down. */
  label?: string;
  /** Banner heading once expired. */
  expiredLabel?: string;
  /** Banner value text once expired. */
  expiredHint?: string;
}

export default function PollCountdown({
  deadlineIso,
  onExpired,
  variant = "banner",
  label = "Voting kết thúc sau",
  expiredLabel = "Hết hạn voting",
  expiredHint = "Đang chốt mẫu thắng…",
}: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const { expired, msLeft } = formatCountdown(deadlineIso);
    if (expired) {
      onExpired?.();
      return;
    }
    const interval = msLeft > 60_000 ? 30_000 : 1_000;
    const id = window.setInterval(() => setTick((t) => t + 1), interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineIso, tick]);

  const { text, expired } = formatCountdown(deadlineIso);

  useEffect(() => {
    if (expired) {
      const t = window.setTimeout(() => onExpired?.(), 800);
      return () => window.clearTimeout(t);
    }
  }, [expired, onExpired]);

  if (variant === "compact") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-mono ${
          expired ? "text-red-400" : "text-yellow-300"
        }`}
        title={`Hạn: ${formatTimestamp(deadlineIso)}`}
      >
        <Clock className="w-3 h-3" />
        {expired ? "Hết hạn" : text}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
        expired
          ? "bg-red-500/10 border border-red-500/30 text-red-300"
          : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-200"
      }`}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <div className="flex-1 flex items-center justify-between gap-2 flex-wrap">
        <span className="font-bold uppercase tracking-wider text-[11px]">
          {expired ? expiredLabel : label}
        </span>
        <span className="font-mono font-black">
          {expired ? expiredHint : text}
        </span>
      </div>
    </div>
  );
}
