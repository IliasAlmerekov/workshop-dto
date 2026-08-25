"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Palette = { base: string; light: string; dark: string };
type Balloon = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  targetY: number;
  phase: number;
  palette: Palette;
  drawX: number;
  drawY: number;
};
type Particle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  color: string;
};

/* Existing palette families only. Signal Red stays reserved for validation. */
const PALETTES: Palette[] = [
  { base: "#1e62fd", light: "#a8c2fd", dark: "#0b3fd0" },
  { base: "#00267e", light: "#5b8dfe", dark: "#02205a" },
  { base: "#6b6bf2", light: "#cdcdfb", dark: "#15139c" },
];

const BALLOON_COUNT = 5;
const MOBILE_BALLOON_COUNT = 3;
const HEADER_GAP = 6;
const FALLBACK_HEADER_BOTTOM = 79;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Keep the balloon body just below the workshop app bar, never behind it. */
export function balloonTargetY(headerBottom: number, radius: number) {
  return headerBottom + radius + HEADER_GAP;
}

export function balloonContainsPoint(
  balloon: Pick<Balloon, "drawX" | "drawY" | "radius">,
  x: number,
  y: number,
) {
  const dx = x - balloon.drawX;
  const dy = y - balloon.drawY;
  return (
    (dx * dx) / (balloon.radius * balloon.radius) +
      (dy * dy) / (balloon.radius * 1.2) ** 2 <=
    1
  );
}

function createBalloon(width: number, height: number): Balloon {
  const radius = randomBetween(18, 31);
  const x = randomBetween(radius, Math.max(radius, width - radius));
  const y = height + radius + randomBetween(28, height * 0.35);
  return {
    x,
    y,
    radius,
    speed: randomBetween(78, 118),
    // Assigned after the app bar has been measured.
    targetY: height,
    phase: randomBetween(0, Math.PI * 2),
    palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
    drawX: x,
    drawY: y,
  };
}

function drawBalloon(context: CanvasRenderingContext2D, balloon: Balloon) {
  const { radius, palette } = balloon;
  context.save();
  context.translate(balloon.drawX, balloon.drawY);
  context.rotate(Math.sin(balloon.phase) * 0.055);
  context.globalAlpha = 0.9;
  context.beginPath();
  context.moveTo(0, radius);
  context.bezierCurveTo(
    -radius * 1.12,
    radius * 0.75,
    -radius * 1.2,
    -radius,
    0,
    -radius * 1.16,
  );
  context.bezierCurveTo(
    radius * 1.2,
    -radius,
    radius * 1.12,
    radius * 0.75,
    0,
    radius,
  );
  context.closePath();

  const fill = context.createRadialGradient(
    -radius * 0.32,
    -radius * 0.47,
    radius * 0.1,
    0,
    0,
    radius * 1.45,
  );
  fill.addColorStop(0, palette.light);
  fill.addColorStop(0.44, palette.base);
  fill.addColorStop(1, palette.dark);
  context.fillStyle = fill;
  context.fill();

  context.globalAlpha = 0.52;
  context.beginPath();
  context.moveTo(0, radius);
  context.bezierCurveTo(5, radius + 24, -7, radius + 46, 2, radius + 70);
  context.strokeStyle = "#66656e";
  context.lineWidth = 1;
  context.stroke();
  context.restore();
}

