import Icon from "./Icon";
import { timestamp } from "../lib/review";
export default function Transport({
  time,
  duration,
  playing,
  speed,
  muted,
  notes,
  disabled,
  onToggle,
  onStep,
  onSeek,
  onSpeed,
  onMute,
  onAdd,
  onSelect,
}) {
  const tick =
    duration > 30 ? Math.ceil(duration / 4 / 10) * 10 : duration > 10 ? 5 : 1;
  const ticks = Array.from(
    { length: Math.min(8, Math.floor(duration / tick) + 1) },
    (_, i) => i * tick,
  );
  return (
    <section className="transport" aria-label="Video controls">
      <div className="controls-row">
        <div className="playback-buttons">
          <button
            className="icon-button play-button"
            onClick={onToggle}
            disabled={disabled}
            title={playing ? "Pause (Space)" : "Play (Space)"}
            aria-label={playing ? "Pause" : "Play"}
          >
            <Icon name={playing ? "pause" : "play"} size={23} />
          </button>
          <button
            className="icon-button"
            disabled={disabled}
            onClick={() => onStep(-0.1)}
            title="Back 0.1 seconds (←)"
            aria-label="Back 0.1 seconds"
          >
            <Icon name="back" />
          </button>
          <button
            className="icon-button"
            disabled={disabled}
            onClick={() => onStep(0.1)}
            title="Forward 0.1 seconds (→)"
            aria-label="Forward 0.1 seconds"
          >
            <Icon name="next" />
          </button>
        </div>
        <div className="time-display">
          <strong>{timestamp(time)}</strong>
          <span> / {timestamp(duration)}</span>
        </div>
        <div className="extra-controls">
          <button
            className="icon-button mute-button"
            onClick={onMute}
            disabled={disabled}
            title={muted ? "Unmute" : "Mute"}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <Icon name={muted ? "mute" : "sound"} />
          </button>
          <label className="speed-control">
            <span className="sr-only">Playback speed</span>
            <select
              value={speed}
              onChange={(e) => onSpeed(Number(e.target.value))}
              disabled={disabled}
            >
              <option value="0.5">0.5×</option>
              <option value="1">1×</option>
              <option value="1.5">1.5×</option>
              <option value="2">2×</option>
            </select>
          </label>
          <button
            className="button add-button"
            onClick={onAdd}
            disabled={disabled}
          >
            <Icon name="pin" />
            Add note
          </button>
        </div>
      </div>
      <div className="timeline">
        <input
          aria-label="Video timeline"
          type="range"
          min="0"
          max={duration || 1}
          step="0.001"
          value={time}
          disabled={disabled}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={{ "--progress": `${duration ? (time / duration) * 100 : 0}%` }}
        />
        <div className="timeline-markers">
          {notes.map((n, i) => (
            <button
              key={n.id}
              aria-label={`Jump to note ${i + 1} at ${timestamp(n.time)}`}
              disabled={disabled}
              style={{ left: `${duration ? (n.time / duration) * 100 : 0}%` }}
              onClick={() => onSelect(n.id)}
            >
              <span>{i + 1}</span>
            </button>
          ))}
        </div>
        <div className="ticks">
          {ticks.map((t) => (
            <span
              key={t}
              style={{ left: `${duration ? (t / duration) * 100 : 0}%` }}
            >
              {t}s
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
