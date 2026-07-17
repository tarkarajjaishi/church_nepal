'use client'

import { useMemo, useState } from "react";
import Link from 'next/link';
import { Play, Search, FileText, Headphones, Video, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Reveal } from "@/components/site/Reveal";
import { CardSkeleton } from "@/components/site/LoadingSpinner";
import { ErrorDisplay } from "@/components/site/ErrorDisplay";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { EditableBlock } from "@/components/site/EditableBlock";
import { images } from "@/lib/data";
import { useSermons, useContentBlock } from "@/lib/hooks";

type SortOption = "date-desc" | "date-asc" | "title-asc" | "title-desc";

export default function Sermons() {
  const { data: sermons = [], isLoading, error, refetch } = useSermons();
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("all");
  const [topic, setTopic] = useState("all");
  const [series, setSeries] = useState("all");
  const [sort, setSort] = useState<SortOption>("date-desc");
  const [visible, setVisible] = useState(6);
  const [showFilters, setShowFilters] = useState(true);

  const hero = useContentBlock('sermons_hero');
  const heading = useContentBlock('sermons_heading');
  const description = useContentBlock('sermons_description');
  const recentHeading = useContentBlock('sermons_recent_heading');
  const emptyState = useContentBlock('sermons_empty_state');

  const searchPlaceholder = heading?.items?.[0]?.search_placeholder ?? "Search by title, speaker, series, or description...";
  const emptyTitle = emptyState?.title ?? "No sermons found";
  const emptyDescription = emptyState?.subtitle ?? "Try adjusting your search or filters to find what you're looking for.";
  const emptyBtnLabel = emptyState?.items?.[0]?.btn_label ?? "Clear all filters";

  const speakers = useMemo(() => ["all", ...Array.from(new Set(sermons.map((s) => s.speaker)))], [sermons]);
  const topics = useMemo(() => ["all", ...Array.from(new Set(sermons.map((s) => s.topic)))], [sermons]);
  const seriesList = useMemo(() => ["all", ...Array.from(new Set(sermons.map((s) => s.series)))], [sermons]);

  const filtered = useMemo(() => {
    let result = sermons.filter(
      (s) =>
        (speaker === "all" || s.speaker === speaker) &&
        (topic === "all" || s.topic === topic) &&
        (series === "all" || s.series === series) &&
        (s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.description.toLowerCase().includes(query.toLowerCase()) ||
          s.series.toLowerCase().includes(query.toLowerCase()) ||
          s.speaker.toLowerCase().includes(query.toLowerCase()))
    );

    result.sort((a, b) => {
      switch (sort) {
        case "date-desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "title-asc": return a.title.localeCompare(b.title);
        case "title-desc": return b.title.localeCompare(a.title);
        default: return 0;
      }
    });

    return result;
  }, [sermons, query, speaker, topic, series, sort]);

  const activeFilters = [speaker !== "all", topic !== "all", series !== "all", query.length > 0].filter(Boolean).length;

  const clearFilters = () => {
    setQuery("");
    setSpeaker("all");
    setTopic("all");
    setSeries("all");
    setSort("date-desc");
    setVisible(6);
  };

  const displayed = filtered.slice(0, visible);

  return (
    <div>
      <EditableBlock block={hero}>
        <PageHero
          title={hero?.title || "Sermons"}
          crumb={hero?.items?.[0]?.crumb || "Sermons"}
          image={hero?.image || images.praise}
          subtitle={hero?.subtitle || ""}
        />
      </EditableBlock>

      {/* Section heading with search */}
      <section className="py-12 bg-section">
        <div className="mx-auto max-w-7xl px-4">
          <EditableBlock block={heading}>
            <SectionHeading
              eyebrow={heading?.items?.[0]?.eyebrow || "Browse & Listen"}
              title={heading?.title || "Sermons"}
              subtitle={description?.title || undefined}
            />
          </EditableBlock>

          {/* Search & Filters */}
          <div className="mt-8">
            <Card className="p-4 border-border/60">
              {/* Main search row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setVisible(6); }}
                    placeholder={searchPlaceholder}
                    className="pl-9"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`shrink-0 gap-1.5 ${showFilters ? "bg-church-blue text-white hover:bg-church-blue/90" : ""}`}
                >
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeFilters > 0 && (
                    <Badge className="ml-1 size-5 p-0 flex items-center justify-center bg-gold text-church-blue border-0 text-[10px]">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Expanded filters */}
              {showFilters && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Select value={speaker} onValueChange={(v) => { setSpeaker(v); setVisible(6); }}>
                      <SelectTrigger><SelectValue placeholder="Speaker" /></SelectTrigger>
                      <SelectContent>
                        {speakers.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All Speakers" : s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={topic} onValueChange={(v) => { setTopic(v); setVisible(6); }}>
                      <SelectTrigger><SelectValue placeholder="Topic" /></SelectTrigger>
                      <SelectContent>
                        {topics.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All Topics" : t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={series} onValueChange={(v) => { setSeries(v); setVisible(6); }}>
                      <SelectTrigger><SelectValue placeholder="Series" /></SelectTrigger>
                      <SelectContent>
                        {seriesList.map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All Series" : s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                      <SelectTrigger className="gap-1.5"><ArrowUpDown className="size-3.5" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">Newest First</SelectItem>
                        <SelectItem value="date-asc">Oldest First</SelectItem>
                        <SelectItem value="title-asc">Title A–Z</SelectItem>
                        <SelectItem value="title-desc">Title Z–A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active filter tags */}
                  {activeFilters > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Active:</span>
                      {query && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          &quot;{query}&quot;
                          <button onClick={() => setQuery("")} className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      {speaker !== "all" && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          {speaker}
                          <button onClick={() => setSpeaker("all")} className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      {topic !== "all" && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          {topic}
                          <button onClick={() => setTopic("all")} className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      {series !== "all" && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                          {series}
                          <button onClick={() => setSeries("all")} className="ml-0.5 hover:text-foreground"><X className="size-3" /></button>
                        </Badge>
                      )}
                      <button onClick={clearFilters} className="text-xs text-church-blue hover:underline ml-1">Clear all</button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          {/* Results count */}
          {!isLoading && !error && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filtered.length === sermons.length
                  ? `Showing all ${sermons.length} sermons`
                  : `${filtered.length} of ${sermons.length} sermons`}
              </p>
            </div>
          )}

          {isLoading ? (
            <CardSkeleton count={6} />
          ) : error ? (
            <ErrorDisplay message="Failed to load sermons. Please try again." onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="size-16 rounded-full bg-gray-100 grid place-items-center mx-auto mb-4">
                <Search className="size-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{emptyTitle}</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {emptyDescription}
              </p>
              <Button variant="outline" onClick={clearFilters} className="gap-2">
                <X className="size-4" /> {emptyBtnLabel}
              </Button>
            </div>
          ) : (
            <>
              <EditableBlock block={recentHeading}>
                <SectionHeading
                  eyebrow={recentHeading?.items?.[0]?.eyebrow || "Watch & Listen"}
                  title={recentHeading?.title || "Recent Sermons"}
                  center={false}
                />
              </EditableBlock>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {displayed.map((s, i) => (
                  <Reveal key={s.id} delay={(i % 3) * 0.08}>
                    <Link href={`/sermons/${s.id}`}>
                      <Card className="group overflow-hidden h-full border-border/60 hover:shadow-xl transition-all gap-0">
                        <div className="relative aspect-video overflow-hidden">
                          <ImageWithFallback src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-church-blue/20 group-hover:bg-church-blue/40 transition-colors grid place-items-center">
                            <span className="grid place-items-center size-14 rounded-full bg-white/90 text-church-blue group-hover:scale-110 transition-transform"><Play className="size-6 fill-church-blue" /></span>
                          </div>
                          <Badge className="absolute top-3 left-3 bg-gold text-church-blue border-0">{s.series}</Badge>
                        </div>
                        <div className="p-5">
                          <div className="text-xs text-muted-foreground">{s.speaker} · {s.date} · {s.duration}</div>
                          <h3 className="mt-1 text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>{s.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                          <div className="mt-4 flex gap-2">
                            <Button size="sm" className="bg-church-blue hover:bg-church-blue/90"><Video className="size-4" /> Video</Button>
                            <Button size="sm" variant="outline"><Headphones className="size-4" /> Audio</Button>
                            <Button size="sm" variant="outline"><FileText className="size-4" /> Notes</Button>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </Reveal>
                ))}
              </div>

              {visible < filtered.length && (
                <div className="mt-10 text-center">
                  <Button variant="outline" onClick={() => setVisible((v) => v + 6)} className="border-church-blue text-church-blue hover:bg-church-blue hover:text-white">
                    Load More ({filtered.length - visible} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
