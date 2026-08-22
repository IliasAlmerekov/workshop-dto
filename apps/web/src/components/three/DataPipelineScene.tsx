"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox, Torus } from "@react-three/drei";
import gsap from "gsap";
import { ACESFilmicToneMapping } from "three";
import type { Group, Mesh } from "three";
import type { StackLayer } from "@/components/IsometricStack";

const LAYERS: StackLayer[] = [
  "Request DTO",
  "Mapper",
  "Entity",
  "Response DTO",
];
const SPACING = 1.35;

function stationPosition(index: number): number {
  return (index - (LAYERS.length - 1) / 2) * SPACING;
}

type StationProps = {
  index: number;
  active: boolean;
};

/** One of the four fixed pipeline stops — a ring the data object passes through. */
function Station({ index, active }: StationProps) {
  return (
    <Torus
      args={[0.55, 0.07, 24, 48]}
      position={[stationPosition(index), 0, 0]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial
        color={active ? "#2563eb" : "#71717a"}
        emissive={active ? "#2563eb" : "#000000"}
        emissiveIntensity={active ? 0.6 : 0}
        metalness={0.6}
        roughness={0.25}
      />
    </Torus>
  );
}

/**
 * The persistent data object (spec 11: "Das Datenobjekt verändert sichtbar
 * Form, Namen und Typen"). It doesn't change geometry between stations —
 * form change is out of scope for this pass — but it does travel to, and
 * visually intensify at, the active station, driven by GSAP rather than a
 * continuous per-frame animation (so the scene goes fully idle between
 * transitions instead of rendering every frame).
 */
function DataObject({ activeIndex }: { activeIndex: number }) {
  const ref = useRef<Mesh>(null);
  const { invalidate } = useThree();
  const targetX = stationPosition(activeIndex);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) {
      return;
    }
    const tween = gsap.to(mesh.position, {
      x: targetX,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });
    const pulse = gsap.fromTo(
      mesh.scale,
      { x: 0.85, y: 0.85, z: 0.85 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.6,
        ease: "back.out(2)",
        onUpdate: invalidate,
      },
    );
    return () => {
      tween.kill();
      pulse.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the target station should retrigger the tween
  }, [targetX]);

  return (
    <RoundedBox
      ref={ref}
      args={[0.7, 0.7, 0.7]}
      radius={0.12}
      position={[targetX, 0, 0]}
    >
      <meshPhysicalMaterial
        color="#eff4ff"
        metalness={0.2}
        roughness={0.15}
        clearcoat={1}
        clearcoatRoughness={0.1}
        emissive="#2563eb"
        emissiveIntensity={0.25}
      />
    </RoundedBox>
  );
}

function Rig({ activeIndex }: { activeIndex: number }) {
  const groupRef = useRef<Group>(null);
  const { invalidate } = useThree();

  useEffect(() => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    const tween = gsap.to(group.rotation, {
      y: (activeIndex - (LAYERS.length - 1) / 2) * 0.05,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <group ref={groupRef} rotation={[0.32, 0, 0]}>
      {LAYERS.map((_, index) => (
        <Station key={index} index={index} active={index === activeIndex} />
      ))}
      <DataObject activeIndex={activeIndex} />
    </group>
  );
}

/**
 * `frameloop="demand"` only paints on an explicit invalidate() — but the
 * async pieces of this scene (Environment's PMREM texture, GSAP's tween
 * startup) don't reliably line up with exactly the commits R3F auto-invalidates
 * on. Rather than depend on that timing, this repaints for a short warm-up
 * window after mount (and after every activeIndex change) and then goes
 * fully idle, which is simpler to reason about than chasing every async
 * source of a missed invalidate individually.
 */
function RenderWarmUp({ activeIndex }: { activeIndex: number }) {
  const remaining = useRef(0);
  const { invalidate } = useThree();

  useEffect(() => {
    remaining.current = 40;
    invalidate();
  }, [activeIndex, invalidate]);

  useFrame(() => {
    if (remaining.current > 0) {
      remaining.current -= 1;
      invalidate();
    }
  });

  return null;
}

/** Procedural environment lighting — no downloaded HDRI file (DESIGN.md's asset rule: no third-party CDN at runtime, everything either local or generated). */
function StudioLighting() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={2.5} position={[0, 4, 2]} scale={[6, 6, 1]} />
      <Lightformer
        intensity={1.4}
        rotation={[0, Math.PI / 2, 0]}
        position={[-4, 1, 0]}
        scale={[6, 2, 1]}
      />
      <Lightformer
        intensity={1.4}
        rotation={[0, -Math.PI / 2, 0]}
        position={[4, 1, 0]}
        scale={[6, 2, 1]}
      />
    </Environment>
  );
}

type DataPipelineSceneProps = {
  activeLayer: StackLayer;
  size: number;
};

/**
 * `frameloop="demand"` from the very first frame proved unreliable here:
 * the initial paint (which has to wait on Environment's async PMREM
 * texture resolving inside Suspense) doesn't reliably happen even with an
 * explicit invalidate() loop backing it up — verified by sampling actual
 * canvas pixels, not just visual inspection. Starting in "always" for one
 * short settle window sidesteps that specific timing gap entirely (it's
 * the same mode already proven to render correctly), then handing off to
 * "demand" once the scene has painted keeps the "no continuous rendering
 * while idle" property for everything after that.
 */
const SETTLE_WINDOW_MS = 1800;

export function DataPipelineScene({
  activeLayer,
  size,
}: DataPipelineSceneProps) {
  const activeIndex = useMemo(
    () => Math.max(0, LAYERS.indexOf(activeLayer)),
    [activeLayer],
  );
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSettled(true), SETTLE_WINDOW_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={settled ? "demand" : "always"}
        gl={{
          antialias: true,
          powerPreference: "low-power",
          toneMapping: ACESFilmicToneMapping,
        }}
        camera={{ position: [0, 1.5, 5.5], fov: 45 }}
      >
        {/*
          Light and depth stay sparing and native rather than via a
          postprocessing pass: @react-three/postprocessing's EffectComposer
          was tried here and reliably produced a fully blank canvas in
          testing (every sampled pixel read back [0,0,0,0] with it present,
          restored the instant it was removed) — a real compatibility
          problem, not a cosmetic one, so shipping it would risk the exact
          same blank pipeline for participants. Film-tone-mapped lighting
          plus exponential fog achieve the same "light and depth, used
          sparingly" goal (spec 11) through the renderer's own built-in
          features, which are verified working.
        */}
        <fog attach="fog" args={["#f4f4f5", 6, 14]} />
        <ambientLight intensity={0.35} />
        {/* Environment generates its PMREM texture asynchronously — without
            a Suspense boundary around it, frameloop="demand" has nothing to
            invalidate() when that promise resolves, and the canvas stays on
            its (incompletely lit) first frame forever. */}
        <Suspense fallback={null}>
          <StudioLighting />
          <Rig activeIndex={activeIndex} />
          <RenderWarmUp activeIndex={activeIndex} />
        </Suspense>
      </Canvas>
    </div>
  );
}
