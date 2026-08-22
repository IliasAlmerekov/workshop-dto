import type { StarterCode } from "./types";

/** Composes a full solution file from a starter's fixed frame and the solved editable region. */
export function composeSolution(
  starterCode: StarterCode,
  solutionEditable: string,
): string {
  return starterCode.before + solutionEditable + starterCode.after;
}
