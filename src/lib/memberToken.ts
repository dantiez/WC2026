const KEY_PREFIX = "wc2026.member.";

export interface StoredMember {
  pickId: string;
  memberToken: string;
}

function readRaw(teamId: string): StoredMember[] {
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + teamId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as StoredMember[];
    // Migrate old single-object format → array
    if (parsed && typeof parsed === "object" && parsed.pickId && parsed.memberToken) {
      return [parsed as StoredMember];
    }
    return [];
  } catch {
    return [];
  }
}

function writeRaw(teamId: string, members: StoredMember[]): void {
  try {
    if (members.length === 0) {
      window.localStorage.removeItem(KEY_PREFIX + teamId);
    } else {
      window.localStorage.setItem(KEY_PREFIX + teamId, JSON.stringify(members));
    }
  } catch {
    // ignore
  }
}

export function getMembers(teamId: string): StoredMember[] {
  return readRaw(teamId);
}

export function addMember(teamId: string, member: StoredMember): void {
  const existing = readRaw(teamId);
  if (existing.some((m) => m.pickId === member.pickId)) return;
  writeRaw(teamId, [...existing, member]);
}

export function removeMember(teamId: string, pickId: string): void {
  const existing = readRaw(teamId);
  writeRaw(teamId, existing.filter((m) => m.pickId !== pickId));
}

export function findMemberToken(teamId: string, pickId: string): string | null {
  const members = readRaw(teamId);
  return members.find((m) => m.pickId === pickId)?.memberToken ?? null;
}
