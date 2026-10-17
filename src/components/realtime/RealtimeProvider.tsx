"use client";
// src/components/realtime/RealtimeProvider.tsx
// Couche temps réel globale : présence en ligne, messages non lus, notifications
// (in-app + téléphone) et appels audio/vidéo — disponible sur toutes les pages.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { BellRing, X } from "lucide-react";
import styles from "./realtime.module.css";
import { joinPresence, openInbox, removeChannel, sendToUser, type PresenceInfo } from "@/lib/realtime-client";
import { useCallManager, type CallKind, type CallPeer } from "./CallManager";
import { playMessageChime, unlockAudioOnFirstTouch } from "./tones";
import { SASPAY_LINKS } from "@/lib/subscription-constants";
import InactivityLock from "./InactivityLock";
import Celebration from "./Celebration";

export interface RealtimeMe {
  userId: string;
  firstName: string;
  photoUrl?: string | null;
  city?: string;
  plan?: string;
  /** Administrateur (vip_master) : accès à l'espace de gestion */
  isAdmin?: boolean;
}

type Listener = (event: string, payload: any) => void;

interface Toast {
  id: string;
  conversationId: string;
  title: string;
  body: string;
  photoUrl?: string;
  /** Page ouverte au toucher (sinon la conversation, ou le profil) */
  href?: string;
}

interface RealtimeContextValue {
  me: RealtimeMe | null;
  online: Record<string, PresenceInfo>;
  isOnline: (userId?: string | null) => boolean;
  unreadTotal: number;
  unreadByConversation: Record<string, number>;
  refreshUnread: () => Promise<void>;
  markConversationRead: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  subscribe: (listener: Listener) => () => void;
  sendTyping: (toUserId: string, conversationId: string) => void;
  startCall: (peer: CallPeer, kind: CallKind, conversationId?: string) => void;
  inCall: boolean;
  push: { supported: boolean; permission: NotificationPermission | "unsupported"; enable: () => Promise<boolean> };
  /** Administrateur : nombre de paiements à valider (pastille du menu Admin) */
  adminPending: number;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const NOOP_CONTEXT: RealtimeContextValue = {
  me: null,
  online: {},
  isOnline: () => false,
  unreadTotal: 0,
  unreadByConversation: {},
  refreshUnread: async () => {},
  markConversationRead: () => {},
  setActiveConversation: () => {},
  subscribe: () => () => {},
  sendTyping: () => {},
  startCall: () => {},
  inCall: false,
  push: { supported: false, permission: "unsupported", enable: async () => false },
  adminPending: 0,
};

export function useRealtime() {
  return useContext(RealtimeContext) || NOOP_CONTEXT;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

async function subscribeDeviceToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) return false;
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  return res.ok;
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<RealtimeMe | null>(null);
  const [online, setOnline] = useState<Record<string, PresenceInfo>>({});
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Animation de félicitations après activation d'un pass
  const [celebratePlan, setCelebratePlan] = useState<string | null>(null);
  useEffect(() => {
    const onCelebrate = (e: Event) => setCelebratePlan((e as CustomEvent).detail?.plan || "ESSENTIAL");
    window.addEventListener("mmc:celebrate", onCelebrate);
    return () => window.removeEventListener("mmc:celebrate", onCelebrate);
  }, []);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [pushBannerDismissed, setPushBannerDismissed] = useState(true);
  const listeners = useRef(new Set<Listener>());
  const activeConvRef = useRef<string | null>(null);
  const lastTypingSent = useRef<Record<string, number>>({});

  const pushSupported =
    typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

