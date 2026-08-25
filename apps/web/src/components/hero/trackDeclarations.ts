import type { Language } from "@/lib/workshop/types";
import { DTO_LAYERS, type DtoLayer } from "./dtoLayers";

/**
 * What the two DTO boundaries are called in the chosen track's own syntax.
 *
 * Only two of the four slabs get one, and that is the idea rather than a
 * shortcut. `Request DTO` and `Response DTO` are the boundaries the participant
 * *writes*, so they are the ones a language decides; `Mapper` and `Entity` are
 * machinery on either side of that decision and keep their role names in every
 * track. Choosing PHP does not rename the mapper, and pretending it did would
 * teach the wrong thing about what a DTO is.
 *
 * Each string is the shortest declaration that is unmistakably its language and
 * nothing else — which is why PHP carries `final class` and Python does not.
 * Both languages spell the keyword `class`, and a swap that showed the same text
 * for two different answers would read as the effect having failed. The
 * distinguishing word is the one those two communities actually write.
 *
 * These are inscriptions pressed into the slab, not editor content, so they stay
 * in the scene's one loaded face rather than pulling a second SDF atlas in for
 * two strings. `fittedLabelSize` keeps every one of them inside its slab.
 */
const DECLARATIONS: Record<
  Language,
  Partial<Record<DtoLayer["id"], string>>
> = {
  java: {
    "request-dto": "record UserRequest",
    "response-dto": "record UserResponse",
  },
  typescript: {
    "request-dto": "type UserRequest",
    "response-dto": "type UserResponse",
  },
  python: {
    "request-dto": "class UserRequest",
    "response-dto": "class UserResponse",
  },
  php: {
    "request-dto": "final class UserRequest",
    "response-dto": "final class UserResponse",
  },
};

/** The layers a track renames, so both renderers agree on which two they are. */
export const DECLARED_LAYER_IDS = DTO_LAYERS.filter(
  (layer) => DECLARATIONS.java[layer.id] !== undefined,
).map((layer) => layer.id);

/** Null wherever the boundary keeps its role name in every track. */
export function trackDeclaration(
  track: Language | null,
  layerId: DtoLayer["id"],
): string | null {
  return track ? (DECLARATIONS[track][layerId] ?? null) : null;
}
