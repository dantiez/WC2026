import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Plus,
  X,
  FileSpreadsheet,
  Ruler,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import {
  addMember,
  findMemberToken,
  getMembers,
  removeMember,
  type StoredMember,
} from "../lib/memberToken";
import { ensureVoter } from "../lib/voterToken";
import { useTeamRealtime } from "../hooks/useTeamRealtime";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { haptic } from "../lib/haptics";
import { formatPickActivity } from "../lib/formatDate";
import type { Shop, ShopJersey, TeamPick, TeamPoll, TeamSession } from "../types";
import JerseyPreview from "../components/common/JerseyPreview";
import JerseyImage from "../components/common/JerseyImage";
import SizeGuideModal from "../components/common/SizeGuideModal";
import PollVoting from "../components/user/PollVoting";
import { Trophy, Vote } from "lucide-react";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;
const ALL_SHOPS = "__all__";

// Team photo backdrop for the member jersey-picking screen. A dark scrim keeps
// the content cards readable over the bright stadium shot.
const SCREEN_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(to bottom, rgba(7,7,11,0.86), rgba(7,7,11,0.94)), url('/images/team-bg.jpg')",
};

interface FormState {
  memberName: string;
  jerseyId: string;
  size: string;
  jerseyNumber: string;
  nickname: string;
}

function emptyForm(defaultJerseyId: string): FormState {
  return {
    memberName: "",
    jerseyId: defaultJerseyId,
    size: "",
    jerseyNumber: "",
    nickname: "",
  };
}

function pickToForm(pick: TeamPick): FormState {
  return {
    memberName: pick.memberName,
    jerseyId: pick.jerseyId ?? "",
    size: pick.size,
    jerseyNumber: pick.jerseyNumber ?? "",
    nickname: pick.nickname ?? "",
  };
}

