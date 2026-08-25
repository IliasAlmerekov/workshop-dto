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
import {
  EffectComposer,
  HueSaturation,
  N8AO,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
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
  type DirectionalLight,
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
  LABEL_DEPTH,
  RESTING_ACCENT_LAYER_INDEX,
  SLAB,
  fittedLabelSize,
  layerPosition,
  layerSeparationOffset,
} from "./dtoLayers";
import {
  HERO_BUSY_MS,
  HERO_IDLE_FRAME_STRIDE,
  HERO_INTRO,
  HERO_INTRO_TOTAL_S,
  HERO_LABEL_SWAP,
  HERO_SEPARATION,
  HERO_SEPARATION_DAMP,
  HERO_SURGE,
  HERO_TRANSITION_MS,
  TRACK_FOCUS_LAYER_INDEX,
  TRACK_PREVIEWS,
  heroSurge,
} from "./heroMotion";
import { useCommitElapsed } from "./commitClock";
import { trackDeclaration } from "./trackDeclarations";
import { LensSurge } from "./LensSurge";
import { BLOOM_LEVELS, DownscaledBloom } from "./DownscaledBloom";
import { SnowField, type HeroPointerRef } from "./SnowField";
import {
  FIELD_HAZE,
  ICE_ACCENT,
  ICE_EDGE,
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
  SNOW_SUN,
  SNOW_TILING,
} from "./snowWorld";

