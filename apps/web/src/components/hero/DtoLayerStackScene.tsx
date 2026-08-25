"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentRef,
} from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  PerspectiveCamera,
  Text,
  useTexture,
} from "@react-three/drei";
import { Bloom, EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BackSide,
  Color,
  ExtrudeGeometry,
  MathUtils,
  MeshPhysicalMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Shape,
  Vector2,
  Vector3,
  type Group,
  type IUniform,
  type MeshBasicMaterial,
  type PointLight,
  type Texture,
} from "three";
import type { SceneQuality } from "@/lib/three/quality";
import type { Language } from "@/lib/workshop/types";
import {
  DTO_LAYERS,
  RESTING_ACCENT_LAYER_INDEX,
  SLAB,
  layerPosition,
  layerSeparationOffset,
} from "./dtoLayers";
import {
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
import { SnowField, type HeroPointerRef } from "./SnowField";
import {
  FIELD_HAZE,
  ICE_ACCENT,
  ICE_GLOW,
  LABEL_ACCENT,
  LABEL_COOL,
  LABEL_FONT,
  LABEL_INK,
  LABEL_MUTED,
  SNOW_BLOCK,
  SNOW_BLOCK_ACTIVE,
  SNOW_ENVIRONMENT,
  SNOW_MAPS,
  SNOW_OCCLUSION,
  SNOW_TILING,
} from "./snowWorld";

/**
 * The hero illustration: four boundaries cut from old, pressed snow, floating
 * over a field of fresh snow that keeps the mark of everything that crosses it.
 *
 * The whole scene is lit by one measured overcast sky and nothing else. There
 * is no key light, no fill, and no rim — every highlight, every soft
 * terminator and every cold blue underside is the environment doing what a
 * real sky does over real snow. Adding lamps to this would be adding lamps to
 * a landscape: whatever they bought in control they would cost in the one
 * quality the material depends on, which is that the light arrives from
 * everywhere at once.
 *
 * Colours are hex literals because three.js takes colours, not CSS custom
 * properties; each names the design token it mirrors.
 */

/**
 * Where the camera sits, as a unit vector. The distance along it is chosen per
 * viewport so the composition is framed the same way in the hero's tall column
 * and in the short block it occupies on a phone.
 *
 * The elevation is the one value the snow field changed. At the old angle the
 * camera was nearly level with the stack, which is the right height for
 * floating glass and the wrong one for a ground plane: the field arrived edge
 * on, as a bright band, and every press in it was foreshortened to a line.
 * Lifted here, the field reads as ground and a footprint reads as a footprint.
 */
const CAMERA_DIRECTION = [0.575, 0.66, 0.575] as const;
const FOV = 24.5;

/**
 * The world extent the *stack's own column* must show, in world units.
 *
 * This is no longer the extent of the canvas. The canvas is the whole viewport
 * now, and the stack occupies one column of the page's layout inside it, so the
 * framing is expressed against that column and the camera's frustum is widened
 * to whatever the viewport needs around it. The alternative — moving the stack
 * in world space until it happens to land under the column — would make the
 * object's position a function of the browser window, which is exactly the
 * thing a world is not.
 */
const FRAME_HEIGHT = 11.6;
const FRAME_WIDTH = 10.2;

/** Where the camera aims: below the stack's centre, so the field has the floor. */
const LOOK_AT_Y = -0.42;

/**
 * The page rectangle the stack is framed inside, in CSS pixels relative to the
 * viewport. Published by the layout box the hero reserves, and read by the
 * camera; `null` before the first measurement, which frames the viewport
 * itself.
 */
export type AnchorRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type AnchorRectRef = { current: AnchorRect | null };

type SnowSurfaceMaps = {
  colour: Texture;
  normal: Texture;
  arm: Texture;
};

/**
 * The same snow the field is made of, tiled to the size of a block.
 *
 * The tiling rate is set against the slab, not against the texture, and it is
 * the whole reason one scan can be two materials. A block 4.05 units wide
 * showing one tile of a metre-scale scan would be a four-metre lump; at two
 * tiles across, the scan's crust arrives at the size the eye expects on
 * something a person could lift — while the same map under the field, at
 * twenty-four tiles, is powder. Packed snow and loose snow, from one upload.
 */
function useSnowBlockMaps(quality: SceneQuality): SnowSurfaceMaps {
  const source = useTexture(SNOW_MAPS);

  const maps = useMemo(() => {
    const colour = source.colour.clone();
    const normal = source.normal.clone();
    const arm = source.arm.clone();

    colour.colorSpace = SRGBColorSpace;
    normal.colorSpace = NoColorSpace;
    arm.colorSpace = NoColorSpace;

    for (const texture of [colour, normal, arm]) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(SNOW_TILING.block[0], SNOW_TILING.block[1]);
      texture.anisotropy = quality.tier === "low" ? 4 : 8;
      texture.channel = 0;
      texture.needsUpdate = true;
    }

    return { colour, normal, arm };
  }, [source, quality.tier]);

  useEffect(
    () => () => {
      for (const texture of Object.values(maps)) {
        texture.dispose();
      }
    },
    [maps],
  );

  return maps;
}

