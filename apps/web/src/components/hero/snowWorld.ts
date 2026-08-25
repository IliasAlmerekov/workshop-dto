/**
 * The hero's material world: four boundaries cut from pressed snow, resting on
 * a field of fresh snow that holds whatever passes over it.
 *
 * The world exists because of one correspondence. A DTO is a shape that data is
 * pressed into on the way through a boundary — what comes out the other side
 * carries the mark of the shape, not the thing that made it. Snow is the one
 * everyday material that does exactly that, visibly, at human scale: you step,
 * and the ground keeps the footprint. So the field under the stack is not
 * scenery. It is the mechanism, and the visitor's own pointer is what
 * demonstrates it.
 *
 * Colour follows from that, not from decoration, and the answer here is almost
 * none. This world is monochrome: a neutral field, neutral snow blocks, one low
 * sun, and nothing in frame carrying a hue it did not earn from the light. The
 * version before it argued that a snow shadow is blue and painted the whole
 * scene with the interface's Accent Blue on that basis — true under an overcast
 * sky, and a cheerful cast the moment the frame had a sun in it, because then
 * almost every blue surface in it was one the sun could reach.
 *
 * One exception, and it is the composition's subject: the core frozen inside
 * the lit boundary. Blue is the only chroma left in the scene, so it belongs to
 * exactly one thing, and that thing is the boundary the workshop is about.
 *
 * Value does the work colour used to. The field is raked by a grazing sun and
 * stays bright; the blocks are the same white snow but present their flat faces
 * to a sun thirteen degrees up, so they fall away to a mid grey with lit
 * chamfers — the separation is exposure, not pigment.
 *
 * three.js takes colours, not CSS custom properties, so every value is a hex
 * literal naming the design token it mirrors.
 */

import { SLAB } from "./dtoLayers";

/**
 * ambientCG's **Snow010A** (CC0), versioned locally at 1K, packed here.
 *
 * One scan serves the whole world, at two scales. That is not a saving, it is
 * the material argument: the ground and the boundaries are the same snow, and
 * what separates them is how hard it has been packed. Tiled fine the surface
 * reads as loose powder; tiled coarse the same crust becomes lumps a person
 * could pick up. Two different scans would have made them two different
 * substances, which is the one thing this composition must not say.
 *
 * It replaces a pair of photogrammetry sets whose albedo averaged 165 of 255 —
 * mid grey, because a photograph of snow is exposed so the *photograph* reads
 * correctly, not so the material does. Rendered, that is wet asphalt, and no
 * amount of exposure recovers it without blowing out everything else in frame.
 * This one measures 223, 239, 252: bright, and already carrying the sky's blue.
 *
 * Occlusion and roughness are shipped apart by the source and packed into R and
 * G here, which is exactly where three.js samples `aoMap` and `roughnessMap`
 * from — one upload instead of two, and B left at zero for the metalness the
 * material does not have.
 */
export const SNOW_MAPS = {
  colour: "/textures/snow/snow010a_color_1k.jpg",
  normal: "/textures/snow/snow010a_normal_1k.jpg",
  arm: "/textures/snow/snow010a_arm_1k.jpg",
  height: "/textures/snow/snow010a_height_1k.jpg",
} as const;

/**
 * Tiles across the surface each material covers.
 *
 * The field is 68 world units wide and seen from ten metres up; the slabs are
 * four units wide and seen close. Setting both against the scan's own metre
 * gives the field its powder and the blocks their lumps, from one texture.
 */
export const SNOW_TILING = {
  field: 24,
  block: [1.3, 0.72],
} as const;

/**
 * Poly Haven's **Snow Field** (CC0) at 1K: a real overcast winter sky over real
 * snow.
 *
 * It carries most of the scene's energy, and that is deliberate. Diffuse light
 * over snow is the easiest condition in computer graphics to get wrong by hand,
 * because almost all of it is bounce: the sky is one enormous softbox and the
 * ground throws most of it back up again. No arrangement of lamps reproduces
 * that, and every attempt ends in one hard key over a flat fill. A measured
 * environment gives the blocks their wrap-around terminator and their lift from
 * below for free.
 *
 * What it cannot do is decide a direction, which is why it is no longer alone:
 * see `SNOW_SUN`. The sky is now the fill and the sun is the key, in that
 * order of energy and the opposite order of authorship.
 */
export const SNOW_ENVIRONMENT = "/hdri/snow_field_1k.hdr";

