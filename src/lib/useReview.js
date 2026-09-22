import { useEffect, useRef, useState } from "react";
import { clamp } from "./review";
import { exportReview } from "./export";
import { hashFile } from "./hashFile";
import demoUrl from "../assets/demo.mp4";

const DEMO = {
  name: "Gravity Type",
  duration: 18.4,
  width: 1280,
  height: 628,
  demo: true,
};
const SAMPLE = {
  id: "sample",
  time: 6.4,
  x: 0.59,
  y: 0.51,
  text: "Keep the letters readable for one more beat.",
  illustrative: true,
  snapshot: null,
};
export default function useReview() {
  const video = useRef(null),
    objectUrl = useRef(null),
    initialized = useRef(false),
    fileBusy = useRef(false),
    sourceFile = useRef(null),
    exportController = useRef(null);
  const [source, setSource] = useState(demoUrl);
  const [meta, setMeta] = useState(DEMO);
  const [ready, setReady] = useState(false),
    [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0),
    [speed, setSpeed] = useState(1),
    [muted, setMuted] = useState(true);
  const [notes, setNotes] = useState([{ ...SAMPLE }]),
    [selected, setSelected] = useState("sample");
  const [editor, setEditor] = useState(null),
    [removed, setRemoved] = useState(null);
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const [seeking, setSeeking] = useState(false);

  useEffect(() => {
    if (!dirty && !editor) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, editor]);
  useEffect(
    () => () => {
      exportController.current?.abort();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    },
    [],
  );

  function snapshot() {
    const el = video.current;
    if (!el || el.readyState < 2 || el.seeking)
      throw new Error(
        "The video is still seeking. Try again when the frame appears.",
      );
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext("2d").drawImage(el, 0, 0);
    return canvas.toDataURL("image/png");
  }
  function onSeeked() {
    setSeeking(false);
    setTime(video.current.currentTime);
    if (
      meta.demo &&
      !initialized.current &&
      Math.abs(video.current.currentTime - 6.4) < 0.05
    ) {
      try {
        const image = snapshot();
        setNotes((prev) =>
          prev.map((n) => (n.id === "sample" ? { ...n, snapshot: image } : n)),
        );
        initialized.current = true;
        setReady(true);
      } catch (err) {
        setError(err.message);
      }
    }
  }
  function onReady() {
    const el = video.current;
    if (!el || !Number.isFinite(el.duration) || !el.videoWidth) {
      setError("This video has no readable duration. Try an MP4 or WebM file.");
      return;
    }
    setMeta((prev) => ({
      ...prev,
      duration: el.duration,
      width: el.videoWidth,
      height: el.videoHeight,
    }));
    if (meta.demo && !initialized.current) {
      setSeeking(true);
      el.currentTime = 6.4;
    } else setReady(true);
  }
  function seek(value) {
    if (!ready || editor || busy) return;
    video.current.pause();
    const target = clamp(value, 0, meta.duration);
    if (Math.abs(video.current.currentTime - target) < 0.00001) return;
    setSeeking(true);
    video.current.currentTime = target;
    setTime(target);
  }
  function toggle() {
    if (!ready || editor || busy) return;
    if (video.current.paused)
      video.current
        .play()
        .catch(() =>
          setError(
            "Playback could not start. Try opening this video in another format.",
          ),
        );
    else video.current.pause();
  }
  function add(x = 0.5, y = 0.5) {
    if (!ready || editor || busy || seeking) return;
    video.current.pause();
    setError("");
    try {
      const captured = snapshot();
      setEditor({
        id: crypto.randomUUID(),
        isNew: true,
        time: video.current.currentTime,
        x: clamp(x, 0, 1),
        y: clamp(y, 0, 1),
        text: "",
        snapshot: captured,
      });
      setTime(video.current.currentTime);
    } catch (err) {
      setError(err.message);
    }
  }
  function select(id) {
    const note = notes.find((n) => n.id === id);
    if (!note || editor || busy) return;
    setSelected(id);
    seek(note.time);
  }
  function edit(note) {
    select(note.id);
    setEditor({ ...note, isNew: false });
  }
  function save() {
    if (!editor?.text.trim()) return;
    const { isNew, ...note } = editor;
    note.text = note.text.trim();
    note.illustrative = false;
    setNotes((prev) =>
      (isNew
        ? [...prev, note]
        : prev.map((n) => (n.id === note.id ? note : n))
      ).sort((a, b) => a.time - b.time),
    );
    setSelected(note.id);
    setEditor(null);
    setDirty(true);
    setStatus("Note saved.");
  }
  function remove(id) {
    setRemoved(notes.find((n) => n.id === id));
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selected === id) setSelected(null);
    setDirty(true);
    setStatus("Note deleted.");
  }
  function undo() {
    if (!removed) return;
    setNotes((prev) => [...prev, removed].sort((a, b) => a.time - b.time));
    setRemoved(null);
    setDirty(true);
    setStatus("Note restored.");
  }

  async function openFile(file) {
    if (!file || busy || fileBusy.current) return;
    if (
      (dirty || editor) &&
      !window.confirm(
        "Open another video? Your current notes will be cleared. Export the review first if you want to keep them.",
      )
    )
      return;
    fileBusy.current = true;
    setBusy(true);
    setError("");
    setStatus("Opening video…");
    const url = URL.createObjectURL(file),
      probe = document.createElement("video");
    try {
      const info = await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () =>
            reject(
              new Error(
                "The video took too long to load. Try a smaller MP4 or WebM file.",
              ),
            ),
          15000,
        );
        probe.preload = "metadata";
        probe.onloadedmetadata = () => {
          clearTimeout(timer);
          if (
            Number.isFinite(probe.duration) &&
            probe.duration > 0 &&
            probe.videoWidth
          )
            resolve({
              duration: probe.duration,
              width: probe.videoWidth,
              height: probe.videoHeight,
            });
          else
            reject(
              new Error(
                "This video has no readable duration. Try an MP4 or WebM file.",
              ),
            );
        };
        probe.onerror = () => {
          clearTimeout(timer);
          reject(
            new Error(
              "This browser cannot read that video. Try an MP4 (H.264) or WebM file.",
            ),
          );
        };
        probe.src = url;
      });
      video.current.pause();
      const previous = objectUrl.current;
      objectUrl.current = url;
      sourceFile.current = file;
      setReady(false);
      setSeeking(false);
      initialized.current = true;
      setMeta({ name: file.name, ...info, demo: false });
      setSource(url);
      setTime(0);
      setNotes([]);
      setSelected(null);
      setEditor(null);
      setRemoved(null);
      setDirty(false);
      setStatus("Video opened. Pause and click a spot to add a note.");
      setSpeed(1);
      setMuted(true);
      if (previous) URL.revokeObjectURL(previous);
    } catch (err) {
      URL.revokeObjectURL(url);
      setError(err.message);
      setStatus("");
    } finally {
      probe.removeAttribute("src");
      probe.load();
      fileBusy.current = false;
      setBusy(false);
    }
  }
  function resetDemo() {
    if (fileBusy.current) return;
    if (
      (dirty || editor) &&
      !window.confirm("Return to the demo? Your current notes will be cleared.")
    )
      return;
    video.current.pause();
    setReady(false);
    initialized.current = false;
    setMeta(DEMO);
    sourceFile.current = null;
    setSource(demoUrl);
    setTime(0);
    setNotes([{ ...SAMPLE }]);
    setSelected("sample");
    setEditor(null);
    setRemoved(null);
    setDirty(false);
    setError("");
    setStatus("");
    setSpeed(1);
    setMuted(true);
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  }
  async function doExport() {
    if (busy || fileBusy.current || editor || !notes.length || !ready) return;
    fileBusy.current = true;
    const controller = new AbortController();
    exportController.current = controller;
    video.current.pause();
    setBusy(true);
    setError("");
    setStatus("Preparing review…");
    try {
      const fingerprint = sourceFile.current
        ? await hashFile(sourceFile.current, {
            signal: controller.signal,
            onProgress: (value) => setStatus(`Identifying source video… ${value}%`),
          })
        : __DEMO_FINGERPRINT__;
      exportController.current = null;
      await exportReview({ ...meta, fingerprint }, notes, setStatus);
      setDirty(false);
      setStatus(
        "Review downloaded · source fingerprint, notes and annotated frames.",
      );
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
      setStatus(
        err.name === "AbortError"
          ? "Export cancelled. Your notes are still here."
          : "",
      );
    } finally {
      exportController.current = null;
      fileBusy.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (video.current) {
      video.current.playbackRate = speed;
      video.current.muted = muted;
    }
  }, [speed, muted, source]);
  useEffect(() => {
    function keyboard(e) {
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "Escape" && editor) {
        setEditor(null);
        return;
      }
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) ||
        e.target.isContentEditable ||
        editor ||
        busy
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        seek(video.current.currentTime + (e.key === "ArrowLeft" ? -0.1 : 0.1));
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        add();
      }
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  });
  return {
    video,
    source,
    meta,
    ready,
    playing,
    time,
    speed,
    muted,
    notes,
    selected,
    editor,
    removed,
    busy,
    status,
    error,
    seeking,
    onReady,
    onSeeked,
    seek,
    toggle,
    add,
    select,
    edit,
    save,
    remove,
    undo,
    openFile,
    resetDemo,
    doExport,
    canCancelExport: busy && !!exportController.current,
    cancelExport: () => exportController.current?.abort(),
    setPlaying,
    setTime,
    setSpeed,
    setMuted,
    setEditor,
    setError,
    setStatus,
  };
}
