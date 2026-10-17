// Recherche de l'accueil : on tape ce qu'on veut, les résultats s'ouvrent dans le Marché.

import { Search } from "lucide-react";

export default function HeroSearch() {
  return (
    <form
      action="/marche"
      method="get"
      role="search"
      style={{
        display: "flex",
        gap: 6,
        background: "#fff",
        borderRadius: 16,
        padding: 6,
        boxShadow: "0 12px 34px rgba(0,0,0,0.3)",
        margin: "0 0 24px",
        width: "100%",
        maxWidth: 560,
      }}
    >
      <label htmlFor="hero-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Rechercher dans le Marché
      </label>
      <span style={{ display: "flex", alignItems: "center", paddingLeft: 8, color: "#505D70" }}>
        <Search size={20} />
      </span>
      <input
        id="hero-search"
        name="q"
        type="search"
        placeholder="Hôtel, appartement, restaurant, coiffeuse…"
        autoComplete="off"
        style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 16, color: "#0F172A", background: "transparent", padding: "10px 4px" }}
      />
      <button
        type="submit"
        style={{ border: "none", borderRadius: 12, background: "#E10600", color: "#fff", fontWeight: 800, fontSize: 15, padding: "0 18px", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        Rechercher
      </button>
    </form>
  );
}