/**
 * The sun, sitting almost on the horizon.
 *
 * The environment above is still the scene's light *budget* — nearly all of the
 * energy in an arctic frame is sky and bounce — but a sky alone cannot model a
 * shape. It arrives from everywhere, so every face of every block receives
 * roughly the same amount and nothing casts anything: that is why the stack had
 * no shadow to stand in and no side that was darker than another. One hard
 * source fixes both, and where it is placed is the whole character of the
 * frame.
 *
 * It is placed low. `elevation` is the sun's height against `reach`, its
 * distance out — 4.8 against 20.6 is thirteen degrees above the horizon, which
 * is polar afternoon. Two things follow from that angle and neither is
 * available at any other. Light arriving this flat *grazes*: it crosses a
 * surface almost parallel to it, so it catches the top of every crystal and
 * skips the trough behind it, and the field's relief becomes legible instead
 * of averaging out into a sheet. And a shadow cast at thirteen degrees is more
 * than four times the height of the thing casting it, so the four boundaries
 * lay four hard bars across the snow at four different lengths — the top one
 * running far enough out that its end dissolves into the whiteout — rather
 * than four puddles underneath themselves.
 *
 * Any lower and the geometry stops paying: the top boundary floats seven units
 * over the field, and past about ten degrees its shadow leaves the disc
 * entirely and the stack is back to standing on nothing.
 *
 * `intensity` is what it is because the sky is not being turned down all the way
 * to compensate. Two lights of comparable strength would give the flat, keyless
 * look back; the sun has to be clearly the one that decides where a highlight
 * falls, and the sky's job is reduced to filling the side it cannot reach.
 */
export const SNOW_SUN = {
  /** Neutral, barely warm. Low sun over snow is not golden hour — the
   *  atmosphere it crosses is dry and there is nothing in it to redden. */
  colour: "#fff8ef",
  intensity: 2.6,
  elevation: 4.8,
  reach: 20.6,
  /** Bearing in the XZ plane, radians. Front-left, so the shadow is thrown
   *  right and away from the camera — across the open field the layout keeps
   *  clear, rather than back under the display type on the left. */
  bearing: 2.42,
  /**
   * The sky's remaining share.
   *
   * Held well below the 1.0 it had when it was the only light. An environment
   * at full strength next to a sun this strong is not a fill, it is a second
   * key, and the terminator it produces on every block wraps so far around that
   * the silhouette softens back into the field.
   */
  environmentIntensity: 0.62,
  /**
   * Half-extent of the shadow camera's orthographic frustum, in world units.
   *
   * Sized to the shadow, not to the scene. A 34-unit field would need a
   * frustum wide enough to spend most of its texels on snow nothing is
   * standing on; this covers the stack and the full run of what it throws, and
   * the field past that is lit by sky alone anyway.
   */
  shadowExtent: 26,
} as const;

/**
 * The field's diffuse tint, applied over the photographic albedo.
 *
 * Neutral, and deliberately a shade under white. The previous value was a warm
 * white built to cancel two of the three blues this scene used to multiply
 * together, which is the kind of correction that works right up until someone
 * looks at the result next to a real photograph of snow: cancelling a cast with
 * its opposite leaves a *tinted* white, not an untinted one, and the eye reads
 * the residue. So the cast is removed at every source instead, and this tint
 * has no hue left to correct. Under a grazing sun a snow field is not white
 * anyway — it is one narrow value away from white where the light lands and
 * several away everywhere else, and starting a hair below white is what leaves
 * the highlights somewhere to go.
 */
export const SNOW_SURFACE = "#f2f2f2";

/**
 * What a press looks like from inside.
 *
 * Compacted snow is denser, so less light escapes it, and a footprint's floor
 * can see almost no sky at all. Neutral rather than blue: with the sun this low
 * the light reaching the bottom of a press has bounced off snow, and snow's
 * bounce carries the albedo it bounced off, not the sky's hue.
 */
export const SNOW_PRESSED = "#b5b7b9";

/**
 * The blocks' own tint. White: the scan already carries all the colour snow has.
 *
 * Kept white deliberately, now that the scene has a sun in it. The obvious way
 * to stop four white volumes dissolving into white ground is to darken them,
 * and it works, and it is a lie — the boundaries and the field are the same
 * material at two densities, and painting one of them grey says they are two
 * substances. The separation comes from light instead, and it comes for free at
 * this sun angle: a horizontal top face under a thirteen-degree sun receives
 * about a fifth of what a sun-facing bevel does, so the blocks read as a stack
 * of dim planes with bright rolled edges while the open field, raked by the
 * same light, stays bright. Same albedo, opposite exposure — which is what
 * actually happens to a snow brick sitting on snow late in the day.
 */
