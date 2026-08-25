"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  Color,
  MeshStandardMaterial,
  NoColorSpace,
  Raycaster,
  RepeatWrapping,
  RingGeometry,
  SRGBColorSpace,
  Vector2,
  type IUniform,
} from "three";
import type { SceneQuality } from "@/lib/three/quality";
import { pickFieldUv } from "./fieldPick";
import { SnowTrample } from "./snowTrample";
import {
  FIELD,
  FIELD_ANCHOR,
  SNOW_MAPS,
  SNOW_PRESSED,
  SNOW_SURFACE,
  SNOW_TILING,
  TRAMPLE,
} from "./snowWorld";

/**
 * Where the pointer is, in normalised device coordinates, or `inside: false`
 * when it is not over the illustration.
 *
 * Passed as a ref rather than as React state on purpose. A pointer crossing the
 * hero fires a move event per input sample — several hundred a second on a
 * high-rate mouse — and routing each one through a render would re-render the
 * whole hero subtree, including a `backdrop-blur` card sitting over a live
 * WebGL canvas, to move a brush by four pixels. The scene reads the ref inside
 * its own frame loop instead, so the pointer costs one texture write per
 * rendered frame and nothing at all between them.
 */
export type HeroPointer = { x: number; y: number; inside: boolean };
export type HeroPointerRef = { current: HeroPointer };

/**
 * The snow field: fresh snow that keeps a record of what has crossed it.
 *
 * The surface is one displaced disc carrying two heights at once. The
 * photographic height map supplies the dunes — the slow, authored landscape the
 * field would have with nobody on it. The trample map supplies the marks, and
 * that one is written at runtime: the visitor's pointer paints into it, the
 * stack's own weight is pressed into it permanently, and both come back out of
 * the vertex shader as geometry rather than as a texture pretending to be
 * geometry. Move the light and a footprint's rim still catches it correctly,
 * because there is a rim there.
 *
 * The permanent press under the stack is doing the work a contact shadow would
 * normally do, and doing it better. A shadow catcher under a floating object is
 * a dark ellipse painted on the ground; a depression is the ground itself
 * yielding, which is both what happens under a weight and the point the
 * illustration is making — a boundary leaves the shape of itself in whatever
 * passes through it.
 */
