"use client";

import { useEffect, useRef, useState } from "react";
import { markTimestamp } from "@/app/community/radio/actions";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const SPEEDS = [1, 1.25, 1.5, 2];

export function AudioPlayer({
  episodeId,
  audioUrl,
  durationSeconds,
  initialMarks,
  canReact,
}: {
  episodeId: string;
  audioUrl: string;
  durationSeconds?: number | null;
  initialMarks: number[];
  canReact: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [marks, setMarks] = useState<number[]>(initialMarks);
  const [justMarked, setJustMarked] = useState(false);

  // 再生位置の記憶（端末ごと）
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    try {
      const saved = Number(localStorage.getItem(`pod:${episodeId}`) || "0");
      if (saved > 0) a.currentTime = saved;
    } catch {
      /* noop */
    }
  }, [episodeId]);

  function onTime() {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    if (Math.floor(a.currentTime) % 5 === 0) {
      try {
        localStorage.setItem(`pod:${episodeId}`, String(Math.floor(a.currentTime)));
      } catch {
        /* noop */
      }
    }
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function skip(sec: number) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.min(Math.max(0, a.currentTime + sec), duration || a.duration || 0);
  }

  function cycleSpeed() {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  }

  function seekTo(ratio: number) {
    const a = audioRef.current;
    if (!a || !duration) return;
    a.currentTime = ratio * duration;
    setCurrent(a.currentTime);
  }

  function addMark() {
    if (!canReact) return;
    const t = Math.floor(current);
    setMarks((m) => [...m, t]);
    setJustMarked(true);
    setTimeout(() => setJustMarked(false), 900);
    markTimestamp(episodeId, t).then((res) => {
      if (!res.ok) setMarks((m) => m.filter((x, i) => !(x === t && i === m.length - 1)));
    });
  }

  const pct = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="rounded-xl border border-line bg-surface/30 p-5">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={onTime}
        onEnded={() => setPlaying(false)}
      />

      {/* シークバー（クリックでジャンプ・「ここ好き」マーカー表示） */}
      <div
        className="relative h-3 cursor-pointer rounded-full bg-line"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seekTo((e.clientX - rect.left) / rect.width);
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
        {marks.map((t, i) => (
          <span
            key={i}
            className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-accent/70"
            style={{ left: `${duration ? (t / duration) * 100 : 0}%` }}
            title={`${fmt(t)} ここ好き`}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-xs text-muted">
        <span>{fmt(current)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {/* コントロール */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          onClick={() => skip(-15)}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          ⟲ 15
        </button>
        <button
          onClick={toggle}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-bg transition-opacity hover:opacity-90"
          aria-label={playing ? "一時停止" : "再生"}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          onClick={() => skip(30)}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          30 ⟳
        </button>
        <button
          onClick={cycleSpeed}
          className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted hover:border-accent hover:text-fg"
        >
          {SPEEDS[speedIdx]}×
        </button>
      </div>

      {/* ここ好き */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="font-mono text-xs text-muted">
          ♥ ここ好き {marks.length}
        </span>
        <button
          onClick={addMark}
          disabled={!canReact}
          title={canReact ? "今の瞬間に『ここ好き』を残す" : "ログインすると押せます"}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            justMarked
              ? "border-accent bg-accent/20 text-accent"
              : "border-line text-muted hover:border-accent hover:text-fg"
          }`}
        >
          {justMarked ? "残しました！" : "♡ ここ好き"}
        </button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted/60">
        再生中の好きな瞬間に押すと、その時間に印が付きます。配信者はどこが響いたか分かります。
      </p>
    </div>
  );
}
