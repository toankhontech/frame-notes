export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
export function containedRect(boxWidth, boxHeight, videoWidth, videoHeight) {
  const scale = Math.min(boxWidth / videoWidth, boxHeight / videoHeight);
  const width = videoWidth * scale,
    height = videoHeight * scale;
  return {
    left: (boxWidth - width) / 2,
    top: (boxHeight - height) / 2,
    width,
    height,
  };
}
export function timestamp(seconds) {
  const ms = Math.max(
    0,
    Math.round((Number.isFinite(seconds) ? seconds : 0) * 1000),
  );
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor(ms / 60000) % 60;
  const secs = Math.floor(ms / 1000) % 60;
  return `${hours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms % 1000).padStart(3, "0")}`;
}
export function escapeMarkdown(text) {
  return String(text).replace(/[\\`*_{}\[\]()<>#+.!|~-]/g, "\\$&");
}
export function makeReview(meta, notes) {
  return {
    schemaVersion: 2,
    source: {
      name: meta.name,
      durationSeconds: meta.duration,
      width: meta.width,
      height: meta.height,
      demo: meta.demo,
      fingerprint: meta.fingerprint,
    },
    timing:
      "Browser media time in seconds. Timestamps and 0.1s steps are not frame-accurate timecode.",
    coordinates:
      "Normalized x/y relative to the video, from the top-left. Range 0–1.",
    notes: notes.map((note, i) => ({
      number: i + 1,
      timeSeconds: note.time,
      timestamp: timestamp(note.time),
      x: note.x,
      y: note.y,
      text: note.text,
      illustrative: !!note.illustrative,
      image: `frames/note-${String(i + 1).padStart(3, "0")}-${timestamp(note.time).replaceAll(":", "-").replace(".", "-")}.png`,
    })),
  };
}
export function markdown(review) {
  const s = review.source;
  return `# Frame Notes review\n\nSource: ${escapeMarkdown(s.name)}${s.demo ? " (demo clip)" : ""}\n\n${s.width} × ${s.height} · ${timestamp(s.durationSeconds)}\n\n${s.fingerprint ? `Source SHA-256: \`${s.fingerprint.digest}\`\n\nFile size: ${s.fingerprint.byteLength} bytes. Checks exact file bytes, not visual similarity; timestamps are not remapped.\n\n` : ""}${review.timing}\n\n${review.coordinates}\n\n${review.notes.map((n) => `## ${n.number}. ${n.timestamp}\n\n${escapeMarkdown(n.text)}\n\n${n.illustrative ? "_Illustrative sample note._\n\n" : ""}Position: x=${n.x.toFixed(4)}, y=${n.y.toFixed(4)}\n\n![Annotated frame ${n.number}](${n.image})\n`).join("\n")}\nMade with Frame Notes by ToanKhonTech.\n`;
}
