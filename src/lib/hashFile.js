export function hashFile(file, { signal, onProgress = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(
      new URL("./fingerprint.worker.js", import.meta.url),
      { type: "module" },
    );
    const finish = (callback, value) => {
      worker.terminate();
      signal?.removeEventListener("abort", abort);
      callback(value);
    };
    const abort = () =>
      finish(reject, new DOMException("Cancelled", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.result) finish(resolve, data.result);
      else if (data.error) finish(reject, new Error(data.error));
      else onProgress(data.progress);
    };
    worker.onerror = () =>
      finish(
        reject,
        new Error(
          "Source check could not start. Reload the page and try again.",
        ),
      );
    worker.onmessageerror = () =>
      finish(
        reject,
        new Error("Could not read the source-check result. Try again."),
      );
    worker.postMessage(file);
  });
}
