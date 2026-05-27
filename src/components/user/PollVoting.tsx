import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Vote } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { ensureVoter, setVoterName } from "../../lib/voterToken";
import type { ShopJersey, TeamPoll } from "../../types";
import JerseyImage from "../common/JerseyImage";
import PollCountdown from "../common/PollCountdown";

interface Props {
  teamId: string;
  poll: TeamPoll;
  jerseyMap: Map<string, ShopJersey>;
  onVoted: (poll: TeamPoll) => void;
  onVoterNameChange?: (name: string) => void;
  onDeadlinePassed?: () => void;
}

export default function PollVoting({
  teamId,
  poll,
  jerseyMap,
  onVoted,
  onVoterNameChange,
  onDeadlinePassed,
}: Props) {
  const initialVoter = ensureVoter(teamId);
  const [name, setName] = useState<string>(initialVoter.name);
  const [busyCandidateId, setBusyCandidateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialVoter.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const sortedCandidates = useMemo(
    () =>
      [...poll.candidates].sort((a, b) => {
        if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
        return a.position - b.position;
      }),
    [poll.candidates],
  );

  const handleVote = async (candidateId: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Vui lòng nhập tên trước khi vote.");
      return;
    }
    setNameError(null);
    setError(null);
    setBusyCandidateId(candidateId);
    try {
      const stored = setVoterName(teamId, trimmed);
      const { poll: updated } = await api.teams.poll.vote(
        teamId,
        candidateId,
        trimmed,
        stored.token,
      );
      onVoted(updated);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Không vote được, thử lại nhé.",
      );
    } finally {
      setBusyCandidateId(null);
    }
  };

  return (
    <section className="bg-surface-2 border border-yellow-500/40 rounded-2xl p-5 flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <Vote className="w-4 h-4 text-yellow-400" />
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">
            Vote chọn mẫu áo cho cả team
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Bạn có thể đổi vote bất cứ lúc nào trước khi captain chốt.
          </p>
        </div>
      </header>

      {poll.deadlineAt ? (
        <PollCountdown
          deadlineIso={poll.deadlineAt}
          onExpired={onDeadlinePassed}
        />
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
          Tên của bạn <span className="text-red-400">*</span>
        </span>
        <input
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setName(v);
            if (nameError) setNameError(null);
            // Persist on every change so the pick form (same screen) picks it up.
            setVoterName(teamId, v.trim());
            onVoterNameChange?.(v.trim());
          }}
          placeholder="Tên thật hoặc bí danh"
          aria-invalid={!!nameError}
          className={`bg-surface-3 border rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ${
            nameError ? "border-red-500/60" : "border-border-default"
          }`}
        />
        {nameError ? (
          <span className="text-[11px] text-red-400">{nameError}</span>
        ) : null}
      </label>

      {error ? (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sortedCandidates.map((c) => {
          const jersey = jerseyMap.get(c.jerseyId);
          const isMyVote = poll.myVoteCandidateId === c.id;
          const isBusy = busyCandidateId === c.id;
          const pct =
            poll.totalVotes > 0
              ? Math.round((c.voteCount / poll.totalVotes) * 100)
              : 0;
          return (
            <button
              type="button"
              key={c.id}
              onClick={() => handleVote(c.id)}
              disabled={isBusy}
              aria-pressed={isMyVote}
              className={`group bg-surface-3 rounded-xl overflow-hidden border-2 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
                isMyVote
                  ? "border-yellow-400 ring-2 ring-yellow-400/40"
                  : "border-border-default hover:border-yellow-500/40"
              }`}
            >
              <div className="aspect-[4/5] bg-surface-base relative">
                {jersey ? (
                  <JerseyImage
                    src={jersey.imageUrl}
                    alt={jersey.name}
                    imgClassName="w-full h-full object-cover"
                    wrapperClassName="block w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                    {c.jerseyId}
                  </div>
                )}
                <span className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full z-10">
                  {c.voteCount} vote{c.voteCount === 1 ? "" : "s"} · {pct}%
                </span>
                {isMyVote ? (
                  <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-black rounded-full p-1 z-10">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </span>
                ) : null}
                {isBusy ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-300" />
                  </span>
                ) : null}
              </div>
              <div className="px-2.5 py-2">
                <p className="text-xs font-black text-text-primary truncate">
                  {jersey?.name ?? c.jerseyId}
                </p>
                <div className="h-1.5 bg-surface-base rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-text-muted text-center">
        Tổng: <span className="font-black text-text-primary">{poll.totalVotes}</span>{" "}
        vote
      </p>
    </section>
  );
}
