"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Line,
  MeshTransmissionMaterial,
  PerspectiveCamera,
  Text,
  useTexture,
} from "@react-three/drei";
import {
  BackSide,
  DataTexture,
  ExtrudeGeometry,
  FrontSide,
  LinearFilter,
  MathUtils,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  Vector2,
  Vector3,
  type Group,
  type PointLight,
  type Texture,
} from "three";
import type { SceneQuality } from "@/lib/three/quality";
import type { Language } from "@/lib/workshop/types";
import {
  DTO_LAYERS,
  LAYER_PITCH,
  SLAB,
  layerPosition,
  layerSeparationOffset,
} from "./dtoLayers";
import {
  CONNECTOR_NODE_TONES,
  HERO_BUSY_MS,
  HERO_IDLE_FRAME_STRIDE,
  HERO_INTRO,
  HERO_INTRO_TOTAL_S,
  HERO_SEPARATION,
  HERO_SEPARATION_DAMP,
  HERO_TRANSITION_MS,
  TRACK_FOCUS_LAYER_INDEX,
  TRACK_PREVIEWS,
} from "./heroMotion";

/**
 * The hero illustration as liquid glass: four thick cast blocks floating in a
 * neutral high-key photographic studio.
 *
 * The material is Drei's physically based transmission volume with a
 * restrained frosted microsurface, not an opaque translucent fill. Light
 * enters the block, picks up the illustration's restrained lavender
 * attenuation over the optical path,
 * and leaves through the rolled rim carrying the local HDRI's softbox
 * reflections.
 *
 * Colours are literals here because three.js takes colours, not CSS custom
 * properties; each one names the design token it mirrors so a token change has
 * a findable second home. The renderer runs unmapped (`flat`), so every value
 * here is the token's own hex rather than a scene-linear stand-in.
 */
/** `bg/canvas`: the scene paints the page's own backdrop so the glass has
 *  something to refract and the canvas leaves no seam against the page. */
const BACKDROP = "#f6f6f6";

/**
 * Poly Haven's **Studio Small 08** (CC0), versioned locally at 1K. This is the
 * authored environment from DESIGN.md: its asymmetric softboxes create the
 * long rim reflections the reference depends on.
 */
const ENVIRONMENT = "/hdri/studio_small_08_1k.hdr";
const GLASS_NORMAL_MAP = "/textures/glass-frosted-001-normal.jpg";

/**
 * The reference keeps three boundaries milky and nearly colourless. Only the
 * active boundary carries a visible lavender core, so the colour creates one
 * clear point of attention instead of turning the stack into four opaque bars.
 */
const GLASS_PASSIVE = "#e8e8ea"; // reference neutral top face
const GLASS_ACTIVE = "#cdcdfb"; // reference Mapper top face
const GLASS_ATTENUATION_PASSIVE = "#d9dbea"; // reference neutral side
const GLASS_ATTENUATION_ACTIVE = "#b0b0f4"; // reference Mapper core
const GLASS_ATTENUATION_DISTANCE_PASSIVE = 5.2;
const GLASS_ATTENUATION_DISTANCE_ACTIVE = 2.3;
const MAPPER_LIGHT = "#6b6bf2"; // lavender/500, emitted only inside the illustration

const LABEL_INK = "#0a0a0a"; // neutral/black
const LABEL_MUTED = "#26262c"; // reference Entity label, held up against bright frost
const LABEL_ACCENT = "#15139c"; // reference Mapper label
const LABEL_COOL = "#6673b3"; // reference Response DTO label

const CONNECTOR = "#a8b2e8"; // reference primary dashed leader
const CONNECTOR_MUTED = "#c4c5cf"; // reference muted dashed leader
const CONNECTOR_NODE = "#4a6bfa"; // reference primary node
const CONNECTOR_NODE_MUTED = "#c2c3cd"; // reference muted node
const LABEL_FONT = "/fonts/inter-latin-500-normal.woff";

/**
 * Where the camera sits, as a unit vector. The distance along it is chosen per
 * viewport so the stack is framed the same way in the hero's tall column and
 * in the short block it occupies on a phone.
 */
const CAMERA_DIRECTION = [0.615, 0.538, 0.615] as const;
const FOV = 24.5;
/**
 * Screen-space extent the stack needs, in world units, plus its margin.
 *
 * The margin is most of the point. The four slabs plus the connector network
 * measure roughly 8.4 × 7.6, and framing them that tightly put the top slab's
 * far corner on the container's own edge — the illustration read as cropped,
 * and the connectors were pushed off frame to the left entirely. The extra
 * units here are the reference's air, which is what lets the stack float.
 */
