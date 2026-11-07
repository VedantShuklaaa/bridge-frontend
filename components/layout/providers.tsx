"use client";

import { MotionConfig } from "framer-motion";
//import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function Providers({
  children,
  nonce,
}: {
  children: ReactNode;
  nonce?: string;
}) {
  return (
    //<ThemeProvider
    //  attribute="class"
    //  defaultTheme="system"
    //  enableSystem
    //  disableTransitionOnChange
    //  nonce={nonce}
    //>
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
    //</ThemeProvider>
  );
}