/**
 * One slab as a rounded rectangle extruded into a thick block with a rounded
 * rim. `RoundedBox` fillets all twelve edges with one radius, which cannot hold
 * the proportion this shape needs: generous corners in plan, a much tighter
 * roll on the top and bottom rims. So the profile carries the corner radius and
 * the extrusion's bevel carries the rim.
 *
 * The rim survived the change of material, for a different reason. Under glass
 * it was what swept the softbox into a highlight; under snow it is what stops
 * the block reading as a cut cube. Snow does not hold a sharp arris — wind and
 * its own weight round every edge it has — and a hard corner here is the single
 * fastest way to make the material read as polystyrene.
 *
 * The profile is inset by the bevel and the extrusion shortened by twice it, so
 * the finished block measures exactly `width × height × depth`.
 */
function buildSlabGeometry(): ExtrudeGeometry {
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

/**
 * The four slabs are geometrically identical, so the extrusion is built once
 * and shared. Building it per layer cost four rounded-rect extrusions (with
 * normals) on the main thread during exactly the frames the opening move needs.
 *
 * It lives for as long as the scene does and is released on its unmount, so no
 * layer can dispose a resource its siblings are still drawing with.
 */
let sharedSlabGeometry: ExtrudeGeometry | null = null;

function useSharedSlabGeometry(): ExtrudeGeometry {
  return (sharedSlabGeometry ??= buildSlabGeometry());
}

function useReleaseSharedAssetsOnUnmount() {
  useEffect(
    () => () => {
      sharedSlabGeometry?.dispose();
      sharedSlabGeometry = null;
    },
    [],
  );
}

type LayerProps = {
  index: number;
  surface: SnowSurfaceMaps;
  reducedMotion: boolean;
  /** True once the canvas is on screen, which is when the entrance may start. */
  revealed: boolean;
  focusIndex: number | null;
  selectedTrack: Language | null;
  expanded: boolean;
  /** The pointer is over the illustration: open the stack further. */
  hovered: boolean;
};

function SnowLayer({
  index,
  surface,
  reducedMotion,
  revealed,
  focusIndex,
  selectedTrack,
  expanded,
  hovered,
}: LayerProps) {
  const layer = DTO_LAYERS[index];
  const active = (focusIndex ?? RESTING_ACCENT_LAYER_INDEX) === index;
  // The stack rests on the Request DTO: one lit boundary, with the remaining
  // three returning to plain snow. Explicit workshop focus moves that same
  // single accent as before.
  const lit = active;

  const labelColour = active
    ? LABEL_ACCENT
    : layer.tone === "ink"
      ? LABEL_INK
      : layer.tone === "cool"
        ? LABEL_COOL
        : LABEL_MUTED;

  const geometry = useSharedSlabGeometry();
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
  const spill = useRef<PointLight>(null);
  const rim = useRef<MeshBasicMaterial>(null);
  const glowUniforms = useRef<Record<string, IUniform> | null>(null);
  const glowMix = useRef(0);

  /**
   * The slab's material, built here rather than declared, because the light
   * inside it is not something `meshPhysicalMaterial` has a prop for.
   *
   * All four are identical and all four carry the buried-core shader; only the
   * uniform that says how bright the core is differs, and it is animated rather
   * than switched. That is what lets the glow *travel* when a track preview
   * moves the accent — the light drains out of one boundary while it fills the
   * next — instead of cutting between two materials, which would also have cost
   * a shader recompile in the middle of the move.
   */
  const material = useMemo(() => {
    const created = new MeshPhysicalMaterial({
      map: surface.colour,
      normalMap: surface.normal,
      aoMap: surface.arm,
      roughnessMap: surface.arm,
      metalnessMap: surface.arm,
      color: SNOW_BLOCK,
      // As matte as the field. Powder has no specular to speak of, and every
      // attempt to give the lit slab one — lower roughness, a clearcoat —
      // rendered it as moulded plastic, because a smooth highlight over a lumpy
      // normal is exactly what plastic is.
      roughness: 0.94,
      metalness: 0,
      // The scan's relief is authored to be read at arm's length, so a slab
      // this close cannot take it at full strength — every crystal becomes a
      // boulder. Taken too far the other way it vanishes and the block is soap.
      normalScale: new Vector2(0.8, 0.8),
      aoMapIntensity: 0.4,
      // Above the field's own. A raised block sees more sky than the ground
      // does, and holding it below the field is what made four white volumes
      // read as grey ones sitting on snow.
      envMapIntensity: 1.7,
      // Snow's velvet: light that enters a crystal, bounces a few times and
      // leaves near where it came in. It is why a snow bank has a bright fringe
      // wherever it turns away from the sky.
      sheen: 1,
      sheenColor: new Color("#ffffff"),
      sheenRoughness: 0.95,
    });

    created.onBeforeCompile = (shader) => {
      shader.uniforms.uGlowColour = {
        value: new Color(ICE_GLOW).convertSRGBToLinear(),
      };
      shader.uniforms.uGlowTint = {
        value: new Color(SNOW_BLOCK_ACTIVE).convertSRGBToLinear(),
      };
      // The frozen thing itself, in the slab's own coordinates: a long, flat
      // lens lying inside the block rather than a point at its centre. A point
      // source produces a circular bloom that reads as a lamp under a sheet;
      // something with a length reads as an object that was caught in there.
      shader.uniforms.uGlowRadius = { value: new Vector3(2.1, 0.3, 1.05) };
      shader.uniforms.uGlowStrength = { value: 0 };

      shader.vertexShader = shader.vertexShader
        .replace("void main() {", "varying vec3 vSlabLocal;\nvoid main() {")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvSlabLocal = transformed;",
        );

      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", `${SLAB_GLOW_HEAD}\nvoid main() {`)
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>\n${SLAB_GLOW_BLEED}`,
        )
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>\n${SLAB_GLOW_TINT}`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>\n${SLAB_GLOW_EMISSIVE}`,
        );

      glowUniforms.current = shader.uniforms;
    };
    created.customProgramCacheKey = () => "snow-slab-v1";

    return created;
  }, [surface]);

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    if (!selectedTrack) {
      transitionStartedAt.current = null;
    }
  }, [selectedTrack]);

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime();

    // The core, first, because it has to keep working when nothing else does.
    // Under reduced motion the boundary is still the one the workshop is about,
    // so the light is still in it — it simply arrives already there and holds
    // steady instead of drifting in and breathing.
    const target = lit ? 1 : 0;
    glowMix.current = reducedMotion
      ? target
      : MathUtils.damp(glowMix.current, target, 3.4, delta);
    if (glowMix.current > 0.0005 || target > 0) {
      // A slow, shallow breath. Ice under pressure is not a steady lamp, and a
      // glow that never moves stops reading as something alive in there and
      // starts reading as a printed gradient. Six per cent, over eleven
      // seconds: below the threshold anyone would call an animation, above the
      // one that makes the difference between a light and a swatch.
      const breath = reducedMotion
        ? 1
        : 1 + Math.sin(now * 0.57) * 0.06 + Math.sin(now * 1.31) * 0.025;
      const strength = glowMix.current * breath;
      const uniforms = glowUniforms.current;
      if (uniforms) {
        uniforms.uGlowStrength.value = strength;
      }
      if (spill.current) {
        spill.current.intensity = strength * 0.5;
      }
      if (rim.current) {
        rim.current.opacity = 0.03 + strength * 0.19;
      }
      if (!reducedMotion) {
        invalidate();
      }
    }

    const group = animated.current;
    if (!group || reducedMotion) {
      return;
    }

    // The entrance is clocked from the reveal, not from the scene's first
    // frame. Shader compilation and the HDRI both sit between those two
    // moments, so timing the move from mount used to spend its most legible
    // part behind a canvas that was still at opacity 0.
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
      <mesh geometry={geometry} material={material} />

      {/* What the frozen core does to the air around the block.

          Snow is not transparent, so a light inside one does not shine out of
          it — it lights the snow it is buried in, and that snow lights whatever
          is next to it. This is that second bounce, and it is the reason the
          effect reads as depth rather than as a decal: the boundary above and
          the field below both pick up a little of the blue, so the eye places
          the source inside the volume instead of on its surface. Short range,
          low intensity — it may never look like a lamp. */}
      <pointLight
        ref={spill}
        color={ICE_GLOW}
        intensity={0}
        distance={3.4}
        decay={2}
        position={[0, 0, 0]}
      />

      {/* The edge the core escapes through. Where the block is thin, more of
          the buried light gets out — which is a rim, but a rim with a cause. */}
      <mesh geometry={geometry} scale={1.006}>
        <meshBasicMaterial
          ref={rim}
          side={BackSide}
          color={lit ? ICE_ACCENT : "#e7eef8"}
          transparent
          opacity={lit ? 0.2 : 0.03}
          depthWrite={false}
        />
      </mesh>

      <Text
        font={LABEL_FONT}
        fontSize={layer.labelSize}
        letterSpacing={-0.014}
        color={labelColour}
        anchorX="center"
        anchorY="middle"
        depthOffset={-2}
        renderOrder={10 + index}
        position={[layer.labelShift, height / 2 + 0.014, 0]}
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
 * Something frozen inside the block, seen through the snow around it.
 *
 * This is subsurface scattering, done the way a game does it rather than the
 * way a renderer does it. A real solver would march light through the volume
 * and cost more per frame than everything else in this scene put together, to
 * answer a question the eye resolves from two cues: light is brighter nearer
 * the thing emitting it, and it escapes most easily where the material between
 * you and it is thinnest.
 *
 * So `slabBleed` is the first cue — an anisotropic falloff from the core's own
 * position in the slab's local space, which is why the glow has a *shape* and
 * not a radius. The Fresnel term is the second: at a grazing angle you are
 * looking through the least snow, which is where a buried light actually
 * surfaces. Together they put the source inside the volume. Neither touches the
 * surface's specular, so the block stays snow rather than becoming a lamp.
 */
const SLAB_GLOW_HEAD = /* glsl */ `
uniform vec3 uGlowColour;
uniform vec3 uGlowTint;
uniform vec3 uGlowRadius;
uniform float uGlowStrength;
varying vec3 vSlabLocal;
float slabBleed;
`;

/**
 * Gaussian rather than linear, over squared distance.
 *
 * Light leaving a scattering medium falls off faster than the inverse square
 * that governs it in air, because every millimetre of snow is also absorbing
 * some of it. The exponential is what gives the glow a soft centre with no
 * visible boundary — a linear falloff draws a ring at its own edge, and a ring
 * is the tell that turns this back into a decal.
 */
const SLAB_GLOW_BLEED = /* glsl */ `
vec3 slabToCore = vSlabLocal / uGlowRadius;
slabBleed = exp( -dot( slabToCore, slabToCore ) * 1.15 ) * uGlowStrength;
`;

/**
 * The snow immediately around the core takes its colour.
 *
 * Applied to the albedo rather than added on top, so it darkens as well as
 * tints: this is snow light is passing *through*, not snow with a blue lamp
 * shining on it. It also keeps the effect legible where the glow is strongest,
 * because pure additive emission there would clip to white and the block would
 * lose its own surface at exactly the point of interest.
 */
const SLAB_GLOW_TINT = /* glsl */ `
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  diffuseColor.rgb * uGlowTint,
  clamp( slabBleed * 1.3, 0.0, 1.0 )
);
`;

const SLAB_GLOW_EMISSIVE = /* glsl */ `
float slabEscape = pow(
  1.0 - abs( dot( normalize( vViewPosition ), normal ) ),
  1.5
);
totalEmissiveRadiance += uGlowColour * slabBleed * ( 0.42 + 1.25 * slabEscape );
`;

/**
 * Drives the demand loop from `requestAnimationFrame` rather than a timer.
 *
 * A 42ms `setInterval` asked for ~24 rendered frames per second on a cadence
 * that has no relationship to the display's refresh: every render landed at a
 * different phase within its vsync interval, so frames were alternately shown
 * twice and dropped. That is what read as the stack not appearing smoothly —
 * not the easing, and not the frame cost.
 *
 * On rAF every render is vsync-aligned and `delta` is even. Full rate is spent
 * where it is legible — the opening move, a track commit, and a pointer on the
 * snow — and the ambient float, whose whole amplitude is 0.014 world units,
 * renders every third frame. `frameloop="demand"` is what makes this gating
 * possible at all: the loop also sleeps with the tab and whenever the canvas
 * leaves the viewport.
 */
function SceneMotionDriver({
  enabled,
  busyKey,
  pointer,
  anchorRect,
}: {
  enabled: boolean;
  /** Any change re-opens the full-rate window. */
  busyKey: string;
  /**
   * The column the stack is framed inside. A scroll moves it without producing
   * a React render or a pointer event, and at the idle stride the stack would
   * lag a third of a frame behind its own layout box the whole way down the
   * page. Watched here because this is the only loop that runs regardless.
   */
  anchorRect: AnchorRectRef;
  /**
   * A pointer on the field is direct manipulation of a surface, so it takes
   * the full rate for as long as it is there. Painting a footprint at every
   * third frame leaves the brush visibly behind the cursor — the one place in
   * this scene where a dropped frame is a wrong position rather than a slower
   * cadence.
   */
  pointer: HeroPointerRef;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const canvas = useThree((state) => state.gl.domElement);
  const busyUntil = useRef(0);
  const seenRect = useRef("");

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

      const box = anchorRect.current;
      const stamp = box
        ? `${box.x}:${box.y}:${box.width}:${box.height}`
        : "none";
      const moved = stamp !== seenRect.current;
      seenRect.current = stamp;

      tick += 1;
      if (
        moved ||
        pointer.current.inside ||
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
  }, [anchorRect, canvas, enabled, invalidate, pointer]);

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
  /** Live pointer position, read per frame rather than per render. */
  pointer: HeroPointerRef;
  /** The page column the stack is framed inside, in viewport pixels. */
  anchorRect: AnchorRectRef;
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
const MAX_WARMUP_FRAMES = 14;
/** Roughly two vsync intervals at 60Hz: no compile or upload spike left. */
const CALM_FRAME_S = 0.034;

/**
 * Reveal the DOM only once the renderer is actually keeping up. A React effect
 * merely proves that the scene mounted, and a fixed frame count proves only
 * that some frames happened — the field's injected shader and the HDRI's
 * convolution both land on first draw, and either can take 200ms on its own.
 * Revealing into that spike put the hitch exactly where it was most visible:
 * the first moment the visitor sees the illustration.
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
  anchorRect,
}: {
  previewTrack: Language | null;
  selectedTrack: Language | null;
  focusLayerIndex: number | null;
  reducedMotion: boolean;
  anchorRect: AnchorRectRef;
}) {
  const camera = useRef<ComponentRef<typeof PerspectiveCamera>>(null);
  const size = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);
  const distance = useRef(1);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dolly = useRef(0);
  const focusPan = useRef(0);
  const framedAt = useRef("");
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

  /**
   * Frame the stack inside the page's column while the canvas covers the page.
   *
   * Two independent things are being solved. The distance decides how big the
   * stack is, and it is measured against the *column*, so the object keeps the
   * size the composition was drawn at whatever else is on screen. The field of
   * view then widens from the column to the whole viewport, which is what puts
   * snow in every corner of the page rather than a panel of it behind one
   * block.
   *
   * `setViewOffset` supplies the last piece. It slides the frustum off its
   * optical axis by exactly the distance between the viewport's centre and the
   * column's, so the stack sits where the layout says it sits — including
   * halfway down a scrolling phone page — without ever moving in world space.
   * Everything downstream (the pointer's ray onto the snow, the parallax, the
   * dolly on commit) reads the same matrix and needs to know nothing about it.
   */
  const frame = useCallback(() => {
    const view = camera.current;
    if (!view) {
      return;
    }

    const viewportWidth = Math.max(1, size.width);
    const viewportHeight = Math.max(1, size.height);
    const box = anchorRect.current;
    const boxWidth = Math.max(1, box?.width ?? viewportWidth);
    const boxHeight = Math.max(1, box?.height ?? viewportHeight);
    const boxCentreX = (box?.x ?? 0) + boxWidth / 2;
    const boxCentreY = (box?.y ?? 0) + boxHeight / 2;

    const reach = 2 * Math.tan(MathUtils.degToRad(FOV) / 2);
    distance.current = Math.max(
      FRAME_HEIGHT / reach,
      FRAME_WIDTH / (reach * (boxWidth / boxHeight)),
    );

    // The world height the canvas must show for the column to show
    // `FRAME_HEIGHT`, converted back into the vertical angle that produces it.
    const canvasWorldHeight = FRAME_HEIGHT * (viewportHeight / boxHeight);
    view.fov = MathUtils.clamp(
      MathUtils.radToDeg(
        2 * Math.atan(canvasWorldHeight / (2 * distance.current)),
      ),
      FOV,
      104,
    );
    view.aspect = viewportWidth / viewportHeight;
    view.setViewOffset(
      viewportWidth,
      viewportHeight,
      viewportWidth / 2 - boxCentreX,
      viewportHeight / 2 - boxCentreY,
      viewportWidth,
      viewportHeight,
    );

    view.position.set(
      CAMERA_DIRECTION[0] * distance.current,
      CAMERA_DIRECTION[1] * distance.current,
      CAMERA_DIRECTION[2] * distance.current,
    );
    view.lookAt(0, LOOK_AT_Y, 0);
    view.updateProjectionMatrix();
  }, [anchorRect, size]);

  useLayoutEffect(() => {
    frame();
    invalidate();
  }, [frame, invalidate]);

  useFrame(({ clock, pointer }, delta) => {
    const view = camera.current;
    if (!view) {
      return;
    }

    // The column moves under the camera whenever the page scrolls or reflows,
    // and neither of those is a React render. Comparing the published rectangle
    // against the one the frustum was last built from is cheaper than a
    // subscription and cannot miss a change.
    const box = anchorRect.current;
    const stamp = box
      ? `${Math.round(box.x)}:${Math.round(box.y)}:${Math.round(box.width)}:${Math.round(box.height)}`
      : "none";
    if (stamp !== framedAt.current) {
      framedAt.current = stamp;
      frame();
    }

    if (reducedMotion) {
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
    // it: a fraction of the layer's height, so the other three boundaries stay
    // in frame and the move reads as attention, not navigation.
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
      MathUtils.lerp(LOOK_AT_Y, layerPosition(1)[1], dolly.current * 0.9) +
        focusPan.current,
      MathUtils.lerp(0, -0.18, dolly.current),
    );
  });

  // No `fov` prop: the angle is computed from the column's size against the
  // viewport's, and a declared one would be reapplied on every render.
  return <PerspectiveCamera ref={camera} makeDefault />;
}

/**
 * Two passes, and the first is not a grade at all.
 *
 * Snow is the subject where bloom is not a stylistic choice: at these
 * luminances a real lens does veil, and the crystal facets that catch the sky
 * are physically small and physically bright. The threshold is set above every
 * value the diffuse surface can reach, so nothing blooms except those facets
 * and the lit boundary's rim — which is the difference between a scene that
 * looks photographed and one that looks rendered.
 *
 * Ambient occlusion is the pass this scene cannot do without. Lighting the
 * world from an environment and nothing else is what makes the snow read as
 * snow, and it is also what leaves every crevice as bright as every face: an
 * image-based light has no way to know that the gap between two stacked slabs
 * sees almost none of the sky. That missing darkness is the whole reason the
 * four boundaries were washing into the field behind them. Occlusion supplies
 * it from depth, tinted towards the sky's blue rather than towards grey —
 * because on snow the shadow *is* the sky, seen from a place that can only see
 * a little of it.
 *
 * Everything else a composer usually carries is refused here. A vignette would
 * darken a canvas whose corners are transparent and meant to become the page;
 * depth of field would blur an illustration a visitor is reading labels off;
 * colour grading would move design tokens.
 */
function SnowGrade({ quality }: { quality: SceneQuality }) {
  if (quality.tier === "low") {
    return null;
  }

  return (
    <EffectComposer multisampling={quality.tier === "high" ? 4 : 0}>
      <N8AO
        color={SNOW_OCCLUSION}
        aoRadius={0.95}
        distanceFalloff={0.8}
        intensity={0.9}
        quality={quality.tier === "high" ? "medium" : "low"}
        halfRes={quality.tier !== "high"}
      />
      <Bloom
        mipmapBlur
        intensity={0.42}
        luminanceThreshold={0.86}
        luminanceSmoothing={0.22}
        radius={0.62}
      />
    </EffectComposer>
  );
}

export default function DtoLayerStackScene({
  quality,
  reducedMotion,
  previewTrack,
  selectedTrack,
  expanded,
  hovered,
  pointer,
  anchorRect,
  focusLayerIndex,
  revealed,
  onReady,
}: DtoLayerStackSceneProps) {
  const activeTrack = selectedTrack ?? previewTrack;
  const trackFocus = activeTrack ? TRACK_FOCUS_LAYER_INDEX : null;
  const focusIndex = focusLayerIndex ?? trackFocus;
  const snowSurface = useSnowBlockMaps(quality);
  useReleaseSharedAssetsOnUnmount();

  return (
    <>
      <CameraRig
        previewTrack={previewTrack}
        selectedTrack={selectedTrack}
        focusLayerIndex={focusLayerIndex}
        reducedMotion={reducedMotion}
        anchorRect={anchorRect}
      />
      <ReadyAfterWarmup onReady={onReady} />
      <SceneMotionDriver
        enabled={!reducedMotion}
        pointer={pointer}
        anchorRect={anchorRect}
        // Every input that starts a move re-opens the full-rate window: the
        // reveal (the opening), a hover preview, a commit, and the expand.
        busyKey={`${revealed}:${previewTrack}:${selectedTrack}:${expanded}:${hovered}:${focusLayerIndex}`}
      />

      {/* The whole lighting rig. An overcast winter sky measured over a real
          snow field, which is one enormous softbox above and one enormous
          bounce below — the condition every hand-placed light in the previous
          scene was approximating, and the one that no arrangement of lamps
          reproduces, because most of its light comes back up off the ground. */}
      {/* The world's far end. Everything past the stack walks into the page's
          own backdrop colour, so the field has a horizon and the page has no
          seam — one value doing the work of a matte painting. */}
      <fog
        attach="fog"
        args={[FIELD_HAZE.colour, FIELD_HAZE.near, FIELD_HAZE.far]}
      />

      <Environment
        files={SNOW_ENVIRONMENT}
        resolution={quality.environmentResolution}
        environmentIntensity={1}
      />

      <SnowField
        quality={quality}
        reducedMotion={reducedMotion}
        pointer={pointer}
      />

      <group position={[0, -0.1, 0]}>
        {DTO_LAYERS.map((layer, index) => (
          <SnowLayer
            key={layer.id}
            index={index}
            surface={snowSurface}
            reducedMotion={reducedMotion}
            revealed={revealed}
            focusIndex={focusIndex}
            selectedTrack={selectedTrack}
            expanded={expanded}
            hovered={hovered}
          />
        ))}
      </group>

      <SnowGrade quality={quality} />
    </>
  );
}
