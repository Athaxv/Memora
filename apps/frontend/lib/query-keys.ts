export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
    stats: ["auth", "me", "stats"] as const,
    sessions: ["auth", "me", "sessions"] as const,
  },
  memories: {
    list: ["memories", "list"] as const,
    search: (q: string) => ["memories", "search", q] as const,
    graph: (search: string) => ["memories", "graph", search] as const,
    detail: (id: string) => ["memories", "detail", id] as const,
  },
  chat: {
    sessions: ["chat", "sessions"] as const,
  },
} as const;
