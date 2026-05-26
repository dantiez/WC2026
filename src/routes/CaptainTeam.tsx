import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Pencil,
  X,
  Vote,
  Crown,
  Trophy,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import type {
  Shop,
  ShopJersey,
  TeamAggregate,
  TeamPick,
  TeamPoll,
  TeamPollCandidate,
} from "../types";
import PollSetupModal from "../components/admin/PollSetupModal";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;

interface PickEditState {
  memberName: string;
  jerseyId: string;
  size: string;
  jerseyNumber: string;
  nickname: string;
}

function toEditState(pick: TeamPick): PickEditState {
  return {
    memberName: pick.memberName,
    jerseyId: pick.jerseyId,
    size: pick.size,
    jerseyNumber: pick.jerseyNumber ?? "",
    nickname: pick.nickname ?? "",
  };
}

export default function CaptainTeam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TeamAggregate | null>(null);
  const [jerseys, setJerseys] = useState<ShopJersey[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingPickId, setEditingPickId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PickEditState | null>(null);
  const [savingPickId, setSavingPickId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [showPollSetup, setShowPollSetup] = useState(false);
  const [pendingWinnerId, setPendingWinnerId] = useState<string | null>(null);
  const [pollBusy, setPollBusy] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [agg, jerseyList, shopList] = await Promise.all([
        api.teams.aggregate(id),
        api.jerseys.list({ isAdmin: true }),
        api.shops.list(),
      ]);
      setData(agg);
      setJerseys(jerseyList);
      setShops(shopList);
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

  const jerseyMap = useMemo(
    () => new Map(jerseys.map((j) => [j.id, j])),
    [jerseys],
  );
  const shopMap = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);

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

  const startEdit = (pick: TeamPick) => {
    setRowError(null);
    setEditingPickId(pick.id);
    setEditDraft(toEditState(pick));
  };

  const cancelEdit = () => {
    setEditingPickId(null);
    setEditDraft(null);
    setRowError(null);
  };

  const saveEdit = async (pickId: string) => {
    if (!id || !editDraft) return;
    setRowError(null);

    const missing: string[] = [];
    if (!editDraft.memberName.trim()) missing.push("tên");
    if (!editDraft.jerseyId) missing.push("mẫu áo");
    if (!editDraft.size) missing.push("size");
    if (!editDraft.jerseyNumber.trim()) missing.push("số áo");
    if (missing.length > 0) {
      setRowError(`Vui lòng nhập đủ: ${missing.join(", ")}.`);
      return;
    }

    setSavingPickId(pickId);
    try {
      await api.teams.updatePick(id, pickId, null, {
        memberName: editDraft.memberName.trim(),
        jerseyId: editDraft.jerseyId,
        size: editDraft.size,
        jerseyNumber: editDraft.jerseyNumber.trim(),
        nickname: editDraft.nickname.trim() || null,
      });
      setEditingPickId(null);
      setEditDraft(null);
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const messages = Object.values(err.fieldErrors).join(" ");
        setRowError(messages || err.message);
      } else {
        setRowError(err instanceof Error ? err.message : "Không lưu được.");
      }
    } finally {
      setSavingPickId(null);
    }
  };

  const removePick = async (pick: TeamPick) => {
    if (!id) return;
    if (!window.confirm(`Xoá pick của "${pick.memberName}"?`)) return;
    await api.teams.deletePick(id, pick.id, null);
    if (editingPickId === pick.id) cancelEdit();
    await refresh();
  };

  const exportExcel = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const { exportPicksToExcel } = await import("../lib/excelExport");
      await exportPicksToExcel({
        team: data.team,
        picks: data.picks,
        jerseyMap,
        shopMap,
      });
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

  const { team, picks, sizeBreakdown, poll } = data;
  const winnerJersey = poll?.winnerJerseyId
    ? jerseyMap.get(poll.winnerJerseyId)
    : null;

  const finalizePoll = async () => {
    if (!id || !pendingWinnerId) return;
    if (!window.confirm("Sau khi chốt, toàn bộ team sẽ pick size/số trên mẫu này. Xác nhận?")) {
      return;
    }
    setPollBusy(true);
    setPollError(null);
    try {
      await api.teams.poll.finalize(id, pendingWinnerId);
      setPendingWinnerId(null);
      await refresh();
    } catch (err) {
      setPollError(err instanceof Error ? err.message : "Không chốt được.");
    } finally {
      setPollBusy(false);
    }
  };

  const reopenPoll = async () => {
    if (!id) return;
    if (!window.confirm("Xoá poll và mở lại voting? Tất cả votes sẽ mất.")) return;
    setPollBusy(true);
    setPollError(null);
    try {
      await api.teams.poll.remove(id);
      setPendingWinnerId(null);
      await refresh();
    } catch (err) {
      setPollError(err instanceof Error ? err.message : "Không xoá được poll.");
    } finally {
      setPollBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
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

        <PollSection
          teamId={team.id}
          poll={poll}
          jerseyMap={jerseyMap}
          winnerJersey={winnerJersey ?? null}
          pendingWinnerId={pendingWinnerId}
          onChangePendingWinner={setPendingWinnerId}
          onOpenSetup={() => setShowPollSetup(true)}
          onFinalize={finalizePoll}
          onReopen={reopenPoll}
          busy={pollBusy}
          error={pollError}
        />

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
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-3 text-text-muted uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2 text-left w-10">#</th>
                    <th className="px-3 py-2 text-left">Tên</th>
                    <th className="px-3 py-2 text-left">Mẫu áo</th>
                    <th className="px-3 py-2 text-left w-20">Size</th>
                    <th className="px-3 py-2 text-left w-20">Số</th>
                    <th className="px-3 py-2 text-left">Nickname</th>
                    <th className="px-3 py-2 text-right w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {picks.map((pick, idx) => {
                    const isEditing = editingPickId === pick.id && editDraft !== null;
                    const isSaving = savingPickId === pick.id;
                    const jersey = jerseyMap.get(pick.jerseyId);
                    if (isEditing && editDraft) {
                      return (
                        <tr key={pick.id} className="bg-yellow-500/5 align-middle">
                          <td className="px-3 py-2 font-mono text-text-muted">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              value={editDraft.memberName}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, memberName: e.target.value })
                              }
                              className="bg-surface-3 border border-border-default rounded px-2 py-1 w-full text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editDraft.jerseyId}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, jerseyId: e.target.value })
                              }
                              className="bg-surface-3 border border-border-default rounded px-2 py-1 w-full text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400 max-w-[180px]"
                            >
                              {jerseys.map((j) => {
                                const shopName = shopMap.get(j.shopId)?.name;
                                return (
                                  <option key={j.id} value={j.id}>
                                    {j.name}
                                    {shopName ? ` — ${shopName}` : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={editDraft.size}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, size: e.target.value })
                              }
                              className="bg-surface-3 border border-border-default rounded px-2 py-1 w-full text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400"
                            >
                              {SIZES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={editDraft.jerseyNumber}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, jerseyNumber: e.target.value })
                              }
                              inputMode="numeric"
                              className="bg-surface-3 border border-border-default rounded px-2 py-1 w-full text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={editDraft.nickname}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, nickname: e.target.value })
                              }
                              className="bg-surface-3 border border-border-default rounded px-2 py-1 w-full text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-yellow-400"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => saveEdit(pick.id)}
                                disabled={isSaving}
                                aria-label="Lưu"
                                className="p-1.5 min-w-8 min-h-8 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-md transition-colors disabled:opacity-50"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                aria-label="Huỷ"
                                className="p-1.5 min-w-8 min-h-8 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-md transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {rowError ? (
                              <p className="text-[10px] text-red-400 mt-1 text-right">{rowError}</p>
                            ) : null}
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={pick.id} className="hover:bg-surface-3/40 align-middle">
                        <td className="px-3 py-2 font-mono text-text-muted">{idx + 1}</td>
                        <td className="px-3 py-2 font-black text-text-primary">
                          {pick.memberName}
                        </td>
                        <td className="px-3 py-2 text-text-secondary truncate max-w-[200px]">
                          {jersey?.name ?? pick.jerseyId}
                        </td>
                        <td className="px-3 py-2 text-text-secondary font-mono">{pick.size}</td>
                        <td className="px-3 py-2 text-text-secondary font-mono">
                          {pick.jerseyNumber ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-text-secondary truncate max-w-[160px]">
                          {pick.nickname ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(pick)}
                              aria-label={`Sửa pick của ${pick.memberName}`}
                              className="p-1.5 min-w-8 min-h-8 text-yellow-400 hover:bg-yellow-500 hover:text-black rounded-md transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removePick(pick)}
                              aria-label={`Xoá pick của ${pick.memberName}`}
                              className="p-1.5 min-w-8 min-h-8 text-red-400 hover:bg-red-500 hover:text-white rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showPollSetup && id ? (
        <PollSetupModal
          teamId={id}
          jerseys={jerseys}
          shops={shops}
          onClose={() => setShowPollSetup(false)}
          onCreated={() => {
            setShowPollSetup(false);
            refresh();
          }}
        />
      ) : null}
    </main>
  );
}

