"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavbarSearch } from "./navbar-search";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isLive = pathname === "/live" || pathname.startsWith("/live/");

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <motion.nav
        aria-label="Primary"
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.7 }}
        className="pointer-events-auto flex h-14 w-full max-w-3xl items-center gap-1.5 rounded-full border border-border bg-background/80 px-2 shadow-sm backdrop-blur-md sm:gap-2 sm:px-3"
      >
        <Link
          href="/"
          aria-current={isHome ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-2 py-2 font-heading text-[13px] font-medium tracking-tight transition-[color,background-color,transform] hover:bg-muted sm:px-3 sm:text-base motion-safe:active:scale-[0.97] max-[359px]:hidden",
            isHome && "underline decoration-1 underline-offset-[6px]",
          )}
        >
          bridgeIndexer
        </Link>

        {/* Compact wordmark for the narrowest phones, where the full one would
            squeeze the search field to nothing. */}
        <Link
          href="/"
          aria-current={isHome ? "page" : undefined}
          aria-label="bridgeIndexer home"
          className={cn(
            "hidden shrink-0 items-center justify-center rounded-full px-2 py-2 font-heading text-[13px] font-medium transition-[color,background-color,transform] hover:bg-muted motion-safe:active:scale-[0.97] max-[359px]:inline-flex",
            isHome && "underline decoration-1 underline-offset-[6px]",
          )}
        >
          b
        </Link>

        <NavbarSearch />

        <Link
          href="/live"
          aria-current={isLive ? "page" : undefined}
          className={cn(
            "relative shrink-0 rounded-full px-2 py-2 text-sm transition-[color,background-color,transform] hover:bg-muted sm:px-3 motion-safe:active:scale-[0.97]",
            isLive
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Live
          {isLive ? (
            <span
              aria-hidden
              className="absolute inset-x-2 bottom-1.5 h-px bg-foreground sm:inset-x-3"
            />
          ) : null}
        </Link>

        <ThemeToggle />
      </motion.nav>
    </header>
  );
}