export function SnowField({
  quality,
  reducedMotion,
  pointer,
}: {
  quality: SceneQuality;
  reducedMotion: boolean;
  pointer: HeroPointerRef;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const maps = useTexture(SNOW_MAPS);
  const raycaster = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);
  // Written by every pick and read immediately; one vector for the whole scene.
  const uv = useMemo(() => new Vector2(), []);
  const uniforms = useRef<Record<string, IUniform> | null>(null);

  /**
   * Rings are the one quality dial that matters here. The disc is displaced per
   * vertex, so its tessellation is the resolution of every mark on it: a press
   * spans about ten rings at full quality, which is enough for its rim to
   * curve, and about four at the lowest, which is enough for it to read as a
   * dent rather than as a crease.
   */
  const [rings, segments] = useMemo(() => {
    const scale =
      quality.tier === "high" ? 1 : quality.tier === "medium" ? 0.68 : 0.42;
    return [
      Math.round(FIELD.rings * scale),
      Math.round(FIELD.segments * scale),
    ];
  }, [quality.tier]);

  const geometry = useMemo(
    // A ring rather than a plane: the tessellation follows the composition,
    // concentrating vertices under the stack, where every mark is, and thinning
    // towards a rim that only ever has to fade.
    () => new RingGeometry(0.0001, FIELD.radius, segments, rings),
    [rings, segments],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const trample = useMemo(
    () => (typeof document === "undefined" ? null : new SnowTrample(document)),
    [],
  );
  useEffect(() => () => trample?.dispose(), [trample]);

  const { material, textures } = useMemo(() => {
    // Cloned so the two tiling rates below cannot leak into another consumer of
    // the same cached upload; a clone shares its source, so this costs no GPU
    // memory.
    const colour = maps.colour.clone();
    const normal = maps.normal.clone();
    const arm = maps.arm.clone();
    const height = maps.height.clone();

    colour.colorSpace = SRGBColorSpace;
    normal.colorSpace = NoColorSpace;
    arm.colorSpace = NoColorSpace;
    height.colorSpace = NoColorSpace;

    for (const texture of [colour, normal, arm, height]) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.anisotropy = quality.tier === "low" ? 4 : 8;
      texture.channel = 0;
      texture.needsUpdate = true;
    }

    // Two tiling rates, because the scan is carrying two different frequencies.
    // The grain — crystals, crust, micro-shadow — has to arrive at roughly the
    // scale it has in life, or the field reads as an enlarged photograph of
    // snow rather than as snow: tiled seven times across a 68-unit field, every
    // crystal in the scan was three metres wide, which is what turned the
    // surface into tyre tracks. The dunes are landscape and must not repeat
    // inside one view at all, so the same map runs once for height.
    const grain = SNOW_TILING.field;
    colour.repeat.set(grain, grain);
    normal.repeat.set(grain, grain);
    arm.repeat.set(grain, grain);
    height.repeat.set(1, 1);

    const created = new MeshStandardMaterial({
      map: colour,
      normalMap: normal,
      aoMap: arm,
      roughnessMap: arm,
      metalnessMap: arm,
      color: SNOW_SURFACE,
      // Fresh snow is a diffuse dielectric with a faint forward sheen, not a
      // wet or polished surface. The packed map carries the variation; this is
      // the floor it varies from.
      roughness: 0.95,
      metalness: 0,
      // The scan's normals are authored for a close-up. At hero scale, full
      // strength turns every crystal edge into a ridge and the field into
      // gravel; this is the depth that survives being seen from ten metres.
      normalScale: new Vector2(1.05, 1.05),
      // A scan's baked occlusion is crevice shadow measured under a studio
      // dome, and under an open sky most of those crevices are lit.
      aoMapIntensity: 0.42,
      // Snow returns almost everything the sky gives it, and under this
      // environment nearly all of the light arriving is indirect. Anything
      // near unity leaves the surface reading as the grey the photograph was
      // exposed at rather than as the material it photographed.
      envMapIntensity: 1.75,
      // The rim dissolves in alpha rather than ending at an edge, so the disc
      // has to be drawn in the transparent pass. Nothing else in the scene is,
      // so it is simply the last thing drawn.
      transparent: true,
    });

    created.onBeforeCompile = (shader) => {
      shader.uniforms.uSnowTrample = { value: trample?.texture ?? null };
      shader.uniforms.uSnowHeight = { value: height };
      shader.uniforms.uSnowDune = { value: FIELD.duneHeight };
      shader.uniforms.uSnowPressDepth = { value: FIELD.pressDepth };
      shader.uniforms.uSnowTexel = { value: 1 / TRAMPLE.size };
      // The gradient is measured across two texels of a 512 map spanning the
      // whole disc, so turning it into a surface normal means scaling by how
      // many world units those texels cover against how deep the press is.
      // Held a little under the true ratio: at the exact value every brush edge
      // became a crease, because the map is smooth and the geometry is not.
      shader.uniforms.uSnowSlope = {
        value: (FIELD.pressDepth * TRAMPLE.size) / (TRAMPLE.extent * 2) / 1.35,
      };
      // The anchor's five numbers live in `snowWorld` because the pointer pick
      // evaluates the same distance field on the CPU; a second copy here would
      // be a second surface for the pointer to press into.
      shader.uniforms.uSnowAnchorHalf = {
        value: new Vector2(FIELD_ANCHOR.half[0], FIELD_ANCHOR.half[1]),
      };
      shader.uniforms.uSnowAnchorCentre = {
        value: new Vector2(FIELD_ANCHOR.centre[0], FIELD_ANCHOR.centre[1]),
      };
      shader.uniforms.uSnowAnchorRound = { value: FIELD_ANCHOR.round };
      shader.uniforms.uSnowAnchorSoft = { value: FIELD_ANCHOR.soft };
      shader.uniforms.uSnowAnchorDepth = { value: FIELD_ANCHOR.depth };
      shader.uniforms.uSnowPressedTint = {
        value: new Color(SNOW_PRESSED).convertSRGBToLinear(),
      };
      shader.uniforms.uSnowFadeStart = { value: FIELD.fadeStart };
      shader.uniforms.uSnowTime = { value: 0 };

      shader.vertexShader = shader.vertexShader
        .replace("void main() {", `${SNOW_VERTEX_HEAD}\nvoid main() {`)
        .replace("#include <beginnormal_vertex>", SNOW_NORMAL_VERTEX)
        .replace("#include <begin_vertex>", SNOW_BEGIN_VERTEX);

      shader.fragmentShader = shader.fragmentShader
        .replace("void main() {", `${SNOW_FRAGMENT_HEAD}\nvoid main() {`)
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>\n${SNOW_MAP_FRAGMENT}`,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>\n${SNOW_ROUGHNESS_FRAGMENT}`,
        )
        .replace(
          "#include <aomap_fragment>",
          `#include <aomap_fragment>\n${SNOW_AO_FRAGMENT}`,
        );

      uniforms.current = shader.uniforms;
    };
    // Injected source is not part of three's own cache key, so without this two
    // standard materials compiled from different sources would share a program.
    created.customProgramCacheKey = () => "snow-field-v1";

    return { material: created, textures: [colour, normal, arm, height] };
  }, [maps, quality.tier, trample]);

  useEffect(() => {
    return () => {
      for (const texture of textures) {
        texture.dispose();
      }
      material.dispose();
    };
  }, [material, textures]);

  useFrame(({ clock }, delta) => {
    const map = uniforms.current;
    if (!map || !trample) {
      return;
    }

    map.uSnowTime.value = clock.getElapsedTime();

    const probe = pointer.current;
    if (probe.inside && !reducedMotion) {
      ndc.set(probe.x, probe.y);
      // The raycaster is here for its camera unprojection and nothing else:
      // `pickFieldUv` solves the surface analytically rather than walking the
      // disc's eighty thousand triangles once per frame.
      raycaster.setFromCamera(ndc, camera);
      if (pickFieldUv(raycaster.ray, uv)) {
        // The brush is charged by time rather than by event count, so the same
        // gesture leaves the same mark whether the pointer reports at 60Hz or
        // at 1000Hz, and a pointer held still keeps pressing rather than
        // stopping at whatever one sample happened to deposit.
        trample.press(
          uv.x,
          uv.y,
          TRAMPLE.brushStrength * Math.min(delta, 1 / 30) * 60,
        );
      }
    }

    if (trample.update(delta)) {
      invalidate();
    }
  });

  return (
    // Receives, never casts. The disc is the ground: nothing in this scene is
    // below it for it to shadow, and asking a 176-ring displaced surface to
    // render itself a second time into a depth map would cost the frame the
    // stack's shadow is paid for out of. Its own relief is modelled by the
    // sun's grazing angle across the normal map, which is cheaper and, at
    // thirteen degrees, sharper than a shadow map of the same dunes.
    <mesh
      geometry={geometry}
      material={material}
      receiveShadow
      castShadow={false}
      position={[0, FIELD.y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
}

/**
 * Shared by both stages: the marks the field remembers.
 *
 * `uSnowTrample` is the runtime canvas, black where the snow has never been
 * touched. `snowAnchorAt` is the stack's permanent press, and it is analytic
 * rather than painted for a reason worth stating: it never changes, so writing
 * it into the canvas would mean re-stamping it every frame to survive the same
 * decay that erases footprints — a megabyte of texture uploading forever to
 * hold a shape that is four numbers.
 */
const SNOW_SHARED_GLSL = /* glsl */ `
uniform sampler2D uSnowTrample;
uniform vec2 uSnowAnchorHalf;
uniform vec2 uSnowAnchorCentre;
uniform float uSnowAnchorRound;
uniform float uSnowAnchorSoft;
uniform float uSnowAnchorDepth;

float snowAnchorAt( vec2 p ) {
  vec2 d = abs( p - uSnowAnchorCentre ) - uSnowAnchorHalf;
  float outside = length( max( d, vec2( 0.0 ) ) );
  float inside = min( max( d.x, d.y ), 0.0 );
  float sd = outside + inside - uSnowAnchorRound;
  return uSnowAnchorDepth *
    ( 1.0 - smoothstep( -uSnowAnchorSoft, uSnowAnchorSoft, sd ) );
}

float snowPressAt( vec2 p ) {
  return clamp( texture2D( uSnowTrample, p ).r + snowAnchorAt( p ), 0.0, 1.0 );
}
`;

const SNOW_VERTEX_HEAD = /* glsl */ `
uniform sampler2D uSnowHeight;
uniform float uSnowDune;
uniform float uSnowPressDepth;
uniform float uSnowTexel;
uniform float uSnowSlope;
varying float vSnowPress;
varying vec2 vSnowUv;
${SNOW_SHARED_GLSL}
`;

/**
 * The displaced surface's own normal, replacing the flat one the disc was built
 * with.
 *
 * Only the press contributes. The dunes are a metre-scale swell whose normal
 * barely differs from flat, and the crystal-scale detail already arrives
 * through the normal map; what has to be right is the mark, because a
 * depression whose normal still points straight up is a stain, not a hole. The
 * gradient is central-differenced across two texels — the smallest symmetric
 * stencil, and an asymmetric one biases every rim towards the side it was
 * sampled from.
 */
const SNOW_NORMAL_VERTEX = /* glsl */ `
vSnowUv = uv;
float snowPress = snowPressAt( uv );
vSnowPress = snowPress;

vec2 snowStep = vec2( uSnowTexel, 0.0 );
float snowL = snowPressAt( uv - snowStep.xy );
float snowR = snowPressAt( uv + snowStep.xy );
float snowD = snowPressAt( uv - snowStep.yx );
float snowU = snowPressAt( uv + snowStep.yx );

vec3 objectNormal = normalize( vec3(
  ( snowL - snowR ) * uSnowSlope,
  ( snowD - snowU ) * uSnowSlope,
  1.0
) );
#ifdef USE_TANGENT
  vec3 objectTangent = vec3( tangent.xyz );
#endif
`;

const SNOW_BEGIN_VERTEX = /* glsl */ `
vec3 transformed = vec3( position );
float snowDune = texture2D( uSnowHeight, uv ).r;
transformed.z += ( snowDune - 0.5 ) * uSnowDune - snowPress * uSnowPressDepth;
`;

/**
 * A cheap 2D simplex, used only as an overlay.
 *
 * The photographic set is the material; this is weather on top of it. It exists
 * because a tiling photograph, however good, repeats — and once the eye finds
 * the repeat it stops reading the surface as a field and starts reading it as
 * wallpaper. A slow, non-repeating drift over the roughness and a trace of it
 * over the albedo is enough to break the lattice, and it costs no texture.
 */
const SNOW_NOISE_GLSL = /* glsl */ `
vec3 snowPermute( vec3 x ) {
  return mod( ( ( x * 34.0 ) + 1.0 ) * x, 289.0 );
}

float snowNoise( vec2 v ) {
  const vec4 C = vec4( 0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439 );
  vec2 i = floor( v + dot( v, C.yy ) );
  vec2 x0 = v - i + dot( i, C.xx );
  vec2 i1 = ( x0.x > x0.y ) ? vec2( 1.0, 0.0 ) : vec2( 0.0, 1.0 );
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod( i, 289.0 );
  vec3 p = snowPermute( snowPermute( i.y + vec3( 0.0, i1.y, 1.0 ) )
                      + i.x + vec3( 0.0, i1.x, 1.0 ) );
  vec3 m = max( 0.5 - vec3( dot( x0, x0 ), dot( x12.xy, x12.xy ),
                            dot( x12.zw, x12.zw ) ), 0.0 );
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract( p * C.www ) - 1.0;
  vec3 h = abs( x ) - 0.5;
  vec3 ox = floor( x + 0.5 );
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0 * a0 + h * h );
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 0.5 + 65.0 * dot( m, g );
}
`;

const SNOW_FRAGMENT_HEAD = /* glsl */ `
uniform vec3 uSnowPressedTint;
uniform float uSnowFadeStart;
uniform float uSnowTime;
varying float vSnowPress;
varying vec2 vSnowUv;
${SNOW_SHARED_GLSL}
${SNOW_NOISE_GLSL}
`;

/**
 * Two things happen to the colour of pressed snow, and only one of them is
 * darkening.
 *
 * Compacting snow collapses the air out of it, so less light comes back — but
 * what does come back has travelled further through ice before escaping, which
 * moves it towards the sky's blue. A footprint that is merely a darker grey
 * looks like dirt; the tint is what makes it read as depth.
 *
 * The rim fade is on the same line because it is the same operation: the disc
 * has to stop being snow and start being the page, and doing that in alpha
 * rather than by ending the geometry means there is no edge to see.
 */
const SNOW_MAP_FRAGMENT = /* glsl */ `
float snowWind = snowNoise( vSnowUv * 9.0 + uSnowTime * vec2( 0.011, 0.006 ) );
float snowDrift = snowNoise( vSnowUv * 34.0 - uSnowTime * vec2( 0.004, 0.017 ) );
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  diffuseColor.rgb * uSnowPressedTint,
  smoothstep( 0.04, 0.85, vSnowPress )
);
diffuseColor.rgb *= 1.0 - ( snowWind * 0.022 + snowDrift * 0.013 );
float snowRim = length( vSnowUv - vec2( 0.5 ) ) * 2.0;
diffuseColor.a *= 1.0 - smoothstep( uSnowFadeStart, 1.0, snowRim );

`;

/**
 * A press polishes what it touches: the crust breaks, the crystals pack, and
 * the floor of a footprint is measurably glossier than the powder around it.
 * The wind term pulls the other way over the untouched field, so the two never
 * average into one even sheen.
 */
const SNOW_ROUGHNESS_FRAGMENT = /* glsl */ `
roughnessFactor = clamp(
  roughnessFactor + snowWind * 0.14 - vSnowPress * 0.24,
  0.05,
  1.0
);
`;

/**
 * The one thing an environment-lit scene cannot work out for itself.
 *
 * Under a sky this size almost all the light is ambient, and ambient light
 * reaches the floor of a depression from a smaller piece of sky than it reaches
 * the flat around it. Without this the press has correct normals and correct
 * colour and still reads as flat, because its deepest part is as bright as the
 * surface beside it.
 */
const SNOW_AO_FRAGMENT = /* glsl */ `
reflectedLight.indirectDiffuse *= 1.0 - vSnowPress * 0.2;
`;
