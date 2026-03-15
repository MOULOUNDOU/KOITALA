"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  children: React.ReactNode;
}

export default function PageTransition({ children }: Props) {
  const EXIT_DURATION_MS = 260;
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [displayPath, setDisplayPath] = useState(pathname);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (pathname !== displayPath) {
      const exitFrame = requestAnimationFrame(() => {
        setPhase("exit");
      });
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setDisplayPath(pathname);
        setPhase("enter");
      }, EXIT_DURATION_MS);
      return () => {
        cancelAnimationFrame(exitFrame);
        clearTimeout(timeout);
      };
    }
  }, [pathname, children, displayPath]);

  return (
    <div
      className={
        phase === "enter"
          ? "page-transition-shell min-h-full animate-page-enter"
          : "page-transition-shell min-h-full animate-page-exit"
      }
    >
      {pathname === displayPath ? children : displayChildren}
    </div>
  );
}
