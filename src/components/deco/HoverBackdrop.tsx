"use client";

import Image from "next/image";
import { sparkLayout } from "./spark-layout";

type HoverBackdropProps = {
  slug: string;
  reducedMotion?: boolean;
  posterPath?: string;
};

/**
 * Three-layer hover curtain behind YearCard copy (spec.md 6.1.1).
 * CSS-only motion — no JavaScript timers. Spark positions come from the slug.
 */
export function HoverBackdrop({
  slug,
  reducedMotion = false,
  posterPath,
}: HoverBackdropProps) {
  const sparks = reducedMotion ? [] : sparkLayout(slug);
  return (
    <div className="hover-backdrop" aria-hidden="true">
      {reducedMotion ? null : <div className="hover-backdrop-vignette" />}
      {sparks.map((spark, index) => (
        <span
          key={`${spark.left}-${spark.top}-${index}`}
          data-hover-flash
          className="hover-flash"
          style={{
            left: spark.left,
            top: spark.top,
            animationDelay: `${spark.delayMs}ms`,
            ["--flash-scale" as string]: String(spark.scale),
          }}
        />
      ))}
      <div
        className="hover-backdrop-poster"
        data-poster-curtain={posterPath ? "ready" : "empty"}
      >
        {posterPath ? (
          <Image
            src={posterPath}
            alt=""
            fill
            sizes="280px"
            className="object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}
