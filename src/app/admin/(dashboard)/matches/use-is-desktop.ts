"use client";

import { useEffect, useState } from "react";

const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Track the `md` breakpoint so overlays can be a bottom-sheet on mobile and a
 * centered dialog on desktop (admin-ux-spec §7). Starts `false` (mobile-first)
 * to keep SSR/first paint deterministic, then syncs after mount.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = globalThis.window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
