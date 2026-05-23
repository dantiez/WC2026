const KEY_PREFIX = "wc2026.member.";

interface StoredMember {
  pickId: string;
  memberToken: string;
}

export function saveMember(teamId: string, member: StoredMember): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + teamId, JSON.stringify(member));
  } catch {
    // ignore
  }
}

export function readMember(teamId: string): StoredMember | null {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + teamId);
    if (!raw) return null;
    return JSON.parse(raw) as StoredMember;
  } catch {
    return null;
  }
}

export function clearMember(teamId: string): void {
  try {
    window.localStorage.removeItem(KEY_PREFIX + teamId);
  } catch {
    // ignore
  }
}