function PollSection({
  teamId: _teamId,
  poll,
  jerseyMap,
  winnerJersey,
  pendingWinnerId,
  onChangePendingWinner,
  onOpenSetup,
  onFinalize,
  onReopen,
  busy,
  error,
}: {
  teamId: string;
  poll: TeamPoll | null;
  jerseyMap: Map<string, ShopJersey>;
  winnerJersey: ShopJersey | null;
  pendingWinnerId: string | null;
  onChangePendingWinner: (id: string | null) => void;
  onOpenSetup: () => void;
  onFinalize: () => void;
  onReopen: () => void;
  busy: boolean;
  error: string | null;
}) {
  if (!poll) {
    return (
      <section className="bg-surface-2 border border-border-default rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Vote className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">
            Voting mẫu áo
          </h2>
        </div>
        <p className="text-[12px] text-text-muted">
          Mỗi người trong team thích 1 mẫu áo khác nhau? Mở poll để cả team vote
          chọn 1 mẫu chung, sau đó pick size/số trên mẫu thắng.
        </p>
        <button
          type="button"
          onClick={onOpenSetup}
          className="text-xs uppercase font-black px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black w-fit flex items-center gap-1.5"
        >
          <Vote className="w-3.5 h-3.5" /> Mở voting chọn mẫu áo
        </button>
      </section>
    );
  }

  if (poll.winnerJerseyId) {
    return (
      <section className="bg-surface-2 border border-green-500/40 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-green-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-green-400">
            Đã chốt mẫu thắng
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-surface-3 border border-border-default rounded-lg p-3">
          {winnerJersey ? (
            <img
              src={winnerJersey.imageUrl}
              alt={winnerJersey.name}
              className="w-16 h-20 object-cover rounded-md"
              loading="lazy"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-text-primary truncate">
              {winnerJersey?.name ?? poll.winnerJerseyId}
            </p>
            <p className="text-[11px] text-text-muted">
              {poll.totalVotes} vote · cả team đang pick size/số trên mẫu này.
            </p>
          </div>
        </div>
        {error ? (
          <p className="text-[11px] text-red-400">{error}</p>
        ) : null}
        <button
          type="button"
          onClick={onReopen}
          disabled={busy}
          className="text-xs uppercase font-black px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 w-fit flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          Mở lại voting (xoá poll)
        </button>
      </section>
    );
  }

  const sortedCandidates: TeamPollCandidate[] = [...poll.candidates].sort(
    (a, b) => {
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.position - b.position;
    },
  );
  const topCount = sortedCandidates[0]?.voteCount ?? 0;

  return (
    <section className="bg-surface-2 border border-yellow-500/40 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Vote className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">
            Voting đang diễn ra
          </h2>
          <span className="text-[11px] text-text-muted">
            · {poll.totalVotes} vote
          </span>
        </div>
        <button
          type="button"
          onClick={onReopen}
          disabled={busy}
          className="text-[11px] uppercase font-black px-2.5 py-1.5 rounded-md text-red-400 hover:bg-red-500/10 disabled:opacity-50"
        >
          Xoá poll
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {sortedCandidates.map((c) => {
          const jersey = jerseyMap.get(c.jerseyId);
          const pct =
            poll.totalVotes > 0
              ? Math.round((c.voteCount / poll.totalVotes) * 100)
              : 0;
          const isLeading = c.voteCount === topCount && topCount > 0;
          const isPending = pendingWinnerId === c.jerseyId;
          return (
            <li
              key={c.id}
              className={`bg-surface-3 border rounded-lg p-3 flex items-center gap-3 ${
                isPending
                  ? "border-yellow-400 ring-2 ring-yellow-400/30"
                  : "border-border-default"
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="radio"
                  name="poll-winner"
                  value={c.jerseyId}
                  checked={isPending}
                  onChange={() => onChangePendingWinner(c.jerseyId)}
                  className="accent-yellow-400"
                />
                {jersey ? (
                  <img
                    src={jersey.imageUrl}
                    alt={jersey.name}
                    className="w-12 h-16 object-cover rounded-md"
                    loading="lazy"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-text-primary truncate flex items-center gap-1.5">
                    {jersey?.name ?? c.jerseyId}
                    {isLeading ? (
                      <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    ) : null}
                  </p>
                  <div className="h-1.5 bg-surface-base rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {c.voters.length > 0 ? (
                    <p className="text-[10px] text-text-muted mt-1 truncate">
                      {c.voters.join(", ")}
                    </p>
                  ) : null}
                </div>
              </label>
              <div className="text-right font-mono text-text-secondary text-xs shrink-0">
                <div className="font-black text-text-primary text-base">
                  {c.voteCount}
                </div>
                <div className="text-[10px] text-text-muted">{pct}%</div>
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="text-[11px] text-red-400">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={onFinalize}
        disabled={!pendingWinnerId || busy}
        className="text-xs uppercase font-black px-3 py-2.5 rounded-lg bg-green-500 hover:bg-green-400 disabled:bg-green-500/30 disabled:cursor-not-allowed text-black flex items-center justify-center gap-1.5"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trophy className="w-3.5 h-3.5" />
        )}
        Chốt mẫu thắng
      </button>
    </section>
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
