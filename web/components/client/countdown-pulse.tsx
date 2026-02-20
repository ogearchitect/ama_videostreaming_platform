"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CountdownPulseProps {
  targetDate: string;
  label?: string;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getTimeRemaining(target: Date): TimeRemaining {
  const now = Date.now();
  const totalMs = Math.max(0, target.getTime() - now);
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalMs };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

const SVG_WIDTH = 600;
const SVG_HEIGHT = 80;
const BASELINE_Y = SVG_HEIGHT / 2;

function buildPulsePath(
  offset: number,
  frequency: number,
  amplitude: number,
): string {
  const points: string[] = [];
  const pulseWidth = 30 / frequency;
  const segmentWidth = 200 / frequency;

  for (let x = -100; x <= SVG_WIDTH + 100; x += 2) {
    const adjustedX = x + (offset % segmentWidth);
    const posInSegment = ((adjustedX % segmentWidth) + segmentWidth) % segmentWidth;
    let y = BASELINE_Y;

    const pulseStart = segmentWidth * 0.4;
    const pulseEnd = pulseStart + pulseWidth;

    if (posInSegment >= pulseStart && posInSegment < pulseStart + pulseWidth * 0.15) {
      const t = (posInSegment - pulseStart) / (pulseWidth * 0.15);
      y = BASELINE_Y + amplitude * 0.3 * Math.sin(t * Math.PI);
    } else if (posInSegment >= pulseStart + pulseWidth * 0.15 && posInSegment < pulseStart + pulseWidth * 0.35) {
      const t = (posInSegment - pulseStart - pulseWidth * 0.15) / (pulseWidth * 0.2);
      y = BASELINE_Y - amplitude * Math.sin(t * Math.PI);
    } else if (posInSegment >= pulseStart + pulseWidth * 0.35 && posInSegment < pulseStart + pulseWidth * 0.55) {
      const t = (posInSegment - pulseStart - pulseWidth * 0.35) / (pulseWidth * 0.2);
      y = BASELINE_Y + amplitude * 0.6 * Math.sin(t * Math.PI);
    } else if (posInSegment >= pulseStart + pulseWidth * 0.55 && posInSegment < pulseEnd) {
      const t = (posInSegment - pulseStart - pulseWidth * 0.55) / (pulseWidth * 0.45);
      y = BASELINE_Y - amplitude * 0.15 * Math.sin(t * Math.PI);
    }

    points.push(`${x},${y.toFixed(1)}`);
  }

  return `M${points.join(" L")}`;
}

export default function CountdownPulse({
  targetDate,
  label,
}: CountdownPulseProps) {
  const target = useRef(new Date(targetDate));
  const [time, setTime] = useState<TimeRemaining>(() =>
    getTimeRemaining(target.current),
  );
  const [isLive, setIsLive] = useState(false);
  const [pulsePath, setPulsePath] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(target.current);
      setTime(remaining);
      if (remaining.totalMs <= 0) {
        setIsLive(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const getFrequencyAndAmplitude = useCallback((): {
    frequency: number;
    amplitude: number;
    speed: number;
  } => {
    const remaining = time.totalMs;
    if (remaining <= 0) {
      return { frequency: 3.0, amplitude: 30, speed: 300 };
    }
    const oneHour = 3_600_000;
    const tenMinutes = 600_000;
    const oneMinute = 60_000;

    if (remaining > oneHour) {
      return { frequency: 0.8, amplitude: 18, speed: 80 };
    } else if (remaining > tenMinutes) {
      const t = 1 - (remaining - tenMinutes) / (oneHour - tenMinutes);
      return {
        frequency: 0.8 + t * 0.7,
        amplitude: 18 + t * 6,
        speed: 80 + t * 60,
      };
    } else if (remaining > oneMinute) {
      const t = 1 - (remaining - oneMinute) / (tenMinutes - oneMinute);
      return {
        frequency: 1.5 + t * 0.8,
        amplitude: 24 + t * 4,
        speed: 140 + t * 80,
      };
    } else {
      const t = 1 - remaining / oneMinute;
      return {
        frequency: 2.3 + t * 0.7,
        amplitude: 28 + t * 2,
        speed: 220 + t * 80,
      };
    }
  }, [time.totalMs]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPulsePath(buildPulsePath(0, 1, 18));
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const delta = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;

      const { frequency, amplitude, speed } = getFrequencyAndAmplitude();
      offsetRef.current += (speed * delta) / 1000;
      setPulsePath(buildPulsePath(offsetRef.current, frequency, amplitude));
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [prefersReducedMotion, getFrequencyAndAmplitude]);

  const glowIntensity = isLive
    ? 1
    : Math.max(0.3, 1 - time.totalMs / 3_600_000);

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {label && (
        <span className="text-sm tracking-widest uppercase text-[var(--text-muted)]">
          {label}
        </span>
      )}

      <div
        className="font-display text-center transition-colors duration-500"
        style={{
          fontSize: isLive ? "4rem" : "3.5rem",
          lineHeight: 1,
          color: isLive ? "var(--accent-live)" : "var(--text-strong)",
          textShadow: isLive
            ? "0 0 24px rgba(255,45,85,0.6), 0 0 48px rgba(255,45,85,0.3)"
            : "none",
        }}
        aria-live="polite"
        role="timer"
      >
        {isLive ? "LIVE NOW" : `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)}`}
      </div>

      <div className="w-full max-w-[600px] relative" aria-hidden="true">
        {prefersReducedMotion ? (
          <div
            className="h-1 rounded-full mx-auto"
            style={{
              width: "60%",
              backgroundColor: "var(--accent-live)",
              animation: "live-pulse 1.4s ease-in-out infinite",
            }}
          />
        ) : (
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full"
            style={{ height: "80px", overflow: "visible" }}
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="pulse-glow">
                <feGaussianBlur
                  stdDeviation={3 + glowIntensity * 4}
                  result="blur"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient
                id="pulse-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor="var(--accent-live)"
                  stopOpacity="0"
                />
                <stop
                  offset="15%"
                  stopColor="var(--accent-live)"
                  stopOpacity={0.4 + glowIntensity * 0.3}
                />
                <stop
                  offset="50%"
                  stopColor="var(--accent-live)"
                  stopOpacity={0.8 + glowIntensity * 0.2}
                />
                <stop
                  offset="85%"
                  stopColor="var(--accent-live)"
                  stopOpacity={0.4 + glowIntensity * 0.3}
                />
                <stop
                  offset="100%"
                  stopColor="var(--accent-live)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <line
              x1="0"
              y1={BASELINE_Y}
              x2={SVG_WIDTH}
              y2={BASELINE_Y}
              stroke="var(--border-subtle)"
              strokeWidth="1"
            />

            {pulsePath && (
              <>
                <path
                  d={pulsePath}
                  fill="none"
                  stroke="url(#pulse-gradient)"
                  strokeWidth={2 + glowIntensity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#pulse-glow)"
                />
                <path
                  d={pulsePath}
                  fill="none"
                  stroke="var(--accent-live)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
              </>
            )}
          </svg>
        )}
      </div>

      {isLive && (
        <span className="live-badge text-sm">BROADCASTING</span>
      )}
    </div>
  );
}
