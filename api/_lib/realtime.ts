import Pusher from "pusher";

// Realtime fan-out via Pusher Channels. Works on Vercel serverless (each
// trigger is a plain HTTPS call) as well as the long-running Node host.
// Fully optional: if the PUSHER_* env vars are missing the helper no-ops,
// so the app keeps working on the polling fallback alone.

declare global {
  // eslint-disable-next-line no-var
  var __pusher: Pusher | null | undefined;
}

function getPusher(): Pusher | null {
  if (globalThis.__pusher !== undefined) return globalThis.__pusher;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    globalThis.__pusher = null; // remember it's disabled; don't warn every call
    return null;
  }

  globalThis.__pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return globalThis.__pusher;
}

/** Public channel name for a team. teamId is an opaque id, not a credential. */
export function teamChannel(teamId: string): string {
  return `team-${teamId}`;
}

export const TEAM_CHANGED = "team:changed";

/**
 * Notify everyone watching a team that its data changed (a pick/poll was
 * created, edited, deleted, or voted on). Clients respond by refetching.
 * Never throws — a realtime failure must not break the underlying write.
 */
export async function notifyTeam(
  teamId: string,
  reason: string = "",
): Promise<void> {
  const pusher = getPusher();
  if (!pusher) return;
  try {
    await pusher.trigger(teamChannel(teamId), TEAM_CHANGED, { reason });
  } catch (err) {
    console.error("[realtime] notifyTeam failed", err);
  }
}
