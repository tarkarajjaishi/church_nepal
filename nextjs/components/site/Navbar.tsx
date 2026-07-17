'use client'

import { useEffect, useState } from "react";
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { Menu, Search, Radio, ChevronDown, Church, BookOpen } from "lucide-react";
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
  { to: "/contact", key: "nav_contact" },
];

const more = [
  { to: "/pastor", key: "nav_pastor" },
  { to: "/leadership", key: "nav_leadership" },
  { to: "/prayer", key: "nav_prayer" },
];

const allLinks = [...primary, ...more, { to: "/give", key: "give" }];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const brand = useContentBlock('site_brand');
  const churchName = brand?.title || t("churchName");
  const tagline = brand?.subtitle || t("tagline");
  const logoImage = brand?.items?.[0]?.logo;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur shadow-[0_4px_24px_rgba(var(--church-blue-rgb),0.08)]" : "bg-background/80 backdrop-blur"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {logoImage ? (
            <img src={logoImage.startsWith('http') ? logoImage : `http://localhost:3002${logoImage}`} alt={churchName} className="size-10 rounded-xl object-cover" />
          ) : (
            <span className="grid place-items-center size-10 rounded-xl bg-church-blue text-white">
              <Church className="size-5" />
            </span>
          )}
          <span className="leading-tight">
            <span className="block text-church-blue" style={{ fontFamily: "var(--font-heading)", fontWeight: 700 }}>
              {churchName}
            </span>
            <span className="block text-[11px] text-gold" style={{ fontFamily: "var(--font-heading)" }}>
              {tagline}
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {primary.map((l) => (
            <Link
              key={l.to}
              href={l.to}
              className={pathname === l.to ? "px-3 py-2 rounded-md text-sm font-medium text-church-blue" : "px-3 py-2 rounded-md text-sm text-foreground/70 hover:text-church-blue"}
            >
              {t(l.key)}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="px-3 py-2 rounded-md text-sm text-foreground/70 hover:text-church-blue inline-flex items-center gap-1 outline-none">
              {lang === "en" ? "More" : "थप"} <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {more.map((l) => (
                <DropdownMenuItem key={l.to} asChild>
                  <Link href={l.to}>{t(l.key)}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/sermons"
            className="hidden sm:grid place-items-center size-9 rounded-md text-foreground/70 hover:bg-secondary"
            aria-label={t("search")}
          >
            <Search className="size-4" />
          </Link>

          <ThemeToggle />

          <Link
            href="/bible"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-church-blue transition-colors"
          >
            <BookOpen className="size-4" />
            पवित्र बाइबल (NE)
          </Link>

          <div className="hidden sm:flex items-center rounded-full bg-secondary p-0.5 text-xs">
            <button
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 rounded-full transition ${lang === "en" ? "bg-church-blue text-white" : "text-church-blue"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ne")}
              className={`px-2.5 py-1 rounded-full transition ${lang === "ne" ? "bg-church-blue text-white" : "text-church-blue"}`}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              नेपाली
            </button>
          </div>

          <Button asChild size="sm" className="hidden md:inline-flex bg-gold text-church-blue hover:bg-gold/90">
            <Link href="/live">
              <Radio className="size-4" /> {t("joinLive")}
            </Link>
          </Button>

          <Button asChild size="sm" className="hidden xl:inline-flex bg-church-blue hover:bg-church-blue/90">
            <Link href="/give">{t("give")}</Link>
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden grid place-items-center size-9 rounded-md text-church-blue hover:bg-secondary" aria-label="Menu">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto">
              <SheetTitle className="text-church-blue" style={{ fontFamily: "var(--font-heading)" }}>
                {t("churchName")}
              </SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {allLinks.map((l) => (
                  <Link
                    key={l.to + l.key}
                    href={l.to}
                    className={pathname === l.to ? "px-3 py-2.5 rounded-lg bg-church-blue text-white" : "px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-secondary"}
                  >
                    {t(l.key)}
                  </Link>
                ))}
                <Link
                  href="/bible"
                  className="px-3 py-2.5 rounded-lg text-foreground/80 hover:bg-secondary text-left flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <BookOpen className="size-4" /> पवित्र बाइबल
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{lang === "en" ? "Language" : "भाषा"}:</span>
                <div className="flex items-center rounded-full bg-secondary p-0.5 text-xs">
                  <button onClick={() => setLang("en")} className={`px-3 py-1 rounded-full ${lang === "en" ? "bg-church-blue text-white" : "text-church-blue"}`}>EN</button>
                  <button onClick={() => setLang("ne")} className={`px-3 py-1 rounded-full ${lang === "ne" ? "bg-church-blue text-white" : "text-church-blue"}`}>नेपाली</button>
                </div>
              </div>
              <Button asChild className="mt-4 w-full bg-gold text-church-blue hover:bg-gold/90">
                <Link href="/live"><Radio className="size-4" /> {t("joinLive")}</Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
