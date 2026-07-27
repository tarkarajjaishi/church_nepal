import { useEffect, useState } from "react";
import { Link } from 'wouter';
import { usePathname } from '@/lib/navigation';
import { Menu, Search, Radio, ChevronDown, Church, BookOpen, Heart } from "lucide-react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useLang } from "@/lib/language";
import { useContentBlock } from "@/lib/hooks";
import { ThemeToggle } from "./ThemeToggle";

// Primary desktop links — kept to 6 so they never overflow or wrap
const primary = [
  { to: "/about",      key: "nav_about" },
  { to: "/ministries", key: "nav_ministries" },
  { to: "/sermons",    key: "nav_sermons" },
  { to: "/events",     key: "nav_events" },
  { to: "/gallery",    key: "nav_gallery" },
  { to: "/contact",    key: "nav_contact" },
];

// Secondary links hidden behind "More" dropdown
const more = [
  { to: "/groups",       key: "nav_groups" },
  { to: "/membership",   key: "nav_membership" },
  { to: "/pastor",       key: "nav_pastor" },
  { to: "/leadership",   key: "nav_leadership" },
  { to: "/prayer",       key: "nav_prayer" },
  { to: "/testimonies",  key: "nav_testimonies" },
];

const allLinks = [...primary, ...more, { to: "/give", key: "give" }];

