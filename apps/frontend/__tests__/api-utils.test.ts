import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/server's NextResponse
const mockJsonFn = vi.fn((data: unknown, init?: { status?: number }) => ({
  _body: data,
  _status: init?.status ?? 200,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      mockJsonFn(data, init),
  },
  NextRequest: vi.fn(),
}));

// Variable to control what auth() returns in each test
let mockSession: { user?: { id?: string } } | null = null;

vi.mock("../lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

import { jsonResponse, errorResponse, withAuth } from "../lib/api-utils";

describe("jsonResponse", () => {
  beforeEach(() => {
    mockJsonFn.mockClear();
  });

  it("returns JSON response with default 200 status", () => {
    const data = { id: 1, name: "Test" };
    const result = jsonResponse(data);
    expect(mockJsonFn).toHaveBeenCalledWith(data, { status: 200 });
    expect(result._body).toEqual(data);
    expect(result._status).toBe(200);
  });

  it("returns JSON response with custom status", () => {
    const data = { created: true };
    const result = jsonResponse(data, 201);
    expect(mockJsonFn).toHaveBeenCalledWith(data, { status: 201 });
    expect(result._status).toBe(201);
  });

  it("handles null data", () => {
    const result = jsonResponse(null);
    expect(mockJsonFn).toHaveBeenCalledWith(null, { status: 200 });
    expect(result._body).toBeNull();
  });

  it("handles array data", () => {
    const data = [1, 2, 3];
    const result = jsonResponse(data);
    expect(result._body).toEqual([1, 2, 3]);
  });

  it("handles empty object", () => {
    const result = jsonResponse({});
    expect(result._body).toEqual({});
  });
});

describe("errorResponse", () => {
  beforeEach(() => {
    mockJsonFn.mockClear();
  });

  it("returns error response with default 400 status", () => {
    const result = errorResponse("Bad request");
    expect(mockJsonFn).toHaveBeenCalledWith(
      { error: "Bad request" },
      { status: 400 }
    );
    expect(result._body).toEqual({ error: "Bad request" });
    expect(result._status).toBe(400);
  });

  it("returns error response with custom status", () => {
    const result = errorResponse("Not found", 404);
    expect(mockJsonFn).toHaveBeenCalledWith(
      { error: "Not found" },
      { status: 404 }
    );
    expect(result._status).toBe(404);
  });

  it("returns 401 for unauthorized errors", () => {
    const result = errorResponse("Unauthorized", 401);
    expect(result._body).toEqual({ error: "Unauthorized" });
    expect(result._status).toBe(401);
  });

  it("returns 500 for server errors", () => {
    const result = errorResponse("Internal server error", 500);
    expect(result._body).toEqual({ error: "Internal server error" });
    expect(result._status).toBe(500);
  });
});

describe("withAuth", () => {
  beforeEach(() => {
    mockJsonFn.mockClear();
    mockSession = null;
  });

  it("rejects unauthenticated requests (null session)", async () => {
    mockSession = null;

    const handler = vi.fn();
    const wrappedHandler = await withAuth(handler);
    const fakeReq = {} as any;
    const result = await wrappedHandler(fakeReq);

    expect(handler).not.toHaveBeenCalled();
    expect(result._body).toEqual({ error: "Unauthorized" });
    expect(result._status).toBe(401);
  });

  it("rejects when session has no user", async () => {
    mockSession = {};

    const handler = vi.fn();
    const wrappedHandler = await withAuth(handler);
    const fakeReq = {} as any;
    const result = await wrappedHandler(fakeReq);

    expect(handler).not.toHaveBeenCalled();
    expect(result._body).toEqual({ error: "Unauthorized" });
    expect(result._status).toBe(401);
  });

  it("rejects when session user has no id", async () => {
    mockSession = { user: {} };

    const handler = vi.fn();
    const wrappedHandler = await withAuth(handler);
    const fakeReq = {} as any;
    const result = await wrappedHandler(fakeReq);

    expect(handler).not.toHaveBeenCalled();
    expect(result._body).toEqual({ error: "Unauthorized" });
    expect(result._status).toBe(401);
  });

  it("calls handler with userId when authenticated", async () => {
    mockSession = { user: { id: "user-123" } };

    const expectedResponse = { _body: { ok: true }, _status: 200 };
    const handler = vi.fn().mockResolvedValue(expectedResponse);
    const wrappedHandler = await withAuth(handler);
    const fakeReq = { url: "http://localhost/test" } as any;
    const result = await wrappedHandler(fakeReq);

    expect(handler).toHaveBeenCalledWith("user-123", fakeReq);
    expect(result).toEqual(expectedResponse);
  });

  it("passes the correct userId from session", async () => {
    mockSession = { user: { id: "abc-def-789" } };

    const handler = vi.fn().mockResolvedValue({
      _body: { success: true },
      _status: 200,
    });
    const wrappedHandler = await withAuth(handler);
    const fakeReq = {} as any;
    await wrappedHandler(fakeReq);

    expect(handler).toHaveBeenCalledWith("abc-def-789", fakeReq);
  });

  it("passes the request object through to handler", async () => {
    mockSession = { user: { id: "user-1" } };

    const fakeReq = {
      url: "http://localhost/api/test",
      method: "POST",
    } as any;
    const handler = vi.fn().mockResolvedValue({
      _body: {},
      _status: 200,
    });
    const wrappedHandler = await withAuth(handler);
    await wrappedHandler(fakeReq);

    expect(handler.mock.calls[0][1]).toBe(fakeReq);
  });
});
