import type { Ray, Vector2 } from "three";
import { FIELD, FIELD_ANCHOR, TRAMPLE } from "./snowWorld";

/**
 * Where the pointer meets the snow — solved against the field's height
 * function, not against the field's triangles.
 *
 * The disc is a ring of 224 by 176 quads, so `Raycaster.intersectObject` walks
 * roughly eighty thousand triangles to answer one question, every frame the
 * pointer is over the page. It does that with a matrix-inverted ray and a
 * three-way barycentric test per triangle, on the main thread, next to
 * React — and it produces an answer no more truthful than this one, because
 * the geometry it tests is the *undisplaced* ring: all of this field's relief
 * lives in the vertex shader, where a raycaster cannot see it.
 *
 * So the surface is described once, analytically, and the ray is intersected
 * with that description by bisection. The height function is bounded — the
 * surface cannot leave the band between the untouched plane and the floor of a
 * full press — which turns the intersection into a sign change inside a known
 * interval, and a sign change inside a known interval is fourteen halvings.
 * Two dozen arithmetic operations replace eighty thousand triangle tests, and
 * the answer is closer to the surface the visitor is actually looking at.
 */

/** Highest the modelled surface can reach: the untouched plane. */
const SURFACE_CEILING = FIELD.y;

/**
 * Lowest it can reach: the floor of the deepest press the height function
 * knows about. Slightly generous, so the bracket always contains the crossing
 * rather than sitting exactly on it.
 */
const SURFACE_FLOOR = FIELD.y - FIELD.pressDepth;

/**
 * Halvings of the bracket.
 *
 * The interval spans `pressDepth` of vertical travel, so fourteen halvings
 * resolve the crossing to about forty microns of world space — four orders of
 * magnitude finer than the 0.13-unit texel the result is used to address.
 * Every step past that is arithmetic spent below the resolution of the answer.
 */
const BISECTION_STEPS = 14;

/** Rays that graze the plane produce a `t` that overflows into nonsense. */
const MIN_DESCENT = 1e-6;

const RADIUS_SQUARED = FIELD.radius * FIELD.radius;

/** GLSL's `smoothstep`, so the CPU and the vertex shader agree at every point. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * How pressed the surface is at one point of the disc, from 0 to 1.
 *
 * The CPU half of `snowAnchorAt` in the field's vertex shader — the same
 * rounded-box distance field, the same falloff. What it leaves out is what the
 * CPU cannot cheaply read: the photographic dune map, which lives on the GPU,
 * and the visitor's own footprints, which live in a canvas that is written for
 * upload and never read back. Both are absent from the triangle raycast this
 * replaces as well, so nothing is lost — and neither one could move the answer
 * far: the dunes are a half-unit swell under a camera looking well down at the
 * field, and a footprint's own depth only ever biases the pick towards the
 * footprint the pointer is already standing in.
 */
export function fieldPressAt(u: number, v: number): number {
  const dx = Math.abs(u - FIELD_ANCHOR.centre[0]) - FIELD_ANCHOR.half[0];
  const dy = Math.abs(v - FIELD_ANCHOR.centre[1]) - FIELD_ANCHOR.half[1];
  const outsideX = Math.max(dx, 0);
  const outsideY = Math.max(dy, 0);
  const outside = Math.sqrt(outsideX * outsideX + outsideY * outsideY);
  const inside = Math.min(Math.max(dx, dy), 0);
  const distance = outside + inside - FIELD_ANCHOR.round;

  return (
    FIELD_ANCHOR.depth *
    (1 - smoothstep(-FIELD_ANCHOR.soft, FIELD_ANCHOR.soft, distance))
  );
}

/**
 * World-space Y of the surface above a point of the disc, in UV coordinates.
 */
export function fieldHeightAt(u: number, v: number): number {
  return FIELD.y - fieldPressAt(u, v) * FIELD.pressDepth;
}

/**
 * World X/Z to the disc's UV, which is also the trample canvas's UV.
 *
 * `RingGeometry` maps its local XY into the unit square, and the mesh is laid
 * flat by a quarter turn about X — which sends local +Y to world −Z, hence the
 * one flipped sign. Worth stating because it is the seam where a mark ends up
 * mirrored about the camera axis and looks almost right.
 */
export function fieldUv(x: number, z: number, out: Vector2): Vector2 {
  return out.set(x / TRAMPLE.extent + 0.5, 0.5 - z / TRAMPLE.extent);
}

/**
 * The disc's UV under a ray, or `false` when the ray misses the field.
 *
 * `out` is written in place and only when the return value is `true`, so the
 * caller can keep one vector for the life of the scene.
 */
export function pickFieldUv(ray: Ray, out: Vector2): boolean {
  const descent = ray.direction.y;
  // Looking level or up: whatever is under the pointer, it is not the ground.
  if (descent > -MIN_DESCENT) {
    return false;
  }

  const exit = (SURFACE_FLOOR - ray.origin.y) / descent;
  if (exit <= 0) {
    return false;
  }
  let near = Math.max((SURFACE_CEILING - ray.origin.y) / descent, 0);
  let far = exit;

  for (let step = 0; step < BISECTION_STEPS; step += 1) {
    const middle = (near + far) / 2;
    const x = ray.origin.x + ray.direction.x * middle;
    const z = ray.origin.z + ray.direction.z * middle;
    fieldUv(x, z, out);
    // Positive while the ray is still above the surface.
    if (ray.origin.y + descent * middle > fieldHeightAt(out.x, out.y)) {
      near = middle;
    } else {
      far = middle;
    }
  }

  const hit = (near + far) / 2;
  const x = ray.origin.x + ray.direction.x * hit;
  const z = ray.origin.z + ray.direction.z * hit;
  // The field is a disc, and the corners of its UV square are off it.
  if (x * x + z * z > RADIUS_SQUARED) {
    return false;
  }

  fieldUv(x, z, out);
  return true;
}