const FRAME_HEIGHT = 10.8;
const FRAME_WIDTH = 9.9;

type GlassSurfaceMaps = {
  normal: Texture;
};

/**
 * 3DTextures.me's **Glass Frosted 001** (CC0), stored locally at 1K.
 *
 * The normal map contains a tiny, irregular acid-etched grain. Roughness is
 * intentionally numerical: the source roughness map's high-frequency contrast
 * produced striped reflections at hero scale, while the requested resin needs
 * one quiet, even frost.
 */
function useGlassSurfaceMaps(): GlassSurfaceMaps {
  const source = useTexture(GLASS_NORMAL_MAP);
  const normal = useMemo(() => {
    const texture = source.clone();
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, [source]);

  useEffect(() => () => normal.dispose(), [normal]);

  return useMemo(() => ({ normal }), [normal]);
}

/**
 * A transparent photographic light card below the active shell's top surface.
 * Alpha fades continuously to zero, so neither the plane nor an ellipse edge
 * can become visible; only a wide lavender feather and its denser lavender
 * core survive the shell's milky transmission.
 */
function buildInnerGlowTexture(): Texture {
  const width = 256;
  const height = 128;
  const data = new Uint8Array(width * height * 4);
  const outer = [233, 233, 251]; // #e9e9fb — reference glow edge
  const glowCore = [176, 176, 244]; // #b0b0f4 — reference Mapper core

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = ((x + 0.5) / width - 0.54) / 0.5;
      const dy = ((y + 0.5) / height - 0.46) / 0.5;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const feather = Math.pow(1 - MathUtils.smoothstep(radius, 0.02, 1), 1.35);
      const core = Math.pow(1 - MathUtils.smoothstep(radius, 0.02, 0.58), 1.65);
      const index = (y * width + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        data[index + channel] = Math.round(
          MathUtils.lerp(outer[channel], glowCore[channel], core),
        );
      }
      data[index + 3] = Math.round(feather * 255);
    }
  }

  const texture = new DataTexture(data, width, height, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A neutral optical field for the resin volume. Screen-space transmission
 * captured the other three slabs and their labels as dark bands; a uniform
 * near-white field keeps the subtle depth/attenuation response while removing
 * recognizable scene shapes from the material entirely.
 */
function buildResinTransmissionBuffer(): Texture {
  const texture = new DataTexture(
    new Uint8Array([
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
      255,
    ]),
    2,
    2,
    RGBAFormat,
  );
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function InnerGlow() {
  const texture = useSharedInnerGlow();

  return (
    <mesh
      renderOrder={1}
      position={[0.12, SLAB.height * 0.18, -0.06]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[SLAB.width * 0.94, SLAB.depth * 0.86]} />
      <meshBasicMaterial
        map={texture}
        color="#ffffff"
        transparent
        opacity={0.28}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * One slab as a rounded rectangle extruded into a thick block with a rounded
 * rim. `RoundedBox` fillets all twelve edges with one radius, which cannot
 * hold the reference's proportion: generous corners in plan, a much tighter
 * roll on the top and bottom rims. So the profile carries the corner radius
 * and the extrusion's bevel carries the rim.
 *
 * The rim is the point. A hard edge reflects the studio in a single thin line;
 * a rolled one sweeps the softbox across it and produces the broad white
 * highlight that makes the block read as cast glass rather than as a decal.
 *
 * The profile is inset by the bevel and the extrusion shortened by twice it,
 * so the finished block measures exactly `width × height × depth`.
 */
function buildSlabGeometry(): ExtrudeGeometry {
  {
    const { width, depth, height, radius, bevel } = SLAB;
    const halfWidth = width / 2 - bevel;
    const halfDepth = depth / 2 - bevel;
    const corner = radius - bevel;

    const profile = new Shape();
    profile.moveTo(-halfWidth + corner, -halfDepth);
    profile.lineTo(halfWidth - corner, -halfDepth);
    profile.absarc(
      halfWidth - corner,
      -halfDepth + corner,
      corner,
      -Math.PI / 2,
      0,
    );
    profile.lineTo(halfWidth, halfDepth - corner);
    profile.absarc(
      halfWidth - corner,
      halfDepth - corner,
      corner,
      0,
      Math.PI / 2,
    );
    profile.lineTo(-halfWidth + corner, halfDepth);
    profile.absarc(
      -halfWidth + corner,
      halfDepth - corner,
      corner,
      Math.PI / 2,
      Math.PI,
    );
    profile.lineTo(-halfWidth, -halfDepth + corner);
    profile.absarc(
      -halfWidth + corner,
      -halfDepth + corner,
      corner,
      Math.PI,
      Math.PI * 1.5,
    );

    const core = height - bevel * 2;
    const geometry = new ExtrudeGeometry(profile, {
      depth: core,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: 0,
      bevelSegments: 5,
      curveSegments: 24,
    });
    geometry.translate(0, 0, -core / 2);
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    return geometry;
  }
}

/**
 * The four slabs are geometrically identical, so the extrusion is built once
 * and shared. Building it per layer cost four rounded-rect extrusions (with
 * normals) on the main thread during exactly the frames the opening move needs.
 *
 * They live for as long as the scene does and are released on its unmount, so
 * no layer can dispose a resource its siblings are still drawing with.
 */
let sharedSlabGeometry: ExtrudeGeometry | null = null;
let sharedInnerGlow: Texture | null = null;
let sharedResinTransmissionBuffer: Texture | null = null;

function useSharedSlabGeometry(): ExtrudeGeometry {
  return (sharedSlabGeometry ??= buildSlabGeometry());
}

function useSharedInnerGlow(): Texture {
  return (sharedInnerGlow ??= buildInnerGlowTexture());
}

function useSharedResinTransmissionBuffer(): Texture {
  return (sharedResinTransmissionBuffer ??= buildResinTransmissionBuffer());
}

function useReleaseSharedAssetsOnUnmount() {
  useEffect(
    () => () => {
      sharedSlabGeometry?.dispose();
      sharedSlabGeometry = null;
      sharedInnerGlow?.dispose();
      sharedInnerGlow = null;
      sharedResinTransmissionBuffer?.dispose();
      sharedResinTransmissionBuffer = null;
    },
    [],
  );
}

type LayerProps = {
  index: number;
  quality: SceneQuality;
  surface: GlassSurfaceMaps;
  reducedMotion: boolean;
  /** True once the canvas is on screen, which is when the entrance may start. */
  revealed: boolean;
  focusIndex: number | null;
  selectedTrack: Language | null;
  expanded: boolean;
  /** The pointer is over the illustration: open the stack further. */
  hovered: boolean;
};

function GlassLayer({
  index,
  quality,
  surface,
  reducedMotion,
  revealed,
  focusIndex,
  selectedTrack,
  expanded,
  hovered,
}: LayerProps) {
  const layer = DTO_LAYERS[index];
  const active = (focusIndex ?? 1) === index;
  // The reference opens on Mapper: one violet label and one optical core,
  // with the remaining boundaries returning to neutral glass.
  // Explicit workshop focus still moves that same single accent as before.
  const lit = active;
  const glassColour = lit ? GLASS_ACTIVE : GLASS_PASSIVE;
  const attenuationColour = lit
    ? GLASS_ATTENUATION_ACTIVE
    : GLASS_ATTENUATION_PASSIVE;
  const attenuationDistance = lit
    ? GLASS_ATTENUATION_DISTANCE_ACTIVE
    : GLASS_ATTENUATION_DISTANCE_PASSIVE;
  const transmission = lit ? 0.56 : 0.74;
  const rimColour = lit ? "#c8c8fa" : "#ffffff";
  const labelColour = active
    ? LABEL_ACCENT
    : layer.tone === "ink"
      ? LABEL_INK
      : layer.tone === "cool"
        ? LABEL_COOL
        : LABEL_MUTED;
  const geometry = useSharedSlabGeometry();
  const transmissionBuffer = useSharedResinTransmissionBuffer();
  const rest = useMemo(() => layerPosition(index), [index]);
  const height = SLAB.height;
  const animated = useRef<Group>(null);
  const startedAt = useRef<number | null>(null);
  const transitionStartedAt = useRef<number | null>(null);
  const previewMix = useRef(0);
  const hoverMix = useRef(0);
  const invalidate = useThree((state) => state.invalidate);
  const compressed = useMemo<[number, number, number]>(
    () => [rest[0] - 0.14, rest[1] * 0.22 + 0.08, rest[2] + 0.12],
    [rest],
  );
  const transmissionSamples =
    quality.tier === "high" ? 32 : quality.tier === "medium" ? 24 : 16;
  const transmissionResolution =
    quality.tier === "high" ? 512 : quality.tier === "medium" ? 384 : 256;
  const glassNormalScale = useMemo(() => new Vector2(0.004, 0.004), []);

  useEffect(() => {
    if (!selectedTrack) {
      transitionStartedAt.current = null;
    }
  }, [selectedTrack]);

  useFrame(({ clock }, delta) => {
    const group = animated.current;
    if (!group || reducedMotion) {
      return;
    }

    const now = clock.getElapsedTime();

    // The entrance is clocked from the reveal, not from the scene's first
    // frame. Shader compilation, the HDRI and the transmission buffers all sit
    // between those two moments, so timing the move from mount used to spend
    // its most legible part behind a canvas that was still at opacity 0 — and
    // left only the crawling tail of a 1.9s quart to be seen. Held here, the
    // stack is still fully compressed when the material starts to dissolve in.
    if (!revealed) {
      return;
    }
    if (startedAt.current === null) {
      startedAt.current = now;
    }

    const elapsed =
      now - startedAt.current - HERO_INTRO.leadS - index * HERO_INTRO.staggerS;
    const progress = MathUtils.clamp(elapsed / HERO_INTRO.durationS, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    // The ambient float fades in over its own ramp instead of switching on at
    // a fixed clock time. Its phase is `index`-offset, so an abrupt start put
    // each slab at a different non-zero offset — four simultaneous small pops
    // right after the stack had settled.
    const settled = now - startedAt.current - HERO_INTRO_TOTAL_S;
    const idleRamp = MathUtils.smoothstep(settled, 0, HERO_INTRO.idleRampS);

    previewMix.current = MathUtils.damp(
      previewMix.current,
      expanded ? 1 : 0,
      HERO_SEPARATION_DAMP.picker,
      delta,
    );
    hoverMix.current = MathUtils.damp(
      hoverMix.current,
      hovered ? 1 : 0,
      HERO_SEPARATION_DAMP.hover,
      delta,
    );

    if (selectedTrack && transitionStartedAt.current === null) {
      transitionStartedAt.current = now;
    }
    const transitionProgress =
      transitionStartedAt.current !== null
        ? MathUtils.clamp(
            ((now - transitionStartedAt.current) * 1000) / HERO_TRANSITION_MS,
            0,
            1,
          )
        : 0;
    const transitionEase = 1 - Math.pow(1 - transitionProgress, 3);
    const spread = index - (DTO_LAYERS.length - 1) / 2;
    // The two separations add, so hovering an already-previewed stack opens it
    // further still rather than snapping to a single "open" pose.
    const previewOffset = layerSeparationOffset(
      index,
      previewMix.current * HERO_SEPARATION.picker.y +
        hoverMix.current * HERO_SEPARATION.hover.y,
      previewMix.current * HERO_SEPARATION.picker.z +
        hoverMix.current * HERO_SEPARATION.hover.z,
    );
    const idleY = Math.sin(now * 0.6 + index * 1.37) * 0.014 * idleRamp;
    const idleZ = Math.sin(now * 0.48 + index * 1.73) * 0.012 * idleRamp;

    group.position.set(
      MathUtils.lerp(compressed[0], rest[0], eased),
      MathUtils.lerp(compressed[1], rest[1], eased) +
        idleY +
        previewOffset[0] +
        -spread * transitionEase * 0.1,
      MathUtils.lerp(compressed[2], rest[2], eased) +
        idleZ +
        previewOffset[1] +
        spread * transitionEase * 0.22,
    );
    group.rotation.y = MathUtils.lerp(-0.045, 0, eased);

    if (
      progress < 1 ||
      transitionProgress < 1 ||
      previewMix.current > 0.001 ||
      hoverMix.current > 0.001
    ) {
      invalidate();
    }
  });

  return (
    <group ref={animated} position={reducedMotion ? rest : compressed}>
      <mesh geometry={geometry}>
        <MeshTransmissionMaterial
          // A neutral authored buffer prevents the three other slabs and their
          // labels from reappearing as dark screen-space refraction bands.
          buffer={transmissionBuffer}
          transmission={transmission}
          thickness={0.62}
          ior={1.41}
          roughness={0.24}
          normalMap={surface.normal}
          normalScale={glassNormalScale}
          chromaticAberration={0}
          anisotropy={0}
          anisotropicBlur={0}
          distortion={0}
          temporalDistortion={0}
          samples={transmissionSamples}
          resolution={transmissionResolution}
          side={FrontSide}
          metalness={0}
          clearcoat={0.42}
          clearcoatRoughness={0.22}
          envMapIntensity={0.26}
          color={glassColour}
          attenuationColor={attenuationColour}
          attenuationDistance={attenuationDistance}
        />
      </mesh>

      {/* The active rim carries the reference's lavender edge; the remaining
          rims stay almost white against the canvas. */}
      <mesh geometry={geometry} scale={1.004}>
        <meshBasicMaterial
          side={BackSide}
          color={rimColour}
          transparent
          opacity={lit ? 0.2 : 0.03}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {lit ? <InnerGlow /> : null}

      <Text
        font={LABEL_FONT}
        fontSize={layer.labelSize}
        letterSpacing={-0.014}
        color={labelColour}
        anchorX="center"
        anchorY="middle"
        depthOffset={-2}
        renderOrder={10 + index}
        position={[layer.labelShift, height / 2 + 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material-depthTest={false}
        material-depthWrite={false}
        material-toneMapped={false}
      >
        {layer.label}
      </Text>
    </group>
  );
}

/**
 * The dashed leader lines and nodes from the reference. They are scene
 * geometry rather than an SVG overlay so they stay locked to the layers they
 * point at under any viewport aspect ratio, and so the glass refracts them.
 */
function ConnectorNodePattern({
  positions,
}: {
  positions: ReadonlyArray<readonly [number, number, number]>;
}) {
  return positions.map((position, index) => {
    const tone = CONNECTOR_NODE_TONES[index];
    return (
      <mesh key={`connector-node-${index}`} position={position}>
        <sphereGeometry args={[0.048, 20, 20]} />
        <meshBasicMaterial
          color={tone === "accent" ? CONNECTOR_NODE : CONNECTOR_NODE_MUTED}
          transparent
          opacity={tone === "accent" ? 0.9 : 0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    );
  });
}

function Connectors() {
  const outerX = -SLAB.width / 2 - 2.06;
  const innerX = -SLAB.width / 2 - 1.81;
  const endX = -SLAB.width / 2 + 0.06;
  const topY = layerPosition(0)[1] - 0.16;
  const bottomY = layerPosition(3)[1] - 0.18;
  const lineProps = {
    lineWidth: 1,
    dashed: true,
    dashSize: 0.07,
    gapSize: 0.09,
    transparent: true,
  } as const;
  const nodePositions = DTO_LAYERS.map((_, index) => {
    const [, y, z] = layerPosition(index);
    const trunkX = index === 1 || index === 2 ? innerX : outerX;
    return [trunkX, y + LAYER_PITCH * 0.11, z] as const;
  });

  return (
    <group>
      <group>
        <Line
          points={[
            [outerX, topY, -0.08],
            [outerX, bottomY, 0.34],
          ]}
          color={CONNECTOR}
          {...lineProps}
        />
        <Line
          points={[
            [innerX, layerPosition(1)[1] + 0.54, 0.02],
            [innerX, layerPosition(3)[1] + 0.18, 0.3],
          ]}
          color={CONNECTOR_MUTED}
          {...lineProps}
        />
        {DTO_LAYERS.map((layer, index) => {
          const [, y, z] = layerPosition(index);
          const trunkX = index === 1 || index === 2 ? innerX : outerX;
          const nodeY = y + LAYER_PITCH * 0.11;
          const muted = index >= 2;

          return (
            <group key={layer.id}>
              <Line
                points={[
                  [trunkX, nodeY, z],
                  [trunkX + 0.56, nodeY, z],
                  [endX, y, z],
                ]}
                color={muted ? CONNECTOR_MUTED : CONNECTOR}
                {...lineProps}
              />
              <mesh position={[endX, y, z]}>
                <sphereGeometry args={[0.042, 20, 20]} />
                <meshBasicMaterial
                  color={muted ? CONNECTOR_NODE_MUTED : CONNECTOR_NODE}
                  transparent
                  opacity={muted ? 0.48 : 0.82}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          );
        })}
        {[topY, bottomY].map((y, index) => (
          <mesh
            key={`outer-end-${y}`}
            position={[outerX, y, index * 0.42 - 0.08]}
          >
            <sphereGeometry args={[0.044, 20, 20]} />
            <meshBasicMaterial
              color={index === 0 ? CONNECTOR_NODE : CONNECTOR_NODE_MUTED}
              transparent
              opacity={index === 0 ? 0.9 : 0.46}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
        {[
          [innerX, layerPosition(1)[1] + 0.54, 0.02],
          [innerX, layerPosition(3)[1] + 0.18, 0.3],
        ].map(([x, y, z], index) => (
          <mesh key={`inner-end-${index}`} position={[x, y, z]}>
            <sphereGeometry args={[0.04, 20, 20]} />
            <meshBasicMaterial
              color={index === 0 ? CONNECTOR_NODE : CONNECTOR_NODE_MUTED}
              transparent
              opacity={index === 0 ? 0.78 : 0.42}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      <ConnectorNodePattern positions={nodePositions} />
    </group>
  );
}

/**
 * Drives the demand loop from `requestAnimationFrame` rather than a timer.
 *
 * A 42ms `setInterval` asked for ~24 rendered frames per second on a cadence
 * that has no relationship to the display's refresh: every render landed at a
 * different phase within its vsync interval, so frames were alternately shown
 * twice and dropped. That is what read as the stack not appearing smoothly —
 * not the easing, and not the frame cost. The animations here are all
 * delta-corrected, so the jitter never showed up as wrong positions, only as
 * an uneven cadence, which is the harder kind of stutter to place.
 *
 * On rAF every render is vsync-aligned and `delta` is even. Full rate is spent
 * where it is legible — the opening move and a track commit — and the ambient
 * float, whose whole amplitude is 0.014 world units, renders every third frame.
 * That is still a vsync-locked cadence, just a slower one, so it reads as calm
 * rather than choppy while costing a third of the fill-rate-bound refraction
 * work. `frameloop="demand"` is what makes this gating possible at all: the
 * loop also sleeps with the tab and whenever the canvas leaves the viewport.
 */
function SceneMotionDriver({
  enabled,
  busyKey,
}: {
  enabled: boolean;
  /** Any change re-opens the full-rate window. */
  busyKey: string;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const busyUntil = useRef(0);

  useEffect(() => {
    busyUntil.current = performance.now() + HERO_BUSY_MS;
  }, [busyKey]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let inView = true;
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
          });
    observer?.observe(canvas);

    let frame = 0;
    let tick = 0;
    const step = () => {
      frame = requestAnimationFrame(step);
      if (!inView || document.visibilityState === "hidden") {
        return;
      }

      tick += 1;
      if (
        performance.now() < busyUntil.current ||
        tick % HERO_IDLE_FRAME_STRIDE === 0
      ) {
        invalidate();
      }
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [canvas, enabled, invalidate]);

  return null;
}

export type DtoLayerStackSceneProps = {
  quality: SceneQuality;
  reducedMotion: boolean;
  previewTrack: Language | null;
  selectedTrack: Language | null;
  expanded: boolean;
  /** The pointer is over the illustration: open the stack further. */
  hovered: boolean;
  /**
   * Index into `DTO_LAYERS` to light, overriding the track-derived focus.
   * The hero leaves it null and lets the chosen language move the accent;
   * the workshop names the boundary its active exercise is about.
   */
  focusLayerIndex: number | null;
  /**
   * True once the canvas is visible on the page. The opening move waits for
   * it, so the entrance is never spent behind a transparent canvas.
   */
  revealed: boolean;
  onReady: () => void;
};

/** Frames that must come in under `CALM_FRAME_S` before the scene is revealed. */
const CALM_FRAMES = 2;
const MIN_WARMUP_FRAMES = 3;
/** Never hold the reveal longer than this many frames, however slow the device. */
const MAX_WARMUP_FRAMES = 12;
/** Roughly two vsync intervals at 60Hz: no compile or upload spike left. */
const CALM_FRAME_S = 0.034;

/**
 * Reveal the DOM only once the renderer is actually keeping up. A React effect
 * merely proves that the scene mounted, and a fixed three-frame count proves
 * only that three frames happened — the four transmission materials compile
 * their shaders on first draw, so one of those frames can take 200ms on its
 * own. Revealing into that spike put the hitch exactly where it was most
 * visible: the first moment the user sees the illustration.
 *
 * So the gate is frame *time*, not frame count: a minimum warm-up, then two
 * consecutive frames inside a normal budget, capped so a genuinely slow device
 * still gets its scene rather than a permanent loading study.
 */
function ReadyAfterWarmup({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const calm = useRef(0);
  const sent = useRef(false);
  const invalidate = useThree((state) => state.invalidate);

  useFrame((_, delta) => {
    if (sent.current) {
      return;
    }

    frames.current += 1;
    calm.current = delta < CALM_FRAME_S ? calm.current + 1 : 0;

    const settled =
      frames.current >= MIN_WARMUP_FRAMES && calm.current >= CALM_FRAMES;
    if (!settled && frames.current < MAX_WARMUP_FRAMES) {
      invalidate();
      return;
    }

    sent.current = true;
    requestAnimationFrame(onReady);
  });

  return null;
}

const CAMERA_Y_AXIS = new Vector3(0, 1, 0);

function CameraRig({
  previewTrack,
  selectedTrack,
  focusLayerIndex,
  reducedMotion,
}: {
  previewTrack: Language | null;
  selectedTrack: Language | null;
  focusLayerIndex: number | null;
  reducedMotion: boolean;
}) {
  const camera = useRef<ComponentRef<typeof PerspectiveCamera>>(null);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const distance = useRef(1);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dolly = useRef(0);
  const focusPan = useRef(0);
  const transitionStartedAt = useRef<number | null>(null);
  const direction = useMemo(
    () => new Vector3(...CAMERA_DIRECTION).normalize(),
    [],
  );
  const offset = useMemo(() => new Vector3(), []);
  const rightAxis = useMemo(
    () => new Vector3(CAMERA_DIRECTION[2], 0, -CAMERA_DIRECTION[0]).normalize(),
    [],
  );

  useEffect(() => {
    if (!selectedTrack) {
      transitionStartedAt.current = null;
    }
  }, [selectedTrack]);

  useLayoutEffect(() => {
    const view = camera.current;
    if (!view) {
      return;
    }

    const aspect = size.width / Math.max(1, size.height);
    const reach = 2 * Math.tan(MathUtils.degToRad(FOV) / 2);
    distance.current = Math.max(
      FRAME_HEIGHT / reach,
      FRAME_WIDTH / (reach * aspect),
    );

    view.position.set(
      CAMERA_DIRECTION[0] * distance.current,
      CAMERA_DIRECTION[1] * distance.current,
      CAMERA_DIRECTION[2] * distance.current,
    );
    view.lookAt(0, -0.18, 0);
    view.updateProjectionMatrix();
    invalidate();
  }, [size, invalidate]);

  useFrame(({ clock, pointer }, delta) => {
    const view = camera.current;
    if (!view || reducedMotion) {
      return;
    }

    const now = clock.getElapsedTime();
    if (selectedTrack && transitionStartedAt.current === null) {
      transitionStartedAt.current = now;
    }
    const transitionProgress =
      transitionStartedAt.current !== null
        ? MathUtils.clamp(
            ((now - transitionStartedAt.current) * 1000) / HERO_TRANSITION_MS,
            0,
            1,
          )
        : 0;
    const transitionEase = 1 - Math.pow(1 - transitionProgress, 3);
    const track = selectedTrack ?? previewTrack;
    const trackYaw = track ? TRACK_PREVIEWS[track].cameraYaw : 0;
    const pointerYaw = selectedTrack ? 0 : pointer.x * 1.15;
    const pointerPitch = selectedTrack ? 0 : -pointer.y * 0.72;

    yaw.current = MathUtils.damp(
      yaw.current,
      MathUtils.degToRad(trackYaw + pointerYaw),
      4.2,
      delta,
    );
    pitch.current = MathUtils.damp(
      pitch.current,
      MathUtils.degToRad(pointerPitch),
      4.2,
      delta,
    );
    dolly.current = MathUtils.damp(dolly.current, transitionEase, 5.5, delta);
    // A named focus leans the camera towards that slab instead of cutting to
    // it: a fraction of the layer's height, so the other three boundaries
    // stay in frame and the move reads as attention, not navigation.
    focusPan.current = MathUtils.damp(
      focusPan.current,
      focusLayerIndex === null ? 0 : layerPosition(focusLayerIndex)[1] * 0.34,
      3.2,
      delta,
    );

    offset
      .copy(direction)
      .applyAxisAngle(CAMERA_Y_AXIS, yaw.current)
      .applyAxisAngle(rightAxis, pitch.current)
      .multiplyScalar(distance.current * (1 - dolly.current * 0.24));
    view.position.copy(offset);
    view.lookAt(
      0,
      MathUtils.lerp(-0.18, layerPosition(1)[1], dolly.current * 0.9) +
        focusPan.current,
      MathUtils.lerp(0, -0.18, dolly.current),
    );
  });

  return <PerspectiveCamera ref={camera} makeDefault fov={FOV} />;
}

/**
 * The studio HDRI does the material shaping; these lights place the asymmetric
 * highlights it cannot aim. A broad RectAreaLight gives the resin one low-
 * contrast softbox gradient, while a weak cool fill keeps the far edge from
 * collapsing into the page.
 *
 * None of them casts a shadow map. Clear glass under a directional light casts
 * a flat opaque rectangle — the one thing that would immediately read as fake
 * here — so the only shadow in the scene is the soft contact pool the blocks
 * float over, which is rendered from depth and needs no shadow map at all. A
 * The tiny internal point light only lets the active slab breathe onto its
 * neighbour; the radial card, not a blue reflection, carries the accent.
 */
function StudioLights({
  engaged,
  transitioning,
  reducedMotion,
  activeLayerIndex,
}: {
  engaged: boolean;
  transitioning: boolean;
  reducedMotion: boolean;
  activeLayerIndex: number;
}) {
  const mapperLight = useRef<PointLight>(null);

  useFrame(({ clock }, delta) => {
    const light = mapperLight.current;
    if (!light || reducedMotion) {
      return;
    }

    const pulse = Math.sin(clock.getElapsedTime() * 0.78) * 0.005;
    const target =
      0.14 + pulse + (engaged ? 0.015 : 0) + (transitioning ? 0.01 : 0);
    light.intensity = MathUtils.damp(light.intensity, target, 4, delta);
    light.position.y = MathUtils.damp(
      light.position.y,
      layerPosition(activeLayerIndex)[1] - SLAB.height * 0.62,
      4,
      delta,
    );
  });

  return (
    <>
      <ambientLight intensity={0.28} />
      <rectAreaLight
        position={[4.5, 6.5, 5.5]}
        rotation={[-0.6, 0.4, 0]}
        width={12}
        height={10}
        intensity={4.8}
        color="#ffffff"
      />
      <directionalLight
        color="#e7e7f5"
        position={[-5, 2, 4]}
        intensity={0.14}
      />
      <pointLight
        ref={mapperLight}
        color={MAPPER_LIGHT}
        intensity={0.14}
        distance={2.8}
        decay={2}
        position={[
          0,
          layerPosition(activeLayerIndex)[1] - SLAB.height * 0.62,
          0,
        ]}
      />
    </>
  );
}

export default function DtoLayerStackScene({
  quality,
  reducedMotion,
  previewTrack,
  selectedTrack,
  expanded,
  hovered,
  focusLayerIndex,
  revealed,
  onReady,
}: DtoLayerStackSceneProps) {
  const activeTrack = selectedTrack ?? previewTrack;
  const trackFocus = activeTrack ? TRACK_FOCUS_LAYER_INDEX : null;
  const focusIndex = focusLayerIndex ?? trackFocus;
  const glassSurface = useGlassSurfaceMaps();
  useReleaseSharedAssetsOnUnmount();

  return (
    <>
      <color attach="background" args={[BACKDROP]} />

      <CameraRig
        previewTrack={previewTrack}
        selectedTrack={selectedTrack}
        focusLayerIndex={focusLayerIndex}
        reducedMotion={reducedMotion}
      />
      <ReadyAfterWarmup onReady={onReady} />
      <SceneMotionDriver
        enabled={!reducedMotion}
        // Every input that starts a move re-opens the full-rate window: the
        // reveal (the opening), a hover preview, a commit, and the expand.
        busyKey={`${revealed}:${previewTrack}:${selectedTrack}:${expanded}:${hovered}:${focusLayerIndex}`}
      />

      <Environment
        files={ENVIRONMENT}
        resolution={quality.environmentResolution}
        environmentIntensity={0.22}
        environmentRotation={[0, 2.22, 0]}
      />
      <StudioLights
        engaged={previewTrack !== null || focusLayerIndex !== null}
        transitioning={selectedTrack !== null}
        reducedMotion={reducedMotion}
        activeLayerIndex={focusIndex ?? 1}
      />

      <group position={[0, -0.1, 0]}>
        <Connectors />
        {DTO_LAYERS.map((layer, index) => (
          <GlassLayer
            key={layer.id}
            index={index}
            quality={quality}
            surface={glassSurface}
            reducedMotion={reducedMotion}
            revealed={revealed}
            focusIndex={focusIndex}
            selectedTrack={selectedTrack}
            expanded={expanded}
            hovered={hovered}
          />
        ))}
      </group>

      <ContactShadows
        position={[-0.15, -3.72, 0.35]}
        scale={5.6}
        opacity={0.18}
        blur={4.6}
        far={3}
        color="#8a8d9c"
        // Enough rendered frames to track the whole entrance now that it plays
        // at vsync rate after the reveal, then the shadow freezes: the ambient
        // float moves the slabs by a fraction of the blur radius, so nothing
        // is gained by re-rendering the depth pass for it forever.
        frames={reducedMotion ? 1 : 120}
        resolution={quality.tier === "high" ? 512 : 256}
      />
    </>
  );
}
