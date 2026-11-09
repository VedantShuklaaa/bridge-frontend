"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import { NavLink } from "@/components/layout/navbar/nav-link";
import { navItems, type NavItem } from "@/lib/nav";

function isActive(item: NavItem, pathname: string) {
  if (item.external) return false;
  if (item.href === "/") return pathname === "/";
  return pathname.startsWith(item.href);
}

export function Navbar() {
  const pathname = usePathname();

  // Docs renders its own header and sidebar shell; the floating navbar would
  // collide with it.
  if (pathname === "/docs" || pathname.startsWith("/docs/")) return null;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-3">
      <motion.nav
        aria-label="Primary"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          mass: 0.7,
        }}
        className="pointer-events-auto flex max-w-full items-center gap-0.5 whitespace-nowrap rounded-xl border border-foreground/15 bg-background/80 p-1 shadow-sm backdrop-blur-md"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item, pathname)}
          />
        ))}
      </motion.nav>
    </header>
  );
}
