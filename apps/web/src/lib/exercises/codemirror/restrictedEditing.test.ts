import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { restrictedEditing } from "./restrictedEditing";

function makeState(
  doc: string,
  from: number,
  to: number,
  onChange?: (text: string) => void,
) {
  return EditorState.create({
    doc,
    extensions: [restrictedEditing({ from, to }, onChange)],
  });
}

describe("restrictedEditing", () => {
  it("allows an edit fully inside the editable range", () => {
    const doc = "before[EDIT]after";
    const from = doc.indexOf("[EDIT]");
    const to = from + "[EDIT]".length;
    const state = makeState(doc, from, to);

    const tr = state.update({
      changes: { from: from + 1, to: from + 1, insert: "X" },
    });
    expect(tr.state.doc.toString()).toBe("before[XEDIT]after");
  });

  it("rejects an edit entirely inside the fixed prefix", () => {
    const doc = "before[EDIT]after";
    const from = doc.indexOf("[EDIT]");
    const to = from + "[EDIT]".length;
    const state = makeState(doc, from, to);

    const tr = state.update({ changes: { from: 0, to: 1, insert: "X" } });
    expect(tr.state.doc.toString()).toBe(doc);
  });

  it("rejects an edit that spans across the boundary into the fixed suffix", () => {
    const doc = "before[EDIT]after";
    const from = doc.indexOf("[EDIT]");
    const to = from + "[EDIT]".length;
    const state = makeState(doc, from, to);

    // Replaces "T]a" — starts inside the editable region, ends outside it.
    const tr = state.update({
      changes: { from: to - 2, to: to + 2, insert: "" },
    });
    expect(tr.state.doc.toString()).toBe(doc);
  });

  it("grows the editable region when typing at its right edge", () => {
    const doc = "before[]after";
    const from = doc.indexOf("[]") + 1;
    const to = from;
    const state = makeState(doc, from, to);

    const tr1 = state.update({ changes: { from, to, insert: "X" } });
    expect(tr1.state.doc.toString()).toBe("before[X]after");

    // A second insertion right after the first must also be accepted — the
    // region's `to` must have actually grown, not stayed pinned at the
    // original boundary.
    const posAfterX = from + 1;
    const tr2 = tr1.state.update({
      changes: { from: posAfterX, to: posAfterX, insert: "Y" },
    });
    expect(tr2.state.doc.toString()).toBe("before[XY]after");
  });

  it("grows the editable region when typing at its left edge", () => {
    const doc = "before[]after";
    const from = doc.indexOf("[]") + 1;
    const state = makeState(doc, from, from);

    const tr1 = state.update({ changes: { from, to: from, insert: "X" } });
    // Typing again at the same left edge position must still land inside.
    const tr2 = tr1.state.update({ changes: { from, to: from, insert: "Y" } });
    expect(tr2.state.doc.toString()).toBe("before[YX]after");
  });

  it("rejects a paste that spans the boundary entirely, not just the overflowing part", () => {
    const doc = "before[EDIT]after";
    const from = doc.indexOf("[EDIT]");
    const to = from + "[EDIT]".length;
    const state = makeState(doc, from, to);

    const tr = state.update({
      changes: { from: from - 3, to: to + 3, insert: "PASTED" },
    });
    // Rejected in full: the editable part of the paste is not partially applied.
    expect(tr.state.doc.toString()).toBe(doc);
  });

  it("reports the current editable text on every accepted change", () => {
    // updateListener only fires through an actual EditorView dispatch cycle,
    // not from a bare EditorState.update() transaction.
    const doc = "before[EDIT]after";
    const from = doc.indexOf("[EDIT]");
    const to = from + "[EDIT]".length;
    const seen: string[] = [];
    const state = EditorState.create({
      doc,
      extensions: [restrictedEditing({ from, to }, (text) => seen.push(text))],
    });
    const view = new EditorView({ state });

    view.dispatch({ changes: { from, to, insert: "NEW" } });

    expect(seen).toEqual(["NEW"]);
    view.destroy();
  });
});
