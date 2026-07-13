import Link from 'next/link';
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export default function NotFound() {
  return (
    <section className="relative min-h-[80vh] grid place-items-center">
      <div className="absolute inset-0">
        <ImageWithFallback src={images.mountains} alt="Mountains" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-church-blue/85" />
      </div>
      <div className="relative text-center text-white px-4">
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "6rem", lineHeight: 1 }} className="text-gold">404</div>
        <h1 className="text-white mt-2" style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "1.75rem" }}>Page Not Found</h1>
        <p className="mt-3 text-white/80 max-w-md mx-auto">"Your word is a lamp for my feet, a light on my path." Let's guide you back home.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-gold text-church-blue hover:bg-gold/90"><Link href="/"><Home className="size-4" /> Back Home</Link></Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 text-white bg-white/5 hover:bg-white/15 hover:text-white"><Link href="/ministries"><Compass className="size-4" /> Explore Ministries</Link></Button>
        </div>
      </div>
    </section>
  );
}
