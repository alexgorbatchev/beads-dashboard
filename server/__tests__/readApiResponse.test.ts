import { describe, expect, it } from "bun:test";

import { readApiResponse } from "../../src/lib/readApiResponse";

type ApiResponseProjects = { ok: boolean; projects: unknown[] };

describe("readApiResponse", () => {
  it("parses JSON API responses", async () => {
    const response = new Response(JSON.stringify({ ok: true, projects: [] }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status: 200,
    });

    const data = await readApiResponse<ApiResponseProjects>(response, "/api/projects");

    expect(data).toEqual({ ok: true, projects: [] });
  });

  it("throws a helpful error when the server returns HTML instead of JSON", async () => {
    const response = new Response("<!DOCTYPE html><html><body>Not JSON</body></html>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 404,
      statusText: "Not Found",
    });

    await expect(readApiResponse(response, "/api/settings/projects")).rejects.toThrow(
      "Received HTML instead of JSON from /api/settings/projects (HTTP 404 Not Found). This usually means the frontend reached the app server instead of the API. Start `bun dev:all` or set `VITE_API_BASE_URL` to the API origin.",
    );
  });
});
