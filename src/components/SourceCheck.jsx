import { useEffect, useRef, useState } from "react";
import { hashFile } from "../lib/hashFile";
import {
  compareSource,
  MAX_REVIEW_BYTES,
  parseSourceReview,
} from "../lib/sourceReview";
import Icon from "./Icon";

const outcomes = {
  match: [
    "Same source file",
    "The video’s bytes match this review, even if the filename changed.",
  ],
  mismatch: [
    "Different source file",
    "This video does not match the review. Its notes may point to the wrong moments. Use the original video or make a new review.",
  ],
  unverified: [
    "Source not verified",
    "This older review has no file fingerprint. A matching name or duration cannot confirm the source. Export a new review from the original video.",
  ],
};

export default function SourceCheck({ onClose }) {
  const dialog = useRef(null),
    operation = useRef(null),
    reviewInput = useRef(null),
    videoInput = useRef(null);
  const [reviewFile, setReviewFile] = useState(null),
    [videoFile, setVideoFile] = useState(null);
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => {
      operation.current?.abort();
      el.close();
    };
  }, []);

  function cancel() {
    operation.current?.abort();
    operation.current = null;
    setBusy(false);
    setProgress(0);
    setResult(null);
    setError("");
  }
  function choose(file, setter) {
    if (!file) return;
    cancel();
    setter(file);
  }
  async function check() {
    if (!reviewFile || !videoFile || operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setResult(null);
    setError("");
    setProgress(0);
    try {
      if (reviewFile.size > MAX_REVIEW_BYTES)
        throw new Error(
          "Review files must be 2 MB or smaller. Choose review.json, not the ZIP or video.",
        );
      const source = parseSourceReview(await reviewFile.text());
      if (controller.signal.aborted) return;
      const actual = source.fingerprint
        ? await hashFile(videoFile, {
            signal: controller.signal,
            onProgress: (value) => {
              if (!controller.signal.aborted) setProgress(value);
            },
          })
        : null;
      if (!controller.signal.aborted)
        setResult({
          kind: compareSource(source.fingerprint, actual),
          name: source.name,
        });
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message);
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <dialog
      className="source-dialog"
      ref={dialog}
      aria-labelledby="source-title"
      onClose={onClose}
    >
      <div className="source-heading">
        <h2 id="source-title">Check the source video</h2>
        <button
          className="icon-button"
          aria-label="Close source check"
          onClick={() => dialog.current.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="source-intro">Do these notes belong to this video?</p>
      <div className="source-file">
        <span className="source-label">1. Review file</span>
        <input
          ref={reviewInput}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex="-1"
          aria-label="Choose review JSON"
          onChange={(e) => {
            choose(e.target.files[0], setReviewFile);
            e.target.value = "";
          }}
        />
        <button className="button" onClick={() => reviewInput.current.click()}>
          Choose review.json
        </button>
        <span className="chosen-file">
          {reviewFile?.name || "Unzip an exported review to find review.json."}
        </span>
      </div>
      <div className="source-file">
        <span className="source-label">2. Video to compare</span>
        <input
          ref={videoInput}
          type="file"
          accept="video/*,.mp4,.webm,.mov,.m4v"
          className="sr-only"
          tabIndex="-1"
          aria-label="Choose video to compare"
          onChange={(e) => {
            choose(e.target.files[0], setVideoFile);
            e.target.value = "";
          }}
        />
        <button className="button" onClick={() => videoInput.current.click()}>
          Choose video
        </button>
        <span className="chosen-file">
          {videoFile?.name || "Select the file you want to check."}
        </span>
      </div>
      <div className="source-actions">
        <button
          className="button primary"
          onClick={check}
          disabled={!reviewFile || !videoFile || busy}
        >
          {busy ? `Checking… ${progress}%` : "Compare files"}
        </button>
        {busy && (
          <button className="button" onClick={cancel}>
            Cancel check
          </button>
        )}
      </div>
      {busy && (
        <progress
          aria-label="Reading video for source check"
          value={progress}
          max="100"
        />
      )}
      {error && (
        <p className="source-result mismatch" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className={`source-result ${result.kind}`} role="status">
          <strong>{outcomes[result.kind][0]}</strong>
          <p>{outcomes[result.kind][1]}</p>
          <small>Review source: {result.name}</small>
        </div>
      )}
      <p className="source-footnote">
        Files stay in your browser. This only compares files; it does not load
        notes or move timestamps after a trim or re-encode.
      </p>
    </dialog>
  );
}
