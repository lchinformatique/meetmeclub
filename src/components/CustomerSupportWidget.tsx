"use client";
// src/components/CustomerSupportWidget.tsx
// Double Support : Assistant WhatsApp Direct (0022890283580) + Assistant Robot Virtuel Interactif 24/7

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const WHATSAPP_PHONE = "22890283580";
const WHATSAPP_MESSAGE = "Bonjour Meet Me Club, je souhaite continuer la discussion.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

interface BotMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  actionUrl?: string;
  actionText?: string;
}

const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ["gratuit", "free", "limite", "3 partenaire", "partenaire", "quota"],
    response:
      "Le Plan Gratuit (0 FCFA) vous donne un accès opérationnel de 7 jours pour créer votre profil complet, être visible à Lomé et échanger avec jusqu'à 3 partenaires, ainsi que commander des packs de rendez-vous réels. Pour un accès illimité, activez le Pass Essentiel à 3 000 FCFA/mois.",
    actionUrl: "/tarifs",
    actionText: "Voir les formules & tarifs",
  },
  {
    keywords: ["payer", "paiement", "t-money", "tmoney", "flooz", "moov", "togocom", "prix", "cout"],
    response:
      "Nous acceptons tous les moyens de paiement mobile locaux au Togo : T-Money (Togocom) et Flooz (Moov Africa), ainsi que les cartes bancaires Visa et Mastercard. Les transactions sont 100% sécurisées.",
    actionUrl: "/tarifs",
    actionText: "Consulter les moyens de paiement",
  },
  {
    keywords: ["video", "appel", "vrai", "personne", "faux", "securite", "authentique", "camera"],
    response:
      "Meet Me Club intègre une fonction d'Appel Vidéo en direct dans la messagerie. Avant de fixer une sortie, vous pouvez lancer un appel vidéo d'un clic pour vérifier instantanément l'authenticité de votre partenaire.",
    actionUrl: "/messages",
    actionText: "Tester la messagerie sécurisée",
  },
  {
    keywords: ["rendez-vous", "rdv", "restaurant", "table", "lieu", "boisson", "sortie", "lome", "coco beach", "byblos"],
    response:
      "Vous pouvez organiser une rencontre dans nos établissements partenaires vérifiés à Lomé (Coco Beach Bè Plage, Byblos Tokoin, Café de la Paix, etc.). Avec les formules Complice et VIP, la table est réservée et les consommations sont incluses !",
    actionUrl: "/rendez-vous/nouveau",
    actionText: "Proposer un rendez-vous",
  },
  {
    keywords: ["contact", "humain", "conseiller", "numero", "telephone", "aide", "service", "whatsapp"],
    response:
      "Notre équipe du service client à Lomé est joignable en direct sur WhatsApp du Lundi au Dimanche pour vous assister.",
    actionUrl: WHATSAPP_URL,
    actionText: "Discuter sur WhatsApp (Opérationnel)",
  },
];

const INITIAL_BOT_MESSAGES: BotMessage[] = [
  {
    id: "m_welcome",
    sender: "bot",
    text: "Bonjour et bienvenue sur Meet Me Club Togo ! Je suis l'Assistant Robot 24h/24. Comment puis-je vous aider aujourd'hui ?",
    time: "À l'instant",
  },
];

