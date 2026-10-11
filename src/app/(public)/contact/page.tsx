// src/app/(public)/contact/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "Question générale", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, #0B2559 0%, #071530 100%)", padding: "70px 20px", color: "white", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              padding: "6px 16px 6px 6px",
              borderRadius: "9999px",
              marginBottom: "18px",
            }}
          >
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid #E10600" }}>
              <Image src="/logo.png" alt="Logo" width={28} height={28} style={{ objectFit: "contain" }} priority />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>SUPPORT & CONTACT</span>
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 800, marginBottom: "16px" }}>
            Une question ? Notre équipe à Lomé vous répond
          </h1>
          <p style={{ fontSize: "17px", color: "#E2E8F0", lineHeight: 1.6 }}>
            Assistance 7j/7 disponible via WhatsApp, email ou directement sur la plateforme.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="container" style={{ maxWidth: "1000px", padding: "60px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
          {/* Quick Contact Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* WhatsApp Card */}
            <div style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", color: "white", padding: "30px", borderRadius: "20px", boxShadow: "0 8px 24px rgba(37, 211, 102, 0.25)" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
              <h3 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>Assistance Directe WhatsApp</h3>
              <p style={{ fontSize: "14px", opacity: 0.95, lineHeight: 1.6, marginBottom: "20px" }}>
                Réponse instantanée par notre service client togolais pour toute assistance sur votre compte ou vos réservations.
              </p>
              <a
                href="https://wa.me/22890000000?text=Bonjour%20Meet%20Me%20Club%2C%20j%27ai%20besoin%20d%27assistance"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "white",
                  color: "#128C7E",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "15px",
                  textDecoration: "none",
                }}
              >
                <span>Ouvrir WhatsApp (+228 90 00 00 00)</span>
                <span>➔</span>
              </a>
            </div>

            {/* General Info */}
            <div style={{ background: "white", padding: "30px", borderRadius: "20px", border: "1px solid #E2E8F0" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: "16px" }}>Coordonnées du Club</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px", color: "#475569" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>📍</span>
                  <span><strong>Bureau d'accueil :</strong> Lomé, Togo</span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>📧</span>
                  <span><strong>Email :</strong> contact@meetmeclub.tg</span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>🕒</span>
                  <span><strong>Disponibilité :</strong> 7j/7 de 08h00 à 22h00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div style={{ background: "white", padding: "36px 30px", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0B2559", marginBottom: "8px" }}>Envoyez-nous un message</h2>
            <p style={{ fontSize: "14px", color: "#64748B", marginBottom: "24px" }}>Nous vous répondons en moins de 2 heures ouvrées.</p>

            {submitted ? (
              <div style={{ padding: "30px", textAlign: "center", background: "#F0FDF4", borderRadius: "16px", border: "1px solid #86EFAC" }}>
                <div style={{ fontSize: "42px", marginBottom: "12px" }}>✅</div>
                <h4 style={{ fontSize: "18px", fontWeight: 800, color: "#166534", marginBottom: "8px" }}>Message bien reçu !</h4>
                <p style={{ fontSize: "14px", color: "#15803D" }}>Notre équipe Meet Me Club reviendra vers vous très vite par WhatsApp ou email.</p>
                <button onClick={() => setSubmitted(false)} className="btn btn-outline-blue btn-sm" style={{ marginTop: "16px" }}>
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>Nom & Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Armand Adzra"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>Email</label>
                    <input
                      type="email"
                      required
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>Téléphone</label>
                    <input
                      type="tel"
                      required
                      placeholder="+228 90 XX XX XX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>Motif</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px", background: "white" }}
                  >
                    <option value="Question générale">Question générale</option>
                    <option value="Abonnement & Paiement T-Money / Flooz">Abonnement & Paiement T-Money / Flooz</option>
                    <option value="Partenariat établissement">Devenir établissement partenaire</option>
                    <option value="Signalement ou Sécurité">Signaler un profil ou problème</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#1E293B", marginBottom: "6px" }}>Votre message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Comment pouvons-nous vous aider ?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "14px" }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: "14px", fontWeight: 800, fontSize: "15px" }}>
                  Envoyer le message 🚀
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
