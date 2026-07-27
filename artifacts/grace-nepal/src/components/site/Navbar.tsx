import { useEffect, useState } from "react";
import { Link } from 'wouter'
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

const primary = [
  { to: "/about", key: "nav_about" },
  { to: "/ministries", key: "nav_ministries" },
  { to: "/groups", key: "nav_groups" },
  { to: "/sermons", key: "nav_sermons" },
  { to: "/events", key: "nav_events" },
  { to: "/gallery", key: "nav_gallery" },
  { to: "/membership", key: "nav_membership" },
  { to: "/contact", key: "nav_contact" },
];

const more = [
  { to: "/pastor", key: "nav_pastor" },
  { to: "/leadership", key: "nav_leadership" },
  { to: "/prayer", key: "nav_prayer" },
  { to: "/testimonies", key: "nav_testimonies" },
];

const allLinks = [...primary, ...more, { to: "/give", key: "give" }];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeLogo, setThemeLogo] = useState<string>('');
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const brand = useContentBlock('site_brand');
  const churchName = brand?.title || t("churchName");
  const tagline = brand?.subtitle || t("tagline");
  const logoImage = themeLogo || brand?.items?.[0]?.logo;

  useEffect(() => {
    const logo = document.documentElement.getAttribute('data-theme-logo') || ''
    setThemeLogo(logo)
  }, [])

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
          ? "bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-border/50 shadow-[0_8px_32px_rgba(11,60,93,0.06)] py-2" 
          : "bg-white/40 dark:bg-background/40 backdrop-blur-md border-transparent py-4"
      }`}
    >
      <nav className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          {logoImage ? (
            <img src={logoImage.startsWith('http') ? logoImage : `${import.meta.env.VITE_API_URL ?? 'http://localhost:3002'}${logoImage}`} alt={churchName} className="size-11 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <span className="grid place-items-center size-11 rounded-xl bg-gradient-to-br from-church-blue to-sky-blue text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-500">
              <Church className="size-5.5" />
            </span>
          )}
          <span className="leading-tight flex flex-col justify-center">
            <span className="block text-church-blue dark:text-white text-lg tracking-tight transition-colors" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
              {churchName}
            </span>
            <span className="block text-[11px] text-gold font-medium tracking-wide uppercase transition-colors" style={{ fontFamily: "var(--font-body)" }}>
              {tagline}
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1.5 ml-8">
          {primary.map((l) => (
            <Link
              key={l.to}
              href={l.to}
              className="relative group px-3 py-2 text-[13px] font-medium text-foreground/70 hover:text-church-blue dark:hover:text-gold transition-colors"
            >
              {t(l.key)}
              <span className={`absolute inset-x-3 -bottom-0.5 h-[2px] bg-gold rounded-t-full transition-transform duration-300 origin-left ${pathname === l.to ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-2 text-[13px] font-medium text-foreground/70 hover:text-church-blue dark:hover:text-gold transition-colors inline-flex items-center gap-1.5 outline-none group" aria-haspopup="true">
              {lang === "en" ? "More" : "थप"} <ChevronDown className="size-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-border/50 bg-white/95 dark:bg-background/95 backdrop-blur-xl shadow-2xl p-2">
              {more.map((l) => (
                <DropdownMenuItem key={l.to} asChild className="rounded-lg hover:bg-secondary/50 focus:bg-secondary/50 cursor-pointer text-sm font-medium p-2.5">
                  <Link href={l.to}>{t(l.key)}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto">
          <Link href="/sermons"
            className="hidden sm:grid place-items-center size-9 rounded-full text-foreground/70 hover:bg-secondary/80 hover:text-church-blue transition-colors"
            aria-label={t("search")}
          >
            <Search className="size-4.5" />
          </Link>

          <ThemeToggle />

          {/* Lang Toggle Pill */}
          <div className="hidden sm:flex items-center rounded-full bg-secondary/60 dark:bg-white/10 p-0.5 text-[11px] font-semibold tracking-wide border border-border/50 shadow-inner" role="group" aria-label="Language selection">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-full transition-all duration-300 ${lang === "en" ? "bg-white dark:bg-church-blue text-church-blue dark:text-white shadow-sm" : "text-foreground/60 hover:text-foreground"}`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ne")}
              className={`px-3 py-1.5 rounded-full transition-all duration-300 ${lang === "ne" ? "bg-white dark:bg-church-blue text-church-blue dark:text-white shadow-sm" : "text-foreground/60 hover:text-foreground"}`}
              style={{ fontFamily: "var(--font-heading)" }}
              aria-pressed={lang === "ne"}
            >
              नेपाली
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border/50">
            <Button asChild size="sm" variant="ghost" className="h-9 px-4 text-[13px] font-semibold text-church-blue dark:text-white hover:bg-secondary/80 rounded-full transition-all">
              <Link href="/live">
                <Radio className="size-4 mr-1.5 text-red-500 animate-pulse" /> {t("joinLive")}
              </Link>
            </Button>

            <Button asChild size="sm" className="h-9 px-5 bg-gradient-to-r from-gold to-[#e5b534] hover:from-[#c29215] hover:to-gold text-church-blue shadow-lg shadow-gold/20 hover:shadow-gold/40 border-0 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5">
              <Link href="/give">
                <Heart className="size-4 mr-1.5" /> {t("give")}
              </Link>
            </Button>
          </div>

          {/* Mobile menu trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden grid place-items-center size-10 rounded-full bg-secondary/80 text-church-blue hover:bg-secondary transition-colors" aria-label="Menu">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 overflow-y-auto border-l-0 p-0">
              <div className="p-6 bg-church-blue text-white rounded-bl-3xl">
                <SheetTitle className="text-white text-2xl flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
                  <Church className="size-6 text-gold" /> {t("churchName")}
                </SheetTitle>
                <p className="text-gold mt-1 text-sm">{tagline}</p>
              </div>
              
              <div className="p-6 flex flex-col gap-2">
                {allLinks.map((l) => (
                  <Link
                    key={l.to + l.key}
                    href={l.to}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${pathname === l.to ? "bg-church-blue/5 text-church-blue" : "text-foreground/80 hover:bg-secondary"}`}
                  >
                    {t(l.key)}
                  </Link>
                ))}
                
                <div className="my-4 h-px bg-border/60" />

                <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 rounded-xl">
                  <span className="text-sm font-medium text-foreground/80">{lang === "en" ? "Language" : "भाषा"}</span>
                  <div className="flex items-center rounded-full bg-white dark:bg-black/20 p-1 shadow-sm" role="group">
                    <button onClick={() => setLang("en")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === "en" ? "bg-church-blue text-white shadow" : "text-foreground/60"}`}>EN</button>
                    <button onClick={() => setLang("ne")} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${lang === "ne" ? "bg-church-blue text-white shadow" : "text-foreground/60"}`} style={{ fontFamily: "var(--font-heading)" }}>नेपाली</button>
                  </div>
                </div>

                <Button asChild className="mt-4 w-full h-12 bg-church-blue text-white hover:bg-church-blue/90 rounded-xl text-base">
                  <Link href="/live"><Radio className="size-5 mr-2 text-red-400" /> {t("joinLive")}</Link>
                </Button>
                <Button asChild className="mt-2 w-full h-12 bg-gold text-church-blue hover:bg-gold/90 rounded-xl text-base font-bold shadow-lg shadow-gold/20">
                  <Link href="/give"><Heart className="size-5 mr-2" /> {t("give")}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
