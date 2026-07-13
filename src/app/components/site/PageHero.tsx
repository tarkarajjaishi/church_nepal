import { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface Props {
  title: string;
  subtitle?: string;
  image: string;
  crumb?: string;
  children?: ReactNode;
}

export function PageHero({ title, subtitle, image, crumb, children }: Props) {
  return (
    <section className="relative">
      <div className="absolute inset-0">
        <ImageWithFallback src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-church-blue/90 via-church-blue/75 to-church-blue/40" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
        <nav className="flex items-center gap-1.5 text-sm text-white/70 mb-3">
          <Link to="/" className="hover:text-gold">Home</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-gold">{crumb ?? title}</span>
        </nav>
        <h1 className="text-white text-4xl md:text-5xl max-w-3xl" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </h1>
        {subtitle && <p className="mt-4 text-white/85 max-w-2xl text-lg">{subtitle}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
