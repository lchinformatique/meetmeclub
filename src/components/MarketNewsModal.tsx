"use client";
// Fenêtre « Nouvelle annonce au Marché » : s'ouvre chez chaque membre tant qu'il n'a pas regardé
// la dernière annonce validée. « Plus tard » la masque jusqu'à la prochaine visite du site.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, X } from "lucide-react";

const SEEN_KEY = "mmc:market-news-seen";
const LATER_KEY = "mmc:market-news-later";
const HIDDEN_ON = ["/marche", "/admin", "/connexion", "/inscription", "/onboarding", "/verification", "/auth", "/support"];

interface News {
  id: string;
  title: string;
  photo: string | null;
  price: string;
}

export default function MarketNewsModal() {
  const pathname = usePathname() || "/";
  const [news, setNews] = useState<News | null>(null);

  useEffect(() => {
    // Le membre ouvre une annonce : la fenêtre ne revient plus pour elle
    const opened = pathname.match(/^\/marche\/annonce\/([^/?#]+)/);
    if (opened) {
      try {
        localStorage.setItem(SEEN_KEY, decodeURIComponent(opened[1]));
      } catch {}
    }
    if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    let alive = true;
    fetch("/api/market/latest", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const l: News | null = d?.listing || null;
        if (!alive || !l) return;
        try {
          if (localStorage.getItem(SEEN_KEY) === l.id) return;
          if (sessionStorage.getItem(LATER_KEY) === l.id) return;
        } catch {}
        setNews(l);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  if (!news) return null;

  const markSeen = () => {
    try {
      localStorage.setItem(SEEN_KEY, news.id);
    } catch {}
    setNews(null);
  };
  const later = () => {
    try {
      sessionStorage.setItem(LATER_KEY, news.id);
    } catch {}
    setNews(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nouvelle annonce au Marché"
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(24,34,58,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 22, overflow: "hidden", boxShadow: "0 24px 60px rgba(24,34,58,0.35)", position: "relative" }}>
        <button type="button" onClick={later} aria-label="Fermer" style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 17, border: "none", background: "rgba(255,255,255,0.92)", color: "#18223a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <X size={18} />
        </button>
        {news.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={news.photo} alt={news.title} style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", display: "block", background: "#EEF1F6" }} />
        ) : (
          <div style={{ width: "100%", aspectRatio: "16 / 10", background: "linear-gradient(135deg,#EEF2FB,#FDF2F4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Store size={54} color="#2F4A8A" />
          </div>
        )}
        <div style={{ padding: "18px 18px 20px", textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "#2F4A8A", background: "#EEF2FB", padding: "5px 12px", borderRadius: 999 }}>
            <Store size={14} /> Nouvelle annonce au Marché
          </span>
          <h2 style={{ margin: "10px 0 4px", fontSize: 20, fontWeight: 800, color: "#18223a", lineHeight: 1.3 }}>{news.title}</h2>
          <p style={{ margin: "0 0 16px", fontWeight: 800, color: "#D6455A", fontSize: 16 }}>{news.price}</p>
          <div style={{ display: "grid", gap: 8 }}>
            <Link href={`/marche/annonce/${news.id}`} onClick={markSeen} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48, borderRadius: 14, background: "#2F4A8A", color: "#fff", fontWeight: 800, fontSize: 16, textDecoration: "none" }}>
              Voir l&apos;annonce
            </Link>
            <button type="button" onClick={later} style={{ minHeight: 44, borderRadius: 14, border: "1.5px solid #C9D3EA", background: "#fff", color: "#3B4658", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
