"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface Props {
  children: React.ReactNode;
}

export default function PageTransition({ children }: Props) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      // Route changed — trigger exit then enter
      setPhase("exit");
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        setPhase("enter");
        prevPath.current = pathname;
      }, 200);
      return () => clearTimeout(timeout);
    } else {
      // Same route, just update children
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className={
        phase === "enter"
          ? "min-h-full animate-page-enter"
          : "min-h-full animate-page-exit"
      }
    >
      {displayChildren}
    </div>
  );
}
