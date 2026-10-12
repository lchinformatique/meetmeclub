"use client";
// src/components/LogoutButton.tsx
// Bouton de déconnexion réactif avec icône et état de chargement

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  variant?: "outline" | "danger" | "ghost" | "icon";
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function LogoutButton({
  variant = "danger",
  label = "Se déconnecter",
  className = "",
  style = {},
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Erreur logout:", err);
    } finally {
      router.push("/connexion");
      router.refresh();
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        title="Se déconnecter"
        aria-label="Se déconnecter"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          border: "1.5px solid #FECACA",
          background: "#FFF5F5",
          color: "#DC2626",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "all 0.18s ease",
          ...style,
        }}
        className={className}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      </button>
    );
  }

  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.7 : 1,
    transition: "all 0.18s ease",
    textDecoration: "none",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    danger: {
      background: "#FFF5F5",
      border: "1.5px solid #FECACA",
      color: "#DC2626",
    },
    outline: {
      background: "white",
      border: "1.5px solid #E2E8F0",
      color: "#475569",
    },
    ghost: {
      background: "transparent",
      border: "none",
      color: "#DC2626",
    },
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        ...baseStyle,
        ...(variantStyles[variant] || variantStyles.danger),
        ...style,
      }}
      className={className}
    >
      {loading ? (
        <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <LogOut size={15} />
      )}
      <span>{loading ? "Déconnexion..." : label}</span>
    </button>
  );
}
