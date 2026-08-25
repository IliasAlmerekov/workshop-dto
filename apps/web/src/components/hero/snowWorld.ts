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
 * Colour follows from that, not from decoration. Snow in overcast light is a
 * near-white that carries the sky's blue in every place light does not reach
 * directly, which means the system's one attention colour — Accent Blue
 * `#1e62fd` — is already this world's native shadow hue. The hero's retired
 * lavender family is not replaced by a second accent; it is dissolved into the
 * blue the rest of the interface was already using. Nothing here introduces a
 * colour the participant does not meet again on the task screen.
 *
 * three.js takes colours, not CSS custom properties, so every value is a hex
 * literal naming the design token it mirrors.
 */

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
 * It is the only light in the scene, and that is deliberate. Overcast light
 * over snow is the rarest lighting condition in computer graphics and the
 * easiest to get wrong by hand, because almost all of it is bounce: the sky is
 * one enormous softbox and the ground throws most of it back up again. Any
 * arrangement of directional and point lights approximating that ends up with
 * one hard key and a flat fill — the plastic look. A measured environment gives
 * the blocks their soft wrap-around terminator and their cold blue underside
 * for free, and it is what the rims reflect.
 */
export const SNOW_ENVIRONMENT = "/hdri/snow_field_1k.hdr";

/**
 * The field's diffuse tint, applied over the photographic albedo.
 *
 * A white with a trace of warmth in it, which is a correction applied twice
 * over. The first correction was upward: the scan this replaced averaged middle
 * grey, and no exposure recovers wet asphalt into snow. The second is this one,
 * sideways. Three separate things in this scene are blue on purpose — the
 * scan's own albedo, the overcast sky lighting it, and the occlusion tinted
 * towards that sky — and three blues multiplied are not a cold white, they are
 * ice. The warmth here cancels exactly two of them, so the field lands neutral
 * where the light hits it square and keeps its blue only where the light does
 * not reach. Which is what snow does.
 */
export const SNOW_SURFACE = "#fffcf5";

/**
 * What a press looks like from inside.
 *
 * Compacted snow is denser, so less light escapes it and more of what does has
 * bounced around under the surface, which pulls it towards the sky's blue. This
 * is the colour a footprint's floor is, and it deepens with the press.
 */
export const SNOW_PRESSED = "#d6e0ed";

/** The blocks' own tint. White: the scan already carries all the colour snow has. */
export const SNOW_BLOCK = "#ffffff";
export const SNOW_BLOCK_ACTIVE = "#e9f0ff";

/**
 * `blue/600`. The attention colour, and simultaneously the colour of a shadow
 * on snow — which is why the accent block does not need a second material to
 * announce itself. It is the same snow, reading a little more like ice.
 */
export const ICE_ACCENT = "#1e62fd";
/**
 * `blue/500`. The thing frozen inside the lit boundary.
 *
 * This is the only light in the scene that is not the sky, and it is allowed
 * because it is not lighting anything — it is *being* something. The colour is
 * one step up DESIGN.md's ramp from the accent itself, because a source always
 * reads lighter than the surface it is tinting, and the snow around it lands on
 * `blue/100` on the way out.
 */
export const ICE_GLOW = "#5b8dfe"; // blue/500

/**
 * The colour of not seeing the sky.
 *
 * Ambient occlusion is usually black because most scenes are lit by something
 * with a colour of its own. Here the only light is a sky, so a place that is
 * occluded is not a place with less light in it — it is a place that can see
 * less sky, and what it loses is sky-coloured. Tinted rather than neutral, the
 * gaps between the slabs come out the blue that snow shadows actually are
 * instead of the grey that gives a render away.
 */
export const SNOW_OCCLUSION = "#8ea6cb";

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
