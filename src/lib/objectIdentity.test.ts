import { describe, expect, it } from "vitest";
import { createObjectRedirects, objectIdentities, validateObjectIdentities } from "./objectIdentity";
import worker from "../../worker";

const [fibonacci, prime] = objectIdentities;

describe("object identity and permanent redirects", () => {
  it("rejects non-v7 UUIDs and duplicate UUIDs", () => {
    expect(() => validateObjectIdentities([{ ...fibonacci, id: "fibonacci" }])).toThrow(/UUIDv7/);
    expect(() => validateObjectIdentities([fibonacci, fibonacci])).toThrow(/UUIDv7/);
  });

  it("rejects duplicate, unsafe, and retired slugs even on another object", () => {
    for (const slug of ["../escape", "", "Upper", fibonacci.slug]) {
      expect(() => validateObjectIdentities([fibonacci, { ...prime, slug }])).toThrow(/slug/);
    }
    expect(() => validateObjectIdentities([
      { ...fibonacci, slug: "fibonacci-numbers", previousSlugs: ["fibonacci"] },
      { ...prime, slug: "fibonacci" },
    ])).toThrow(/previously used/);
    expect(() => validateObjectIdentities([{ ...fibonacci, previousSlugs: [fibonacci.slug] }])).toThrow(/slug/);
  });

  it("redirects every old slug directly to the current page without chains", () => {
    const redirects = createObjectRedirects([{
      ...fibonacci, slug: "new-name", previousSlugs: ["fibonacci", "old-name"],
    }]);
    expect(redirects[`/id/${fibonacci.id}/`]).toBe("/numbers/new-name/");
    expect(redirects["/numbers/fibonacci/"]).toBe("/numbers/new-name/");
    expect(redirects["/numbers/old-name/"]).toBe("/numbers/new-name/");
    expect(redirects["/objects/old-name/functions.mjs"]).toBe(`/objects/${fibonacci.id}/functions.mjs`);
  });

  it.each(["GET", "HEAD"])("serves HTTP 301 with query preservation for %s", async (method) => {
    const response = await worker.fetch(new Request(`https://example.test/id/${fibonacci.id}/?source=paper`, { method }), {
      ASSETS: { fetch: async () => { throw new Error("Redirect must not request assets"); } },
    });
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("https://example.test/numbers/fibonacci/?source=paper");
  });

  it("keeps old data and module URLs usable through HTTP redirects", async () => {
    for (const suffix of ["functions.js", "functions.mjs", "data/digest.json", "data/standard.json"]) {
      const response = await worker.fetch(new Request(`https://example.test/objects/fibonacci/${suffix}`), {
        ASSETS: { fetch: async () => { throw new Error("Redirect must not request assets"); } },
      });
      expect(response.status).toBe(301);
      expect(response.headers.get("Location")).toBe(`https://example.test/objects/${fibonacci.id}/${suffix}`);
    }
  });

  it("passes current pages, unknown IDs, and non-read requests to assets", async () => {
    const asset = new Response("asset", { status: 404 });
    for (const path of ["/numbers/fibonacci/", "/id/unknown/"]) {
      expect(await worker.fetch(new Request(`https://example.test${path}`), {
        ASSETS: { fetch: async () => asset },
      })).toBe(asset);
    }
    expect(await worker.fetch(new Request(`https://example.test/id/${fibonacci.id}/`, { method: "POST" }), {
      ASSETS: { fetch: async () => asset },
    })).toBe(asset);
  });
});
