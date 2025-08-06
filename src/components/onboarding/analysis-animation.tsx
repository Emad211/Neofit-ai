"use client"

import React, { useMemo } from 'react';

const Dot = ({ x, y }: { x: number; y: number }) => (
  <circle
    cx={x}
    cy={y}
    r="3"
    className="fill-primary opacity-50 animate-[pulse_3s_ease-in-out_infinite]"
    style={{ animationDelay: `${Math.random() * 2}s` }}
  />
);

const Line = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    className="stroke-primary/30"
    strokeWidth="1"
  />
);


export const AnalysisAnimation = () => {
  const { dots, lines } = useMemo(() => {
    const numDots = 40;
    const width = 400;
    const height = 200;
    
    const generatedDots = Array.from({ length: numDots }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
    }));

    const generatedLines = [];
    for (let i = 0; i < numDots; i++) {
      for (let j = i + 1; j < numDots; j++) {
        const dist = Math.hypot(generatedDots[i].x - generatedDots[j].x, generatedDots[i].y - generatedDots[j].y);
        if (dist < 80 && Math.random() > 0.5) {
          generatedLines.push({
            p1: generatedDots[i],
            p2: generatedDots[j],
          });
        }
      }
    }
    return { dots: generatedDots, lines: generatedLines };
  }, []);

  return (
    <div className="flex justify-center items-center p-4">
      <svg viewBox="0 0 400 200" className="w-full max-w-lg h-auto">
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
          </radialGradient>
        </defs>
        <rect width="400" height="200" fill="url(#grad1)" />
        {lines.map((line, i) => (
          <Line key={i} x1={line.p1.x} y1={line.p1.y} x2={line.p2.x} y2={line.p2.y} />
        ))}
        {dots.map((dot, i) => (
          <Dot key={i} x={dot.x} y={dot.y} />
        ))}
      </svg>
    </div>
  );
};
