"use client";
// src/app/vip/page.tsx
// Espace VIP Exclusif — Mur communautaire de publications (Articles, Photos, Vidéos) pour membres VIP

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import {
  Crown,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Send,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { VipPost, SASPAY_LINKS } from "@/lib/subscription-constants";

export default function VipPage() {
  const [myProfile, setMyProfile] = useState<any>(null);
  const [posts, setPosts] = useState<VipPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Formulaire de publication
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "ARTICLE">("IMAGE");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Likes locaux instantanés
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, postsRes] = await Promise.all([
          fetch("/api/profiles/me"),
          fetch("/api/vip/posts"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setMyProfile(meData.profile);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.posts || []);
        }
      } catch (err) {
        console.warn("Could not load VIP page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isVip = myProfile?.plan === "VIP";

  // Upload média (photo ou vidéo)
  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Upload direct via Supabase Storage
        const res = await fetch("/api/profiles/me/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, isMain: false }),
        });
        if (res.ok) {
          const data = await res.json();
          setMediaUrl(data.photo?.url || base64);
        } else {
          setMediaUrl(base64);
        }
        setUploadingMedia(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingMedia(false);
    }
  }

  // Création de publication VIP
  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setPublishing(true);
    try {
      const res = await fetch("/api/vip/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          mediaType,
          mediaUrl: mediaUrl || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.post) {
          setPosts((prev) => [data.post, ...prev]);
        }
        setTitle("");
        setContent("");
        setMediaUrl("");
        setShowForm(false);
      }
    } catch (err) {
      console.warn("Publish error:", err);
    } finally {
      setPublishing(false);
    }
  }

  // Like de publication
  async function handleLike(postId: string) {
    if (likedMap[postId]) return;

    setLikedMap((prev) => ({ ...prev, [postId]: true }));
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p))
    );

    try {
      await fetch(`/api/vip/posts/${postId}/like`, { method: "POST" });
    } catch {}
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#0B132B", color: "white" }}>
      <Header />

      {/* Hero Banner VIP */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(15,23,42,0.9) 0%, #0B132B 100%)",
          borderBottom: "1px solid rgba(245, 158, 11, 0.25)",
          padding: "40px 20px 30px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.3) 100%)",
              border: "1.5px solid #F59E0B",
              padding: "6px 16px",
              borderRadius: "999px",
              color: "#FDE047",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            <Crown size={16} />
            <span>Club VIP International</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 900,
              margin: "0 0 12px",
              background: "linear-gradient(135deg, #FFFFFF 0%, #FDE047 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Mur Exclusif & Salons Privés VIP
          </h1>

          <p style={{ fontSize: "15px", color: "#CBD5E1", lineHeight: 1.6, margin: "0 auto 20px", maxWidth: "620px" }}>
            Espace d&apos;échanges et de publications ouvert à tous les membres VIP. Partagez vos articles, photos, vidéos, bons plans et organisez des rencontres d&apos;exception à Lomé.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {isVip ? (
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="btn btn-primary"
                style={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                  color: "#0F172A",
                  fontWeight: 800,
                  fontSize: "14px",
                  padding: "12px 24px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 20px rgba(245,158,11,0.3)",
                }}
              >
                <Sparkles size={18} />
                <span>{showForm ? "Fermer le formulaire" : "Créer une publication VIP"}</span>
              </button>
            ) : (
              <a
                href={SASPAY_LINKS.VIP}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "14px",
                  padding: "12px 24px",
                  borderRadius: "14px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 20px rgba(225,6,0,0.4)",
                }}
              >
                <Crown size={18} />
                <span>Débloquer le Pass VIP — 15 000 FCFA</span>
              </a>
            )}

            <Link
              href="/messages"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                padding: "12px 20px",
                borderRadius: "14px",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span>💬 Messagerie & Appels</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Feed */}
      <main className="container" style={{ paddingBlock: "32px", maxWidth: "800px" }}>
        {/* Formulaire de publication si VIP */}
        {isVip && showForm && (
          <div
            style={{
              background: "#1E293B",
              border: "1.5px solid #F59E0B",
              borderRadius: "20px",
              padding: "24px",
              marginBottom: "30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Crown size={22} color="#F59E0B" />
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "white", margin: 0 }}>
                Nouvelle publication sur le Mur VIP
              </h2>
            </div>

            <form onSubmit={handlePublish} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <input
                type="text"
                placeholder="Titre de votre publication (optionnel)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />

              <textarea
                placeholder="Exprimez-vous auprès des membres VIP : annoncez une sortie, partagez un bon plan ou une réflexion..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                style={{
                  background: "#0F172A",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  color: "white",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  resize: "vertical",
                  outline: "none",
                }}
              />

              {/* Sélection Type de Média */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#78859A", fontWeight: 700 }}>Ajouter un média :</span>

                <button
                  type="button"
                  onClick={() => {
                    setMediaType("IMAGE");
                    fileInputRef.current?.click();
                  }}
                  style={{
                    background: mediaType === "IMAGE" ? "#F59E0B" : "#0F172A",
                    color: mediaType === "IMAGE" ? "#0F172A" : "#CBD5E1",
                    border: "1px solid #334155",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ImageIcon size={15} />
                  <span>Photo / Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType("VIDEO")}
                  style={{
                    background: mediaType === "VIDEO" ? "#F59E0B" : "#0F172A",
                    color: mediaType === "VIDEO" ? "#0F172A" : "#CBD5E1",
                    border: "1px solid #334155",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <VideoIcon size={15} />
                  <span>Vidéo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType("ARTICLE")}
                  style={{
                    background: mediaType === "ARTICLE" ? "#F59E0B" : "#0F172A",
                    color: mediaType === "ARTICLE" ? "#0F172A" : "#CBD5E1",
                    border: "1px solid #334155",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FileText size={15} />
                  <span>Article</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleMediaUpload}
                  style={{ display: "none" }}
                />
              </div>

              {/* Aperçu média si sélectionné */}
              {uploadingMedia && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FDE047", fontSize: "13px" }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Envoi du média en cours...</span>
                </div>
              )}

              {mediaUrl && (
                <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", maxHeight: "280px" }}>
                  <Image
                    src={mediaUrl}
                    alt="Aperçu publication"
                    width={800}
                    height={400}
                    style={{ width: "100%", maxHeight: "280px", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => setMediaUrl("")}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(0,0,0,0.7)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    background: "transparent",
                    color: "#78859A",
                    border: "none",
                    padding: "10px 18px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={publishing || !content.trim()}
                  style={{
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    color: "#0F172A",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 24px",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Publier sur le Mur VIP</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Aperçu réservé / Teaser pour utilisateurs non-VIP */}
        {!isVip && (
          <div
            style={{
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
              border: "2px solid #F59E0B",
              borderRadius: "24px",
              padding: "32px 24px",
              textAlign: "center",
              marginBottom: "32px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#B45309",
                fontSize: "26px",
              }}
            >
              👑
            </div>

            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "white", marginBottom: "8px" }}>
              Rejoignez le Club VIP pour participer
            </h2>

            <p style={{ fontSize: "14px", color: "#78859A", lineHeight: 1.6, maxWidth: "540px", margin: "0 auto 20px" }}>
              Le Mur VIP permet aux membres d&apos;échanger librement, de publier leurs articles, photos et vidéos, et de bénéficier des <strong>Appels audio et vidéo WhatsApp en direct</strong> avec tous les membres de la plateforme.
            </p>

            <a
              href={SASPAY_LINKS.VIP}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)",
                color: "white",
                padding: "14px 28px",
                borderRadius: "14px",
                fontWeight: 800,
                fontSize: "15px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 6px 20px rgba(225,6,0,0.4)",
              }}
            >
              <span>Activer mon Pass VIP — 15 000 FCFA</span>
              <ArrowRight size={18} />
            </a>
          </div>
        )}

        {/* Liste des publications VIP */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {posts.map((post) => {
            const hasLiked = Boolean(likedMap[post.id]);
            return (
              <article
                key={post.id}
                style={{
                  background: "#1E293B",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "22px",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
                  filter: !isVip ? "blur(1px) opacity(0.85)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Author Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ position: "relative" }}>
                    {post.authorAvatar ? (
                      <Image
                        src={post.authorAvatar}
                        alt={post.authorName}
                        width={46}
                        height={46}
                        style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #F59E0B" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "50%",
                          background: "#0B2559",
                          color: "white",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #F59E0B",
                        }}
                      >
                        {post.authorName.charAt(0)}
                      </div>
                    )}
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        background: "#F59E0B",
                        borderRadius: "50%",
                        width: "16px",
                        height: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                      }}
                    >
                      👑
                    </span>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ fontSize: "15px", color: "white" }}>{post.authorName}</strong>
                      <span
                        style={{
                          background: "rgba(245,158,11,0.2)",
                          color: "#FDE047",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid rgba(245,158,11,0.4)",
                        }}
                      >
                        VIP
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#78859A" }}>
                      {post.authorPseudo || "@membre_vip"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                {post.title && (
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "white", margin: "0 0 8px" }}>
                    {post.title}
                  </h3>
                )}

                <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: 1.6, margin: "0 0 16px", whiteSpace: "pre-line" }}>
                  {post.content}
                </p>

                {/* Media */}
                {post.mediaUrl && (
                  <div
                    style={{
                      borderRadius: "14px",
                      overflow: "hidden",
                      marginBottom: "16px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Image
                      src={post.mediaUrl}
                      alt={post.title || "Image publication VIP"}
                      width={800}
                      height={460}
                      style={{ width: "100%", maxHeight: "420px", objectFit: "cover" }}
                    />
                  </div>
                )}

                {/* Actions Footer */}
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    paddingTop: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button
                      type="button"
                      disabled={!isVip}
                      onClick={() => handleLike(post.id)}
                      style={{
                        background: hasLiked ? "rgba(239,68,68,0.2)" : "transparent",
                        color: hasLiked ? "#EF4444" : "#CBD5E1",
                        border: "none",
                        cursor: isVip ? "pointer" : "default",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: "8px",
                      }}
                    >
                      <Heart size={16} fill={hasLiked ? "#EF4444" : "none"} />
                      <span>{post.likesCount} J&apos;aime</span>
                    </button>

                    <button
                      type="button"
                      disabled={!isVip}
                      style={{
                        background: "transparent",
                        color: "#CBD5E1",
                        border: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: 700,
                        padding: "6px 12px",
                      }}
                    >
                      <MessageCircle size={16} />
                      <span>{post.commentsCount || 0} Commentaires</span>
                    </button>
                  </div>

                  <Link
                    href={`/messages?user=${post.userId}`}
                    style={{
                      color: "#FDE047",
                      fontSize: "12px",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>Discuter en privé →</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
