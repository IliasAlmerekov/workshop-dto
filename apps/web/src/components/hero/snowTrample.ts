import { CanvasTexture, LinearFilter, ClampToEdgeWrapping } from "three";
import { TRAMPLE } from "./snowWorld";

/**
 * The field's memory: a single-channel height map the pointer writes into and
 * the wind erases, living on a 2D canvas that is never shown.
 *
 * This is the whole interactive effect, and it is deliberately not a
 * simulation. Particles, cloth, or a real snow solver all spend their budget on
 * physics nobody can see at hero scale, and all of them scale with the number
 * of marks rather than with the size of the field. Here every press — the first
 * and the ten-thousandth — is one `drawImage` of a pre-rendered brush into a
 * fixed 512×512 buffer, and the vertex shader turns whatever is in that buffer
 * into geometry. The cost is flat.
 *
 * Black is pristine snow and white is a full press, which is the opposite of
 * the convention (a displacement map usually reads white as *up*) and is the
 * right way round here: the map's neutral state is its cleared state, so a
 * field that has never been touched costs nothing to represent and the buffer
 * can be uploaded exactly when it stops being empty.
 */
export class SnowTrample {
  readonly texture: CanvasTexture;

  private readonly context: CanvasRenderingContext2D;
  private readonly brush: HTMLCanvasElement;

  /**
   * A running estimate of how much press is left in the buffer.
   *
   * It exists so the field can stop working. Healing means compositing a
   * translucent black rectangle over the canvas and re-uploading a megabyte of
   * texture, every rendered frame, forever — which is a real cost to pay for a
   * buffer that has been uniformly black for the last thirty seconds. This
   * tracks the same exponential the composite applies, so the class can tell
   * when the remainder is below what a byte can represent and shut the whole
   * path down until the pointer comes back.
   */
  private residual = 0;
  private painted = false;
  private settled = true;

  /**
   * True when the canvas has been painted since the last upload.
   *
   * The buffer is a megabyte, and handing it to the driver means a full
   * `texImage2D` — decode, unpack, and a stall if the GPU is still reading the
   * previous copy. At sixty frames that is 60MB/s of bus traffic spent on a
   * shape whose fastest feature is a footprint filling in over six seconds, so
   * the copy is refreshed on every other frame instead. It halves the cost and
   * it is invisible: the map is read as a *displacement*, low-frequency by
   * construction and filtered bilinearly on the way in, so one frame of lag on
   * the rim of a mark is a sub-texel difference in a surface the eye is
   * tracking for its light, not its latency.
   *
   * Two frames are exempt. The first press after the field has been asleep goes
   * up immediately, because that one *is* visible — it is the gap between the
   * pointer arriving and the snow answering. And the frame that settles goes up
   * unconditionally: it is the clear to true black, and skipping it would leave
   * the GPU holding the last mark forever with nothing scheduled to replace it.
   */
  private stale = false;

  constructor(document: Document) {
    const canvas = document.createElement("canvas");
    canvas.width = TRAMPLE.size;
    canvas.height = TRAMPLE.size;

    const context = canvas.getContext("2d", { willReadFrequently: false });
    if (!context) {
      throw new Error("Snow trample map needs a 2D canvas context.");
    }
    context.fillStyle = "#000000";
    context.fillRect(0, 0, TRAMPLE.size, TRAMPLE.size);
    this.context = context;

    this.brush = buildBrush(document);

    const texture = new CanvasTexture(canvas);
    // The map is read as a smooth function of position, never as an image:
    // linear filtering is what turns 24 texels of brush into a curved rim, and
    // mipmaps would only ever be sampled at level zero.
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    this.texture = texture;
  }

