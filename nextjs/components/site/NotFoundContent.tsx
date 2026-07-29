import Link from 'next/link';
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

/**
 * Shared 404 body.
 *
 * Rendered by both `app/not-found.tsx` (unmatched URLs anywhere in the app —
 * these do NOT get the (site) layout, so this must stand on its own) and
 * `app/(site)/not-found.tsx` (notFound() inside the site group, which keeps the
 * navbar and footer around it).
 */
export function NotFoundContent() {
  return (
    <section className="relative min-h-[80vh] grid place-items-center">
      <div className="absolute inset-0">
        <ImageWithFallback src={images.mountains} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-church-blue/85" />
      </div>
      <div className="relative text-center text-white px-4">
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "6rem", lineHeight: 1 }} className="text-gold">404</div>
        <h1 className="text-white mt-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.75rem" }}>Page Not Found</h1>
        <p className="mt-3 text-white/80 max-w-md mx-auto">&ldquo;Your word is a lamp for my feet, a light on my path.&rdquo; Let&rsquo;s guide you back home.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-gold text-church-blue hover:bg-gold/90"><Link href="/"><Home className="size-4" /> Back Home</Link></Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 text-white bg-white/5 hover:bg-white/15 hover:text-white"><Link href="/ministries"><Compass className="size-4" /> Explore Ministries</Link></Button>
        </div>
      </div>
    </section>
  );
}
