import { useRef, useState } from "react";
import Icon from "./components/Icon";
import VideoStage from "./components/VideoStage";
import Transport from "./components/Transport";
import NotesPanel from "./components/NotesPanel";
import SourceCheck from "./components/SourceCheck";
import useReview from "./lib/useReview";
export default function App() {
  const r = useReview(),
    fileInput = useRef(null),
    [dragging, setDragging] = useState(false),
    [checking, setChecking] = useState(false);
  return (
    <div
      className="app"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          if (!checking) setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!checking) r.openFile(e.dataTransfer.files[0]);
      }}
    >
      <header className="app-header">
        <div className="brand">
          <img src="./brand/icon.svg" alt="ToanKhonTech" />
          <span>Frame Notes</span>
        </div>
        <div className="header-actions">
          <input
            ref={fileInput}
            className="sr-only"
            tabIndex="-1"
            type="file"
            accept="video/*,.mp4,.webm,.mov,.m4v"
            aria-label="Choose a local video"
            onChange={(e) => {
              r.openFile(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <button
            className="button"
            onClick={() => fileInput.current.click()}
            disabled={r.busy}
          >
            <Icon name="folder" />
            Open video
          </button>
          <button
            className="button primary"
            onClick={r.doExport}
            disabled={!r.ready || !r.notes.length || !!r.editor || r.busy}
          >
            <Icon name="export" />
            <span>{r.busy ? "Working…" : "Export review"}</span>
          </button>
        </div>
      </header>
      <main>
        <div className="project-heading">
          <div>
            <h1 title={r.meta.name}>{r.meta.name}</h1>
            <p>
              {r.meta.demo ? "Demo clip" : "Local video"} ·{" "}
              {r.meta.duration.toFixed(1)}s
            </p>
          </div>
          <div className="project-actions">
            <button
              className="button quiet"
              disabled={r.busy}
              onClick={() => {
                r.video.current?.pause();
                setChecking(true);
              }}
            >
              Check source
            </button>
            {!r.meta.demo && (
              <button
                className="button quiet"
                disabled={r.busy}
                onClick={r.resetDemo}
              >
                Back to demo
              </button>
            )}
          </div>
        </div>
        {(r.status || r.error) && (
          <div
            className={`status ${r.error ? "error" : ""}`}
            role={r.error ? "alert" : "status"}
          >
            <span>{r.error || r.status}</span>
            {r.canCancelExport && (
              <button className="button quiet" onClick={r.cancelExport}>
                Cancel export
              </button>
            )}
            {r.removed && !r.error && (
              <button
                className="button quiet"
                disabled={r.busy || !!r.editor}
                onClick={r.undo}
              >
                <Icon name="undo" size={16} />
                Undo
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Dismiss message"
              onClick={() => {
                r.setError("");
                r.setStatus("");
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <div className="workspace">
          <div className="player-column">
            <VideoStage
              ref={r.video}
              source={r.source}
              meta={r.meta}
              ready={r.ready}
              disabled={r.busy || r.seeking}
              notes={r.notes}
              selected={r.selected}
              time={r.time}
              editor={r.editor}
              onReady={r.onReady}
              onTime={() => r.setTime(r.video.current.currentTime)}
              onSeeked={r.onSeeked}
              onPlay={() => r.setPlaying(true)}
              onPause={() => r.setPlaying(false)}
              onError={() => {
                r.setError(
                  "Could not load the video. Try opening a local MP4 or WebM file.",
                );
              }}
              onPin={r.add}
              onSelect={r.select}
            />
            <Transport
              time={r.time}
              duration={r.meta.duration}
              playing={r.playing}
              speed={r.speed}
              muted={r.muted}
              notes={r.notes}
              disabled={!r.ready || !!r.editor || r.busy}
              onToggle={r.toggle}
              onStep={(d) => r.seek(r.video.current.currentTime + d)}
              onSeek={r.seek}
              onSpeed={r.setSpeed}
              onMute={() => r.setMuted((m) => !m)}
              onAdd={() => r.add()}
              onSelect={r.select}
            />
          </div>
          <NotesPanel
            notes={r.notes}
            selected={r.selected}
            editor={r.editor}
            busy={r.busy}
            onSelect={r.select}
            onEdit={r.edit}
            onDelete={r.remove}
            onText={(text) => r.setEditor((e) => ({ ...e, text }))}
            onSave={r.save}
            onCancel={() => r.setEditor(null)}
          />
        </div>
      </main>
      <footer>
        <span>Your video stays in this browser.</span>
        <span className="keyboard-hint">
          <kbd>Space</kbd> play/pause <b>·</b> <kbd>← →</kbd> step <b>·</b>{" "}
          <kbd>N</kbd> add note
        </span>
        <img src="./brand/wordmark.png" alt="ToanKhonTech" />
      </footer>
      {checking && <SourceCheck onClose={() => setChecking(false)} />}
      {dragging && (
        <div className="drop-overlay">
          <Icon name="folder" size={44} />
          <p>Drop your video here</p>
        </div>
      )}
    </div>
  );
}
