"use client";
// src/app/messages/page.tsx
// Messagerie Meet Me Club — style WhatsApp aux couleurs du club :
// discussions en temps réel, membres en ligne, photos, notes vocales, position,
// appels audio/vidéo (VIP), accusés de lecture et notifications.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BellRing,
  CalendarHeart,
  Lock,
  MessageCircle,
  MessageCirclePlus,
  MoreVertical,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import Header from "@/components/Header";
import { useRealtime } from "@/components/realtime/RealtimeProvider";
import styles from "./messages.module.css";
import Avatar from "./_components/Avatar";
import MessageBubble from "./_components/MessageBubble";
import Composer from "./_components/Composer";
import { LocationModal, Lightbox, PartnerSheet, PlanBadge, QuotaModal, RulesModal, VipModal } from "./_components/Modals";
import {
  VICTOIRE_CONVERSATION,
  VICTOIRE_ID,
  compressImage,
  dayLabel,
  formatListTime,
  previewText,
  readAsDataUrl,
  toChatMessage,
  type ChatMessage,
  type Conversation,
  type Member,
} from "./_lib/chat-utils";

const FREE_MAX_PARTNERS = 3;
const MAX_VIDEO_BYTES = 3 * 1024 * 1024;

function MessagesApp() {
  const searchParams = useSearchParams();
  const convParam = searchParams.get("conv");
  const contactParam = searchParams.get("contact") || searchParams.get("user");

  const rt = useRealtime();

  const [authState, setAuthState] = useState<"loading" | "in" | "out">("loading");
  const [myProfile, setMyProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([VICTOIRE_CONVERSATION]);
  const [convsLoaded, setConvsLoaded] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">(convParam || contactParam ? "chat" : "list");
  const [messagesByConv, setMessagesByConv] = useState<Record<string, ChatMessage[]>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<"chats" | "online">("chats");
  const [search, setSearch] = useState("");
  const [typingAt, setTypingAt] = useState<Record<string, number>>({});
  const [partnerTypingBot, setPartnerTypingBot] = useState(false);
  const [sheetMember, setSheetMember] = useState<Member | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [vipOpen, setVipOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingPayloads = useRef<Record<string, { body: string; mediaUrl?: string; convId: string }>>({});
  const contactHandled = useRef<string | null>(null);

  const myId: string | undefined = rt.me?.userId || myProfile?.userId;
  const plan: string = (myProfile?.effectivePlan || myProfile?.plan || rt.me?.plan || "FREE").toUpperCase();
  const isVip = plan === "VIP";
  const isFree = plan === "FREE";

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConvId) || null,
    [conversations, activeConvId]
  );

  const memberById = useMemo(() => {
    const map: Record<string, Member> = {};
    for (const m of members) map[m.userId] = m;
    return map;
  }, [members]);

  // ── Chargements ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/profiles/me")
      .then(async (res) => {
        if (res.status === 401) return setAuthState("out");
        if (!res.ok) return setAuthState("in");
        const data = await res.json();
        setMyProfile(data.profile);
        setAuthState("in");
      })
      .catch(() => setAuthState("in"));
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (res.status === 401) return setAuthState("out");
      if (!res.ok) return;
      const data = await res.json();
      const list: Conversation[] = Array.isArray(data.conversations) ? data.conversations : [];
      setConversations((prev) => {
        // Conserve les conversations ouvertes localement qui n'existent pas encore côté serveur
        const localOnly = prev.filter((c) => !list.some((l) => l.id === c.id) && c.id.startsWith("local_"));
        const merged = [...localOnly, ...list];
        if (!merged.some((c) => c.participantId === VICTOIRE_ID)) merged.push(VICTOIRE_CONVERSATION);
        return merged.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      });
    } catch {
    } finally {
      setConvsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    fetch("/api/profiles")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data?.profiles)) return;
        setMembers(
          data.profiles.map((p: any) => ({
            userId: p.userId,
            firstName: p.firstName || "Membre",
            pseudo: p.pseudo,
            photoUrl: p.photos?.find((ph: any) => ph.isMain)?.url || p.photos?.[0]?.url || p.avatarUrl || "",
            photos: p.photos || [],
            city: p.city,
            neighborhood: p.neighborhood,
            bio: p.bio,
            profession: p.profession,
            relationshipGoal: p.relationshipGoal,
            age: p.age,
            plan: p.plan,
            gender: p.gender,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(convId)}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const serverMsgs: ChatMessage[] = (data.messages || []).map(toChatMessage);
      setMessagesByConv((prev) => {
        const pending = (prev[convId] || []).filter((m) => m.id.startsWith("tmp-"));
        return { ...prev, [convId]: [...serverMsgs, ...pending] };
      });
    } catch {}
  }, []);

  // ── Conversation active ─────────────────────────────────────
  const chatVisible = Boolean(activeConvId) && (mobileView === "chat" || (typeof window !== "undefined" && window.innerWidth > 768));

  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);
    const id = setInterval(() => loadMessages(activeConvId), 20_000);
    return () => clearInterval(id);
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    rt.setActiveConversation(chatVisible ? activeConvId : null);
    if (chatVisible && activeConvId) {
      setConversations((prev) => prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c)));
    }
    return () => rt.setActiveConversation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, chatVisible]);

  // Desktop : ouvrir la première conversation par défaut
  useEffect(() => {
    if (!convsLoaded || activeConvId || convParam || contactParam) return;
    if (window.innerWidth > 768 && conversations[0]) setActiveConvId(conversations[0].id);
  }, [convsLoaded, conversations, activeConvId, convParam, contactParam]);

  // ?conv=… (depuis une notification)
  useEffect(() => {
    if (!convParam || !convsLoaded) return;
    setActiveConvId(convParam);
    setMobileView("chat");
    if (!conversations.some((c) => c.id === convParam)) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convParam, convsLoaded]);

  // Défilement automatique vers le dernier message
  const activeMessages = activeConvId ? messagesByConv[activeConvId] || [] : [];
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [activeMessages.length, activeConvId, partnerTypingBot]);

  // ── Temps réel ──────────────────────────────────────────────
  const activeConvRef = useRef(activeConvId);
  activeConvRef.current = activeConvId;

  const rtSubscribe = rt.subscribe;
  useEffect(() => {
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = rtSubscribe((event, payload) => {
      const convId = payload?.conversationId as string | undefined;
      if (event === "message") {
        if (convId && convId === activeConvRef.current) loadMessages(convId);
        setTypingAt((prev) => (convId && prev[convId] ? { ...prev, [convId]: 0 } : prev));
        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(loadConversations, 400);
      } else if (event === "typing" && convId) {
        setTypingAt((prev) => ({ ...prev, [convId]: Date.now() }));
        setTimeout(() => forceTick((n) => n + 1), 3600);
      } else if (event === "read" && convId) {
        setMessagesByConv((prev) => {
          const list = prev[convId];
          if (!list) return prev;
          return {
            ...prev,
            [convId]: list.map((m) => (m.senderId !== payload.readerId && m.status !== "READ" && !m.id.startsWith("tmp-") ? { ...m, status: "READ" } : m)),
          };
        });
      }
    });
    const onCallLogged = (e: Event) => {
      const convId = (e as CustomEvent).detail?.conversationId;
      if (convId) loadMessages(convId);
      loadConversations();
    };
    window.addEventListener("mmc:call-logged", onCallLogged);
    return () => {
      unsubscribe();
      window.removeEventListener("mmc:call-logged", onCallLogged);
      if (reloadTimer) clearTimeout(reloadTimer);
    };
  }, [rtSubscribe, loadMessages, loadConversations]);

  const isTyping = (convId: string) => Date.now() - (typingAt[convId] || 0) < 3500;

  // ── Démarrer une discussion avec un membre ──────────────────
  const realPartnersCount = conversations.filter((c) => c.participantId !== VICTOIRE_ID).length;

  const openConversation = (convId: string) => {
    setActiveConvId(convId);
    setMobileView("chat");
    setMenuOpen(false);
  };

  const startChatWith = useCallback(
    async (member: { userId: string; firstName: string; pseudo?: string; photoUrl?: string }) => {
      setSheetMember(null);
      const existing = conversations.find((c) => c.participantId === member.userId);
      if (existing) return openConversation(existing.id);
      if (member.userId === myId) return;
      if (isFree && realPartnersCount >= FREE_MAX_PARTNERS) return setQuotaOpen(true);

      let conv: Conversation | null = null;
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: member.userId }),
        });
        if (res.status === 403) return setQuotaOpen(true);
        if (res.ok) conv = (await res.json()).conversation;
      } catch {}
      if (!conv) {
        conv = {
          id: `local_${member.userId}`,
          participantId: member.userId,
          firstName: member.firstName,
          pseudo: member.pseudo || member.firstName,
          photoUrl: member.photoUrl || "",
          lastMessage: "Nouvelle discussion",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
          isVerified: true,
        };
      }
      const finalConv = { ...conv, firstName: conv.firstName === "Membre" ? member.firstName : conv.firstName, photoUrl: conv.photoUrl || member.photoUrl || "" };
      setConversations((prev) => [finalConv, ...prev.filter((c) => c.id !== finalConv.id)]);
      openConversation(finalConv.id);
    },
    [conversations, isFree, realPartnersCount, myId]
  );

  // ?contact=… (depuis une fiche membre)
  useEffect(() => {
    if (!contactParam || !convsLoaded || contactHandled.current === contactParam) return;
    contactHandled.current = contactParam;
    const m = memberById[contactParam];
    startChatWith({ userId: contactParam, firstName: m?.firstName || "Membre", pseudo: m?.pseudo, photoUrl: m?.photoUrl });
  }, [contactParam, convsLoaded, memberById, startChatWith]);

  // ── Envoi ───────────────────────────────────────────────────
  const migrateConversationId = (oldId: string, newId: string) => {
    if (oldId === newId) return;
    setConversations((prev) => prev.map((c) => (c.id === oldId ? { ...c, id: newId } : c)));
    setMessagesByConv((prev) => {
      const { [oldId]: moved = [], ...rest } = prev;
      return { ...rest, [newId]: [...(rest[newId] || []), ...moved] };
    });
    setActiveConvId((cur) => (cur === oldId ? newId : cur));
  };

  const touchConversation = (convId: string, body: string) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === convId);
      if (!target) return prev;
      const updated = { ...target, lastMessage: body, lastMessageAt: new Date().toISOString(), lastMessageSenderId: myId };
      return [updated, ...prev.filter((c) => c.id !== convId)];
    });
  };

  const deliver = async (tmpId: string) => {
    const payload = pendingPayloads.current[tmpId];
    if (!payload) return;
    const { convId, body, mediaUrl } = payload;
    const setStatus = (status: ChatMessage["status"]) =>
      setMessagesByConv((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).map((m) => (m.id === tmpId ? { ...m, status } : m)),
      }));
    setStatus("PENDING");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, body, mediaUrl }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      delete pendingPayloads.current[tmpId];
      const saved = toChatMessage({ ...data.message, mediaUrl: data.message?.mediaUrl || mediaUrl });
      const realConvId: string = data.message?.conversationId || convId;
      setMessagesByConv((prev) => ({
        ...prev,
        [convId]: (prev[convId] || []).map((m) => (m.id === tmpId ? { ...saved, senderId: myId || saved.senderId } : m)),
      }));
      migrateConversationId(convId, realConvId);

      if (data.reply) {
        setPartnerTypingBot(true);
        setTimeout(() => {
          setPartnerTypingBot(false);
          setMessagesByConv((prev) => ({ ...prev, [realConvId]: [...(prev[realConvId] || []), toChatMessage(data.reply)] }));
          touchConversation(realConvId, data.reply.body);
        }, 1400);
      }
    } catch {
      setStatus("FAILED");
    }
  };

  const sendMessage = (body: string, mediaUrl?: string) => {
    if (!activeConv) return;
    const convId = activeConv.id;
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pendingPayloads.current[tmpId] = { convId, body, mediaUrl };
    const optimistic = { ...toChatMessage({ id: tmpId, senderId: myId || "me", body, mediaUrl, createdAt: new Date().toISOString() }), status: "PENDING" as const };
    setMessagesByConv((prev) => ({ ...prev, [convId]: [...(prev[convId] || []), optimistic] }));
    touchConversation(convId, previewText(body));
    deliver(tmpId);
  };

  const sendFile = async (file: File) => {
    if (file.type.startsWith("video/")) {
      if (file.size > MAX_VIDEO_BYTES) {
        setNotice("Vidéo trop lourde (3 Mo maximum). Envoyez une vidéo plus courte.");
        return;
      }
      sendMessage("🎥 Vidéo", await readAsDataUrl(file));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setNotice("Format non pris en charge. Envoyez une photo ou une vidéo.");
      return;
    }
    sendMessage("📷 Photo", await compressImage(file));
  };

  const sendVoice = (dataUrl: string, seconds: number) => {
    sendMessage(`🎙️ Note vocale (${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")})`, dataUrl);
  };

  const shareLocation = (label: string, lat: number, lng: number) => {
    setLocationOpen(false);
    sendMessage(`📍 ${label} (https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)})`);
  };

  // ── Appels ──────────────────────────────────────────────────
  const callPartner = (kind: "audio" | "video", conv: Conversation | null = activeConv) => {
    setMenuOpen(false);
    if (!conv) return;
    if (conv.participantId === VICTOIRE_ID) {
      setNotice("Victoire est l'hôtesse d'accueil du club : les appels sont disponibles avec les membres.");
      return;
    }
    if (!isVip) return setVipOpen(true);
    const m = memberById[conv.participantId];
    rt.startCall(
      { userId: conv.participantId, firstName: conv.firstName || m?.firstName || "Membre", photoUrl: conv.photoUrl || m?.photoUrl || null },
      kind,
      conv.id.startsWith("local_") ? undefined : conv.id
    );
  };

  // Mobile : la conversation reste fixée à l'écran, même clavier ouvert (iPhone & Android)
  useEffect(() => {
    if (mobileView !== "chat" || window.innerWidth > 768) return;
    const root = document.documentElement;
    const vv = window.visualViewport;
    const apply = () => {
      root.style.setProperty("--chat-height", `${Math.round(vv ? vv.height : window.innerHeight)}px`);
      root.style.setProperty("--chat-top", `${Math.round(vv ? vv.offsetTop : 0)}px`);
    };
    apply();
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("orientationchange", apply);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
      document.body.style.overflow = prevOverflow;
      root.style.removeProperty("--chat-height");
      root.style.removeProperty("--chat-top");
    };
  }, [mobileView]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(id);
  }, [notice]);

  // ── Données d'affichage ─────────────────────────────────────
  const unreadFor = (c: Conversation) => (c.id === activeConvId && chatVisible ? 0 : rt.unreadByConversation[c.id] ?? c.unreadCount ?? 0);

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.firstName.toLowerCase().includes(q) || c.pseudo?.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q);
  });

  const onlineMembers: Member[] = useMemo(() => {
    // Seuls les membres que mon plan me permet de voir (liste /api/profiles déjà filtrée),
    // ou ceux avec qui j'ai déjà une discussion
    return Object.values(rt.online)
      .filter((p) => p.userId !== myId)
      .filter((p) => memberById[p.userId] || conversations.some((c) => c.participantId === p.userId))
      .map((p) => {
        const m = memberById[p.userId];
        return m
          ? { ...m, photoUrl: m.photoUrl || p.photoUrl || "" }
          : { userId: p.userId, firstName: p.firstName, photoUrl: p.photoUrl || "", photos: [], city: p.city, plan: p.plan };
      })
      .sort((a, b) => (b.plan === "VIP" ? 1 : 0) - (a.plan === "VIP" ? 1 : 0));
  }, [rt.online, memberById, myId, conversations]);

  const filteredOnline = onlineMembers.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [m.firstName, m.pseudo, m.city, m.profession, m.bio].some((v) => v?.toLowerCase().includes(q));
  });

  const offlineSuggestions = members
    .filter((m) => m.userId !== myId && !rt.isOnline(m.userId) && m.userId !== VICTOIRE_ID)
    .slice(0, 12);

  const partnerMember: Member | null = activeConv
    ? memberById[activeConv.participantId] || {
        userId: activeConv.participantId,
        firstName: activeConv.firstName,
        pseudo: activeConv.pseudo,
        photoUrl: activeConv.photoUrl,
        photos: activeConv.photoUrl ? [{ url: activeConv.photoUrl, isMain: true }] : [],
      }
    : null;
  const partnerOnline = activeConv ? activeConv.participantId === VICTOIRE_ID || rt.isOnline(activeConv.participantId) : false;
  const partnerTyping = activeConv ? partnerTypingBot || isTyping(activeConv.id) : false;
  const partnerStatus = partnerTyping ? "écrit…" : partnerOnline ? "en ligne" : "hors ligne";

  // ── Non connecté ────────────────────────────────────────────
  if (authState === "out") {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.signedOut}>
          <div className={styles.signedOutCard}>
            <span className={styles.signedOutIcon}>
              <MessageCircle size={30} />
            </span>
            <h2>Votre messagerie Meet Me Club</h2>
            <p>Connectez-vous pour lire vos messages, voir qui est en ligne et discuter en toute sécurité.</p>
            <Link href="/connexion?callbackUrl=/messages" className={styles.primaryBtn}>
              Se connecter
            </Link>
            <Link href="/inscription" className={styles.secondaryBtn}>
              Créer un compte gratuit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Rendu ───────────────────────────────────────────────────
  let lastDay = "";

  return (
    <div className={styles.page}>
      <div className={mobileView === "chat" ? "hidden-on-mobile" : ""}>
        <Header />
      </div>

      <div className={`${styles.shell} ${mobileView === "chat" ? styles.shellChat : ""}`}>
        {/* ── Colonne gauche : discussions & membres en ligne ── */}
        <aside className={`${styles.sidebar} ${mobileView === "chat" ? styles.hideMobile : ""}`}>
          <div className={styles.sideHeader}>
            <div className={styles.sideTitleRow}>
              <h1>Discussions</h1>
              <div className={styles.sideMe}>
                {!isFree ? <PlanBadge plan={plan} /> : (
                  <Link href="/tarifs" className={styles.freePill}>
                    Gratuit · {Math.min(realPartnersCount, FREE_MAX_PARTNERS)}/{FREE_MAX_PARTNERS}
                  </Link>
                )}
                <Link href="/profil" aria-label="Mon profil">
                  <Avatar name={myProfile?.firstName || rt.me?.firstName || "Moi"} url={rt.me?.photoUrl || myProfile?.photos?.[0]?.url} size={36} />
                </Link>
              </div>
            </div>

            <label className={styles.searchBox}>
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === "chats" ? "Rechercher une discussion" : "Rechercher un membre en ligne"}
              />
            </label>

            <div className={styles.tabs} role="tablist">
              <button type="button" role="tab" aria-selected={tab === "chats"} className={tab === "chats" ? styles.tabActive : ""} onClick={() => setTab("chats")}>
                <MessageCircle size={16} /> Discussions
                {rt.unreadTotal > 0 && <span className={styles.tabBadge}>{rt.unreadTotal}</span>}
              </button>
              <button type="button" role="tab" aria-selected={tab === "online"} className={tab === "online" ? styles.tabActive : ""} onClick={() => setTab("online")}>
                <span className={styles.liveDot} /> En ligne
                <span className={styles.tabCount}>{onlineMembers.length}</span>
              </button>
            </div>
          </div>

          {rt.push.supported && rt.push.permission === "default" && (
            <button type="button" className={styles.pushStrip} onClick={() => rt.push.enable()}>
              <BellRing size={16} /> Activer les notifications sur ce téléphone
            </button>
          )}

          {tab === "chats" ? (
            <div className={styles.list}>
              {onlineMembers.length > 0 && !search && (
                <div className={styles.storyRow}>
                  {onlineMembers.slice(0, 15).map((m) => (
                    <button key={m.userId} type="button" className={styles.story} onClick={() => setSheetMember(m)}>
                      <Avatar name={m.firstName} url={m.photoUrl} size={54} online ring />
                      <span>{m.firstName}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredConversations.map((c) => {
                const unread = unreadFor(c);
                const typing = isTyping(c.id);
                const mineLast = c.lastMessageSenderId && c.lastMessageSenderId === myId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`${styles.convItem} ${c.id === activeConvId ? styles.convActive : ""}`}
                    onClick={() => openConversation(c.id)}
                  >
                    <Avatar name={c.firstName} url={c.photoUrl || memberById[c.participantId]?.photoUrl} size={52} online={c.participantId === VICTOIRE_ID || rt.isOnline(c.participantId)} />
                    <span className={styles.convBody}>
                      <span className={styles.convTop}>
                        <span className={styles.convName}>
                          {c.firstName}
                          {c.isVerified && <BadgeCheck size={14} className={styles.verified} />}
                        </span>
                        <span className={`${styles.convTime} ${unread ? styles.convTimeUnread : ""}`}>{formatListTime(c.lastMessageAt)}</span>
                      </span>
                      <span className={styles.convBottom}>
                        <span className={`${styles.convPreview} ${typing ? styles.convTyping : ""}`}>
                          {typing ? "écrit…" : `${mineLast ? "Vous : " : ""}${previewText(c.lastMessage)}`}
                        </span>
                        {unread > 0 && <span className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</span>}
                      </span>
                    </span>
                  </button>
                );
              })}

              {filteredConversations.length === 0 && <p className={styles.emptyList}>Aucune discussion trouvée.</p>}

              <button type="button" className={styles.fab} onClick={() => setTab("online")} aria-label="Nouvelle discussion">
                <MessageCirclePlus size={24} />
              </button>
            </div>
          ) : (
            <div className={styles.list}>
              <p className={styles.onlineIntro}>
                <span className={styles.liveDot} />
                {onlineMembers.length > 0
                  ? `${onlineMembers.length} membre${onlineMembers.length > 1 ? "s" : ""} connecté${onlineMembers.length > 1 ? "s" : ""} en ce moment`
                  : "Aucun autre membre connecté pour le moment"}
              </p>

              {filteredOnline.map((m) => (
                <MemberCard key={m.userId} member={m} online onOpen={() => setSheetMember(m)} onChat={() => startChatWith(m)} />
              ))}

              {offlineSuggestions.length > 0 && (
                <>
                  <p className={styles.sectionLabel}>
                    <Users size={14} /> Membres du club
                  </p>
                  {offlineSuggestions.map((m) => (
                    <MemberCard key={m.userId} member={m} online={false} onOpen={() => setSheetMember(m)} onChat={() => startChatWith(m)} />
                  ))}
                </>
              )}
            </div>
          )}
        </aside>

        {/* ── Colonne droite : conversation ── */}
        <main className={`${styles.chat} ${mobileView === "list" ? styles.hideMobile : ""}`}>
          {activeConv && partnerMember ? (
            <>
              <header className={styles.chatHeader}>
                <button type="button" className={`${styles.iconBtnLight} ${styles.backBtn}`} onClick={() => setMobileView("list")} aria-label="Retour aux discussions">
                  <ArrowLeft size={22} />
                </button>
                <button type="button" className={styles.chatPeer} onClick={() => setSheetMember(partnerMember)}>
                  <Avatar name={activeConv.firstName} url={activeConv.photoUrl || partnerMember.photoUrl} size={42} online={partnerOnline} />
                  <span className={styles.chatPeerText}>
                    <span className={styles.chatPeerName}>
                      {activeConv.firstName}
                      <BadgeCheck size={15} className={styles.verifiedLight} />
                    </span>
                    <span className={`${styles.chatPeerStatus} ${partnerTyping ? styles.statusTypingLight : ""}`}>{partnerStatus}</span>
                  </span>
                </button>
                <div className={styles.chatActions}>
                  <button type="button" className={styles.iconBtnLight} onClick={() => callPartner("video")} aria-label="Appel vidéo" title={isVip ? "Appel vidéo" : "Appel vidéo (Pass VIP)"}>
                    <Video size={22} />
                  </button>
                  <button type="button" className={styles.iconBtnLight} onClick={() => callPartner("audio")} aria-label="Appel vocal" title={isVip ? "Appel vocal" : "Appel vocal (Pass VIP)"}>
                    <Phone size={20} />
                  </button>
                  <div className={styles.menuWrap}>
                    <button type="button" className={styles.iconBtnLight} onClick={() => setMenuOpen((v) => !v)} aria-label="Plus d'options">
                      <MoreVertical size={21} />
                    </button>
                    {menuOpen && (
                      <div className={styles.menu} onMouseLeave={() => setMenuOpen(false)}>
                        <button type="button" onClick={() => { setSheetMember(partnerMember); setMenuOpen(false); }}>
                          <UserRound size={17} /> Voir le profil
                        </button>
                        <Link href={`/rendez-vous/nouveau?avec=${activeConv.participantId}`} onClick={() => setMenuOpen(false)}>
                          <CalendarHeart size={17} /> Proposer une sortie
                        </Link>
                        <button type="button" onClick={() => { setRulesOpen(true); setMenuOpen(false); }}>
                          <ShieldCheck size={17} /> Règles du chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </header>

              <div className={styles.thread} ref={scrollRef} onClick={() => setMenuOpen(false)}>
                <div className={styles.e2e}>
                  <Lock size={12} /> Vos échanges sont privés et protégés. Ne partagez jamais d&apos;argent.
                </div>

                {activeMessages.length === 0 && (
                  <div className={styles.emptyChat}>
                    <Avatar name={activeConv.firstName} url={activeConv.photoUrl || partnerMember.photoUrl} size={84} ring />
                    <h3>Dites bonjour à {activeConv.firstName} 👋</h3>
                    <p>Envoyez un premier message, une photo ou une note vocale pour faire connaissance.</p>
                  </div>
                )}

                {activeMessages.map((m) => {
                  const day = dayLabel(m.createdAt);
                  const showDay = day !== lastDay;
                  lastDay = day;
                  const mine = m.senderId === myId || m.senderId === "me" || (m.senderId !== activeConv.participantId && m.senderId !== VICTOIRE_ID);
                  return (
                    <div key={m.id}>
                      {showDay && <div className={styles.dayChip}>{day}</div>}
                      <MessageBubble
                        msg={m}
                        mine={mine}
                        partnerOnline={partnerOnline}
                        onOpenImage={setLightbox}
                        onRetry={m.status === "FAILED" ? () => deliver(m.id) : undefined}
                      />
                    </div>
                  );
                })}

                {partnerTyping && (
                  <div className={styles.row}>
                    <div className={`${styles.bubble} ${styles.bubbleTheirs} ${styles.typingBubble}`}>
                      <span /> <span /> <span />
                    </div>
                  </div>
                )}
              </div>

              <Composer
                blocked={false}
                onBlocked={() => setQuotaOpen(true)}
                onSendText={(text) => sendMessage(text)}
                onSendFile={sendFile}
                onSendVoice={sendVoice}
                onOpenLocation={() => setLocationOpen(true)}
                onTyping={() => activeConv.participantId !== VICTOIRE_ID && rt.sendTyping(activeConv.participantId, activeConv.id)}
              />
            </>
          ) : (
            <div className={styles.welcomePane}>
              <span className={styles.welcomeLogo}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-icon.png" alt="Meet Me Club" />
              </span>
              <h2>Meet Me Club · Messagerie</h2>
              <p>Choisissez une discussion ou un membre en ligne pour commencer à échanger.</p>
              <span className={styles.e2eInline}>
                <Lock size={13} /> Échanges privés et sécurisés
              </span>
            </div>
          )}
        </main>
      </div>

      {notice && <div className={styles.toastNotice}>{notice}</div>}

      {sheetMember && (
        <PartnerSheet
          member={sheetMember}
          online={sheetMember.userId === VICTOIRE_ID || rt.isOnline(sheetMember.userId)}
          onClose={() => setSheetMember(null)}
          onOpenImage={setLightbox}
          onMessage={sheetMember.userId !== myId ? () => startChatWith(sheetMember) : undefined}
          onCall={
            sheetMember.userId !== myId && sheetMember.userId !== VICTOIRE_ID
              ? (kind) => {
                  const conv = conversations.find((c) => c.participantId === sheetMember.userId);
                  setSheetMember(null);
                  if (!isVip) return setVipOpen(true);
                  rt.startCall({ userId: sheetMember.userId, firstName: sheetMember.firstName, photoUrl: sheetMember.photoUrl || null }, kind, conv?.id);
                }
              : undefined
          }
        />
      )}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
      {vipOpen && <VipModal onClose={() => setVipOpen(false)} />}
      {quotaOpen && <QuotaModal onClose={() => setQuotaOpen(false)} />}
      {locationOpen && <LocationModal onClose={() => setLocationOpen(false)} onShare={shareLocation} />}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </div>
  );
}

function MemberCard({ member, online, onOpen, onChat }: { member: Member; online: boolean; onOpen: () => void; onChat: () => void }) {
  return (
    <div className={styles.memberCard}>
      <button type="button" className={styles.memberMain} onClick={onOpen}>
        <Avatar name={member.firstName} url={member.photoUrl} size={56} online={online} />
        <span className={styles.memberInfo}>
          <span className={styles.memberName}>
            {member.firstName}
            {member.age ? `, ${member.age}` : ""}
            <PlanBadge plan={member.plan} />
          </span>
          <span className={styles.memberMeta}>
            <span className={online ? styles.statusOnline : styles.statusOffline}>{online ? "En ligne" : "Hors ligne"}</span>
            {member.city ? ` · ${member.city}` : ""}
            {member.profession ? ` · ${member.profession}` : ""}
          </span>
          {member.bio && <span className={styles.memberBio}>{member.bio}</span>}
        </span>
      </button>
      <button type="button" className={styles.chatBtn} onClick={onChat} aria-label={`Discuter avec ${member.firstName}`}>
        <MessageCircle size={20} />
        <span>Discuter</span>
      </button>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <MessagesApp />
    </Suspense>
  );
}
