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
  Plus,
  CheckCircle2,
  X,
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
import type { Shop, ShopJersey, TeamPick, TeamPoll, TeamSession } from "../types";
import JerseyPreview from "../components/common/JerseyPreview";
import PollVoting from "../components/user/PollVoting";
import { Trophy } from "lucide-react";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;
const ALL_SHOPS = "__all__";

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
    jerseyId: pick.jerseyId,
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validateForm = (f: FormState): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!f.memberName.trim()) errs.memberName = "Vui lòng nhập tên của bạn.";
    if (!f.jerseyId) errs.jerseyId = "Vui lòng chọn mẫu áo.";
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

  const refresh = useCallback(async () => {
    try {
      const earlyTeam = await api.teams.byToken(shareToken);
      const voter = ensureVoter(earlyTeam.team.id);
      const [byToken, jerseyList, shopList] = await Promise.all([
        api.teams.byToken(shareToken, voter.token),
        api.jerseys.list(),
        api.shops.list(),
      ]);
      setTeam(byToken.team);
      setPicks(byToken.picks);
      setPoll(byToken.poll);
      setJerseys(jerseyList);
      setShops(shopList);
      setStoredMembers(getMembers(byToken.team.id));
      const winnerId = byToken.poll?.winnerJerseyId ?? null;
      const defaultJersey =
        winnerId || byToken.team.defaultProductId || jerseyList[0]?.id || "";
      setForm((prev) => {
        if (winnerId && prev.jerseyId !== winnerId) {
          return { ...prev, jerseyId: winnerId };
        }
        return prev.jerseyId ? prev : emptyForm(defaultJersey);
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

  const dismissSuccess = useCallback(() => {
    setSuccessMsg(null);
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(dismissSuccess, 5000);
    return () => clearTimeout(t);
  }, [successMsg, dismissSuccess]);

  const openNewForm = () => {
    if (!team) return;
    setEditingPickId(null);
    const defaultJersey =
      poll?.winnerJerseyId || team.defaultProductId || jerseys[0]?.id || "";
    setForm(emptyForm(defaultJersey));
    setSubmitError(null);
    setFieldErrors({});
    setShowForm(true);
    setSuccessMsg(null);
  };

  const startEdit = (pick: TeamPick) => {
    setEditingPickId(pick.id);
    setForm(pickToForm(pick));
    setSubmitError(null);
    setFieldErrors({});
    setShowForm(true);
    setSuccessMsg(null);
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

    const localErrs = validateForm(form);
    if (Object.keys(localErrs).length > 0) {
      setFieldErrors(localErrs);
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
        setSuccessMsg(`Đã cập nhật pick của ${form.memberName.trim()}.`);
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
        setSuccessMsg(
          `Pick thành công! ${form.memberName.trim()} đã được thêm vào danh sách.`,
        );
      }
      closeForm();
      await refresh();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
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
    setSuccessMsg(`Đã rút lại pick của ${pick.memberName}.`);
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
  const winnerJerseyId = poll?.winnerJerseyId ?? null;
  const inVoting = !!poll && !winnerJerseyId;
  const winnerJersey = winnerJerseyId ? jerseyMap.get(winnerJerseyId) : null;
  const selectedJersey = jerseyMap.get(form.jerseyId);

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
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

        {successMsg ? (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="flex-1">{successMsg}</p>
            <button
              type="button"
              onClick={dismissSuccess}
              aria-label="Đóng thông báo"
              className="text-green-400 hover:text-green-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        {locked ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-2xl px-4 py-3 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            Captain đã chốt đơn. Bạn không thể chỉnh sửa pick nữa. Liên hệ captain nếu cần thay đổi.
          </div>
        ) : null}

        {inVoting && poll ? (
          <PollVoting
            teamId={team.id}
            poll={poll}
            jerseyMap={jerseyMap}
            onVoted={(updated) => setPoll(updated)}
          />
        ) : null}

        {winnerJersey ? (
          <div className="bg-green-500/10 border border-green-500/40 text-green-300 rounded-2xl p-4 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-green-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider font-bold text-green-400">
                Mẫu áo đã chốt
              </p>
              <p className="text-sm font-black text-text-primary truncate">
                {winnerJersey.name}
              </p>
              <p className="text-[11px] text-text-muted">
                Cả team sẽ pick size/số trên mẫu này.
              </p>
            </div>
            <img
              src={winnerJersey.imageUrl}
              alt={winnerJersey.name}
              className="w-12 h-16 object-cover rounded-md shrink-0"
              loading="lazy"
            />
          </div>
        ) : null}

        {!inVoting && myPicks.length > 0 ? (
          <section className="bg-surface-2 border border-yellow-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <p className="text-[11px] uppercase tracking-wider text-yellow-400 font-bold">
                Pick của bạn ({myPicks.length})
              </p>
              {!locked ? (
                <button
                  type="button"
                  onClick={openNewForm}
                  className="text-xs uppercase font-black px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black flex items-center gap-1.5"
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
                      {jerseyMap.get(pick.jerseyId)?.name ?? pick.jerseyId}
                      {pick.jerseyNumber ? ` · #${pick.jerseyNumber}` : ""}
                      {pick.nickname ? ` · ${pick.nickname}` : ""}
                    </p>
                  </div>
                  {!locked ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(pick)}
                        className="text-[11px] uppercase font-black px-2.5 py-1.5 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => withdraw(pick)}
                        className="text-[11px] uppercase font-black px-2.5 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 flex items-center gap-1"
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

        {!inVoting && !locked && (showForm || myPicks.length === 0) ? (
          <form
            onSubmit={submit}
            className="bg-surface-2 border border-border-default rounded-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Shirt className="w-4 h-4 text-yellow-400" />
                {editingPickId ? "Sửa pick" : "Pick áo của bạn"}
              </h2>
              {myPicks.length > 0 && showForm ? (
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-text-muted hover:text-text-primary"
                  aria-label="Đóng form"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
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

            {winnerJersey ? (
              <div className="bg-surface-3 border border-green-500/40 rounded-lg px-3 py-2.5 flex items-center gap-3">
                <Trophy className="w-4 h-4 text-green-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-green-400 font-bold">
                    Mẫu đã chốt
                  </p>
                  <p className="text-sm font-black text-text-primary truncate">
                    {winnerJersey.name}
                  </p>
                </div>
                <img
                  src={winnerJersey.imageUrl}
                  alt={winnerJersey.name}
                  className="w-10 h-12 object-cover rounded-md shrink-0"
                  loading="lazy"
                />
              </div>
            ) : null}

            <div className={`flex flex-col gap-2 ${winnerJersey ? "hidden" : ""}`}>
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
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
                        className={`group bg-surface-3 rounded-xl overflow-hidden border-2 text-left transition-all hover:-translate-y-0.5 ${
                          isSelected
                            ? "border-yellow-400 ring-2 ring-yellow-400/30"
                            : "border-border-default hover:border-yellow-500/40"
                        }`}
                      >
                        <div className="aspect-[4/5] bg-surface-base relative">
                          <img
                            src={jersey.imageUrl}
                            alt={jersey.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          {isSelected ? (
                            <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-black rounded-full p-1">
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

            {selectedJersey ? (
              <JerseyPreview
                jerseyId={selectedJersey.id}
                imageUrl={selectedJersey.imageUrl}
                name={selectedJersey.name}
                subtitle={shopMap.get(selectedJersey.shopId)?.name}
                nickname={form.nickname}
                jerseyNumber={form.jerseyNumber}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                  Size <span className="text-red-400">*</span>
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

              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
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
                ) : null}
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
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

            <button
              type="submit"
              disabled={submitting}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-black uppercase text-sm rounded-lg py-3 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editingPickId ? "Lưu thay đổi" : "Gửi pick"}
            </button>
          </form>
        ) : null}

        {inVoting ? null : (
        <section className="bg-surface-2 border border-border-default rounded-2xl overflow-hidden">
          <header className="px-4 py-3 border-b border-border-default">
            <h2 className="text-xs uppercase font-black tracking-wider text-text-muted">
              Đã pick ({picks.length})
            </h2>
          </header>
          {picks.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Chưa ai pick. Bạn là người đầu tiên.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-3 text-text-muted uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">#</th>
                    <th className="px-3 py-2 text-left">Tên</th>
                    <th className="px-3 py-2 text-left">Mẫu áo</th>
                    <th className="px-3 py-2 text-left w-14">Size</th>
                    <th className="px-3 py-2 text-left w-14">Số</th>
                    <th className="px-3 py-2 text-left">Nickname</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {picks.map((pick, idx) => {
                    const jersey = jerseyMap.get(pick.jerseyId);
                    return (
                      <tr key={pick.id} className="hover:bg-surface-3/40">
                        <td className="px-3 py-2 font-mono text-text-muted">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-black text-text-primary">
                          {pick.memberName}
                        </td>
                        <td className="px-3 py-2 text-text-secondary truncate max-w-[200px]">
                          {jersey?.name ?? pick.jerseyId}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        )}
      </div>
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
