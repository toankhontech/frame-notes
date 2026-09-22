export const MAX_REVIEW_BYTES = 2 * 1024 * 1024;

export function parseSourceReview(text) {
  let review;
  try {
    review = JSON.parse(text);
  } catch {
    throw new Error(
      "That file is not valid JSON. Choose review.json from an exported review.",
    );
  }
  if (
    !review ||
    ![1, 2].includes(review.schemaVersion) ||
    !review.source ||
    typeof review.source.name !== "string" ||
    !Array.isArray(review.notes)
  ) {
    throw new Error(
      "This is not a supported Frame Notes review (version 1 or 2).",
    );
  }
  const fp = review.source.fingerprint;
  if (review.schemaVersion === 1 && fp == null)
    return { name: review.source.name, fingerprint: null };
  if (
    !fp ||
    fp.algorithm !== "SHA-256" ||
    typeof fp.digest !== "string" ||
    !/^[a-f\d]{64}$/i.test(fp.digest) ||
    !Number.isSafeInteger(fp.byteLength) ||
    fp.byteLength < 0
  ) {
    throw new Error(
      "The source fingerprint is missing or invalid. Export a new review from the original video.",
    );
  }
  return {
    name: review.source.name,
    fingerprint: { ...fp, digest: fp.digest.toLowerCase() },
  };
}

export function compareSource(expected, actual) {
  if (!expected) return "unverified";
  return expected.algorithm === actual.algorithm &&
    expected.digest === actual.digest &&
    expected.byteLength === actual.byteLength
    ? "match"
    : "mismatch";
}