  // ── 1. Identité du membre connecté ───────────────────────────
  useEffect(() => {
    if (me) return;
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.authenticated || !data.user?.id) return;
        setMe({
          userId: data.user.id,
          firstName: data.user.firstName || "Membre",
          photoUrl: data.user.avatarUrl || null,
          city: data.user.city,
          plan: data.user.subscriptionTier,
          isAdmin: Boolean(data.user.isAdmin),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Re-vérifie après une navigation (ex. juste après la connexion)
  }, [pathname, me]);

  // Déconnexion → on coupe tout (les pages de connexion ne sont accessibles qu'hors session)
  useEffect(() => {
    if (pathname?.startsWith("/connexion") || pathname?.startsWith("/inscription")) setMe(null);
  }, [pathname]);

  const isOnline = useCallback((userId?: string | null) => Boolean(userId && online[userId]), [online]);

  const call = useCallManager(
    me ? { userId: me.userId, firstName: me.firstName, photoUrl: me.photoUrl } : null,
    isOnline
  );
  const handleSignalRef = useRef(call.handleSignal);
  useEffect(() => {
    handleSignalRef.current = call.handleSignal;
  }, [call.handleSignal]);

  // ── 2. Non-lus ───────────────────────────────────────────────
  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/unread", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, number> = { ...(data.byConversation || {}) };
      if (activeConvRef.current && document.visibilityState === "visible") delete map[activeConvRef.current];
      setUnreadByConversation(map);
    } catch {}
  }, []);

  // ── Administrateur : paiements à valider ─────────────────────
  const [adminPending, setAdminPending] = useState(0);
  const refreshAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard?summary=1", { cache: "no-store" });
      if (res.ok) setAdminPending((await res.json()).pendingPayments || 0);
    } catch {}
  }, []);
  const refreshAdminRef = useRef(refreshAdmin);
  useEffect(() => {
    refreshAdminRef.current = refreshAdmin;
  }, [refreshAdmin]);
  useEffect(() => {
    if (!me?.isAdmin) return;
    refreshAdmin();
    const id = setInterval(refreshAdmin, 60_000);
    return () => clearInterval(id);
  }, [me?.isAdmin, refreshAdmin, pathname]);

  const markConversationRead = useCallback((conversationId: string) => {
    setUnreadByConversation((prev) => {
      if (!prev[conversationId]) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    }).catch(() => {});
  }, []);

  const setActiveConversation = useCallback(
    (conversationId: string | null) => {
      activeConvRef.current = conversationId;
      if (conversationId) markConversationRead(conversationId);
    },
    [markConversationRead]
  );

  useEffect(() => {
    if (!me) return;
    refreshUnread();
    const id = setInterval(refreshUnread, 60_000);
    const onVisible = () => document.visibilityState === "visible" && refreshUnread();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [me, refreshUnread]);

  // Pastille sur l'icône de l'application (Android / ordinateur)
  const unreadTotal = useMemo(
    () => Object.values(unreadByConversation).reduce((s, n) => s + n, 0),
    [unreadByConversation]
  );
  useEffect(() => {
    try {
      const nav = navigator as any;
      const p = unreadTotal > 0 ? nav.setAppBadge?.(unreadTotal) : nav.clearAppBadge?.();
      p?.catch?.(() => {});
    } catch {}
  }, [unreadTotal]);

  // ── 3. Présence + boîte de réception temps réel ──────────────
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!me) return;
    let presence: RealtimeChannel | null = null;
    let inbox: RealtimeChannel | null = null;

    try {
    presence = joinPresence(
      { userId: me.userId, firstName: me.firstName, photoUrl: me.photoUrl, city: me.city, plan: me.plan },
      (state) => {
        const others = { ...state };
        delete others[me.userId];
        setOnline(others);
      }
    );

    inbox = openInbox(me.userId, (event, payload) => {
      try {
      if (event.startsWith("call-")) {
        handleSignalRef.current(event, payload);
      } else if (event === "admin-alert") {
        // Administrateur : tentative de paiement ou nouveau membre
        playMessageChime();
        refreshAdminRef.current();
        const toast: Toast = {
          id: `admin-${Date.now()}`,
          conversationId: "",
          title: payload?.title || "Alerte administrateur",
          body: "Touchez pour ouvrir l'espace de gestion",
          href: payload?.url || "/admin",
        };
        setToasts((prev) => [...prev, toast].slice(-3));
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 9000);
      } else if (event === "like") {
        playMessageChime();
        const toast: Toast = {
          id: `like-${Date.now()}`,
          conversationId: "",
          title: payload?.isMatch ? "💞 C'est réciproque !" : "❤️ Nouveau like",
          body: `${payload?.fromName || "Un membre"} a aimé votre profil`,
        };
        setToasts((prev) => [...prev, toast].slice(-3));
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 6000);
      } else if (event === "plan-activated") {
        // Paiement confirmé par SasPay : le nouveau pass s'affiche immédiatement
        setMe((m) => (m ? { ...m, plan: payload?.plan || m.plan } : m));
        setCelebratePlan(payload?.plan || "ESSENTIAL");
      } else if (event === "message") {
        const convId = payload?.conversationId as string;
        const viewing =
          convId &&
          activeConvRef.current === convId &&
          document.visibilityState === "visible" &&
          pathnameRef.current?.startsWith("/messages");
        if (viewing) {
          markConversationRead(convId);
        } else if (convId) {
          setUnreadByConversation((prev) => ({ ...prev, [convId]: (prev[convId] || 0) + 1 }));
          playMessageChime();
          if (document.visibilityState === "visible") {
            const toast: Toast = {
              id: `${payload.messageId || Date.now()}`,
              conversationId: convId,
              title: payload.senderName || "Nouveau message",
              body: "vous a envoyé un message",
              photoUrl: payload.senderPhoto,
            };
            setToasts((prev) => [...prev.filter((t) => t.conversationId !== convId), toast].slice(-3));
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 6000);
          }
        }
      }
      listeners.current.forEach((l) => l(event, payload));
      } catch (err) {
        console.warn("[realtime] event", event, err);
      }
    });
    } catch (err) {
      // Le temps réel ne doit jamais empêcher l'affichage du site
      console.warn("[realtime] connexion impossible", err);
    }

    return () => {
      removeChannel(presence);
      removeChannel(inbox);
      setOnline({});
    };
  }, [me, markConversationRead]);

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const sendTyping = useCallback(
    (toUserId: string, conversationId: string) => {
      if (!me || !toUserId) return;
      const now = Date.now();
      if (now - (lastTypingSent.current[conversationId] || 0) < 2500) return;
      lastTypingSent.current[conversationId] = now;
      sendToUser(toUserId, "typing", { conversationId, userId: me.userId });
    },
    [me]
  );

  // Paiement d'un pass : la page de paiement s'ouvre à côté et l'application affiche
  // directement l'activation du plan choisi (retour fluide après paiement)
  useEffect(() => {
    const planByLink: Record<string, string> = {};
    for (const [plan, url] of Object.entries(SASPAY_LINKS)) planByLink[url] = plan;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='https://link.saspay.me/']") as HTMLAnchorElement | null;
      if (!a) return;
      const plan = planByLink[a.href.replace(/\/$/, "")] || planByLink[a.href];
      if (!plan) return;
      e.preventDefault();
      // Retenir qui paie quel pass : le paiement reçu juste après lui sera attribué automatiquement
      fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
        keepalive: true,
      }).catch(() => {});
      window.open(a.href, "_blank", "noopener");
      router.push(`/paiement/activation?plan=${plan}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // Son des notifications autorisé dès le premier toucher (exigence des téléphones)
  useEffect(() => {
    unlockAudioOnFirstTouch();
  }, []);

  // Toucher une notification alors que l'application est déjà ouverte → aller à la conversation
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onSwMessage = (e: MessageEvent) => {
      if (e.data?.type !== "mmc:navigate" || typeof e.data.url !== "string") return;
      try {
        const url = new URL(e.data.url, window.location.origin);
        if (url.origin === window.location.origin) router.push(url.pathname + url.search);
      } catch {}
    };
    navigator.serviceWorker.addEventListener("message", onSwMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onSwMessage);
  }, [router]);

  // ── 4. Notifications téléphone (Web Push) ────────────────────
  useEffect(() => {
    if (!me || !pushSupported) return;
    setPushPermission(Notification.permission);
    // Invitation ignorée → proposée à nouveau 3 jours plus tard
    let dismissed = false;
    try {
      const at = Number(localStorage.getItem("mmc_push_banner_dismissed_at") || 0);
      dismissed = Date.now() - at < 3 * 24 * 3600 * 1000;
    } catch {}
    setPushBannerDismissed(dismissed);
    // Appareil déjà autorisé : on (ré)associe l'abonnement au membre connecté
    if (Notification.permission === "granted") subscribeDeviceToPush().catch(() => {});
  }, [me, pushSupported]);

  // « Je suis en ligne » : prévient mes interlocuteurs (au plus toutes les 6 h, géré par le serveur)
  useEffect(() => {
    if (!me) return;
    try {
      if (sessionStorage.getItem("mmc_online_pinged") === me.userId) return;
      sessionStorage.setItem("mmc_online_pinged", me.userId);
    } catch {}
    fetch("/api/presence/online", { method: "POST" }).catch(() => {});
  }, [me]);

  const enablePush = useCallback(async () => {
    if (!pushSupported) return false;
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission !== "granted") return false;
    try {
      return await subscribeDeviceToPush();
    } catch (err) {
      console.warn("[push] subscribe failed", err);
      return false;
    }
  }, [pushSupported]);

  const dismissPushBanner = () => {
    setPushBannerDismissed(true);
    try {
      localStorage.setItem("mmc_push_banner_dismissed_at", Date.now().toString());
    } catch {}
  };

  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true);
  const showPushBanner =
    Boolean(me) &&
    !pushBannerDismissed &&
    !pathname?.startsWith("/messages") && // la messagerie a sa propre invite, sans masquer la saisie
    !pathname?.startsWith("/onboarding") &&
    ((pushSupported && pushPermission === "default") || (isIos && !isStandalone && !pushSupported));

  const value: RealtimeContextValue = {
    me,
    online,
    isOnline,
    unreadTotal,
    unreadByConversation,
    refreshUnread,
    markConversationRead,
    setActiveConversation,
    subscribe,
    sendTyping,
    startCall: call.startCall,
    inCall: call.inCall,
    push: { supported: pushSupported, permission: pushPermission, enable: enablePush },
    adminPending,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}

      {/* Toasts « nouveau message » */}
      {toasts.length > 0 && (
        <div className={styles.toastStack} aria-live="polite">
          {toasts.map((t) => (
            <button
              key={t.id}
              type="button"
              className={styles.toast}
              onClick={() => {
                setToasts((prev) => prev.filter((x) => x.id !== t.id));
                router.push(t.href || (t.conversationId ? `/messages?conv=${encodeURIComponent(t.conversationId)}` : "/profil"));
              }}
            >
              {t.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.photoUrl} alt="" className={styles.toastAvatar} />
              ) : (
                <span className={styles.toastAvatarFallback}>{t.title.charAt(0).toUpperCase()}</span>
              )}
              <span className={styles.toastText}>
                <strong>{t.title}</strong>
                <span>{t.body}</span>
              </span>
              <span className={styles.toastCta}>Lire</span>
            </button>
          ))}
        </div>
      )}

      {/* Invitation à activer les notifications sur le téléphone */}
      {showPushBanner && (
        <div className={styles.pushBanner} role="dialog" aria-label="Activer les notifications">
          <div className={styles.pushIcon}>
            <BellRing size={20} />
          </div>
          <div className={styles.pushText}>
            <strong>Ne manquez aucun message</strong>
            <span>
              {isIos && !isStandalone && !pushSupported
                ? "Sur iPhone : touchez Partager puis « Sur l'écran d'accueil », ouvrez l'app et activez les notifications."
                : "Recevez une notification sur votre téléphone à chaque message ou appel."}
            </span>
          </div>
          {pushSupported && (
            <button
              type="button"
              className={styles.pushBtn}
              onClick={async () => {
                await enablePush();
                dismissPushBanner();
              }}
            >
              Activer
            </button>
          )}
          <button type="button" className={styles.pushClose} onClick={dismissPushBanner} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
      )}

      {call.ui}

      {celebratePlan && (
        <Celebration
          plan={celebratePlan}
          onClose={() => {
            setCelebratePlan(null);
            // Le site entier se met à jour avec le nouveau statut
            window.location.href = "/profil";
          }}
        />
      )}

      {/* Verrouillage après 30 min d'inactivité (jamais pendant un appel) */}
      <InactivityLock active={Boolean(me)} paused={call.inCall} />
    </RealtimeContext.Provider>
  );
}
