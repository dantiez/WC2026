import { useEffect, useRef } from "react";
import { subscribeTeam } from "../lib/realtime";

/**
 * Refetch team data the instant another member/captain changes a pick or poll.
 * Subscribes to the team's Pusher channel and calls `onChange` on every event.
 * No-ops when realtime is not configured — callers keep their polling fallback.
 *
 * `onChange` is read through a ref so the subscription isn't torn down and
 * rebuilt on every render just because the callback identity changed.
 */
export function useTeamRealtime(
  teamId: string | null | undefined,
  onChange: () => void,
): void {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!teamId) return;
    return subscribeTeam(teamId, () => cbRef.current());
  }, [teamId]);
}
