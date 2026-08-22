import { StateField, EditorState, type Extension } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";

export type EditableRange = { from: number; to: number };

function makeField(initial: EditableRange) {
  return StateField.define<EditableRange>({
    create: () => initial,
    update(value, tr) {
      if (!tr.docChanged) {
        return value;
      }
      // -1 (before) on `from` and +1 (after) on `to`: a character typed at
      // either edge of the region is content the participant is adding
      // inside it, so the region must grow to keep covering it.
      return {
        from: tr.changes.mapPos(value.from, -1),
        to: tr.changes.mapPos(value.to, 1),
      };
    },
  });
}

function readOnlyDecorations(
  state: EditorState,
  field: StateField<EditableRange>,
): DecorationSet {
  const { from, to } = state.field(field);
  const marks = [];
  if (from > 0) {
    marks.push(Decoration.mark({ class: "cm-readonly-region" }).range(0, from));
  }
  if (to < state.doc.length) {
    marks.push(
      Decoration.mark({ class: "cm-readonly-region" }).range(
        to,
        state.doc.length,
      ),
    );
  }
  return Decoration.set(marks);
}

/**
 * Keeps the full file visible but blocks edits outside `initial` (spec
 * section 7.2: "vollständig sichtbare Datei" with a single editable TODO
 * region). Anything a transaction changes outside the current range is
 * rejected outright rather than clamped, so a paste that spans the boundary
 * is refused in full instead of silently truncated.
 *
 * A task/language switch or "Insert solution" is handled by remounting the
 * whole editor with a fresh `initial` range (see CodeMirrorEditor's
 * resetKey), not by mutating this extension's range in place.
 */
export function restrictedEditing(
  initial: EditableRange,
  onEditableTextChange?: (text: string) => void,
): Extension {
  const field = makeField(initial);

  return [
    field,
    EditorView.decorations.of((view) => readOnlyDecorations(view.state, field)),
    EditorState.transactionFilter.of((tr) => {
      if (!tr.docChanged) {
        return tr;
      }
      const range = tr.startState.field(field);
      let allowed = true;
      tr.changes.iterChanges((fromA, toA) => {
        if (fromA < range.from || toA > range.to) {
          allowed = false;
        }
      });
      return allowed ? tr : [];
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && onEditableTextChange) {
        const range = update.state.field(field);
        onEditableTextChange(
          update.state.doc.sliceString(range.from, range.to),
        );
      }
    }),
  ];
}