  /**
   * Press the surface at one point, in the field's own UV coordinates.
   *
   * `amount` accumulates rather than sets, so the depth of a mark is decided by
   * how long the pointer lingers — a sweep leaves a shallow trail and a pause
   * leaves a hole. That is the behaviour of the real material, and it is also
   * what makes the effect survive a pointer that reports at 500Hz on one device
   * and 60Hz on another: the same gesture deposits the same total.
   */
  press(u: number, v: number, amount: number = TRAMPLE.brushStrength): void {
    if (!Number.isFinite(u) || !Number.isFinite(v)) {
      return;
    }

    const size = TRAMPLE.size;
    const radius = TRAMPLE.brushRadius;
    // Canvas rows run top-down while UV runs bottom-up.
    const x = u * size;
    const y = (1 - v) * size;

    this.context.globalCompositeOperation = "lighter";
    this.context.globalAlpha = Math.min(1, Math.max(0, amount));
    this.context.drawImage(
      this.brush,
      x - radius,
      y - radius,
      radius * 2,
      radius * 2,
    );
    this.context.globalAlpha = 1;
    this.context.globalCompositeOperation = "source-over";

    this.residual = Math.min(1, this.residual + amount);
    this.painted = true;
    if (this.settled) {
      // Waking up: this mark is the one the visitor is watching for.
      this.stale = true;
      this.settled = false;
    }
  }

  /**
   * Let the wind fill the marks back in, and report whether the GPU's copy is
   * now stale.
   *
   * Compositing black at alpha `a` over the buffer multiplies every value by
   * `1 - a`, so an alpha derived from `1 - e^(-rate·dt)` is an exact
   * frame-rate-independent exponential decay — the same curve at 30fps as at
   * 144, and correct across the long deltas a demand-driven loop produces when
   * the tab has been in the background.
   */
  update(delta: number): boolean {
    if (this.settled && !this.painted) {
      return false;
    }

    const decay = delta > 0 ? 1 - Math.exp(-TRAMPLE.healPerSecond * delta) : 0;

    if (decay > 0) {
      this.context.globalCompositeOperation = "source-over";
      this.context.fillStyle = `rgba(0, 0, 0, ${decay})`;
      this.context.fillRect(0, 0, TRAMPLE.size, TRAMPLE.size);
      this.residual *= 1 - decay;
    }

    this.painted = false;

    // A single byte cannot hold anything below 1/255, so once the estimate is
    // under it the buffer is black in every channel the shader can read. One
    // last clear guarantees that, and the path sleeps until the next press.
    if (this.residual < 1 / 255) {
      this.context.globalCompositeOperation = "source-over";
      this.context.fillStyle = "#000000";
      this.context.fillRect(0, 0, TRAMPLE.size, TRAMPLE.size);
      this.residual = 0;
      this.settled = true;
    }

    if (this.stale || this.settled) {
      this.texture.needsUpdate = true;
      this.stale = false;
    } else {
      this.stale = true;
    }

    return true;
  }

  /** True while the canvas holds paint the GPU has not been given yet. */
  get pendingUpload(): boolean {
    return this.stale;
  }

  /** True while the buffer still holds a mark worth uploading. */
  get active(): boolean {
    return !this.settled;
  }

  dispose(): void {
    this.texture.dispose();
  }
}

/**
 * The brush, drawn once into its own canvas.
 *
 * A radial gradient evaluated per press would re-run the gradient rasteriser on
 * every pointer sample; drawn once and blitted, a press costs one textured
 * quad. The falloff is squared towards the rim rather than linear so the mark
 * has a soft lip instead of a visible circular edge — the tell that gives away
 * a painted mask the moment two of them overlap.
 */
function buildBrush(document: Document): HTMLCanvasElement {
  const radius = TRAMPLE.brushRadius;
  const size = radius * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Snow trample brush needs a 2D canvas context.");
  }

  const gradient = context.createRadialGradient(
    radius,
    radius,
    0,
    radius,
    radius,
    radius,
  );
  for (let step = 0; step <= 8; step += 1) {
    const t = step / 8;
    const falloff = Math.pow(1 - t, 2.1);
    gradient.addColorStop(t, `rgba(255, 255, 255, ${falloff})`);
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return canvas;
}
