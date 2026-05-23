import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
  Lock,
  Clock,
  Check,
  Pencil,
  Trash2,
  Shirt,
  AlertCircle,
} from "lucide-react";
import { api } from "../lib/api";
import { readMember, saveMember, clearMember } from "../lib/memberToken";
import type { Product, TeamPick, TeamSession } from "../types";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

export default function TeammatePicker() {
  const { shareToken = "" } = useParams<{ shareToken: string }>();
  const [team, setTeam] = useState<TeamSession | null>(null);
  const [picks, setPicks] = useState<TeamPick[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [memberName, setMemberName] = useState("");
  const [jerseyId, setJerseyId] = useState("");
  const [size, setSize] = useState<string>("M");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingPickId, setEditingPickId] = useState<string | null>(null);

  const stored = useMemo(() => (team ? readMember(team.id) : null), [team]);
  const myPick = useMemo(
    () => (stored ? picks.find((p) => p.id === stored.pickId) ?? null : null),
    [picks, stored],
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const refresh = useCallback(async () => {
    try {
      const [byToken, prods] = await Promise.all([
        api.teams.byToken(shareToken),
        api.products.list(),
      ]);
      setTeam(byToken.team);
      setPicks(byToken.picks);
      setProducts(prods);
      if (byToken.team.defaultProductId) {
        setJerseyId((prev) => prev || byToken.team.defaultProductId || "");
      } else if (prods.length > 0) {
        setJerseyId((prev) => prev || prods[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải team.");
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startEdit = (pick: TeamPick) => {
    setEditingPickId(pick.id);
    setMemberName(pick.memberName);
    setJerseyId(pick.jerseyId);
    setSize(pick.size);
    setJerseyNumber(pick.jerseyNumber ?? "");
    setNickname(pick.nickname ?? "");
    setAccentColor(pick.accentColor ?? "");
  };

  const resetForm = () => {
    setEditingPickId(null);
    setMemberName("");
    setJerseyNumber("");
    setNickname("");
    setAccentColor("");
    setSize("M");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (editingPickId && stored && stored.pickId === editingPickId) {
        await api.teams.updatePick(team.id, editingPickId, stored.memberToken, {
          memberName: memberName.trim(),
          jerseyId,
          size,
          jerseyNumber: jerseyNumber || null,
          nickname: nickname || null,
          accentColor: accentColor || null,
        });
      } else {
        const result = await api.teams.createPick(team.id, {
          memberName: memberName.trim(),
          jerseyId,
          size,
          jerseyNumber: jerseyNumber || null,
          nickname: nickname || null,
          accentColor: accentColor || null,
        });
        saveMember(team.id, {
          pickId: result.pick.id,
          memberToken: result.memberToken,
        });
      }
      resetForm();
      await refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Không lưu được pick.");
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = async () => {
    if (!team || !stored) return;
    if (!window.confirm("Rút lại pick của bạn?")) return;
    await api.teams.deletePick(team.id, stored.pickId, stored.memberToken);
    clearMember(team.id);
    resetForm();
    await refresh();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-base text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </main>
    );
  }
  if (error || !team) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-base px-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-4 py-3 text-sm">
          {error ?? "Không có dữ liệu"}
        </div>
      </main>
    );
  }

  const locked = team.status === "locked";

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <header className="bg-surface-2 border border-border-default rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-wider text-text-muted font-bold mb-1">
            Đợt đặt áo
          </p>
          <h1 className="text-xl font-black uppercase tracking-wide text-text-primary">
            {team.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]">
            {team.deadlineAt ? (
              <span className="flex items-center gap-1 text-text-muted">
                <Clock className="w-3 h-3" />
                Hạn: {new Date(team.deadlineAt).toLocaleString("vi-VN")}
              </span>
            ) : null}
            {locked ? (
              <span className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 font-bold uppercase">
                <Lock className="w-3 h-3" /> Đã chốt
              </span>
            ) : (
              <span className="bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold uppercase">
                Đang mở
              </span>
            )}
          </div>
        </header>

        {locked ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            Captain đã chốt đơn. Bạn không thể chỉnh sửa pick nữa. Liên hệ captain nếu cần thay đổi.
          </div>
        ) : null}

        {myPick ? (
          <section className="bg-surface-2 border border-yellow-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-yellow-400 font-bold mb-1">
                  Pick của bạn
                </p>
                <p className="font-black text-text-primary">
                  {myPick.memberName} · Size {myPick.size}
                </p>
                <p className="text-[11px] text-text-muted">
                  {productMap.get(myPick.jerseyId)?.name ?? myPick.jerseyId}
                  {myPick.jerseyNumber ? ` · #${myPick.jerseyNumber}` : ""}
                  {myPick.nickname ? ` · ${myPick.nickname}` : ""}
                </p>
              </div>
              {!locked ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(myPick)}
                    className="text-xs uppercase font-black px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1.5 hover:bg-yellow-500/20"
                  >
                    <Pencil className="w-3 h-3" /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={withdraw}
                    className="text-xs uppercase font-black px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" /> Rút lại
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {!locked && (!myPick || editingPickId) ? (
          <form
            onSubmit={submit}
            className="bg-surface-2 border border-border-default rounded-2xl p-5 flex flex-col gap-4"
          >
            <h2 className="text-sm font-black uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Shirt className="w-4 h-4 text-yellow-400" />
              {editingPickId ? "Sửa pick" : "Pick áo của bạn"}
            </h2>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                Tên (bắt buộc)
              </span>
              <input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                required
                placeholder="Tên thật hoặc bí danh"
                className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                Mẫu áo
              </span>
              <select
                value={jerseyId}
                onChange={(e) => setJerseyId(e.target.value)}
                required
                className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                  Size
                </span>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                  Số áo (tuỳ chọn)
                </span>
                <input
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  inputMode="numeric"
                  placeholder="VD: 10"
                  className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                Nickname in lưng (tuỳ chọn)
              </span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="VD: TIEN LINH"
                className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                Màu nhấn (tuỳ chọn)
              </span>
              <input
                type="color"
                value={accentColor || "#ffd700"}
                onChange={(e) => setAccentColor(e.target.value)}
                className="bg-surface-3 border border-border-default rounded-lg h-10 w-20 cursor-pointer"
              />
            </label>

            {submitError ? (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {submitError}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-black uppercase text-sm rounded-lg py-3 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingPickId ? "Lưu" : "Gửi pick"}
              </button>
              {editingPickId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs uppercase font-black px-4 py-3 rounded-lg bg-surface-3 text-text-muted hover:bg-surface-4"
                >
                  Huỷ
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        <section className="bg-surface-2 border border-border-default rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border-default flex items-center justify-between">
            <h2 className="text-xs uppercase font-black tracking-wider text-text-muted">
              Đã pick ({picks.length})
            </h2>
          </header>
          {picks.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Chưa ai pick. Bạn là người đầu tiên.
            </div>
          ) : (
            <ul className="divide-y divide-border-default">
              {picks.map((pick, idx) => (
                <li key={pick.id} className="px-4 py-3 text-sm">
                  <span className="text-[11px] font-mono text-text-muted mr-2">
                    {idx + 1}
                  </span>
                  <span className="font-black text-text-primary">{pick.memberName}</span>
                  <span className="text-text-muted">
                    {" "}· {productMap.get(pick.jerseyId)?.name?.split(" ")[0] ?? "—"} · Size{" "}
                    {pick.size}
                    {pick.jerseyNumber ? ` · #${pick.jerseyNumber}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
