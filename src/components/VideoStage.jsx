import { forwardRef, useEffect, useRef, useState } from "react";
import { containedRect } from "../lib/review";
const VideoStage = forwardRef(function VideoStage(
  {
    source,
    meta,
    ready,
    disabled,
    notes,
    selected,
    time,
    editor,
    onReady,
    onTime,
    onSeeked,
    onPlay,
    onPause,
    onError,
    onPin,
    onSelect,
  },
  ref,
) {
  const stage = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);
  const content = containedRect(
    size.width,
    size.height,
    meta.width,
    meta.height,
  );
  const pinStyle = (note) => ({
    left: content.left + note.x * content.width,
    top: content.top + note.y * content.height,
  });
  const visible = notes
    .map((n, i) => ({ ...n, number: i + 1 }))
    .filter((n) => n.id === selected && Math.abs(n.time - time) < 0.2);
  return (
    <div
      ref={stage}
      className={`video-stage ${ready && !disabled && !editor ? "can-pin" : ""}`}
      style={{ aspectRatio: `${meta.width} / ${meta.height}` }}
      onClick={(e) => {
        if (!ready || disabled || editor) return;
        const box = e.currentTarget.getBoundingClientRect();
        const rect = containedRect(
          box.width,
          box.height,
          meta.width,
          meta.height,
        );
        const x = (e.clientX - box.left - rect.left) / rect.width;
        const y = (e.clientY - box.top - rect.top) / rect.height;
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) onPin(x, y);
      }}
    >
      <video
        ref={ref}
        src={source}
        preload="auto"
        playsInline
        muted
        onLoadedData={onReady}
        onTimeUpdate={onTime}
        onSeeked={onSeeked}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onPause}
        onError={onError}
        aria-label={`${meta.name} video preview`}
      />
      {!ready && <div className="loading">Loading video…</div>}
      {visible.map((n) => (
        <button
          key={n.id}
          className="pin-badge"
          style={pinStyle(n)}
          title={`Note ${n.number}`}
          aria-label={`Select note ${n.number}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(n.id);
          }}
        >
          {n.number}
        </button>
      ))}
      {editor?.isNew && (
        <span className="pin-badge pending-pin" style={pinStyle(editor)}>
          {notes.length + 1}
        </span>
      )}
    </div>
  );
});
export default VideoStage;
