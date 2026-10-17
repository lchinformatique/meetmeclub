"use client";
// Mémorise la visite du Marché : la pastille « nouveau » de l'onglet s'éteint jusqu'à la prochaine annonce.

import { useEffect } from "react";

export const MARKET_SEEN_KEY = "mmc:market-seen";

export default function MarketSeen() {
  useEffect(() => {
    try {
      localStorage.setItem(MARKET_SEEN_KEY, new Date().toISOString());
      window.dispatchEvent(new Event("mmc:market-seen"));
    } catch {}
  }, []);
  return null;
}
