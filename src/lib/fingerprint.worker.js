import { fingerprint } from "./fingerprint.js";

self.onmessage = async ({ data }) => {
  try {
    const result = await fingerprint(data, (progress) =>
      self.postMessage({ progress }),
    );
    self.postMessage({ result });
  } catch {
    self.postMessage({
      error: "Could not read this file. Choose it again and retry.",
    });
  }
};
