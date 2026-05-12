import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("api() single-flight refresh", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("runs POST /auth/refresh once when three parallel calls first see 401", async () => {
    let refreshCalls = 0;
    let dataCalls = 0;

    globalThis.fetch = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

      if (url.includes("/auth/refresh")) {
        refreshCalls++;
        return Promise.resolve({
          ok: true,
          status: 200,
        } as Response);
      }

      if (url.includes("/data")) {
        dataCalls++;
        if (dataCalls <= 3) {
          return Promise.resolve({
            ok: false,
            status: 401,
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        status: 500,
      } as Response);
    });

    vi.resetModules();
    const { api } = await import("../lib/api");

    await Promise.all([api("/data"), api("/data"), api("/data")]);

    expect(refreshCalls).toBe(1);
    expect(dataCalls).toBe(6);
  });
});
