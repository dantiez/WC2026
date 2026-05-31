import Pusher from "pusher-js";

// Client-side realtime via Pusher Channels. Optional: when the VITE_PUSHER_*
// env vars are absent, subscribeTeam() is a no-op and the app falls back to
// polling. A single shared connection is reused across all subscriptions.

const KEY = import.meta.env.VITE_PUSHER_KEY as string | undefined;
const CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER as string | undefined;

const TEAM_CHANGED = "team:changed";

let client: Pusher | null | undefined;

function getClient(): Pusher | null {
  if (client !== undefined) return client;
  if (!KEY || !CLUSTER) {
    client = null;
    return null;
  }
  client = new Pusher(KEY, { cluster: CLUSTER });
  return client;
}

export function realtimeEnabled(): boolean {
  return Boolean(KEY && CLUSTER);
}

/**
 * Subscribe to a team's change events. `onChange` fires whenever a pick or
 * poll is created/edited/deleted/voted. Returns an unsubscribe function.
 */
export function subscribeTeam(teamId: string, onChange: () => void): () => void {
  const pusher = getClient();
  if (!pusher) return () => {};

  const channelName = `team-${teamId}`;
  const channel = pusher.subscribe(channelName);
  channel.bind(TEAM_CHANGED, onChange);

  return () => {
    channel.unbind(TEAM_CHANGED, onChange);
    // A given team is only watched by one mounted view at a time, so it's safe
    // to drop the whole channel on cleanup.
    pusher.unsubscribe(channelName);
  };
}