export function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeLogo, setThemeLogo]   = useState<string>('');
  const { lang, setLang, t }        = useLang();
  const pathname                    = usePathname();
  const brand                       = useContentBlock('site_brand');
  const churchName                  = brand?.title    || t("churchName");
  const tagline                     = brand?.subtitle || t("tagline");
  const logoImage                   = themeLogo       || brand?.items?.[0]?.logo;

  useEffect(() => {
    const logo = document.documentElement.getAttribute('data-theme-logo') || '';
    setThemeLogo(logo);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 border-b ${
        scrolled
          ? "bg-white/85 dark:bg-background/85 backdrop-blur-2xl border-border/40 shadow-[0_4px_24px_rgba(11,60,93,0.08)] py-1.5"
          : "bg-white/50 dark:bg-background/50 backdrop-blur-lg border-transparent py-3"
      }`}
    >
      <nav
        className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6"
        aria-label="Main navigation"
      >
        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {logoImage ? (
            <img
              src={logoImage.startsWith('http') ? logoImage : `${import.meta.env.VITE_API_URL ?? 'http://localhost:3002'}${logoImage}`}
              alt={churchName}
              className="size-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="grid place-items-center size-10 rounded-xl bg-gradient-to-br from-church-blue to-sky-blue text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
              <Church className="size-5" />
            </span>
          )}
          <span className="leading-tight flex flex-col justify-center">
            <span
              className="block text-church-blue dark:text-white text-base tracking-tight"
              style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}
            >
              {churchName}
            </span>
            <span
              className="block text-[10px] text-gold font-semibold tracking-widest uppercase"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {tagline}
            </span>
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1">
          {primary.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                href={l.to}
                className={`relative whitespace-nowrap px-3 py-2 text-[13px] font-medium rounded-lg transition-colors group ${
                  active
                    ? "text-church-blue dark:text-gold"
                    : "text-foreground/65 hover:text-church-blue dark:hover:text-gold hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                }`}
              >
                {t(l.key)}
                {/* Active underline pill */}
                <span
                  className={`absolute inset-x-3 -bottom-px h-[2px] bg-gold rounded-t-full transition-transform duration-200 origin-left ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}

          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="whitespace-nowrap px-3 py-2 text-[13px] font-medium text-foreground/65 hover:text-church-blue dark:hover:text-gold hover:bg-black/[0.03] dark:hover:bg-white/[0.04] rounded-lg transition-colors inline-flex items-center gap-1 outline-none"
              aria-haspopup="true"
            >
              {lang === "en" ? "More" : "थप"}
              <ChevronDown className="size-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-52 rounded-xl border-border/50 bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-2xl p-1.5"
            >
              {more.map((l) => (
                <DropdownMenuItem
                  key={l.to}
                  asChild
                  className="rounded-lg hover:bg-secondary/60 focus:bg-secondary/60 cursor-pointer text-[13px] font-medium px-3 py-2.5"
                >
                  <Link href={l.to}>{t(l.key)}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Right-side actions ── */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Search icon */}
          <Link
            href="/sermons"
            className="hidden sm:grid place-items-center size-8 rounded-lg text-foreground/60 hover:bg-secondary/80 hover:text-church-blue transition-colors"
            aria-label={t("search")}
          >
            <Search className="size-4" />
          </Link>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Language pill */}
          <div
            className="hidden sm:flex items-center rounded-full bg-secondary/70 dark:bg-white/10 p-0.5 text-[11px] font-bold tracking-wide border border-border/40"
            role="group"
            aria-label="Language selection"
          >
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
                lang === "en"
                  ? "bg-white dark:bg-church-blue text-church-blue dark:text-white shadow-sm"
                  : "text-foreground/50 hover:text-foreground"
              }`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ne")}
              className={`px-2.5 py-1 rounded-full transition-all duration-200 ${
                lang === "ne"
                  ? "bg-white dark:bg-church-blue text-church-blue dark:text-white shadow-sm"
                  : "text-foreground/50 hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-heading)" }}
              aria-pressed={lang === "ne"}
            >
              नेपाली
            </button>
          </div>

          {/* Join Live + Give — hidden on smaller desktop, shown at xl */}
          <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-border/40">
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-[13px] font-semibold text-church-blue dark:text-white hover:bg-secondary/80 rounded-full whitespace-nowrap"
            >
              <Link href="/live">
                <Radio className="size-3.5 mr-1.5 text-red-500 animate-pulse" />
                {t("joinLive")}
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="h-8 px-4 bg-gradient-to-r from-gold to-[#e5b534] hover:from-[#c29215] hover:to-gold text-church-blue border-0 rounded-full text-[13px] font-bold shadow-md shadow-gold/20 hover:shadow-gold/30 transition-all hover:-translate-y-px whitespace-nowrap"
            >
              <Link href="/give">
                <Heart className="size-3.5 mr-1.5" />
                {t("give")}
              </Link>
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden grid place-items-center size-9 rounded-xl bg-secondary/80 text-church-blue hover:bg-secondary transition-colors"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:w-[22rem] overflow-y-auto border-l-0 p-0 flex flex-col">
              {/* Mobile sheet header */}
              <div className="px-6 py-5 bg-church-blue text-white">
                <SheetTitle
                  className="text-white text-xl flex items-center gap-2.5"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  <Church className="size-5 text-gold shrink-0" />
                  {t("churchName")}
                </SheetTitle>
                <p className="text-gold/90 mt-0.5 text-xs font-medium tracking-wide uppercase">{tagline}</p>
              </div>

              {/* Nav links */}
              <div className="flex-1 px-4 pt-4 pb-6 flex flex-col gap-1 overflow-y-auto">
                {allLinks.map((l) => (
                  <Link
                    key={l.to + l.key}
                    href={l.to}
                    className={`px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                      pathname === l.to
                        ? "bg-church-blue/8 text-church-blue dark:bg-white/8 dark:text-gold font-semibold"
                        : "text-foreground/75 hover:bg-secondary/70 hover:text-foreground"
                    }`}
                  >
                    {t(l.key)}
                  </Link>
                ))}

                <div className="my-3 h-px bg-border/50" />

                {/* Language switcher */}
                <div className="flex items-center justify-between px-4 py-3 bg-secondary/40 rounded-xl">
                  <span className="text-sm font-medium text-foreground/70">
                    {lang === "en" ? "Language" : "भाषा"}
                  </span>
                  <div className="flex items-center rounded-full bg-white dark:bg-black/30 p-1 shadow-sm border border-border/30" role="group">
                    <button
                      onClick={() => setLang("en")}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                        lang === "en" ? "bg-church-blue text-white shadow" : "text-foreground/55 hover:text-foreground"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setLang("ne")}
                      className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                        lang === "ne" ? "bg-church-blue text-white shadow" : "text-foreground/55 hover:text-foreground"
                      }`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      नेपाली
                    </button>
                  </div>
                </div>

                {/* CTAs */}
                <Button asChild className="mt-2 w-full h-11 bg-church-blue hover:bg-church-blue/90 text-white rounded-xl text-[15px] font-semibold">
                  <Link href="/live">
                    <Radio className="size-4 mr-2 text-red-400 animate-pulse" />
                    {t("joinLive")}
                  </Link>
                </Button>
                <Button asChild className="mt-2 w-full h-11 bg-gold hover:bg-gold/90 text-church-blue rounded-xl text-[15px] font-bold shadow-lg shadow-gold/20">
                  <Link href="/give">
                    <Heart className="size-4 mr-2" />
                    {t("give")}
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