export const SNOW_BLOCK = "#ffffff";
/**
 * What the snow immediately around the core turns.
 *
 * The tint multiplies the albedo rather than adding to it, so this is the value
 * the block *loses* to having something buried in it — and it has to stay light.
 * Taken down towards navy the block went murky, because the emissive term was
 * then adding light to snow that had just been darkened, and the two cancelled
 * into a flat mid-blue with no centre. Light and clearly cyan: the tint says
 * *this snow is carrying light*, and the emissive says where the light is. The
 * job of looking bright belongs to the second one.
 */
export const SNOW_BLOCK_ACTIVE = "#c4e6ff";

/**
 * `blue/600`. The attention colour, and the one hue this world keeps.
 *
 * Everything else in frame gave its colour up: the field is neutral, the
 * occlusion is neutral, the sun is barely warm, and a desaturation pass at the
 * end of the composer takes the last of the photographic cast off the sky and
 * the albedo. This survives that pass on purpose, and it is the only thing that
 * does. In a frame with no other chroma in it, a single blue does not need to
 * be loud to be the first thing seen — and it is the same blue the participant
 * meets again on the task screen as the active step.
 */
export const ICE_ACCENT = "#1e62fd";

/**
 * The colour of a broken edge.
 *
 * Where a pressed-snow block has been cut, the crystals at the cut are
 * fractured rather than weathered, and a fractured crystal returns light almost
 * achromatically — which is why the chamfer on a real snow brick is the one
 * part of it that stays white when the rest goes to shadow. On a white block
 * this is doing something subtler than it would on a dark one: it is not
 * drawing a bright line on a dark object, it is holding the chamfer up while
 * the flat faces fall away under a sun they are nearly parallel to. A trace
 * cooler than the faces, so the two never merge.
 */
export const ICE_EDGE = "#f4f7fa";
/**
 * The thing frozen inside the lit boundary — and the only light in the scene
 * that is a colour rather than a value.
 *
 * Cyan, and fully saturated. The scene around it is monochrome by construction,
 * so this does not have to be loud to be the subject; it has to be the one place
 * chroma exists at all, which is a far stronger position than the old scene
 * could give it, where the whole frame was blue and a blue core was more of the
 * same.
 *
 * Two earlier attempts are worth recording because both failed in the same
 * direction. A pale near-white core was a lamp switched on under a sheet — no
 * hue, so nothing to place it in the material. A deep navy one had the hue and
 * no light: authored dark and then dimmed by the desaturation pass, it arrived
 * as a bruise on the block rather than as something burning inside it. What the
 * effect actually needs is both at once, and the way to get both is to put the
 * saturation in the *colour* and the brightness in the *falloff* — a hot,
 * small centre that scatters outward across the whole block, which is what
 * `SLAB_GLOW_BLEED` now builds out of two gaussians instead of one.
 *
 * Cyan rather than the interface's own blue for a material reason. Snow and ice
 * transmit the short end of the spectrum furthest — it is why the inside of a
 * crevasse is cyan and not navy — so a light that has travelled through
 * centimetres of pressed snow to reach the surface arrives shifted this way.
 * The blue family it belongs to is still recognisably the interface's; it has
 * simply been through the material.
 */
export const ICE_GLOW = "#00a6ff";

/**
 * The colour of not seeing the sky.
 *
 * Ambient occlusion is usually black because most scenes are lit by something
 * with a colour of its own. Here a place that is occluded is a place that can
 * see less of the sky and none of the sun — so it is dark, and it is dark
 * without a hue. The blue this used to carry was the sky's, and it was correct
 * for an overcast world with no sun in it; with a low sun doing the modelling,
 * the same tint turned every gap between two slabs into a lit blue channel and
 * undid the contact it exists to create.
 */
export const SNOW_OCCLUSION = "#4a4d51";

export const LABEL_INK = "#0a0a0a"; // neutral/black
export const LABEL_MUTED = "#26262c"; // held up against bright snow
export const LABEL_ACCENT = "#0b3fd0"; // blue/700 — AA-safe on a lit block
export const LABEL_COOL = "#3c4a68"; // the receding `Response DTO`

export const CONNECTOR = "#8ea9d2";
export const CONNECTOR_MUTED = "#c2c8d4";
export const CONNECTOR_NODE = "#1e62fd"; // blue/600
export const CONNECTOR_NODE_MUTED = "#bcc4d2";

export const LABEL_FONT = "/fonts/inter-latin-500-normal.woff";

