const KEY_PREFIX = "wc2026.voter.";

export interface StoredVoter {
  token: string;
  name: string;
}

function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const buf = new Uint32Array(28);
    window.crypto.getRandomValues(buf);
    let out = "";
    for (let i = 0; i < 28; i++) out += chars[buf[i] % chars.length];
    return out;
  }
  let out = "";
  for (let i = 0; i < 28; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getVoter(teamId: string): StoredVoter | null {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + teamId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.token === "string") {
      return {
        token: parsed.token,
        name: typeof parsed.name === "string" ? parsed.name : "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function ensureVoter(teamId: string): StoredVoter {
  const existing = getVoter(teamId);
  if (existing) return existing;
  const voter: StoredVoter = { token: generateToken(), name: "" };
  writeVoter(teamId, voter);
  return voter;
}

export function setVoterName(teamId: string, name: string): StoredVoter {
  const voter = ensureVoter(teamId);
  const updated = { ...voter, name };
  writeVoter(teamId, updated);
  return updated;
}

function writeVoter(teamId: string, voter: StoredVoter): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + teamId, JSON.stringify(voter));
  } catch {
    // ignore
  }
}

export function clearVoter(teamId: string): void {
  try {
    window.localStorage.removeItem(KEY_PREFIX + teamId);
  } catch {
    // ignore
  }
}
