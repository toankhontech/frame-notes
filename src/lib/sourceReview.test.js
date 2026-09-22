import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fingerprint } from "./fingerprint.js";
import { parseSourceReview, compareSource } from "./sourceReview.js";
import { makeReview, markdown } from "./review.js";

test("chunked fingerprint matches independent SHA256 at empty, padding and chunk boundaries", async () => {
  for (const length of [0, 1, 55, 56, 63, 64, 65, 127, 128, 100003]) {
    const bytes = Uint8Array.from({ length }, (_, i) => i % 251);
    const actual = await fingerprint(new Blob([bytes]), () => {}, 64);
    assert.equal(
      actual.digest,
      createHash("sha256").update(bytes).digest("hex"),
    );
    assert.equal(actual.byteLength, length);
  }
});
test("same bytes under a different name match; a changed byte or trim does not", async () => {
  const original = await fingerprint(new File(["video data"], "a.mp4"));
  assert.equal(
    compareSource(
      original,
      await fingerprint(new File(["video data"], "renamed.mp4")),
    ),
    "match",
  );
  assert.equal(
    compareSource(
      original,
      await fingerprint(new File(["Video data"], "a.mp4")),
    ),
    "mismatch",
  );
  assert.equal(
    compareSource(original, await fingerprint(new Blob(["video"]))),
    "mismatch",
  );
});
test("export carries fingerprint through JSON and Markdown; parser accepts the exported shape", async () => {
  const fp = await fingerprint(new Blob(["abc"]));
  const review = makeReview({ name: "clip.mp4", fingerprint: fp }, []);
  assert.equal(review.schemaVersion, 2);
  assert.deepEqual(parseSourceReview(JSON.stringify(review)), {
    name: "clip.mp4",
    fingerprint: fp,
  });
  assert.ok(markdown(review).includes(fp.digest));
});
test("legacy reviews stay unverified, even with a familiar name", () => {
  const parsed = parseSourceReview(
    JSON.stringify({
      schemaVersion: 1,
      source: { name: "clip.mp4" },
      notes: [],
    }),
  );
  assert.equal(compareSource(parsed.fingerprint, null), "unverified");
});
test("invalid JSON, unsupported schemas and malformed fingerprints fail closed", () => {
  for (const value of [
    "{",
    "null",
    "[]",
    JSON.stringify({ schemaVersion: 3, source: { name: "a" }, notes: [] }),
  ]) {
    assert.throws(() => parseSourceReview(value));
  }
  const valid = {
    algorithm: "SHA-256",
    digest: "a".repeat(64),
    byteLength: 10,
  };
  for (const fp of [
    undefined,
    null,
    {},
    { ...valid, algorithm: "MD5" },
    { ...valid, digest: "z".repeat(64) },
    { ...valid, byteLength: -1 },
    { ...valid, byteLength: 1.5 },
  ]) {
    assert.throws(() =>
      parseSourceReview(
        JSON.stringify({
          schemaVersion: 2,
          source: { name: "a", fingerprint: fp },
          notes: [],
        }),
      ),
    );
  }
  assert.equal(
    parseSourceReview(
      JSON.stringify({
        schemaVersion: 2,
        source: {
          name: "a",
          fingerprint: { ...valid, digest: "A".repeat(64) },
        },
        notes: [],
      }),
    ).fingerprint.digest,
    "a".repeat(64),
  );
});
