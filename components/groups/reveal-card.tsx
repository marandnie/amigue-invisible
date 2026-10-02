"use client";

import { useState } from "react";

const COLORS = ["#b91c1c", "#f59e0b", "#15803d", "#fcd34d", "#dc2626", "#16a34a"];

export function RevealCard({ receiverName }: { receiverName: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="w-full rounded-xl border-2 border-dashed border-primary bg-primary/5 p-10 text-center transition hover:bg-primary/10"
      >
        <span className="block text-5xl">🎁</span>
        <span className="mt-3 block font-display text-2xl font-bold">Tocá para descubrir a quién le regalás</span>
        <span className="mt-1 block text-sm text-muted-foreground">Asegurate de que nadie esté mirando 👀</span>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-700 to-green-800 p-10 text-center text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${(i * 37) % 100}%`,
              backgroundColor: COLORS[i % COLORS.length],
              animationDelay: `${(i % 7) * 0.12}s`,
              animationDuration: `${1.6 + (i % 5) * 0.25}s`,
            }}
          />
        ))}
      </div>
      <p className="relative text-sm uppercase tracking-widest text-amber-200">Te tocó regalarle a</p>
      <p className="relative mt-2 font-display text-4xl font-bold sm:text-5xl">{receiverName}</p>
      <p className="relative mt-3 text-sm text-red-100">Es un secreto: no se lo cuentes a nadie 🤫</p>
    </div>
  );
}
