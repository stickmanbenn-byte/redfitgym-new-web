// Barrel file for barbell PNG frame sequence (transparent, 1600x900)
// Missing frames (003,004,020,029,031,062,064,075,076,097,107,134,136)
// are simply skipped; GSAP scrub interpolates smoothly over the gaps.
const modules = import.meta.glob<{ default: string }>('./*.png', { eager: true });

export const BARBELL_FRAMES: string[] = Object.keys(modules)
  .sort()
  .map((key) => modules[key].default);
