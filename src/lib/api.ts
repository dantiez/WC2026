import type {
  Product,
  Shop,
  ShopJersey,
  TeamSession,
  TeamPick,
  TeamAggregate,
  TeamPoll,
} from "../types";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let fieldErrors: Record<string, string> | undefined;
    try {
      const data = (await res.json()) as {
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (data?.error) message = data.error;
      if (data?.fieldErrors) fieldErrors = data.fieldErrors;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status, fieldErrors);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  products: {
    list: () => request<Product[]>("/api/products"),
  },

  auth: {
    login: (email: string, password: string) =>
      request<{ email: string }>("/api/auth?action=login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request<{ ok: boolean }>("/api/auth?action=logout", { method: "POST" }),
    me: () =>
      request<{ authenticated: boolean; email?: string }>("/api/auth?action=me"),
  },

  teams: {
    listMine: () => request<TeamSession[]>("/api/teams"),
    create: (input: {
      name: string;
      defaultProductId?: string | null;
      deadlineAt?: string | null;
    }) =>
      request<TeamSession>("/api/teams", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    getById: (id: string) => request<TeamSession>(`/api/teams/${id}`),
    update: (
      id: string,
      input: Partial<{
        name: string;
        deadlineAt: string | null;
        status: "open" | "locked";
        defaultProductId: string | null;
      }>,
    ) =>
      request<TeamSession>(`/api/teams/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ ok: boolean }>(`/api/teams/${id}`, { method: "DELETE" }),
    byToken: (token: string, voterToken?: string | null) =>
      request<{ team: TeamSession; picks: TeamPick[]; poll: TeamPoll | null }>(
        `/api/teams/by-token?token=${encodeURIComponent(token)}`,
        voterToken ? { headers: { "X-Voter-Token": voterToken } } : undefined,
      ),
    aggregate: (id: string) => request<TeamAggregate>(`/api/teams/${id}/aggregate`),

    listPicks: (teamId: string) =>
      request<TeamPick[]>(`/api/teams/${teamId}/picks`),
    createPick: (
      teamId: string,
      input: {
        memberName: string;
        jerseyId: string;
        size: string;
        jerseyNumber?: string | null;
        nickname?: string | null;
      },
    ) =>
      request<{ pick: TeamPick; memberToken: string }>(
        `/api/teams/${teamId}/picks`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    updatePick: (
      teamId: string,
      pickId: string,
      memberToken: string | null,
      input: Partial<{
        memberName: string;
        jerseyId: string;
        size: string;
        jerseyNumber: string | null;
        nickname: string | null;
      }>,
    ) =>
      request<TeamPick>(`/api/teams/${teamId}/picks/${pickId}`, {
        method: "PUT",
        headers: memberToken ? { "X-Member-Token": memberToken } : undefined,
        body: JSON.stringify(input),
      }),
    deletePick: (teamId: string, pickId: string, memberToken: string | null) =>
      request<{ ok: boolean }>(`/api/teams/${teamId}/picks/${pickId}`, {
        method: "DELETE",
        headers: memberToken ? { "X-Member-Token": memberToken } : undefined,
      }),

    poll: {
      get: (teamId: string, voterToken?: string | null) =>
        request<{ poll: TeamPoll | null }>(`/api/teams/${teamId}/poll`, {
          headers: voterToken ? { "X-Voter-Token": voterToken } : undefined,
        }),
      create: (teamId: string, candidateJerseyIds: string[]) =>
        request<{ poll: TeamPoll }>(`/api/teams/${teamId}/poll`, {
          method: "POST",
          body: JSON.stringify({ candidateJerseyIds }),
        }),
      finalize: (teamId: string, winnerJerseyId: string) =>
        request<{ poll: TeamPoll }>(`/api/teams/${teamId}/poll`, {
          method: "PATCH",
          body: JSON.stringify({ winnerJerseyId }),
        }),
      remove: (teamId: string) =>
        request<{ ok: boolean }>(`/api/teams/${teamId}/poll`, {
          method: "DELETE",
        }),
      vote: (
        teamId: string,
        candidateId: string,
        voterName: string,
        voterToken: string,
      ) =>
        request<{ poll: TeamPoll; voterToken: string }>(
          `/api/teams/${teamId}/poll?action=vote`,
          {
            method: "POST",
            headers: { "X-Voter-Token": voterToken },
            body: JSON.stringify({ candidateId, voterName }),
          },
        ),
    },
  },

  shops: {
    list: () => request<Shop[]>("/api/shops"),
    create: (name: string) =>
      request<Shop>("/api/shops", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    update: (id: string, name: string) =>
      request<Shop>(`/api/shops/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      }),
    remove: (id: string) =>
      request<{ ok: boolean }>(`/api/shops/${id}`, { method: "DELETE" }),
  },

  jerseys: {
    list: (opts?: { shopId?: string; isAdmin?: boolean }) => {
      const params = new URLSearchParams();
      if (opts?.shopId) params.set("shopId", opts.shopId);
      if (opts?.isAdmin) params.set("isAdmin", "true");
      const qs = params.toString();
      return request<ShopJersey[]>(`/api/jerseys${qs ? `?${qs}` : ""}`);
    },
    create: (input: {
      shopId: string;
      name: string;
      imageUrl: string;
      isActive?: boolean;
    }) =>
      request<ShopJersey>("/api/jerseys", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (
      id: string,
      input: Partial<{
        shopId: string;
        name: string;
        imageUrl: string;
        isActive: boolean;
      }>,
    ) =>
      request<ShopJersey>(`/api/jerseys/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ ok: boolean; softDeleted?: boolean; jersey?: ShopJersey }>(
        `/api/jerseys/${id}`,
        { method: "DELETE" },
      ),
  },
};
