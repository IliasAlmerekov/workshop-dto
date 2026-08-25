/**
 * Joins class names, dropping anything falsy.
 *
 * shadcn's `cn` also runs `tailwind-merge` to resolve conflicting utilities.
 * Nothing here needs that: this codebase writes complete class strings per
 * element rather than layering variant sets on top of a base, so a merge pass
 * would be two dependencies buying nothing. Add it the day a component
 * genuinely composes conflicting utilities.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
