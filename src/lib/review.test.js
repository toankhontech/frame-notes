import test from "node:test";
import assert from "node:assert/strict";
import {
  timestamp,
  makeReview,
  markdown,
  clamp,
  containedRect,
} from "./review.js";
test("timestamps handle rounding across seconds, minutes, and hours", () => {
  assert.equal(timestamp(59.9996), "01:00.000");
  assert.equal(timestamp(3600.04), "01:00:00.040");
  assert.equal(timestamp(NaN), "00:00.000");
  assert.equal(timestamp(-2), "00:00.000");
});
test("export omits internal snapshots and escapes user-controlled Markdown links", () => {
  const review = makeReview(
    {
      name: "[clip](https://example.org)",
      duration: 18.4,
      width: 1280,
      height: 628,
      demo: false,
    },
    [
      {
        time: 6.4,
        x: 0.2,
        y: 0.3,
        text: "<script> & [link](bad)",
        snapshot: "private-pixels",
        id: "internal",
      },
    ],
  );
  assert.equal(review.notes[0].image, "frames/note-001-00-06-400.png");
  assert.equal(review.notes[0].snapshot, undefined);
  assert.equal(review.notes[0].id, undefined);
  const md = markdown(review);
  assert.ok(md.includes("\\[clip\\]\\(https://example\\.org\\)"));
  assert.ok(md.includes("\\<script\\> & \\[link\\]\\(bad\\)"));
  assert.ok(!md.includes("private-pixels"));
});
test("seek and coordinate clamp stay within media boundaries", () => {
  assert.equal(clamp(-1, 0, 18.4), 0);
  assert.equal(clamp(20, 0, 18.4), 18.4);
  assert.equal(clamp(0.59, 0, 1), 0.59);
});
test("pin geometry excludes side and top letterboxing", () => {
  assert.deepEqual(containedRect(1000, 400, 1600, 900), {
    left: 144.44444444444446,
    top: 0,
    width: 711.1111111111111,
    height: 400,
  });
  const portrait = containedRect(360, 300, 900, 1600);
  assert.equal(portrait.left, 95.625);
  assert.equal(portrait.width, 168.75);
  assert.equal(portrait.height, 300);
  const wide = containedRect(400, 400, 1600, 900);
  assert.equal(wide.top, 87.5);
});
