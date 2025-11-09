import { useEffect } from "react";
import { trackAmbassadorVisit } from "@/api/ambassadors";

export function useAmbassadorTracking() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    
    if (!refCode) return;

    // Fire-and-forget, don't block UI
    trackAmbassadorVisit(refCode).catch((err) => {
      console.error("Failed to track ambassador visit", err);
    });
  }, []);
}
