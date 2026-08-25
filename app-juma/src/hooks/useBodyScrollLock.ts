import { useEffect } from "react";

let activeLocks = 0;
let previousHtmlOverflow = "";
let previousBodyOverflow = "";

/** Evita que el contenido del fondo se desplace mientras hay un modal o drawer abierto. */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof document === "undefined") return;

    if (activeLocks === 0) {
      previousHtmlOverflow = document.documentElement.style.overflow;
      previousBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    }
    activeLocks += 1;

    return () => {
      activeLocks = Math.max(0, activeLocks - 1);
      if (activeLocks === 0) {
        document.documentElement.style.overflow = previousHtmlOverflow;
        document.body.style.overflow = previousBodyOverflow;
      }
    };
  }, [isLocked]);
}
