import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Clipboard,
  Check,
  Trash2,
  Loader2,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "../lib/api";
import type { Product, TeamAggregate } from "../types";

export default function CaptainTeam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TeamAggregate | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [agg, prods] = await Promise.all([
        api.teams.aggregate(id),
        api.products.list(),
      ]);
      setData(agg);
      setProducts(prods);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const shareUrl = useMemo(() => {
    if (!data || typeof window === "undefined") return "";
    return `${window.location.origin}/t/${data.team.shareToken}`;
  }, [data]);

  const toggleLock = async () => {
    if (!data || !id) return;
    const next = data.team.status === "open" ? "locked" : "open";
    const updated = await api.teams.update(id, { status: next });
    setData({ ...data, team: updated });
  };

  const removePick = async (pickId: string) => {
    if (!id) return;
    if (!window.confirm("Xoá pick này?")) return;
    await api.teams.deletePick(id, pickId, null);
    await refresh();
  };

  const exportExcel = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const header = ["STT", "Tên", "Số áo", "Nickname", "Size", "Mẫu áo", "Màu nhấn"];
      const rows = data.picks.map((pick, i) => [
        i + 1,
        pick.memberName,
        pick.jerseyNumber ?? "",
        pick.nickname ?? "",
        pick.size,
        productMap.get(pick.jerseyId)?.name ?? pick.jerseyId,
        pick.accentColor ?? "",
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "DanhSachInAo");
      XLSX.writeFile(wb, `${data.team.name.replace(/\s+/g, "_")}_picks.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-base text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-base px-4">
        <div className="text-sm text-red-400">{error ?? "Không có dữ liệu"}</div>
      </main>
    );
  }

  const { team, picks, sizeBreakdown } = data;

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate("/captain")}
          className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </button>

        <header className="bg-surface-2 border border-border-default rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wide text-text-primary">
                {team.name}
              </h1>
              <p className="text-[11px] text-text-muted">
                {team.deadlineAt ? (
                  <>
                    <Clock className="w-3 h-3 inline mr-1" />
                    Hạn: {new Date(team.deadlineAt).toLocaleString("vi-VN")}
                  </>
                ) : (
                  "Không có hạn chốt"
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLock}
                className={`text-xs uppercase font-black px-3 py-2 rounded-lg flex items-center gap-1.5 border ${
                  team.status === "open"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20"
                    : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                }`}
              >
                {team.status === "open" ? (
                  <>
                    <Lock className="w-3.5 h-3.5" /> Chốt đơn
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> Mở lại
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={exportExcel}
                disabled={exporting || picks.length === 0}
                className="text-xs uppercase font-black px-3 py-2 rounded-lg flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {exporting ? "Đang xuất…" : "Xuất Excel"}
              </button>
            </div>
          </div>

          <div className="bg-surface-3 border border-border-default rounded-lg px-3 py-2 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-text-secondary truncate">{shareUrl}</span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="text-[11px] uppercase font-black px-2 py-1 rounded-md bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
              {copied ? "Đã copy" : "Copy link"}
            </button>
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Tổng pick" value={picks.length.toString()} />
          {(["S", "M", "L", "XL"] as const).map((size) => (
            <Stat key={size} label={`Size ${size}`} value={(sizeBreakdown[size] ?? 0).toString()} />
          ))}
        </section>

        {Object.keys(sizeBreakdown).length > 0 ? (
          <section className="bg-surface-2 border border-border-default rounded-2xl p-4">
            <h2 className="text-xs uppercase font-black tracking-wider text-text-muted mb-3">
              Phân bố size
            </h2>
            <div className="flex flex-col gap-2">
              {Object.entries(sizeBreakdown)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([size, count]) => {
                  const pct = picks.length ? Math.round((count / picks.length) * 100) : 0;
                  return (
                    <div key={size} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-black text-text-primary">{size}</span>
                      <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-text-muted font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        ) : null}

        <section className="bg-surface-2 border border-border-default rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border-default">
            <h2 className="text-xs uppercase font-black tracking-wider text-text-muted">
              Danh sách pick ({picks.length})
            </h2>
          </header>
          {picks.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Chưa có ai pick. Gửi link cho teammate để bắt đầu.
            </div>
          ) : (
            <ul className="divide-y divide-border-default">
              {picks.map((pick, idx) => {
                const product = productMap.get(pick.jerseyId);
                return (
                  <li
                    key={pick.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-mono text-text-muted w-6 text-right">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-text-primary truncate">
                          {pick.memberName}
                        </p>
                        <p className="text-[11px] text-text-muted truncate">
                          {product?.name ?? pick.jerseyId} · Size {pick.size}
                          {pick.jerseyNumber ? ` · #${pick.jerseyNumber}` : ""}
                          {pick.nickname ? ` · ${pick.nickname}` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePick(pick.id)}
                      aria-label={`Xoá pick của ${pick.memberName}`}
                      className="p-2 min-w-9 min-h-9 text-red-400 hover:text-white hover:bg-red-500 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-2 border border-border-default rounded-2xl p-3 text-center">
      <p className="text-[11px] uppercase tracking-wider text-text-muted font-bold">{label}</p>
      <p className="text-xl font-black text-text-primary mt-1">{value}</p>
    </div>
  );
}
