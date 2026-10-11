"use client";
// src/components/CustomerSupportWidget.tsx
// Integrated Customer Service Widget: Live WhatsApp Chat + 24/7 Automated System Robot

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

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
      "Notre équipe du service client à Lomé est disponible en direct sur WhatsApp pour répondre à vos demandes personnalisées du Lundi au Dimanche.",
    actionUrl: "https://wa.me/22890000000?text=Bonjour%20Meet%20Me%20Club%2C%20j%27ai%20besoin%20d%27assistance.",
    actionText: "Discuter sur WhatsApp (+228)",
  },
];

const INITIAL_BOT_MESSAGES: BotMessage[] = [
  {
    id: "m_welcome",
    sender: "bot",
    text: "Bonjour et bienvenue sur Meet Me Club Togo ! 👋 Je suis l'Assistant Virtuel officiel. Comment puis-je vous aider aujourd'hui ?",
    time: "À l'instant",
  },
];

export default function CustomerSupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>(INITIAL_BOT_MESSAGES);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
      let matched = FAQ_KNOWLEDGE_BASE.find((item) =>
        item.keywords.some((k) => q.includes(k))
      );

      let replyText =
        "Je comprends votre question. Pour des détails sur mesure, notre service client est joignable 7j/7 directement sur WhatsApp, ou vous pouvez explorer nos rubriques Découverte et Tarifs.";
      let actionUrl = "https://wa.me/22890000000?text=Bonjour%20Meet%20Me%20Club%2C%20j%27ai%20une%20question.";
      let actionText = "💬 Échanger avec un conseiller sur WhatsApp";

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
    <div style={{ position: "fixed", bottom: "80px", right: "20px", zIndex: 9999 }}>
      {/* Floating Main Buttons Container */}
      {!isOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
          {/* WhatsApp compact circle button */}
          <a
            href="https://wa.me/22890000000?text=Bonjour%20Meet%20Me%20Club%2C%20j%27aimerais%20avoir%20des%20renseignements."
            target="_blank"
            rel="noopener noreferrer"
            title="Service Client WhatsApp"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "#25D366",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 4px 14px rgba(37, 211, 102, 0.45)",
              textDecoration: "none",
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
          >
            💬
          </a>

          {/* Interactive Chatbot Launcher Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            title="Assistant Virtuel Meet Me Club (24h/24)"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0B2559 0%, #071530 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(11, 37, 89, 0.4)",
              border: "1.5px solid rgba(255, 255, 255, 0.2)",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              padding: 0,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1.5px solid #E10600",
              }}
            >
              <Image src="/logo.png" alt="Bot Meet Me Club" width={22} height={22} style={{ objectFit: "contain" }} />
            </div>
            {/* Online green indicator badge */}
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#10B981",
                border: "2px solid #0B2559",
                boxShadow: "0 0 4px #10B981",
              }}
            />
          </button>
        </div>
      )}

      {/* ── Active Chatbot Window ─────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            width: "clamp(320px, 92vw, 400px)",
            height: "clamp(480px, 75vh, 580px)",
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
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0B2559 0%, #071530 100%)",
              padding: "16px 20px",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #E10600",
                  padding: "2px",
                  flexShrink: 0,
                }}
              >
                <Image src="/logo.png" alt="Bot Logo" width={34} height={34} style={{ objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                  Assistant Virtuel
                  <span style={{ fontSize: "10px", background: "#10B981", color: "white", padding: "1px 6px", borderRadius: "9999px" }}>
                    En ligne
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.8)" }}>
                  Service Client 24/7 · Lomé, Togo
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
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Quick WhatsApp Banner inside Chat */}
          <div
            style={{
              background: "#ECFDF5",
              padding: "10px 16px",
              borderBottom: "1px solid #D1FAE5",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "12px", color: "#065F46", fontWeight: 700 }}>
              Besoin d'un humain ?
            </span>
            <a
              href="https://wa.me/22890000000?text=Bonjour%20Meet%20Me%20Club%2C%20j%27ai%20besoin%20d%27assistance."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#25D366",
                color: "white",
                padding: "4px 10px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <span>💬</span> WhatsApp Direct
            </a>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
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
                      padding: "12px 14px",
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      fontSize: "13.5px",
                      lineHeight: 1.5,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                      border: isUser ? "none" : "1px solid #E2E8F0",
                    }}
                  >
                    <div>{msg.text}</div>
                    {msg.actionUrl && (
                      <div style={{ marginTop: "10px" }}>
                        <a
                          href={msg.actionUrl}
                          style={{
                            display: "inline-block",
                            background: "#E10600",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "11.5px",
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
                        fontSize: "10px",
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
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748B", fontSize: "12px", padding: "4px 8px" }}>
                <span>🤖 Le robot prépare sa réponse...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: "8px 12px",
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
                  padding: "5px 10px",
                  fontSize: "11px",
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

          {/* Input Bar */}
          <div style={{ padding: "12px 14px", background: "white", borderTop: "1px solid #E2E8F0" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk(inputVal);
              }}
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="text"
                placeholder="Posez votre question…"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid #CBD5E1",
                  fontSize: "13px",
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
                  borderRadius: "12px",
                  padding: "0 14px",
                  cursor: inputVal.trim() ? "pointer" : "default",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
