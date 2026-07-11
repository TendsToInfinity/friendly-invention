'use client';

import { useMemo } from 'react';

const COLORS = ['#2563eb', '#14b8a6', '#7c3aed', '#f59e0b', '#fb7185', '#22c55e'];
const PIECE_COUNT = 28;

/**
 * Lightweight dependency-free confetti burst for celebration moments.
 * Pieces animate once via CSS and fade out; hidden from screen readers and
 * disabled entirely under prefers-reduced-motion (see globals.css).
 */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECE_COUNT }, (_, index) => ({
        left: `${(index * 37) % 100}%`,
        background: COLORS[index % COLORS.length],
        animationDelay: `${(index % 7) * 0.12}s`,
        transform: `rotate(${(index * 53) % 360}deg)`,
      })),
    [],
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {pieces.map((style, index) => (
        <span key={index} className="confetti-piece" style={style} />
      ))}
    </div>
  );
}
