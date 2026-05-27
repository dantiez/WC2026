import { useMemo, useState } from "react";
import { Check, Clock, Loader2, Vote, X } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import type { Shop, ShopJersey } from "../../types";
import JerseyImage from "../common/JerseyImage";

const MIN_CANDIDATES = 2;
const MAX_CANDIDATES = 5;
const ALL_SHOPS = "__all__";

const DEADLINE_PRESETS: Array<{ label: string; hours: number }> = [
  { label: "1h", hours: 1 },
  { label: "4h", hours: 4 },
  { label: "8h", hours: 8 },
  { label: "1d", hours: 24 },
];

function toDatetimeLocalInput(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

interface Props {
  teamId: string;
  jerseys: ShopJersey[];
  shops: Shop[];
  onClose: () => void;
  onCreated: () => void;
}

export default function PollSetupModal({
  teamId,
  jerseys,
  shops,
  onClose,
  onCreated,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [shopFilter, setShopFilter] = useState<string>(ALL_SHOPS);
  const [deadlineInput, setDeadlineInput] = useState<string>(() =>
    toDatetimeLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  );

  const setDeadlinePreset = (hours: number) => {
    setDeadlineInput(
      toDatetimeLocalInput(new Date(Date.now() + hours * 60 * 60 * 1000)),
    );
    setError(null);
  };
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shopMap = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);
  const filteredJerseys = useMemo(() => {
    const active = jerseys.filter((j) => j.isActive);
    if (shopFilter === ALL_SHOPS) return active;
    return active.filter((j) => j.shopId === shopFilter);
  }, [jerseys, shopFilter]);

  const toggle = (jerseyId: string) => {
    setError(null);
    setSelected((prev) => {
      if (prev.includes(jerseyId)) return prev.filter((id) => id !== jerseyId);
      if (prev.length >= MAX_CANDIDATES) {
        setError(`Tối đa ${MAX_CANDIDATES} mẫu áo.`);
        return prev;
      }
      return [...prev, jerseyId];
    });
  };

  const submit = async () => {
    if (selected.length < MIN_CANDIDATES) {
      setError(`Vui lòng chọn ít nhất ${MIN_CANDIDATES} mẫu áo.`);
      return;
    }
    let deadlineIso: string | null = null;
    if (deadlineInput) {
      const d = new Date(deadlineInput);
      if (Number.isNaN(d.getTime())) {
        setError("Hạn voting không hợp lệ.");
        return;
      }
      if (d.getTime() <= Date.now()) {
        setError("Hạn voting phải ở tương lai.");
        return;
      }
      deadlineIso = d.toISOString();
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.teams.poll.create(teamId, selected, deadlineIso);
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Không tạo được poll.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-2 border border-border-default rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-default">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">
              Mở voting mẫu áo
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-5 py-3 border-b border-border-default text-[11px] text-text-muted">
          Chọn {MIN_CANDIDATES}-{MAX_CANDIDATES} mẫu áo làm ứng cử. Members sẽ vote
          mẫu họ thích, captain bấm "Chốt mẫu thắng" để cả team pick size trên mẫu
          thắng (hoặc đợi tới hạn để tự chốt).
        </div>

        <div className="px-5 py-3 border-b border-border-default flex flex-col gap-1.5">
          <label className="text-[11px] uppercase font-bold tracking-wider text-text-muted flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Hạn chốt voting (tự chốt mẫu nhiều vote nhất)
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {DEADLINE_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.label}
                onClick={() => setDeadlinePreset(preset.hours)}
                className="text-[11px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border border-border-default bg-surface-3 text-text-secondary hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/40"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="datetime-local"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              className="bg-surface-3 border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            />
            {deadlineInput ? (
              <button
                type="button"
                onClick={() => setDeadlineInput("")}
                className="text-[11px] text-text-muted hover:text-text-primary underline"
              >
                Bỏ deadline (chốt tay)
              </button>
            ) : null}
          </div>
          <p className="text-[10px] text-text-muted">
            Đến hạn, mẫu nhiều vote nhất tự thắng (tie-break theo thứ tự ứng cử).
            Cần ≥1 vote; nếu không, captain phải chốt tay.
          </p>
        </div>

        {shops.length > 1 ? (
          <div className="px-5 py-3 border-b border-border-default flex gap-1.5 overflow-x-auto">
            <ShopChip
              label="Tất cả shop"
              active={shopFilter === ALL_SHOPS}
              onClick={() => setShopFilter(ALL_SHOPS)}
            />
            {shops.map((shop) => (
              <ShopChip
                key={shop.id}
                label={shop.name}
                active={shopFilter === shop.id}
                onClick={() => setShopFilter(shop.id)}
              />
            ))}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {filteredJerseys.length === 0 ? (
            <div className="text-xs text-text-muted bg-surface-3 border border-dashed border-border-default rounded-lg px-3 py-6 text-center">
              Chưa có mẫu áo nào.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredJerseys.map((jersey) => {
                const isSelected = selected.includes(jersey.id);
                return (
                  <button
                    type="button"
                    key={jersey.id}
                    onClick={() => toggle(jersey.id)}
                    aria-pressed={isSelected}
                    className={`group bg-surface-3 rounded-xl overflow-hidden border-2 text-left transition-all hover:-translate-y-0.5 ${
                      isSelected
                        ? "border-yellow-400 ring-2 ring-yellow-400/30"
                        : "border-border-default hover:border-yellow-500/40"
                    }`}
                  >
                    <div className="aspect-[4/5] bg-surface-base relative">
                      <JerseyImage
                        src={jersey.imageUrl}
                        alt={jersey.name}
                        imgClassName="w-full h-full object-cover"
                        wrapperClassName="block w-full h-full"
                      />
                      {isSelected ? (
                        <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-black rounded-full p-1 z-10">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="text-xs font-black text-text-primary truncate">
                        {jersey.name}
                      </p>
                      <p className="text-[10px] text-text-muted truncate">
                        {shopMap.get(jersey.shopId)?.name ?? ""}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="px-5 py-4 border-t border-border-default flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-text-muted">
            Đã chọn{" "}
            <span className="font-black text-text-primary">
              {selected.length}/{MAX_CANDIDATES}
            </span>
          </p>
          <div className="flex items-center gap-2">
            {error ? (
              <span className="text-[11px] text-red-400">{error}</span>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="text-xs uppercase font-black px-3 py-2 rounded-lg bg-surface-3 text-text-secondary border border-border-default hover:bg-surface-2"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || selected.length < MIN_CANDIDATES}
              className="text-xs uppercase font-black px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Vote className="w-3.5 h-3.5" />
              )}
              Mở poll
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ShopChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 text-[11px] uppercase font-black tracking-wider px-3 py-1.5 rounded-full border whitespace-nowrap ${
        active
          ? "bg-yellow-500 text-black border-yellow-500"
          : "bg-surface-3 text-text-secondary border-border-default hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );
}
