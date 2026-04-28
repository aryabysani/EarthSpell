import type { LetterImage } from "@/types";

function toDMS(deg: number, posDir: string, negDir: string): string {
  const d = Math.abs(deg);
  const degrees = Math.floor(d);
  const minutesFloat = (d - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);
  const dir = deg >= 0 ? posDir : negDir;
  return `${degrees}°${String(minutes).padStart(2, "0")}'${seconds.padStart(4, "0")}" ${dir}`;
}

interface TooltipProps {
  image: LetterImage;
}

export function Tooltip({ image }: TooltipProps) {
  const hasCoordinates = typeof image.lat === "number" && typeof image.lng === "number";

  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${image.lat},${image.lng}&z=8`
    : image.location
    ? `https://www.google.com/maps/search/${encodeURIComponent(image.location)}`
    : null;

  const lat = image.lat as number;
  const lng = image.lng as number;

  return (
    <div
      className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 w-56 -translate-x-1/2 p-3 text-left opacity-0 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
      style={{ background: "#0a0a0a", border: "1px solid rgba(201,168,76,0.2)" }}
    >
      {/* location name */}
      <p className="text-[0.72rem] font-medium uppercase tracking-[0.2em] text-white/80">
        {image.location || "Unknown location"}
      </p>

      {/* coordinates — clickable */}
      {hasCoordinates && mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 flex items-center gap-1.5 font-mono text-[0.65rem] transition-opacity hover:opacity-100"
          style={{ color: "rgba(201,168,76,0.8)", opacity: 0.85, textDecoration: "none" }}
        >
          <span>
            {toDMS(lat, "N", "S")} {toDMS(lng, "E", "W")}
          </span>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </a>
      ) : image.location && mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1 font-mono text-[0.6rem] transition-opacity hover:opacity-100"
          style={{ color: "rgba(201,168,76,0.7)", opacity: 0.8, textDecoration: "none" }}
        >
          Open in Maps
          <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
            <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </a>
      ) : null}

      {/* description */}
      {image.description ? (
        <p className="mt-2 line-clamp-3 text-[0.68rem] leading-relaxed text-white/30">
          {image.description}
        </p>
      ) : null}
    </div>
  );
}