/**
 * The hero illustration: four boundaries cut from old, pressed snow, floating
 * over a field of fresh snow that keeps the mark of everything that crosses it.
 *
 * The scene is lit by exactly two things: a measured sky, and one sun thirteen
 * degrees above the horizon. The sky supplies almost all of the energy, which
 * is what keeps the snow reading as snow — the material depends on light
 * arriving from everywhere at once, and no arrangement of lamps reproduces
 * that. The sun supplies none of the realism and all of the drawing. It decides
 * which face of a block is lit and which is not, it rakes across the field so
 * the relief stops averaging into a sheet, and it throws the four long bars
 * that put the stack on the ground instead of over it.
 *
 * Everything else the frame needed used to be asked of colour and is now asked
 * of value. The blocks are dark and the field is bright; light is allowed on
 * the bevels, in the seams between boundaries and inside the lit one, and
 * nowhere else. The result is close to monochrome on purpose — see
 * `snowWorld.ts` for why the accent gave its hue up.
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

  /**
   * What this boundary is called once a track has been committed, or null if it
   * is one of the two the language does not decide.
   *
   * Read from `selectedTrack` and not from the hover preview on purpose. A
   * preview asks a question and a commit answers it, and re-laying out an SDF
   * string on every card the pointer crosses would spend the scrub's frame
   * budget on text the visitor has not chosen.
   */
  const declaration = trackDeclaration(selectedTrack, layer.id);
  const labelY = height / 2 + 0.014;
  /** How far the inscriptions travel through the face as one replaces the other. */
  const labelTravel = 0.085;
  const animated = useRef<Group>(null);
  const startedAt = useRef<number | null>(null);
  const elapsedSinceCommit = useCommitElapsed(selectedTrack);
  const roleLabel = useRef<ComponentRef<typeof Text>>(null);
  const trackLabel = useRef<ComponentRef<typeof Text>>(null);
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
      // Above the field's own, as it was: a raised block does see more sky than
      // the ground does. What changed is that the sky is now the fill rather
      // than the whole rig, so the same multiplier over a smaller number lands
      // the blocks below the field instead of level with it — which is the
      // separation the stack used to be missing, arrived at by exposure rather
      // than by darkening the material.
      envMapIntensity: 1.42,
      // Snow's velvet: light that enters a crystal, bounces a few times and
      // leaves near where it came in. It is why a snow bank has a bright fringe
      // wherever it turns away from the light. Under a raking sun it is what
      // separates the top of the block from the roll at its edge, so it is
      // tightened a little from the near-uniform value it ran at under an
      // overcast sky — the fringe has to land on the chamfer, not across the
      // whole face.
      sheen: 1,
      sheenColor: new Color("#ffffff"),
      sheenRoughness: 0.86,
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
      // The permanent edge light, which is not the core and does not animate.
      // Everything above describes one boundary's buried core; this describes
      // all four blocks all of the time, and it exists because the brief for
      // this world allows light in three places — on the bevels, in the seams,
      // and inside — and the bevels are the only one of the three that is a
      // property of the surface rather than of an event.
      shader.uniforms.uEdgeColour = {
        value: new Color(ICE_EDGE).convertSRGBToLinear(),
      };
      // Small, because the block underneath it is white. On a dark volume this
      // term would be the drawing; here the sun already does the drawing and
      // this only has to keep the chamfer from merging into the face it rolls
      // off. Anything above a fraction and the blocks acquire a halo, which is
      // the render tell this whole pass exists to avoid.
      shader.uniforms.uEdgeStrength = { value: 0.2 };

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
    created.customProgramCacheKey = () => "snow-slab-v2";

    return created;
  }, [surface]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime();

    /**
     * The impulse this boundary gets from the commit.
     *
     * Staggered by index, so what runs through the stack is a wave and not four
     * simultaneous flashes: the light reaches `Request DTO` first and `Response
     * DTO` last, in the order data actually crosses them.
     */
    const commitElapsed = elapsedSinceCommit(now);
    const surge =
      commitElapsed === null || reducedMotion
        ? 0
        : heroSurge(commitElapsed - index * HERO_SURGE.staggerS);

    // The core, first, because it has to keep working when nothing else does.
    // Under reduced motion the boundary is still the one the workshop is about,
    // so the light is still in it — it simply arrives already there and holds
    // steady instead of drifting in and breathing.
    const target = lit ? 1 : 0;
    glowMix.current = reducedMotion
      ? target
      : MathUtils.damp(glowMix.current, target, 3.4, delta);
    if (glowMix.current > 0.0005 || target > 0 || surge > 0) {
      // A slow, shallow breath. Ice under pressure is not a steady lamp, and a
      // glow that never moves stops reading as something alive in there and
      // starts reading as a printed gradient. Six per cent, over eleven
      // seconds: below the threshold anyone would call an animation, above the
      // one that makes the difference between a light and a swatch.
      const breath = reducedMotion
        ? 1
        : 1 + Math.sin(now * 0.57) * 0.06 + Math.sin(now * 1.31) * 0.025;
      /**
       * The commit's light impulse, on top of whatever this boundary was
       * already carrying.
       *
       * The unlit slabs get the larger share, which is the only way the wave is
       * visible at all: the accent slab is already near the top of its range, so
       * an equal add would light three blocks and leave the fourth looking
       * inert. For half a second all four boundaries have something in them, and
       * then the light drains back into the one the workshop is about — which is
       * the composition answering the choice rather than being replaced by it.
       */
      const strength = glowMix.current * breath + surge * (lit ? 0.42 : 0.78);
      const uniforms = glowUniforms.current;
      if (uniforms) {
        uniforms.uGlowStrength.value = strength;
      }
      if (spill.current) {
        // Raised with the core. What this light is for is the second bounce —
        // the snow around the buried source lighting the boundary above and the
        // field below — and a core several times brighter has to spill
        // proportionally or the block reads as lit inside a sealed box.
        spill.current.intensity = strength * 0.85;
      }
      if (rim.current) {
        rim.current.opacity = 0.06 + strength * 0.26;
      }
      if (!reducedMotion) {
        invalidate();
      }
    }

    /**
     * The inscription being re-pressed: the role name lifts off the face and
     * shrinks away while the track's own declaration rises out of the block.
     *
     * Monotonic, so it does not come back, and driven by scale rather than by
     * opacity — the two strings occupy the same coordinates on the same face,
     * so a crossfade would show both of them legibly on top of each other for
     * the whole length of the move. Scaled to nothing,
     * the one being replaced is simply not there.
     */
    if (declaration && roleLabel.current && trackLabel.current) {
      const swap =
        commitElapsed === null
          ? 0
          : MathUtils.clamp(
              (commitElapsed - HERO_LABEL_SWAP.leadS) /
                HERO_LABEL_SWAP.durationS,
              0,
              1,
            );
      const eased = reducedMotion ? 1 : swap * swap * (3 - 2 * swap);
      roleLabel.current.scale.setScalar(Math.max(0.0001, 1 - eased));
      roleLabel.current.position.y = labelY + eased * labelTravel;
      trackLabel.current.scale.setScalar(Math.max(0.0001, eased));
      trackLabel.current.position.y = labelY - (1 - eased) * labelTravel;
      if (eased > 0 && eased < 1) {
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

    const transitionProgress =
      commitElapsed === null
        ? 0
        : MathUtils.clamp((commitElapsed * 1000) / HERO_TRANSITION_MS, 0, 1);
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

    /**
     * The commit's mechanical answer, in two parts that do different jobs.
     *
     * The surge is the flinch. Symmetric about the stack's centre, so the outer
     * boundaries throw furthest and the four fan apart like a hand of cards
     * rather than sliding as a block — then it releases, and they come back to
     * the isometric rest they started from. The monotonic remainder is the
     * lasting part: a fraction of the same opening that stays while the camera
     * pushes in, so the stack the route change leaves behind is not the identical
     * frame it started on.
     */
    const fanY = spread * (transitionEase * 0.06 + surge * 0.2);
    const fanZ = spread * (transitionEase * 0.14 + surge * 0.26);

    group.position.set(
      MathUtils.lerp(compressed[0], rest[0], eased),
      MathUtils.lerp(compressed[1], rest[1], eased) +
        idleY +
        previewOffset[0] -
        fanY,
      MathUtils.lerp(compressed[2], rest[2], eased) +
        idleZ +
        previewOffset[1] +
        fanZ,
    );
    // Around two degrees at the outermost boundary. Enough that the fan is a
    // rotation and not a translation; short of the angle at which a slab starts
    // showing the eye its underside.
    group.rotation.y = MathUtils.lerp(-0.045, 0, eased) + spread * surge * 0.024;
    group.rotation.z = spread * surge * 0.017;

    if (
      progress < 1 ||
      transitionProgress < 1 ||
      surge > 0 ||
      previewMix.current > 0.001 ||
      hoverMix.current > 0.001
    ) {
      invalidate();
    }
  });

  return (
    <group ref={animated} position={reducedMotion ? rest : compressed}>
      {/* The only caster in the scene, and a receiver too: the four bars the
          stack lays on the field are the point of the sun, and the boundaries
          landing on each other is what turns the gaps between them into seams
          instead of into space. */}
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />

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
          the buried light gets out — which is a rim, but a rim with a cause.
          It carries more weight now than it did on a white block, because a
          hairline this pale against a dark volume is legible where the same
          hairline against snow was not. */}
      <mesh geometry={geometry} scale={1.006}>
        <meshBasicMaterial
          ref={rim}
          side={BackSide}
          color={lit ? ICE_ACCENT : ICE_EDGE}
          transparent
          opacity={lit ? 0.26 : 0.06}
          depthWrite={false}
        />
      </mesh>

      {/* The inscription, pressed into the face rather than floating over the
          stack.

          `depthTest` is on, and that is the whole fix for a defect this scene
          shipped with: with it off, every label was drawn after all four slabs
          regardless of where it was in space, so `Response DTO` — the boundary
          furthest from the camera — printed itself straight across the front of
          `Request DTO`. Four strings from four different depths were landing on
          one plane in front of everything.

          What depth testing was buying was insurance against the opposite
          failure, a glyph z-fighting with the snow it sits on. `depthOffset`
          buys that properly: troika applies it as a polygon offset in the depth
          buffer, so the text is pushed towards the camera by a fraction of a
          unit *in its own depth comparison only*, which lifts it clear of its
          own slab's face while still letting the slab above occlude it. The
          renderOrder below then keeps the two strings on one slab in a fixed
          order relative to each other. */}
      <Text
        ref={roleLabel}
        font={LABEL_FONT}
        fontSize={layer.labelSize}
        letterSpacing={-0.014}
        color={labelColour}
        anchorX="center"
        anchorY="middle"
        depthOffset={-2}
        renderOrder={10 + index}
        position={[layer.labelShift, labelY, LABEL_DEPTH]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={declaration && reducedMotion ? 0.0001 : 1}
        material-depthWrite={false}
        material-toneMapped={false}
      >
        {layer.label}
      </Text>

      {/* The same boundary in the chosen track's own words. Mounted only once a
          track is committed, so the four slabs carry role names until there is
          an answer to carry instead — and sized against the slab rather than
          against the string, because `final class UserRequest` is twice the
          length of the name it replaces. */}
      {declaration ? (
        <Text
          ref={trackLabel}
          font={LABEL_FONT}
          fontSize={fittedLabelSize(declaration, layer.labelSize * 0.88)}
          letterSpacing={-0.014}
          color={labelColour}
          anchorX="center"
          anchorY="middle"
          depthOffset={-2}
          renderOrder={20 + index}
          position={[
            layer.labelShift,
            reducedMotion ? labelY : labelY - 0.085,
            LABEL_DEPTH,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={reducedMotion ? 1 : 0.0001}
          material-depthWrite={false}
          material-toneMapped={false}
        >
          {declaration}
        </Text>
      ) : null}
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
uniform vec3 uEdgeColour;
uniform float uEdgeStrength;
varying vec3 vSlabLocal;
float slabBleed;
float slabCore;
`;

/**
 * Two gaussians over the same squared distance, which is what subsurface
 * scattering actually looks like and what one gaussian could not do.
 *
 * Light leaving a scattering medium falls off faster than the inverse square
 * that governs it in air, because every millimetre of snow is also absorbing
 * some of it — hence exponentials rather than a linear ramp, which would draw a
 * ring at its own edge and turn the whole effect back into a decal.
 *
 * But one exponential has one width, and the thing being modelled has two. Very
 * close to a buried source almost nothing has scattered yet and the light is
 * still nearly as bright as it left: that is `slabCore`, tight and hot, and it
 * is precisely the part that was missing when this glow read as dull. Further
 * out, every photon still arriving has bounced many times, so what remains is
 * faint, far wider than the source, and spread through the whole volume: that is
 * `slabBleed`, and its exponent is deliberately shallow so it reaches the ends
 * of a block two units long instead of dying inside the lens.
 *
 * Eight times the concentration in one as in the other. Summed at the emissive
 * stage with very different weights, they give a centre bright enough to cross
 * the bloom threshold and a falloff that never shows an edge — bright at the
 * source, dissipating through the block, which is the entire description of
 * something frozen inside snow.
 */
const SLAB_GLOW_BLEED = /* glsl */ `
vec3 slabToCore = vSlabLocal / uGlowRadius;
float slabR2 = dot( slabToCore, slabToCore );
slabCore = exp( -slabR2 * 6.0 ) * uGlowStrength;
slabBleed = exp( -slabR2 * 0.78 ) * uGlowStrength;
`;

/**
 * The snow immediately around the core takes its colour.
 *
 * Applied to the albedo rather than added on top, so it darkens as well as
 * tints: this is snow light is passing *through*, not snow with a lamp shining
 * on it. It also keeps the effect legible where the glow is strongest, because
 * pure additive emission there would clip to white and the block would lose its
 * own surface at exactly the point of interest.
 *
 * Driven by the wide term only. The hot centre must not darken anything — it is
 * the one place in the block where light is being added faster than the snow can
 * absorb it, and multiplying its own albedo down there is what turned an earlier
 * pass into a bruise instead of a source.
 */
const SLAB_GLOW_TINT = /* glsl */ `
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  diffuseColor.rgb * uGlowTint,
  clamp( slabBleed * 1.15, 0.0, 1.0 )
);
`;

/**
 * The bevel catching the light, and nothing else catching it.
 *
 * A hard Fresnel — eighth power, so it is essentially zero across a face and
 * only wakes up in the last few degrees before the surface turns away from the
 * eye. On a block whose top and bottom rims are rolled, "the last few degrees"
 * is geometrically the rolled part, which is why this reads as a machined
 * chamfer rather than as an outline: the term is not tracing the silhouette, it
 * is finding the places where the geometry actually curves.
 *
 * The normal it reads is the mapped one, so the scan's crystal facets take part
 * too. That is the whole difference between an edge light and a rim light —
 * every lump on the block's face that happens to turn away from the viewer
 * lights its own leading edge, and the surface stays a material rather than
 * becoming a shape with a glow around it.
 *
 * Emissive rather than specular on purpose. This is not a reflection of
 * anything; there is no fourth light in the scene. It is the block declaring
 * where its own geometry breaks, which is a drawing decision, and drawing
 * decisions do not survive being handed to the BRDF.
 */
const SLAB_EDGE_EMISSIVE = /* glsl */ `
float slabFacet = pow(
  1.0 - clamp( abs( dot( normalize( vViewPosition ), normal ) ), 0.0, 1.0 ),
  8.0
);
totalEmissiveRadiance += uEdgeColour * slabFacet * uEdgeStrength;
`;

const SLAB_GLOW_EMISSIVE = /* glsl */ `
float slabEscape = pow(
  1.0 - abs( dot( normalize( vViewPosition ), normal ) ),
  1.5
);
// The wide halo first: low, and lifted at grazing angles because that is where
// the eye is looking through the least snow. Then the core on top of it, at
// several times the weight and with no view dependence at all — a source this
// close to the surface is bright from every direction, and making it Fresnel
// too was what left the centre looking as tired as its own edges.
totalEmissiveRadiance +=
  uGlowColour * slabBleed * ( 0.30 + 1.05 * slabEscape ) +
  uGlowColour * slabCore * 3.4;
${SLAB_EDGE_EMISSIVE}
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
  const elapsedSinceCommit = useCommitElapsed(selectedTrack);
  const direction = useMemo(
    () => new Vector3(...CAMERA_DIRECTION).normalize(),
    [],
  );
  const offset = useMemo(() => new Vector3(), []);
  const rightAxis = useMemo(
    () => new Vector3(CAMERA_DIRECTION[2], 0, -CAMERA_DIRECTION[0]).normalize(),
    [],
  );

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
    const commitElapsed = elapsedSinceCommit(now);
    const transitionProgress =
      commitElapsed === null
        ? 0
        : MathUtils.clamp((commitElapsed * 1000) / HERO_TRANSITION_MS, 0, 1);
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
 * it from depth. Neutral rather than sky-tinted: with a sun in the scene, a
 * crevice is a place that can see neither the sky nor the sun, and what it
 * loses is not one light's colour but most of the light.
 *
 * The third pass is the transition itself, and unlike the other two it is not
 * a grade — it is the only thing in this chain that is ever animated. It is also
 * the one pass that is here at every quality tier, which is why the composer no
 * longer opts out on the cheapest devices: those are the touch devices, where a
 * tap on a track card is the *only* way this transition is ever triggered, and a
 * scene that dropped the whole chain there would drop the commit's optics with
 * it. The two grades stay tier-gated inside; nothing is ever added or removed
 * once mounted, so no commit can land on a frame that is rebuilding passes.
 *
 * The fourth is the colour decision, and it is the one pass here that used to
 * be refused on the grounds that grading moves design tokens. It moves none:
 * every token this scene binds is now a neutral, and what the pass removes is
 * a cast belonging to two photographic inputs that have no tokens in them at
 * all — a measured sky and a measured albedo, both of which are blue in the
 * file and cannot be edited there.
 *
 * What is still refused is the rest of the composer's usual kit. A vignette
 * would darken a canvas whose corners are transparent and meant to become the
 * page; depth of field would blur an illustration a visitor is reading labels
 * off.
 */
function SnowGrade({
  quality,
  reducedMotion,
  selectedTrack,
}: {
  quality: SceneQuality;
  reducedMotion: boolean;
  selectedTrack: Language | null;
}) {
  const graded = quality.tier !== "low";

  return (
    // Two samples everywhere but the top tier. The bottom tier used to render
    // straight to a multisampled default framebuffer, and routing it through a
    // composer without any would have traded the transition for aliased rims on
    // the devices least able to hide them.
    <EffectComposer multisampling={quality.tier === "high" ? 4 : 2}>
      {graded ? (
        <N8AO
          color={SNOW_OCCLUSION}
          aoRadius={0.95}
          distanceFalloff={0.8}
          intensity={0.9}
          quality={quality.tier === "high" ? "medium" : "low"}
          halfRes={quality.tier !== "high"}
        />
      ) : null}
      {graded ? (
        <DownscaledBloom
          // Stated rather than left to default: `wrapEffect` forwards an
          // undefined `blendFunction` to the reconciler as a real prop, and the
          // fallback for a missing blend function is `SKIP` — an effect that
          // renders and is then discarded.
          blendFunction={BlendFunction.SCREEN}
          args={[
            {
              mipmapBlur: true,
              intensity: 0.42,
              luminanceThreshold: 0.86,
              luminanceSmoothing: 0.22,
              radius: 0.62,
              levels: BLOOM_LEVELS,
            },
          ]}
        />
      ) : null}
      <LensSurge
        quality={quality}
        reducedMotion={reducedMotion}
        selectedTrack={selectedTrack}
      />
      {/* The last word on colour, and the only pass in the chain that is a
          grade in the ordinary sense.

          It is here because two of this scene's inputs carry a hue that cannot
          be edited at source. The environment is a photograph of a real
          overcast sky and its blue is baked into every one of its texels; the
          albedo scan measures 223, 239, 252 and is blue for the same reason.
          Neutralising either one by tinting the material that samples it is the
          correction this world spent a version doing, and it produces a tinted
          white rather than an untinted one — the residue is visible and it is
          what read as cheerful.

          So the cast comes off at the end, where it can come off completely.
          Not all the way: at full desaturation the frame goes to greyscale and
          greyscale is a filter, announcing itself as a treatment applied to a
          colour image. Held here, the snow keeps the last trace of cold it
          actually has and nothing in frame reads as chromatic.

          It runs at every tier, unlike the two grades above it, because a
          scene whose colour decision is tier-dependent is two different
          scenes.

          Where it stops is set by the one thing in frame allowed to keep a
          hue: the core frozen inside the lit boundary. A third is enough to take the
          sky's cast off a near-white field — the field had very little left to
          lose once its own tint went neutral — and it is shallow enough that a
          deep blue authored at `blue/700` still arrives as a deep blue rather
          than as slate. The number was twice this when the core was pale; a
          saturated core cannot afford it, and the field never needed it. */}
      <HueSaturation saturation={-0.34} />
    </EffectComposer>
  );
}


/**
 * The one hard light, and the only thing in the scene that casts.
 *
 * It is a component rather than three lines of JSX because the shadow camera
 * has to be reconfigured whenever the tier changes, and a directional light's
 * shadow camera is a real `OrthographicCamera` whose projection matrix does not
 * recompute on its own — set `left`/`right`/`top`/`bottom` and nothing happens
 * until someone calls `updateProjectionMatrix`. Doing that in JSX props is the
 * bug where the shadow silently uses the default 5-unit frustum and clips into
 * a hard square edge halfway across the field.
 *
 * `castShadow` is bound to the tier rather than left on. A zero-size map means
 * the tier declined the pass, and a light with `castShadow` and no map is a
 * second full render of the scene per frame producing nothing.
 */
function Sun({ quality }: { quality: SceneQuality }) {
  const light = useRef<DirectionalLight>(null);
  const casts = quality.shadowMapSize > 0;

  useLayoutEffect(() => {
    const current = light.current;
    if (!current || !casts) {
      return;
    }
    const camera = current.shadow.camera;
    camera.left = -SNOW_SUN.shadowExtent;
    camera.right = SNOW_SUN.shadowExtent;
    camera.top = SNOW_SUN.shadowExtent;
    camera.bottom = -SNOW_SUN.shadowExtent;
    camera.near = 0.5;
    camera.far = SNOW_SUN.reach + SNOW_SUN.shadowExtent * 2;
    camera.updateProjectionMatrix();
    current.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    // Depth bias, not slope bias. At thirteen degrees almost every lit surface
    // in frame is close to parallel to the light, which is exactly the case a
    // constant bias handles badly and a normal-space offset handles well: the
    // sample is pushed along the surface normal instead of towards the light,
    // so the correction does not grow without bound as the angle closes.
    current.shadow.bias = -0.0004;
    current.shadow.normalBias = 0.045;
    // The penumbra. `shadows="soft"` filters with a fixed kernel in texel
    // space, so the only way to widen the edge is to widen the texel — and the
    // two tiers have different ones, hence a radius scaled to the map rather
    // than a number that looks right on a workstation and turns into a stencil
    // on a laptop.
    current.shadow.radius = quality.shadowMapSize / 512;
    current.shadow.needsUpdate = true;
  }, [casts, quality.shadowMapSize]);

  return (
    <directionalLight
      ref={light}
      color={SNOW_SUN.colour}
      intensity={SNOW_SUN.intensity}
      castShadow={casts}
      position={[
        Math.cos(SNOW_SUN.bearing) * SNOW_SUN.reach,
        SNOW_SUN.elevation,
        Math.sin(SNOW_SUN.bearing) * SNOW_SUN.reach,
      ]}
    />
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

      {/* The world's far end. Everything past the stack walks into the page's
          own backdrop colour, so the field has a horizon and the page has no
          seam — one value doing the work of a matte painting. */}
      <fog
        attach="fog"
        args={[FIELD_HAZE.colour, FIELD_HAZE.near, FIELD_HAZE.far]}
      />

      {/* The fill: an overcast winter sky measured over a real snow field,
          which is one enormous softbox above and one enormous bounce below.
          Turned down from the 1.0 it ran at when it was the whole rig, so that
          what it now does is lift the side the sun cannot reach rather than
          compete with it for authorship of the frame. */}
      <Environment
        files={SNOW_ENVIRONMENT}
        resolution={quality.environmentResolution}
        environmentIntensity={SNOW_SUN.environmentIntensity}
      />

      {/* The key: one sun, almost on the horizon. */}
      <Sun quality={quality} />

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

      <SnowGrade
        quality={quality}
        reducedMotion={reducedMotion}
        selectedTrack={selectedTrack}
      />
    </>
  );
}