export default function CustomerSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>(INITIAL_BOT_MESSAGES);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<"whatsapp" | "robot" | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleAsk = (userQuestion: string) => {
    if (!userQuestion.trim()) return;

    const userMsg: BotMessage = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: userQuestion,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const q = userQuestion.toLowerCase();
      const matched = FAQ_KNOWLEDGE_BASE.find((item) =>
        item.keywords.some((k) => q.includes(k))
      );

      let replyText =
        "Je comprends votre question. Pour une assistance sur mesure ou un suivi direct, notre conseiller est disponible immédiatement sur WhatsApp.";
      let actionUrl: string | undefined = WHATSAPP_URL;
      let actionText: string | undefined = "Continuer sur WhatsApp (Opérationnel)";

      if (matched) {
        replyText = matched.response;
        actionUrl = matched.actionUrl;
        actionText = matched.actionText;
      }

      const botReply: BotMessage = {
        id: `b_${Date.now()}`,
        sender: "bot",
        text: replyText,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        actionUrl,
        actionText,
      };

      setMessages((prev) => [...prev, botReply]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <aside
      className="customer-support-widget-root"
      style={{
        position: "fixed",
        zIndex: 9999,
      }}
      aria-label="Service client et support Meet Me Club"
    >
      {/* ── Deux boutons flottants verticaux (WhatsApp + Robot) ── */}
      {!isOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
          {/* 1. Bouton Assistant WhatsApp avec Icône Chat */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contacter l'Assistant WhatsApp (Opérationnel)"
              title="Assistant WhatsApp (Opérationnel)"
              onMouseEnter={() => setHoveredButton("whatsapp")}
              onMouseLeave={() => setHoveredButton(null)}
              className="whatsapp-chat-btn-pulse"
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 22px rgba(37, 211, 102, 0.45)",
                textDecoration: "none",
                position: "relative",
                transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                flexShrink: 0,
              }}
            >
              {/* Icône de Chat professionnelle */}
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                <circle cx="8.5" cy="12" r="1.1" fill="currentColor" />
                <circle cx="12" cy="12" r="1.1" fill="currentColor" />
                <circle cx="15.5" cy="12" r="1.1" fill="currentColor" />
              </svg>

              {/* Indicateur vert En Ligne */}
              <span
                style={{
                  position: "absolute",
                  top: "1px",
                  right: "1px",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#10B981",
                  border: "2px solid white",
                  boxShadow: "0 0 5px rgba(16, 185, 129, 0.8)",
                }}
                aria-hidden="true"
              />
            </a>
          </div>

          {/* 2. Bouton Assistant Robot Virtuel Interactif */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Ouvrir l'Assistant Robot Virtuel 24h/24"
              title="Assistant Robot Virtuel Meet Me Club (24h/24)"
              onMouseEnter={() => setHoveredButton("robot")}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0B2559 0%, #071530 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 22px rgba(11, 37, 89, 0.45)",
                border: "1.5px solid rgba(255, 255, 255, 0.25)",
                cursor: "pointer",
                position: "relative",
                transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                flexShrink: 0,
                padding: 0,
              }}
            >
              {/* Icône Robot Moderne */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4" />
                <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
                <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
              </svg>

              {/* Pastille 24/7 */}
              <span
                style={{
                  position: "absolute",
                  bottom: "-3px",
                  right: "-2px",
                  background: "#D97706",
                  color: "white",
                  fontSize: "9px",
                  fontWeight: 800,
                  padding: "1px 4px",
                  borderRadius: "9999px",
                  border: "1.5px solid white",
                  lineHeight: 1.1,
                }}
              >
                24h
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Fenêtre du Robot Ouverte ─────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            width: "clamp(320px, 92vw, 390px)",
            height: "clamp(460px, 75vh, 560px)",
            background: "white",
            borderRadius: "24px",
            boxShadow: "0 25px 60px -10px rgba(7, 21, 48, 0.35)",
            border: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header du Robot */}
          <div
            style={{
              background: "linear-gradient(135deg, #0B2559 0%, #071530 100%)",
              padding: "14px 18px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
                  <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  Assistant Robot
                  <span style={{ fontSize: "9px", background: "#10B981", color: "white", padding: "1px 6px", borderRadius: "9999px" }}>
                    En ligne
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)" }}>
                  Support Automatisé 24h/24 · Lomé, Togo
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "none",
                color: "white",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Lien direct WhatsApp en haut du Robot */}
          <div
            style={{
              background: "#ECFDF5",
              padding: "9px 14px",
              borderBottom: "1px solid #D1FAE5",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "11.5px", color: "#065F46", fontWeight: 700 }}>
              Besoin d&apos;un humain ?
            </span>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#25D366",
                color: "white",
                padding: "3px 9px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              WhatsApp Direct
            </a>
          </div>

          {/* Corps des Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              background: "#F8FAFC",
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      background: isUser ? "linear-gradient(135deg, #0B2559 0%, #1E3A8A 100%)" : "white",
                      color: isUser ? "white" : "#0F172A",
                      padding: "10px 13px",
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      fontSize: "13px",
                      lineHeight: 1.5,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                      border: isUser ? "none" : "1px solid #E2E8F0",
                    }}
                  >
                    <div>{msg.text}</div>
                    {msg.actionUrl && (
                      <div style={{ marginTop: "8px" }}>
                        <a
                          href={msg.actionUrl}
                          style={{
                            display: "inline-block",
                            background: "#E10600",
                            color: "white",
                            padding: "5px 10px",
                            borderRadius: "7px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          {msg.actionText || "En savoir plus ➤"}
                        </a>
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "9.5px",
                        color: isUser ? "rgba(255,255,255,0.7)" : "#94A3B8",
                        marginTop: "4px",
                        textAlign: isUser ? "right" : "left",
                      }}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "11.5px", padding: "4px 8px" }}>
                <span>Le robot prépare sa réponse...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggestions Rapides */}
          <div
            style={{
              padding: "7px 10px",
              background: "white",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {[
              "Plan Gratuit (3 partenaires)",
              "Payer par T-Money / Flooz",
              "Appel Vidéo en direct",
              "Réserver un restaurant",
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleAsk(q)}
                style={{
                  background: "#F1F5F9",
                  border: "1px solid #CBD5E1",
                  borderRadius: "9999px",
                  padding: "4px 9px",
                  fontSize: "10.5px",
                  fontWeight: 600,
                  color: "#0B2559",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Saisie de message */}
          <div style={{ padding: "10px 12px", background: "white", borderTop: "1px solid #E2E8F0" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(inputVal);
              }}
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="text"
                placeholder="Posez votre question au robot…"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  fontSize: "12.5px",
                  color: "#0F172A",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!inputVal.trim()}
                style={{
                  background: inputVal.trim() ? "#0B2559" : "#CBD5E1",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0 12px",
                  cursor: inputVal.trim() ? "pointer" : "default",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
