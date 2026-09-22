import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { timestamp } from "../lib/review";
export default function NotesPanel({
  notes,
  selected,
  editor,
  busy,
  onSelect,
  onEdit,
  onDelete,
  onText,
  onSave,
  onCancel,
}) {
  const textRef = useRef(null);
  useEffect(() => {
    if (editor) textRef.current?.focus();
  }, [editor?.id]);
  return (
    <aside className="notes-panel" aria-label="Review notes">
      <div className="notes-heading">
        <h2>Notes</h2>
        <span className="note-count">{notes.length}</span>
      </div>
      <div className="notes-list">
        {notes.map((n, i) => (
          <article
            key={n.id}
            className={`note ${selected === n.id ? "selected" : ""}`}
          >
            <button
              className="note-select"
              onClick={() => onSelect(n.id)}
              disabled={!!editor || busy}
              aria-label={`Note ${i + 1}, ${timestamp(n.time)}: ${n.text}`}
            >
              <span className="note-time">
                <span className="small-badge">{i + 1}</span>
                {timestamp(n.time)}
              </span>
              <span className="note-text">{n.text}</span>
            </button>
            <div className="note-actions">
              <button
                className="icon-button"
                title="Edit note"
                aria-label={`Edit note ${i + 1}`}
                disabled={!!editor || busy}
                onClick={() => onEdit(n)}
              >
                <Icon name="edit" size={18} />
              </button>
              <button
                className="icon-button"
                title="Delete note"
                aria-label={`Delete note ${i + 1}`}
                disabled={!!editor || busy}
                onClick={() => onDelete(n.id)}
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
          </article>
        ))}
        {!notes.length && !editor && (
          <div className="empty-notes">
            <Icon name="pin" size={28} />
            <p>Your first note starts on the video.</p>
            <span>Pause at a moment worth fixing, then click a spot.</span>
          </div>
        )}
        {editor && (
          <form
            className="note-editor"
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            <label htmlFor="note-text">
              {editor.isNew ? "Add note" : "Edit note"}{" "}
              <span>{timestamp(editor.time)}</span>
            </label>
            <textarea
              ref={textRef}
              id="note-text"
              maxLength={1000}
              rows={5}
              value={editor.text}
              onChange={(e) => onText(e.target.value)}
              placeholder="What should change here?"
              onKeyDown={(e) => {
                if (
                  (e.ctrlKey || e.metaKey) &&
                  e.key === "Enter" &&
                  editor.text.trim()
                ) {
                  e.preventDefault();
                  onSave();
                }
              }}
            />
            <div className="editor-actions">
              <button type="button" className="button" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={!editor.text.trim()}
              >
                Save note
              </button>
            </div>
          </form>
        )}
      </div>
      <p className="notes-hint">
        Pause the video, then click a spot to add a note.
      </p>
    </aside>
  );
}
