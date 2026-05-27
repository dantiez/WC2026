import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import { api } from "../lib/api";

const DEADLINE_PRESETS: Array<{ label: string; days: number }> = [
  { label: "1 ngày", days: 1 },
  { label: "3 ngày", days: 3 },
  { label: "7 ngày", days: 7 },
  { label: "14 ngày", days: 14 },
];

const MAX_DEADLINE_DAYS = 365;

function toDatetimeLocalInput(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function CaptainSessionNew() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deadlineError, setDeadlineError] = useState<string | null>(null);

  const { minAttr, maxAttr } = useMemo(() => {
    const now = new Date();
    const max = new Date(now.getTime() + MAX_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
    return {
      minAttr: toDatetimeLocalInput(now),
      maxAttr: toDatetimeLocalInput(max),
    };
  }, []);

  const setDeadlinePreset = (days: number) => {
    setDeadlineAt(
      toDatetimeLocalInput(new Date(Date.now() + days * 24 * 60 * 60 * 1000)),
    );
    setDeadlineError(null);
    setError(null);
  };

  const validateDeadline = (raw: string): string | null => {
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "Hạn chốt đơn không hợp lệ.";
    const now = Date.now();
    if (d.getTime() <= now) return "Hạn chốt đơn phải ở tương lai.";
    const maxMs = now + MAX_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
    if (d.getTime() > maxMs)
      return `Hạn chốt đơn tối đa ${MAX_DEADLINE_DAYS} ngày kể từ hôm nay.`;
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const dErr = validateDeadline(deadlineAt);
    if (dErr) {
      setDeadlineError(dErr);
      return;
    }
    setDeadlineError(null);

    setLoading(true);
    try {
      const team = await api.teams.create({
        name: name.trim(),
        defaultProductId: null,
        deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      });
      navigate(`/captain/teams/${team.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => navigate("/captain")}
          className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Về dashboard
        </button>

        <form
          onSubmit={submit}
          className="bg-surface-2 border border-border-default rounded-2xl p-6 flex flex-col gap-5"
        >
          <header>
            <h1 className="text-lg font-black uppercase tracking-wide text-text-primary">
              Tạo đợt đặt áo mới
            </h1>
            <p className="text-xs text-text-muted">
              Sau khi tạo, bạn sẽ có một link share cho cả team. Mở voting để cả team
              chọn mẫu áo.
            </p>
          </header>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
              Tên team
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="VD: GenBeta WC2026"
              className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Hạn chốt đơn (tuỳ chọn)
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {DEADLINE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setDeadlinePreset(preset.days)}
                  className="text-[11px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border border-border-default bg-surface-3 text-text-secondary hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/40"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="datetime-local"
                value={deadlineAt}
                min={minAttr}
                max={maxAttr}
                onChange={(e) => {
                  setDeadlineAt(e.target.value);
                  setDeadlineError(validateDeadline(e.target.value));
                }}
                aria-invalid={!!deadlineError}
                className={`bg-surface-3 border rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                  deadlineError ? "border-red-500/60" : "border-border-default"
                }`}
              />
              {deadlineAt ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeadlineAt("");
                    setDeadlineError(null);
                  }}
                  className="text-[11px] text-text-muted hover:text-text-primary underline"
                >
                  Bỏ deadline
                </button>
              ) : null}
            </div>
            {deadlineError ? (
              <span className="text-[11px] text-red-400">{deadlineError}</span>
            ) : (
              <span className="text-[10px] text-text-muted">
                Bỏ trống nếu không cần. Tối đa {MAX_DEADLINE_DAYS} ngày kể từ hôm nay.
              </span>
            )}
          </div>

          {error ? (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !!deadlineError}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-black uppercase text-sm rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Đang tạo…" : "Tạo team"}
          </button>
        </form>
      </div>
    </main>
  );
}
