import React, { useLayoutEffect, useRef, useState } from "react";
import Model from "react-body-highlighter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { anteriorPolygons, posteriorPolygons, getBodyPartHighlight } from "@/lib/body-map-polygons";

export type SeverityLevel = "minimal" | "mild" | "moderate" | "severe";

interface BodyMapSelectorProps {
  value: string;
  onChange: (bodyPart: string) => void;
  severity?: SeverityLevel | "";
}

// Body part values are stored in English everywhere (form state, mock data)
// so they stay stable identifiers; this only translates how they're shown.
export function translateBodyPart(t: (key: string) => string, value: string): string {
  if (!value) return value;
  const sideMatch = value.match(/^(Left|Right) (.+)$/);
  if (sideMatch) {
    const [, side, part] = sideMatch;
    const sideKey = side === "Left" ? "side.left" : "side.right";
    return `${t(sideKey)} ${t(`bodyPart.${part}`)}`;
  }
  return t(`bodyPart.${value}`);
}

// Muscles the underlying SVG model does not split into left/right halves.
const UNISEX_PARTS = ["Head", "Neck", "Abs"];

// Recovery-time gradient: green (fastest) through red (slowest), applied to
// the selected body part so its color communicates severity at a glance.
export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  minimal: "#22c55e", // green-500 — 1-3 days
  mild: "#eab308", // yellow-500 — 4-7 days
  moderate: "#f97316", // orange-500 — 8-28 days
  severe: "#ef4444", // red-500 — >28 days
};

// Shown once a body part is picked but before a severity is rated.
const UNRATED_COLOR = "#3b82f6"; // blue-500
const DEFAULT_BODY_COLOR = "#B6BDC3"; // react-body-highlighter's own default fill

interface BodyPartPreviewProps {
  bodyPart: string;
  color: string;
  className?: string;
}

// Read-only body silhouette with exactly one recorded body part colored in —
// used to show back an injury record as it was captured, without needing a
// live click to identify which side. See body-map-polygons.ts.
export function BodyPartPreview({ bodyPart, color, className }: BodyPartPreviewProps) {
  const highlight = getBodyPartHighlight(bodyPart);
  const view = highlight?.view ?? "front";
  const dataset = view === "front" ? anteriorPolygons : posteriorPolygons;
  const highlightedPoints = new Set(highlight?.points ?? []);

  return (
    <svg viewBox="0 0 100 200" className={className}>
      {dataset.map((entry) =>
        entry.svgPoints.map((points, index) => (
          <polygon
            key={`${entry.muscle}-${index}`}
            points={points}
            fill={highlightedPoints.has(points) ? color : DEFAULT_BODY_COLOR}
          />
        ))
      )}
    </svg>
  );
}

interface SelectedPolygon {
  points: string;
  view: "front" | "back";
}

export function BodyMapSelector({ value, onChange, severity }: BodyMapSelectorProps) {
  const { t } = useI18n();
  const [view, setView] = useState<"front" | "back">("front");
  const [selected, setSelected] = useState<SelectedPolygon | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightColor = severity ? SEVERITY_COLORS[severity] : UNRATED_COLOR;
  // Set synchronously by the library's onClick (fires before our wrapper's
  // click handler, since it's bound directly on the polygon that was hit).
  const lastMuscleRef = useRef<string | null>(null);

  const handleMuscleClick = (exercise: any) => {
    lastMuscleRef.current = exercise?.muscle ?? null;
  };

  // Runs after the polygon-level click above, once the click bubbles up to
  // the wrapper. e.target is the exact <polygon> the user hit, so we can
  // read its real coordinates instead of guessing the side.
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement;
    const muscle = lastMuscleRef.current;
    lastMuscleRef.current = null;

    if (!muscle || target.tagName?.toLowerCase() !== "polygon") return;

    const pointsAttr = target.getAttribute("points");
    if (!pointsAttr) return;

    const coords = pointsAttr.trim().split(/\s+/).map(Number);
    const xs = coords.filter((_, i) => i % 2 === 0);
    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;

    let formattedPart = muscle
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase())
      .replace("Left ", "")
      .replace("Right ", "");

    if (!UNISEX_PARTS.includes(formattedPart)) {
      // viewBox is 0-100 wide. Facing the model (front view) its right side
      // renders on the left half of the image; from behind (back view) that
      // flips, since we're now looking at the same side from the other way.
      const isLowHalf = avgX < 50;
      const side = view === "front"
        ? (isLowHalf ? "Right" : "Left")
        : (isLowHalf ? "Left" : "Right");
      formattedPart = `${side} ${formattedPart}`;
    }

    setSelected({ points: pointsAttr, view });
    onChange(formattedPart);
  };

  // Model has no notion of "this exact shape is selected" (it only colors
  // by muscle name, which both left/right polygons share), so we drive the
  // selected-shape highlight entirely by direct style mutation. Since React
  // only touches a DOM style property when its own computed value changes,
  // and data=[] means it always computes the same bodyColor, it will never
  // undo our mutation on its own — so every commit we must both reset every
  // polygon back to the default color and re-apply the highlight to the one
  // the user actually clicked.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const polygons = container.querySelectorAll("polygon");
    polygons.forEach((el) => {
      const isSelected = !!selected && selected.view === view && el.getAttribute("points") === selected.points;
      (el as unknown as SVGElement).style.fill = isSelected ? highlightColor : DEFAULT_BODY_COLOR;
    });
  });

  return (
    <div className="flex flex-col items-center gap-4 p-4 border border-border/50 rounded-xl bg-card">
      <div className="flex flex-col gap-3 w-full">
        {/* View Toggle */}
        <div className="flex justify-center gap-2 bg-muted/50 p-1 rounded-lg w-full max-w-[200px] mx-auto">
          <Button
            type="button"
            variant={view === "front" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("front")}
            className={cn("flex-1", view === "front" ? "bg-rose-500 hover:bg-rose-600 text-white" : "")}
          >
            {t("injury.bodyMap.front")}
          </Button>
          <Button
            type="button"
            variant={view === "back" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("back")}
            className={cn("flex-1", view === "back" ? "bg-rose-500 hover:bg-rose-600 text-white" : "")}
          >
            {t("injury.bodyMap.back")}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-[250px] flex justify-center"
        onClick={handleContainerClick}
      >
        <Model
          type={view === "front" ? "anterior" : "posterior"}
          data={[]}
          style={{ width: "100%", maxWidth: "250px" }}
          onClick={handleMuscleClick}
          highlightedColors={[highlightColor, highlightColor]}
        />
      </div>

      <div className="text-center w-full mt-2">
        <p className="text-sm font-medium text-muted-foreground">{t("injury.bodyMap.selectedPart")}</p>
        <p className="text-base font-bold min-h-[24px]" style={{ color: value ? highlightColor : undefined }}>
          {value ? translateBodyPart(t, value) : t("injury.bodyMap.none")}
        </p>
      </div>

      {/* Severity gradient legend — mirrors the color applied to the body part above */}
      <div className="flex justify-center gap-3 w-full pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
        {(Object.keys(SEVERITY_COLORS) as SeverityLevel[]).map((level) => (
          <div
            key={level}
            className={cn("flex items-center gap-1.5", severity === level && "font-semibold text-foreground")}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[level] }}
            />
            {t(`severity.${level}.label`)}
          </div>
        ))}
      </div>
    </div>
  );
}