export default function TeammatePicker() {
  const { shareToken = "" } = useParams<{ shareToken: string }>();
  const [team, setTeam] = useState<TeamSession | null>(null);
  const [picks, setPicks] = useState<TeamPick[]>([]);
  const [jerseys, setJerseys] = useState<ShopJersey[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [poll, setPoll] = useState<TeamPoll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopFilter, setShopFilter] = useState<string>(ALL_SHOPS);

  const [storedMembers, setStoredMembers] = useState<StoredMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPickId, setEditingPickId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(""));
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const FIELD_ORDER = ["memberName", "vote", "jerseyId", "size", "jerseyNumber"] as const;

  const scrollToFirstError = (errs: Record<string, string>) => {
    const firstKey = FIELD_ORDER.find((k) => errs[k]);
    if (!firstKey) return;
    // Search the whole document — during voting the memberName field lives
    // in <PollVoting> (above the pick form), not inside formRef.
    const target = document.querySelector<HTMLElement>(
      `[data-field="${firstKey}"]`,
    );
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = target.querySelector<HTMLElement>(
      "input, select, textarea, button",
    );
    focusable?.focus({ preventScroll: true });
  };

  // Celebratory burst when a pick lands — small, brand-coloured, quick.
  const celebrate = () => {
    haptic([10, 40, 10]);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#facc15", "#22c55e", "#ffffff"],
      disableForReducedMotion: true,
    });
  };

  const validateForm = (f: FormState, requireJersey: boolean): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!f.memberName.trim()) errs.memberName = "Vui lòng nhập tên của bạn.";
    if (requireJersey && !f.jerseyId) errs.jerseyId = "Vui lòng chọn mẫu áo.";
    if (!f.size) errs.size = "Vui lòng chọn size.";
    if (!f.jerseyNumber.trim()) errs.jerseyNumber = "Vui lòng nhập số áo.";
    return errs;
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const jerseyMap = useMemo(
    () => new Map(jerseys.map((j) => [j.id, j])),
    [jerseys],
  );
  const shopMap = useMemo(() => new Map(shops.map((s) => [s.id, s])), [shops]);

  const myPicks = useMemo(() => {
    const ids = new Set(storedMembers.map((m) => m.pickId));
    return picks.filter((p) => ids.has(p.id));
  }, [picks, storedMembers]);

  const filteredJerseys = useMemo(() => {
    if (shopFilter === ALL_SHOPS) return jerseys;
    return jerseys.filter((j) => j.shopId === shopFilter);
  }, [jerseys, shopFilter]);

  // Soft warning: surface the teammate who already took this number (jersey
  // numbers should be unique per team). Non-blocking — captain may allow dups.
  const numberConflict = useMemo(() => {
    const n = form.jerseyNumber.trim();
    if (!n) return null;
    const other = picks.find(
      (p) => p.id !== editingPickId && (p.jerseyNumber ?? "").trim() === n,
    );
    return other ? other.memberName : null;
  }, [form.jerseyNumber, picks, editingPickId]);

  // Client-side roll-up of the whole team's picks: total, per-size counts, and
  // how many are still waiting for the jersey to be decided (jerseyId null).
  const summary = useMemo(() => {
    const sizeCounts = new Map<string, number>();
    let waiting = 0;
    for (const p of picks) {
      if (p.size) sizeCounts.set(p.size, (sizeCounts.get(p.size) ?? 0) + 1);
      if (!p.jerseyId) waiting += 1;
    }
    const sizes = SIZES.filter((s) => sizeCounts.has(s)).map((s) => ({
      size: s,
      count: sizeCounts.get(s) as number,
    }));
    return { total: picks.length, sizes, waiting };
  }, [picks]);

  const refresh = useCallback(async () => {
    try {
      // shareToken is stable per team — use it as the voter localStorage key
      // so we can derive the voter token without an extra round-trip.
      const voter = ensureVoter(shareToken);
      // Single round-trip: by-token now returns picks + poll + jerseys + shops.
      const byToken = await api.teams.byToken(shareToken, voter.token);
      setTeam(byToken.team);
      setPicks(byToken.picks);
      setPoll(byToken.poll);
      setJerseys(byToken.jerseys);
      setShops(byToken.shops);
      setStoredMembers(getMembers(byToken.team.id));
      const winnerId = byToken.poll?.winnerJerseyId ?? null;
      const lockedId = winnerId ?? byToken.team.defaultProductId ?? null;
      const defaultJersey = lockedId || byToken.jerseys[0]?.id || "";
      const inVotingNow = !!byToken.poll && !winnerId;
      setForm((prev) => {
        let next = prev.jerseyId
          ? prev
          : emptyForm(defaultJersey);
        if (lockedId && next.jerseyId !== lockedId) {
          next = { ...next, jerseyId: lockedId };
        }
        // During voting the pick form's name field is hidden; sync from voter.
        if (inVotingNow && voter.name && !next.memberName) {
          next = { ...next, memberName: voter.name };
        }
        return next;
      });
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

  // Realtime: refetch the instant another member/captain changes a pick or
  // poll. Falls back to polling below when Pusher isn't configured.
  useTeamRealtime(team?.id, refresh);

  // Polling fallback so vote counts + winner state + others' picks stay in sync
  // even if the realtime socket drops. Pauses when tab is hidden; refetches on
  // focus. Realtime carries the fast path, so this can run on a relaxed cadence.
  useEffect(() => {
    if (!shareToken) return;
    const POLL_MS = 60_000;
    const interval = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    const onFocus = () => refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [shareToken, refresh]);

  const openNewForm = () => {
    if (!team) return;
    setEditingPickId(null);
    const defaultJersey =
      poll?.winnerJerseyId ?? team.defaultProductId ?? jerseys[0]?.id ?? "";
    const base = emptyForm(defaultJersey);
    // Prefill memberName from voter when voting (Tên field is hidden).
    const inVotingNow = !!poll && !poll.winnerJerseyId;
    if (inVotingNow) {
      const v = ensureVoter(shareToken);
      if (v.name) base.memberName = v.name;
    }
    setForm(base);
    setSubmitError(null);
    setFieldErrors({});
    setShowForm(true);
  };

  const startEdit = (pick: TeamPick) => {
    setEditingPickId(pick.id);
    setForm(pickToForm(pick));
    setSubmitError(null);
    setFieldErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPickId(null);
    setSubmitError(null);
    setFieldErrors({});
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setSubmitError(null);

    const localErrs: Record<string, string> = validateForm(form, !inVoting);
    if (inVoting && !poll?.myVoteCandidateId) {
      localErrs.vote = "Vui lòng vote 1 mẫu áo trước khi gửi pick.";
    }
    if (Object.keys(localErrs).length > 0) {
      setFieldErrors(localErrs);
      scrollToFirstError(localErrs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      if (editingPickId) {
        const token = findMemberToken(team.id, editingPickId);
        await api.teams.updatePick(team.id, editingPickId, token, {
          memberName: form.memberName.trim(),
          jerseyId: form.jerseyId,
          size: form.size,
          jerseyNumber: form.jerseyNumber.trim(),
          nickname: form.nickname || null,
        });
        haptic();
        toast.success(`Đã cập nhật pick của ${form.memberName.trim()}.`);
      } else {
        const result = await api.teams.createPick(team.id, {
          memberName: form.memberName.trim(),
          jerseyId: form.jerseyId,
          size: form.size,
          jerseyNumber: form.jerseyNumber.trim(),
          nickname: form.nickname || null,
        });
        addMember(team.id, {
          pickId: result.pick.id,
          memberToken: result.memberToken,
        });
        celebrate();
        toast.success(
          `Pick thành công! ${form.memberName.trim()} đã được thêm vào danh sách.`,
        );
      }
      closeForm();
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
        scrollToFirstError(err.fieldErrors);
      }
      setSubmitError(err instanceof Error ? err.message : "Không lưu được pick.");
    } finally {
      setSubmitting(false);
    }
  };

  const withdraw = async (pick: TeamPick) => {
    if (!team) return;
    if (!window.confirm(`Rút lại pick của "${pick.memberName}"?`)) return;
    const token = findMemberToken(team.id, pick.id);
    await api.teams.deletePick(team.id, pick.id, token);
    removeMember(team.id, pick.id);
    setStoredMembers(getMembers(team.id));
    if (editingPickId === pick.id) closeForm();
    haptic();
    toast.success(`Đã rút lại pick của ${pick.memberName}.`);
    await refresh();
  };

  const exportExcel = async () => {
    if (!team || picks.length === 0) return;
    setExporting(true);
    try {
      const { exportPicksToExcel } = await import("../lib/excelExport");
      await exportPicksToExcel({
        team,
        picks,
        jerseyMap,
        shopMap,
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <main
        className="min-h-screen bg-surface-base bg-cover bg-center bg-scroll sm:bg-fixed px-4 py-8"
        style={SCREEN_BG}
      >
        <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
          <div className="bg-surface-2 border border-border-default rounded-2xl p-5">
            <div className="h-3 w-20 bg-surface-3 rounded mb-3" />
            <div className="h-7 w-2/3 bg-surface-3 rounded" />
          </div>
          <div className="bg-surface-2 border border-border-default rounded-2xl p-5 flex flex-col gap-4">
            <div className="h-4 w-32 bg-surface-3 rounded" />
            <div className="h-10 bg-surface-3 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-surface-3 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-surface-3 rounded-lg" />
              <div className="h-10 bg-surface-3 rounded-lg" />
            </div>
          </div>
        </div>
      </main>
    );
  }
  if (error || !team) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-surface-base bg-cover bg-center bg-scroll sm:bg-fixed px-4"
        style={SCREEN_BG}
      >
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl px-4 py-3 text-sm">
          {error ?? "Không có dữ liệu"}
        </div>
      </main>
    );
  }

  const locked = team.status === "locked";
  const winnerJerseyId = poll?.winnerJerseyId ?? null;
  const inVoting = !!poll && !winnerJerseyId;
  const lockedJerseyId = winnerJerseyId ?? team.defaultProductId ?? null;
  const lockedJersey = lockedJerseyId ? jerseyMap.get(lockedJerseyId) : null;
  const noJerseyChosen = !inVoting && !lockedJerseyId;
  const selectedJersey = jerseyMap.get(form.jerseyId);

  return (
    <main
      className="min-h-screen bg-surface-base bg-cover bg-center bg-scroll sm:bg-fixed px-4 py-8"
      style={SCREEN_BG}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-up">
        <header className="bg-surface-2 border border-border-default rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mb-1">
            Đợt đặt áo
          </p>
          <h1 className="text-2xl font-display font-bold tracking-tight text-text-primary">
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

        {inVoting && poll && (myPicks.length === 0 || editingPickId !== null) ? (
          <PollVoting
            teamId={team.id}
            voterKey={shareToken}
            poll={poll}
            jerseyMap={jerseyMap}
            onVoted={(updated) => {
              setPoll(updated);
              if (fieldErrors.vote) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.vote;
                  return next;
                });
              }
            }}
            onVoterNameChange={(name) => {
              setForm((prev) => ({ ...prev, memberName: name }));
              setFieldErrors((prev) => {
                if (!prev.memberName) return prev;
                const next = { ...prev };
                delete next.memberName;
                return next;
              });
            }}
            onDeadlinePassed={() => {
              refresh();
            }}
            externalNameError={fieldErrors.memberName ?? null}
            externalVoteError={fieldErrors.vote ?? null}
          />
        ) : null}

        {winnerJerseyId && lockedJersey ? (
          <div className="bg-green-500/10 border border-green-500/40 text-green-300 rounded-2xl p-4 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-green-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider font-bold text-green-400">
                Mẫu áo đã chốt
              </p>
              <p className="text-sm font-black text-text-primary truncate">
                {lockedJersey.name}
              </p>
              <p className="text-[11px] text-text-muted">
                Cả team sẽ pick size/số trên mẫu này.
              </p>
            </div>
            <JerseyImage
              src={lockedJersey.imageUrl}
              alt={lockedJersey.name}
              imgClassName="w-12 h-16 object-cover rounded-md"
              wrapperClassName="shrink-0 inline-block"
              overlaySize="sm"
            />
          </div>
        ) : null}

        {noJerseyChosen ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            Captain chưa chọn mẫu áo cho team. Liên hệ captain để mở voting hoặc chọn mẫu mặc định trước khi pick.
          </div>
        ) : null}

        {myPicks.length > 0 ? (
          <section className="bg-surface-2 border border-yellow-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <p className="text-[11px] uppercase tracking-wider text-yellow-400 font-bold">
                Pick của bạn ({myPicks.length})
              </p>
              {!locked ? (
                <button
                  type="button"
                  onClick={openNewForm}
                  className="text-xs uppercase font-bold min-h-9 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 active:scale-95 transition-transform text-black flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Pick thêm áo
                </button>
              ) : null}
            </div>
            <ul className="flex flex-col gap-2">
              {myPicks.map((pick) => (
                <li
                  key={pick.id}
                  className="bg-surface-3 border border-border-default rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="min-w-0">
                    <p className="font-black text-sm text-text-primary truncate">
                      {pick.memberName} · Size {pick.size}
                    </p>
                    <p className="text-[11px] text-text-muted truncate">
                      {inVoting
                        ? "Đang chờ vote áo"
                        : pick.jerseyId
                          ? (jerseyMap.get(pick.jerseyId)?.name ?? pick.jerseyId)
                          : "Đang chờ vote áo"}
                      {pick.jerseyNumber ? ` · #${pick.jerseyNumber}` : ""}
                      {pick.nickname ? ` · ${pick.nickname}` : ""}
                    </p>
                    {(() => {
                      const a = formatPickActivity(pick.createdAt, pick.updatedAt);
                      return (
                        <p className="text-[10px] font-mono text-text-muted mt-0.5">
                          <span
                            className={
                              a.edited
                                ? "text-yellow-400 font-black"
                                : "font-bold"
                            }
                          >
                            {a.label}
                          </span>{" "}
                          {a.timestamp}
                        </p>
                      );
                    })()}
                  </div>
                  {!locked ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(pick)}
                        className="text-[11px] uppercase font-bold min-h-9 px-3 py-2 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 active:scale-95 transition-transform flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => withdraw(pick)}
                        className="text-[11px] uppercase font-bold min-h-9 px-3 py-2 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-95 transition-transform flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Rút lại
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!locked && !noJerseyChosen && (showForm || myPicks.length === 0) ? (
          <form
            ref={formRef}
            onSubmit={submit}
            className="bg-surface-2 border border-border-default rounded-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Shirt className="w-4 h-4 text-yellow-400" />
                {editingPickId ? "Sửa pick" : "Pick áo của bạn"}
              </h2>
            </div>

            {!inVoting ? (
              <label data-field="memberName" className="flex flex-col gap-1.5 scroll-mt-24">
                <span className="text-[11px] uppercase font-semibold tracking-wider text-text-muted">
                  Tên <span className="text-red-400">*</span>
                </span>
                <input
                  value={form.memberName}
                  onChange={(e) => updateField("memberName", e.target.value)}
                  placeholder="Tên thật hoặc bí danh"
                  aria-invalid={!!fieldErrors.memberName}
                  className={`bg-surface-3 border rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                    fieldErrors.memberName ? "border-red-500/60" : "border-border-default"
                  }`}
                />
                {fieldErrors.memberName ? (
                  <span className="text-[11px] text-red-400">{fieldErrors.memberName}</span>
                ) : null}
              </label>
            ) : form.memberName ? (
              <p className="text-[11px] text-text-muted">
                Pick áo cho:{" "}
                <span className="text-text-primary font-black">{form.memberName}</span>
                <span className="text-[10px]"> (lấy từ tên đã nhập ở phần Vote phía trên)</span>
              </p>
            ) : null}

            {inVoting ? (
              <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <Vote className="w-4 h-4 text-yellow-400 shrink-0" />
                <p className="text-[11px] text-yellow-200">
                  Mẫu áo sẽ được chốt sau khi voting kết thúc, tự áp dụng cho pick của bạn.
                </p>
              </div>
            ) : lockedJersey ? (
              <div className="bg-surface-3 border border-green-500/40 rounded-lg px-3 py-2.5 flex items-center gap-3">
                <Trophy className="w-4 h-4 text-green-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-green-400 font-bold">
                    {winnerJerseyId ? "Mẫu đã chốt" : "Mẫu áo của team"}
                  </p>
                  <p className="text-sm font-black text-text-primary truncate">
                    {lockedJersey.name}
                  </p>
                </div>
                <JerseyImage
                  src={lockedJersey.imageUrl}
                  alt={lockedJersey.name}
                  imgClassName="w-10 h-12 object-cover rounded-md"
                  wrapperClassName="shrink-0 inline-block"
                  overlaySize="sm"
                />
              </div>
            ) : null}

            <div
              data-field="jerseyId"
              className={`flex flex-col gap-2 scroll-mt-24 ${lockedJersey || inVoting ? "hidden" : ""}`}
            >
              <span className="text-[11px] uppercase font-semibold tracking-wider text-text-muted">
                Mẫu áo <span className="text-red-400">*</span>
              </span>

              {shops.length > 1 ? (
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
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

              {filteredJerseys.length === 0 ? (
                <div className="text-xs text-text-muted bg-surface-3 border border-dashed border-border-default rounded-lg px-3 py-4 text-center">
                  Chưa có mẫu áo nào{shopFilter !== ALL_SHOPS ? " trong shop này" : ""}.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredJerseys.map((jersey) => {
                    const isSelected = jersey.id === form.jerseyId;
                    return (
                      <button
                        type="button"
                        key={jersey.id}
                        onClick={() => updateField("jerseyId", jersey.id)}
                        aria-pressed={isSelected}
                        className={`group bg-surface-3 rounded-xl overflow-hidden border-2 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
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
              {fieldErrors.jerseyId ? (
                <span className="text-[11px] text-red-400">{fieldErrors.jerseyId}</span>
              ) : null}
            </div>

            {!inVoting && selectedJersey ? (
              <JerseyPreview
                jerseyId={selectedJersey.id}
                imageUrl={selectedJersey.imageUrl}
                name={selectedJersey.name}
                subtitle={shopMap.get(selectedJersey.shopId)?.name}
                playerName={form.memberName}
                nickname={form.nickname}
                teamName={team.name}
                jerseyNumber={form.jerseyNumber}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <label data-field="size" className="flex flex-col gap-1.5 scroll-mt-24">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[11px] uppercase font-semibold tracking-wider text-text-muted">
                    Size <span className="text-red-400">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="text-[10px] text-text-muted hover:text-yellow-400 flex items-center gap-1 underline decoration-dotted underline-offset-2"
                  >
                    <Ruler className="w-3 h-3" /> Bảng size
                  </button>
                </span>
                <select
                  value={form.size}
                  onChange={(e) => updateField("size", e.target.value)}
                  aria-invalid={!!fieldErrors.size}
                  className={`bg-surface-3 border rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                    fieldErrors.size ? "border-red-500/60" : "border-border-default"
                  }`}
                >
                  <option value="">— Chọn size —</option>
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldErrors.size ? (
                  <span className="text-[11px] text-red-400">{fieldErrors.size}</span>
                ) : null}
              </label>

              <label data-field="jerseyNumber" className="flex flex-col gap-1.5 scroll-mt-24">
                <span className="text-[11px] uppercase font-semibold tracking-wider text-text-muted">
                  Số áo <span className="text-red-400">*</span>
                </span>
                <input
                  value={form.jerseyNumber}
                  onChange={(e) => updateField("jerseyNumber", e.target.value)}
                  inputMode="numeric"
                  placeholder="VD: 10"
                  aria-invalid={!!fieldErrors.jerseyNumber}
                  className={`bg-surface-3 border rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                    fieldErrors.jerseyNumber ? "border-red-500/60" : "border-border-default"
                  }`}
                />
                {fieldErrors.jerseyNumber ? (
                  <span className="text-[11px] text-red-400">{fieldErrors.jerseyNumber}</span>
                ) : numberConflict ? (
                  <span className="text-[11px] text-amber-400 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    Số {form.jerseyNumber.trim()} đã được {numberConflict} chọn. Bạn vẫn có
                    thể tiếp tục nếu cố ý.
                  </span>
                ) : null}
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-semibold tracking-wider text-text-muted">
                Nickname in lưng (tuỳ chọn)
              </span>
              <input
                value={form.nickname}
                onChange={(e) => updateField("nickname", e.target.value)}
                placeholder="VD: TIEN LINH"
                className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              />
            </label>

            {submitError ? (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {submitError}
              </div>
            ) : null}

            <div className="flex items-center gap-2 sticky bottom-0 z-10 -mx-5 -mb-5 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-surface-2/95 backdrop-blur border-t border-border-default sm:static sm:mx-0 sm:mb-0 sm:p-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none">
              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="flex-1 min-h-12 bg-red-500 hover:bg-red-400 active:scale-[0.98] transition-transform disabled:opacity-60 text-white font-black uppercase text-sm rounded-lg py-3 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 min-h-12 bg-yellow-500 hover:bg-yellow-400 active:scale-[0.98] transition-transform disabled:opacity-60 text-black font-black uppercase text-sm rounded-lg py-3 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {editingPickId ? "Lưu thay đổi" : "Gửi pick"}
              </button>
            </div>
          </form>
        ) : null}

        {summary.total > 0 ? (
          <section className="bg-surface-2 border border-border-default rounded-2xl p-4">
            <p className="text-[11px] uppercase font-semibold tracking-wider text-text-muted mb-2">
              Tóm tắt
            </p>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="bg-surface-3 border border-border-default rounded-full px-3 py-1">
                Tổng <span className="font-black text-text-primary">{summary.total}</span> pick
              </span>
              {summary.sizes.map((s) => (
                <span
                  key={s.size}
                  className="bg-surface-3 border border-border-default rounded-full px-3 py-1 font-mono text-text-secondary"
                >
                  {s.size}×<span className="font-black text-text-primary">{s.count}</span>
                </span>
              ))}
              {summary.waiting > 0 ? (
                <span className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-full px-3 py-1 font-mono">
                  <span className="font-black">{summary.waiting}</span> đang chờ vote
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="bg-surface-2 border border-border-default rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border-default flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-text-muted">
              Đã pick ({picks.length})
            </h2>
            <button
              type="button"
              onClick={exportExcel}
              disabled={exporting || picks.length === 0}
              className="text-[11px] uppercase font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3 h-3" />
              )}
              {exporting ? "Đang xuất…" : "Xuất Excel"}
            </button>
          </header>
          {picks.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Chưa ai pick. Bạn là người đầu tiên.
            </div>
          ) : (
            <>
            {/* Mobile: card list (no awkward horizontal scroll) */}
            <ul className="sm:hidden divide-y divide-border-default">
              {picks.map((pick, idx) => {
                const jersey = pick.jerseyId ? jerseyMap.get(pick.jerseyId) : undefined;
                const a = formatPickActivity(pick.createdAt, pick.updatedAt);
                const jerseyLabel =
                  inVoting || !pick.jerseyId
                    ? null
                    : (jersey?.name ?? pick.jerseyId);
                return (
                  <li key={pick.id} className="px-4 py-3 flex items-start gap-3">
                    <span className="font-mono text-[11px] text-text-muted mt-0.5 w-5 shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sm text-text-primary truncate">
                        {pick.memberName}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="font-mono bg-surface-3 border border-border-default rounded px-1.5 py-0.5 text-text-secondary">
                          {pick.size}
                        </span>
                        <span className="font-mono bg-surface-3 border border-border-default rounded px-1.5 py-0.5 text-text-secondary">
                          #{pick.jerseyNumber ?? "—"}
                        </span>
                        {pick.nickname ? (
                          <span className="text-text-muted truncate">{pick.nickname}</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[11px] truncate">
                        {jerseyLabel ? (
                          <span className="text-text-secondary">{jerseyLabel}</span>
                        ) : (
                          <span className="text-yellow-400 italic">Đang chờ vote áo</span>
                        )}
                      </p>
                      <p className="text-[10px] font-mono text-text-muted mt-0.5">
                        <span className={a.edited ? "text-yellow-400 font-black" : "font-bold"}>
                          {a.label}
                        </span>{" "}
                        {a.timestamp}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* Desktop: full table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-3 text-text-muted uppercase font-semibold tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">#</th>
                    <th className="px-3 py-2 text-left">Tên</th>
                    <th className="px-3 py-2 text-left">Mẫu áo</th>
                    <th className="px-3 py-2 text-left w-14">Size</th>
                    <th className="px-3 py-2 text-left w-14">Số</th>
                    <th className="px-3 py-2 text-left">Nickname</th>
                    <th className="px-3 py-2 text-left w-40">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {picks.map((pick, idx) => {
                    const jersey = pick.jerseyId ? jerseyMap.get(pick.jerseyId) : undefined;
                    return (
                      <tr key={pick.id} className="hover:bg-surface-3/40">
                        <td className="px-3 py-2 font-mono text-text-muted">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-black text-text-primary">
                          {pick.memberName}
                        </td>
                        <td className="px-3 py-2 truncate max-w-[200px]">
                          {inVoting ? (
                            <span className="text-yellow-400 italic">Đang chờ vote áo</span>
                          ) : jersey ? (
                            <span className="text-text-secondary">{jersey.name}</span>
                          ) : pick.jerseyId ? (
                            <span className="text-text-muted">{pick.jerseyId}</span>
                          ) : (
                            <span className="text-yellow-400 italic">Đang chờ vote áo</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-text-secondary font-mono">
                          {pick.size}
                        </td>
                        <td className="px-3 py-2 text-text-secondary font-mono">
                          {pick.jerseyNumber ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-text-secondary truncate max-w-[160px]">
                          {pick.nickname ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          {(() => {
                            const a = formatPickActivity(pick.createdAt, pick.updatedAt);
                            return (
                              <div className="text-[10px] font-mono text-text-muted leading-tight">
                                <span
                                  className={
                                    a.edited
                                      ? "text-yellow-400 font-black"
                                      : "font-bold"
                                  }
                                >
                                  {a.label}
                                </span>{" "}
                                {a.timestamp}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>
      </div>

      {showSizeGuide ? (
        <SizeGuideModal onClose={() => setShowSizeGuide(false)} />
      ) : null}
    </main>
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
      className={`shrink-0 text-[11px] uppercase font-bold tracking-wider min-h-9 px-3 py-1.5 rounded-full border whitespace-nowrap active:scale-95 transition-transform ${
        active
          ? "bg-yellow-500 text-black border-yellow-500"
          : "bg-surface-3 text-text-secondary border-border-default hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );
}
