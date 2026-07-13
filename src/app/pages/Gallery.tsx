import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { PageHero } from "../components/site/PageHero";
import { Reveal } from "../components/site/Reveal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { images, galleryCategories } from "../lib/data";
import { useGallery } from "../lib/hooks";
import { CardSkeleton } from "../components/site/LoadingSpinner";
import { ErrorDisplay } from "../components/site/ErrorDisplay";

export default function Gallery() {
  const { data: gallery = [], isLoading, error, refetch } = useGallery();
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState<number | null>(null);

  const shown = filter === "All" ? gallery : gallery.filter((g) => g.category === filter);
  const current = active !== null ? shown[active] : null;

  const move = (dir: number) =>
    setActive((a) => (a === null ? a : (a + dir + shown.length) % shown.length));

  return (
    <div>
      <PageHero title="Gallery" crumb="Gallery" image={images.crowd}
        subtitle="Snapshots of God's faithfulness — worship, fellowship, mission and celebration." />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-2">
            {galleryCategories.map((c) => (
              <button
                key={c}
                onClick={() => { setFilter(c); setActive(null); }}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filter === c ? "bg-church-blue text-white" : "bg-secondary text-church-blue hover:bg-gold hover:text-church-blue"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-10">
            {isLoading ? (
              <CardSkeleton count={9} />
            ) : error ? (
              <ErrorDisplay message="Failed to load gallery." onRetry={() => refetch()} />
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
                {shown.map((g, i) => (
              <Reveal key={g.id} delay={(i % 3) * 0.05} className="mb-4 break-inside-avoid">
                <button onClick={() => setActive(i)} className="group relative block w-full overflow-hidden rounded-2xl">
                  <ImageWithFallback src={g.image} alt={g.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-church-blue/0 group-hover:bg-church-blue/50 transition-colors grid place-items-center">
                    <ZoomIn className="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-church-blue/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm">{g.title}</span>
                  </div>
                </button>
              </Reveal>
            ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-4xl p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
          {current && (
            <div className="relative">
              <ImageWithFallback src={current.image} alt={current.title} className="w-full max-h-[80vh] object-contain rounded-2xl" />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl">
                <span className="text-white">{current.title}</span>
              </div>
              <button onClick={() => setActive(null)} className="absolute top-3 right-3 grid place-items-center size-10 rounded-full bg-black/50 text-white hover:bg-black/70"><X className="size-5" /></button>
              <button onClick={() => move(-1)} className="absolute top-1/2 -translate-y-1/2 left-3 grid place-items-center size-10 rounded-full bg-black/50 text-white hover:bg-black/70"><ChevronLeft className="size-5" /></button>
              <button onClick={() => move(1)} className="absolute top-1/2 -translate-y-1/2 right-3 grid place-items-center size-10 rounded-full bg-black/50 text-white hover:bg-black/70"><ChevronRight className="size-5" /></button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