/** Five balloons rise to the workshop header and pop on pointer hover. */
export function BalloonsPopBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof CanvasRenderingContext2D === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    // The callbacks below outlive the ref narrowing, so hold stable DOM
    // bindings rather than repeatedly reading a nullable React ref.
    const drawingCanvas: HTMLCanvasElement = canvas;
    const drawingContext: CanvasRenderingContext2D = context;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTimestamp: number | null = null;
    let visible = true;
    let balloons: Balloon[] = [];
    let particles: Particle[] = [];

    function headerBottom() {
      const header = document.querySelector("header");
      const bottom = header?.getBoundingClientRect().bottom ?? 0;
      return bottom > 0 ? bottom : FALLBACK_HEADER_BOTTOM;
    }

    function resetBalloons(staticPosition = false) {
      const count = width < 640 ? MOBILE_BALLOON_COUNT : BALLOON_COUNT;
      balloons = Array.from({ length: count }, () => {
        const balloon = createBalloon(width, height);
        balloon.targetY = balloonTargetY(headerBottom(), balloon.radius);
        if (staticPosition) {
          balloon.y = balloon.targetY;
          balloon.drawX = balloon.x;
          balloon.drawY = balloon.y;
        }
        return balloon;
      });
    }

    function resize() {
      const bounds = drawingCanvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      drawingCanvas.width = Math.round(width * dpr);
      drawingCanvas.height = Math.round(height * dpr);
      drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      resetBalloons(reducedMotion);
    }

    function paint() {
      drawingContext.clearRect(0, 0, width, height);
      balloons.forEach((balloon) => drawBalloon(drawingContext, balloon));
      particles.forEach((particle) => {
        drawingContext.save();
        drawingContext.globalAlpha = Math.max(0, particle.life);
        drawingContext.fillStyle = particle.color;
        drawingContext.beginPath();
        drawingContext.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        drawingContext.fill();
        drawingContext.restore();
      });
    }

    function update(deltaSeconds: number) {
      balloons.forEach((balloon) => {
        balloon.y = Math.max(
          balloon.targetY,
          balloon.y - balloon.speed * deltaSeconds,
        );
        balloon.phase += deltaSeconds * 1.8;
        balloon.drawX = balloon.x + Math.sin(balloon.phase) * 7;
        balloon.drawY = balloon.y;
      });
      particles = particles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.dx * deltaSeconds,
          y: particle.y + particle.dy * deltaSeconds,
          dy: particle.dy + 70 * deltaSeconds,
          life: particle.life - deltaSeconds * 2.8,
        }))
        .filter((particle) => particle.life > 0);
    }

    function schedule() {
      if (!reducedMotion && visible && !document.hidden) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    function tick(timestamp: number) {
      const deltaSeconds = Math.min(
        0.05,
        (timestamp - (lastTimestamp ?? timestamp)) / 1_000,
      );
      lastTimestamp = timestamp;
      update(deltaSeconds);
      paint();
      schedule();
    }

    function pop(balloonIndex: number) {
      const balloon = balloons[balloonIndex];
      if (!balloon) return;
      particles.push(
        ...Array.from({ length: 10 }, () => ({
          x: balloon.drawX,
          y: balloon.drawY,
          dx: randomBetween(-110, 110),
          dy: randomBetween(-130, 55),
          life: 1,
          color: balloon.palette.base,
        })),
      );
      balloons[balloonIndex] = createBalloon(width, height);
      balloons[balloonIndex].targetY = balloonTargetY(
        headerBottom(),
        balloons[balloonIndex].radius,
      );
      if (reducedMotion) {
        const replacement = balloons[balloonIndex];
        replacement.y = replacement.targetY;
        replacement.drawX = replacement.x;
        replacement.drawY = replacement.y;
        particles = [];
      }
      paint();
    }

    function onPointerMove(event: PointerEvent) {
      const bounds = drawingCanvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const hitIndex = balloons.findIndex((balloon) => {
        return balloonContainsPoint(balloon, x, y);
      });
      if (hitIndex >= 0) {
        pop(hitIndex);
      }
    }

    function onVisibilityChange() {
      if (!document.hidden) {
        lastTimestamp = null;
        schedule();
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      paint();
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        lastTimestamp = null;
        schedule();
      } else {
        window.cancelAnimationFrame(frame);
      }
    });
    resizeObserver.observe(drawingCanvas);
    intersectionObserver.observe(drawingCanvas);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    resize();
    paint();
    schedule();

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="completion-balloons"
      className={cn(
        "pointer-events-none fixed inset-0 z-30 h-dvh w-screen",
        className,
      )}
    />
  );
}
