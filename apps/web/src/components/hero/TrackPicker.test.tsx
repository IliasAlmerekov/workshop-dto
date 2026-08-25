import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrackPicker } from "./TrackPicker";
import { LANGUAGES } from "@/lib/workshop/types";
import { TRACKS } from "./tracks";

function renderPicker(props: Partial<Parameters<typeof TrackPicker>[0]> = {}) {
  return render(
    <>
      <h2 id="label">Choose your programming language</h2>
      <TrackPicker
        value={null}
        onChange={vi.fn()}
        labelledBy="label"
        {...props}
      />
    </>,
  );
}

describe("TrackPicker", () => {
  it("offers every supported track exactly once", () => {
    expect(TRACKS.map((track) => track.language).sort()).toEqual(
      [...LANGUAGES].sort(),
    );
  });

  it("presents the tracks in the reference's order", () => {
    renderPicker();

    expect(
      screen.getAllByRole("radio").map((node) => node.textContent),
    ).toEqual(["Java", "Python", "PHP", "TypeScript"]);
  });

  it("shows the pointer cursor on every interactive track card", () => {
    renderPicker();

    screen.getAllByRole("radio").forEach((card) => {
      expect(card).toHaveClass("cursor-pointer");
    });
  });

  it("labels the group from the visible heading", () => {
    renderPicker();

    expect(
      screen.getByRole("radiogroup", {
        name: "Choose your programming language",
      }),
    ).toBeInTheDocument();
  });

  it("marks only the chosen track as checked", () => {
    renderPicker({ value: "php" });

    expect(screen.getByRole("radio", { name: "PHP" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Java" })).not.toBeChecked();
  });

  it("reports the clicked track", async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });

    await userEvent.click(screen.getByRole("radio", { name: "TypeScript" }));

    expect(onChange).toHaveBeenCalledWith("typescript");
  });

  it("activates a clicked track but not an arrow-key preview", async () => {
    const onActivate = vi.fn();
    renderPicker({ value: "java", onActivate });

    screen.getByRole("radio", { name: "Java" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onActivate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("radio", { name: "Python" }));
    expect(onActivate).toHaveBeenCalledWith("python");
  });

  it("reports local pointer and keyboard previews without activating them", async () => {
    const onPreviewChange = vi.fn();
    const onActivate = vi.fn();
    renderPicker({ value: "java", onPreviewChange, onActivate });

    await userEvent.hover(screen.getByRole("radio", { name: "Python" }));
    expect(onPreviewChange).toHaveBeenCalledWith("python");
    expect(onActivate).not.toHaveBeenCalled();

    screen.getByRole("radio", { name: "Java" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onPreviewChange).toHaveBeenLastCalledWith("python");
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("keeps the group to a single tab stop, landing on the chosen track", () => {
    renderPicker({ value: "python" });

    const tabbable = screen
      .getAllByRole("radio")
      .filter((node) => node.getAttribute("tabindex") === "0");

    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName("Python");
  });

  it("moves the selection with the arrow keys and wraps around", async () => {
    const onChange = vi.fn();
    renderPicker({ value: "typescript", onChange });

    screen.getByRole("radio", { name: "TypeScript" }).focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("java");
  });

  it("hides the brand logos from assistive technology", () => {
    const { container } = renderPicker();

    container.querySelectorAll("img").forEach((logo) => {
      expect(logo).toHaveAttribute("alt", "");
    });
  });
});
