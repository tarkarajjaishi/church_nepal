import { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface Props {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  center?: boolean;
  light?: boolean;
}

export function SectionHeading({ eyebrow, title, subtitle, center = true, light = false }: Props) {
  return (
    <Reveal className={center ? "text-center mx-auto max-w-2xl" : "max-w-2xl"}>
      {eyebrow && (
        <div className={`mb-3 inline-flex items-center gap-2 ${center ? "justify-center" : ""}`}>
          <span className={`h-px w-6 ${light ? "bg-white/50" : "bg-gold"}`} />
          {/* The eyebrow ignored `light`, so on the dark-blue sections it stayed
              gold-on-blue — small, letter-spaced, uppercase text at roughly 2:1.
              Gold is a surface colour here, not an ink colour. */}
          <span
            className={`uppercase tracking-[0.2em] text-xs ${light ? "text-white/90" : "text-gold-text"}`}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {eyebrow}
          </span>
          <span className={`h-px w-6 ${light ? "bg-white/50" : "bg-gold"}`} />
        </div>
      )}
      <h2
        className={`text-3xl md:text-4xl ${light ? "text-white" : "text-church-blue"}`}
        style={{ fontFamily: "var(--font-heading)", fontWeight: 700, lineHeight: 1.15 }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 ${light ? "text-white/80" : "text-muted-foreground"}`}>{subtitle}</p>
      )}
    </Reveal>
  );
}