/**
 * The snow field is the page's ground, not the hero's backdrop.
 *
 * It spans the whole viewport and everything on the page stands on it: the
 * display type, the track cards, the stack. That is the difference between a
 * decorative panel and a world — a picture of snow inside one column would be
 * an illustration of the idea, and a field the visitor can walk their pointer
 * across, anywhere, is the idea itself.
 *
 * It is still a disc rather than a horizon. A horizon needs a sky, and a sky
 * would make the page a photograph with an interface printed on it; the disc's
 * rim dissolves into the page's own `bg/canvas` instead, so the world has no
 * edge and no seam.
 */
export const FIELD = {
  radius: 34,
  /** Concentric rings and radial segments of the displaced disc. */
  rings: 176,
  segments: 224,
  /** World-space Y of the untrampled surface, below the lowest slab. */
  y: -4.25,
  /** How far the photographic height map lifts the dunes, in world units. */
  duneHeight: 0.55,
  /** How far a full press sinks the surface. */
  pressDepth: 0.72,
  /**
   * Where the rim starts dissolving, as a fraction of the radius.
   *
   * Held very late, because by the time the geometry runs out the haze below
   * has already turned the field into the page's own colour. This exists only
   * to make sure the last row of triangles has nothing left to show; the
   * horizon itself is atmosphere, not a fade.
   */
  fadeStart: 0.93,
} as const;

/**
 * The whiteout.
 *
 * A snow field under an overcast sky does not end at a line — it dissolves,
 * because the same sky lighting it is also scattering in the air between it and
 * you, and at some distance the two are the same value. That is the only honest
 * way to end this world on a page, and it happens to be the exact effect the
 * layout needs: the far field arrives at `bg/canvas`, which is what the page is
 * painted with, so the disc has no visible edge and no seam anywhere.
 */
export const FIELD_HAZE = {
  colour: "#f6f6f6", // bg/canvas — the page's own backdrop
  // Held well past the stack. At the first setting the boundaries themselves
  // were a third of the way into the haze and dissolving with the horizon —
  // the atmosphere has to start behind the subject, not on it.
  near: 26,
  far: 50,
} as const;

/**
 * The heightmap the field's vertex shader reads.
 *
 * 512 is chosen against the brush, not against the screen: a press is roughly
 * 2.4 world units across on a 52-unit field, so it lands about 24 texels wide.
 * That is enough for the rim of a footprint to curve, and small enough that the
 * whole texture re-uploads in well under a frame — which matters more now that
 * the pointer can reach every part of the page.
 */
export const TRAMPLE = {
  size: 512,
  /** World units the map spans, which is what maps world X/Z onto the canvas. */
  extent: FIELD.radius * 2,
  /**
   * Brush radius in canvas pixels, and how much one stamp adds.
   *
   * Deliberately weak per stamp. A press that lands at full depth from a single
   * pointer sample reads as a decal being switched on; accumulating it over the
   * several samples a real gesture produces is what makes the depression follow
   * the hand.
   */
  brushRadius: 12,
  brushStrength: 0.4,
  /**
   * How fast the field recovers, as the fraction of remaining press erased per
   * second.
   *
   * Snow does not actually heal, but a hero that never forgets is a hero that
   * is uniformly grey within a minute — the effect would demonstrate itself
   * once and then be over. Wind filling a track in is the honest reading, and
   * at this rate a footprint is still legible for about six seconds and gone by
   * twelve, so the field is always both marked and mostly fresh.
   */
  healPerSecond: 0.55,
} as const;

/**
 * The stack's own permanent press, in the disc's UV space.
 *
 * A rounded box distance field rather than a painted mark: it never changes, so
 * stamping it into the trample canvas would mean re-stamping it every frame to
 * survive the same decay that erases footprints — a megabyte of texture
 * uploading forever to hold a shape that is five numbers.
 *
 * It lives here rather than inside the field's material because it is now read
 * twice. The vertex shader turns it into geometry, and the CPU evaluates the
 * same function to find where the pointer meets the surface — and two copies of
 * a height function are two surfaces, so the pointer would press somewhere the
 * snow is not.
 *
 * `half` is widened past the slab it stands for: a press is never the exact
 * outline of the thing that made it, the material fails outward, and an anchor
 * matching the slab edge for edge would read as a projection of it rather than
 * as a mark left by it.
 */
export const FIELD_ANCHOR = {
  half: [
    (SLAB.width * 0.62) / TRAMPLE.extent,
    (SLAB.depth * 0.72) / TRAMPLE.extent,
  ] as const,
  centre: [0.5, 0.5] as const,
  round: 0.006,
  /**
   * Narrow, and deep rather than dark. A press reads as a press because its rim
   * catches light and its floor does not; widen the falloff and the two blur
   * into one grey gradient, which is a drop shadow — the figure this whole world
   * exists to replace.
   */
  soft: 0.0058,
  depth: 0.82,
} as const;
