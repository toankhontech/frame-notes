import { sha256 } from "@noble/hashes/sha2.js";

// Runs in a worker in the app. Keep memory bounded even for long recordings.
export async function fingerprint(
  blob,
  onProgress = () => {},
  chunkSize = 4 * 1024 * 1024,
) {
  const hash = sha256.create();
  try {
    for (let offset = 0; offset < blob.size; offset += chunkSize) {
      hash.update(
        new Uint8Array(
          await blob.slice(offset, offset + chunkSize).arrayBuffer(),
        ),
      );
      onProgress(
        Math.min(100, Math.floor(((offset + chunkSize) / blob.size) * 100)),
      );
    }
    return {
      algorithm: "SHA-256",
      digest: Array.from(hash.digest(), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join(""),
      byteLength: blob.size,
    };
  } finally {
    hash.destroy();
  }
}
