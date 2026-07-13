import { useState } from "react";
import { Card } from "../components/ui/card";
import { PageHero } from "../components/site/PageHero";
import { SectionHeading } from "../components/site/SectionHeading";
import { Reveal } from "../components/site/Reveal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { images } from "../lib/data";
import { useLeaders } from "../lib/hooks";
import { CardSkeleton } from "../components/site/LoadingSpinner";
import { ErrorDisplay } from "../components/site/ErrorDisplay";

const categories = ["All", "Pastors", "Elders", "Deacons", "Ministry Leaders"];

export default function Leadership() {
  const { data: leaders = [], isLoading, error, refetch } = useLeaders();
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? leaders : leaders.filter((l) => l.category === filter);

  return (
    <div>
      <PageHero title="Our Leadership" crumb="Leadership" image={images.study2}
        subtitle="Servant-hearted leaders committed to shepherding God's people with humility and love." />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading eyebrow="The Team" title="Meet Our Leaders" />

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filter === c ? "bg-church-blue text-white" : "bg-secondary text-church-blue hover:bg-gold hover:text-church-blue"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-12">
            {isLoading ? (
              <CardSkeleton count={6} />
            ) : error ? (
              <ErrorDisplay message="Failed to load leaders." onRetry={() => refetch()} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map((l, i) => (
              <Reveal key={l.id} delay={i * 0.06}>
                <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                  <div className="relative h-64 overflow-hidden">
                    <ImageWithFallback src={l.image} alt={l.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-church-blue/90 to-transparent p-4">
                      <div className="text-white" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{l.name}</div>
                      <div className="text-gold text-sm">{l.role}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-muted-foreground">{l.bio}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
