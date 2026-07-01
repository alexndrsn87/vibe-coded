import { useEffect, useRef, useState } from 'react';
import { computeLayout, draw, hitTest } from '../render/draw';
import type { Hotspot } from '../render/draw';
import type { GameState } from '../engine/types';

interface TrackCanvasProps {
  state: GameState;
  onSignalClick: (id: string) => void;
  onPlatformClick: (platform: number) => void;
}

const CANVAS_HEIGHT = 260;

export default function TrackCanvas({ state, onSignalClick, onPlatformClick }: TrackCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const hotspotsRef = useRef<Hotspot[]>([]);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [hover, setHover] = useState<{ tooltip: string; x: number; y: number; id: string } | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(Math.max(w, 600));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf: number;
    const render = () => {
      const layout = computeLayout(containerWidth, CANVAS_HEIGHT);
      hotspotsRef.current = draw(ctx, layout, stateRef.current, hoveredIdRef.current);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [containerWidth]);

  function getCanvasCoords(e: React.MouseEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleClick(e: React.MouseEvent) {
    const { x, y } = getCanvasCoords(e);
    const hit = hitTest(hotspotsRef.current, x, y);
    if (!hit) return;
    if (hit.kind === 'signal') onSignalClick(hit.id);
    if (hit.kind === 'platform') onPlatformClick(Number(hit.id.split('-')[1]));
  }

  function handleMouseMove(e: React.MouseEvent) {
    const { x, y } = getCanvasCoords(e);
    const hit = hitTest(hotspotsRef.current, x, y);
    hoveredIdRef.current = hit?.id ?? null;
    if (hit) {
      setHover({ tooltip: hit.tooltip, x: e.clientX, y: e.clientY, id: hit.id });
    } else if (hover) {
      setHover(null);
    }
  }

  function handleMouseLeave() {
    hoveredIdRef.current = null;
    setHover(null);
  }

  const hoveredKind = hover ? hotspotsRef.current.find((h) => h.id === hover.id)?.kind : null;
  const cursorClass = hoveredKind === 'signal' || hoveredKind === 'platform' ? 'cursor-pointer' : 'cursor-default';

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className={cursorClass}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hover && (
        <div
          className="fixed z-50 max-w-xs px-3 py-2 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200 shadow-xl pointer-events-none"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          {hover.tooltip}
        </div>
      )}
    </div>
  );
}
