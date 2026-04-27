"use client";

export function EarthGlobe() {
  return (
    <div className="earth-globe" aria-hidden="true">
      {/* The sphere itself */}
      <div className="earth-sphere">
        {/* continent blobs layer 1 */}
        <div className="earth-land earth-land--1" />
        <div className="earth-land earth-land--2" />
        <div className="earth-land earth-land--3" />
        <div className="earth-land earth-land--4" />

        {/* city glow clusters */}
        <div className="earth-city earth-city--1" />
        <div className="earth-city earth-city--2" />
        <div className="earth-city earth-city--3" />
        <div className="earth-city earth-city--4" />
        <div className="earth-city earth-city--5" />

        {/* atmosphere rim */}
        <div className="earth-atmosphere" />

        {/* specular highlight */}
        <div className="earth-highlight" />
      </div>

      {/* outer glow ring */}
      <div className="earth-outer-glow" />
    </div>
  );
}
