export type Spark = {
  left: string;
  top: string;
  delayMs: number;
  scale: number;
};

export const SPARK_MIN = 5;
export const SPARK_MAX = 7;

/** djb2 — stable across server and client; never Math.random(). */
export function hashSlug(slug: string): number {
  let hash = 5381;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 33 + slug.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function mix(hash: number, salt: number): number {
  return Math.imul(hash ^ salt, 2654435761) >>> 0;
}

/**
 * 5–7 four-point flashes whose layout is a pure function of the ceremony slug.
 */
export function sparkLayout(slug: string): Spark[] {
  const seed = hashSlug(slug);
  const count = SPARK_MIN + (seed % (SPARK_MAX - SPARK_MIN + 1));
  const sparks: Spark[] = [];
  for (let i = 0; i < count; i += 1) {
    const h = mix(seed, i + 1);
    sparks.push({
      left: `${6 + (h % 84)}%`,
      top: `${8 + ((h >>> 8) % 72)}%`,
      delayMs: i * 160 + (h % 90),
      scale: 0.65 + ((h >>> 16) % 45) / 100,
    });
  }
  return sparks;
}