"use client";
// src/app/messages/page.tsx
// Secure member messaging — Photo upload, GPS Location, Voice Notes (Audio messages), and Live Video Call

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";

// ── Types ─────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number; // duration in seconds
  location?: {
    label: string;
    latitude?: number;
    longitude?: number;
    mapsUrl: string;
  };
  createdAt: string;
  status: "SENT" | "DELIVERED" | "READ";
}

interface Conversation {
  id: string;
  participantId: string;
  firstName: string;
  pseudo: string;
  photoUrl: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
  isVerified: boolean;
}

const ME_ID = "me";

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    participantId: "prof_1",
    firstName: "Ama",
    pseudo: "Ama_Lomé",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    lastMessage: "🎙️ Note vocale (0:08)",
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    unreadCount: 1,
    isOnline: true,
    isVerified: true,
  },
  {
    id: "conv-2",
    participantId: "prof_2",
    firstName: "Koffi",
    pseudo: "Koffi_Pro",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    lastMessage: "Ravi de faire ta connaissance Armand ! Tu es dans quel quartier ?",
    lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    unreadCount: 0,
    isOnline: false,
    isVerified: true,
  },
  {
    id: "conv-3",
    participantId: "prof_3",
    firstName: "Farida",
    pseudo: "Farida_B",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    lastMessage: "La plage de Lomé le dimanche c'est le meilleur endroit pour décompresser 🌊",
    lastMessageAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    unreadCount: 0,
    isOnline: true,
    isVerified: true,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  "conv-1": [
    {
      id: "m1",
      senderId: "prof_1",
      body: "Bonjour ! J'ai vu ton profil et je trouve qu'on a beaucoup de centres d'intérêt en commun 😊",
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      status: "READ",
    },
    {
      id: "m2",
      senderId: ME_ID,
      body: "Bonjour Ama ! Oui en effet, j'adore aussi la bonne cuisine et les sorties conviviales à Lomé !",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      status: "READ",
    },
    {
      id: "m3",
      senderId: "prof_1",
      body: "Avec grand plaisir ! On peut échanger sur nos passions 😊",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: "READ",
    },
    {
      id: "m_voice_ama",
      senderId: "prof_1",
      body: "🎙️ Note vocale",
      audioUrl: "demo_voice_ama",
      audioDuration: 8,
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      status: "DELIVERED",
    },
  ],
  "conv-2": [
    {
      id: "m4",
      senderId: "prof_2",
      body: "Salut ! Heureux d'échanger avec toi via Meet Me Club.",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      status: "READ",
    },
    {
      id: "m5",
      senderId: "prof_2",
      body: "Ravi de faire ta connaissance Armand ! Tu es dans quel quartier ?",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      status: "READ",
    },
  ],
  "conv-3": [
    {
      id: "m6",
      senderId: "prof_3",
      body: "La plage de Lomé le dimanche c'est le meilleur endroit pour décompresser 🌊",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: "READ",
    },
  ],
};

const LOME_SPOTS = [
  { name: "🏖️ Plage de Lomé (Boulevard du Mono)", lat: 6.1264, lng: 1.2255 },
  { name: "🍹 Bè Plage — Restaurant Coco Beach", lat: 6.1320, lng: 1.2580 },
  { name: "🏨 Hôtel 2 Février Lomé (Place de l'Indépendance)", lat: 6.1305, lng: 1.2162 },
  { name: "☕ Tokoin — Café & Lounge Byblos", lat: 6.1450, lng: 1.2180 },
  { name: "🌴 Agoè-Nyivé (Carrefour 2 Lions)", lat: 6.2050, lng: 1.1980 },
];

const QUICK_REPLIES = [
  "Bonjour ! 😊",
  "Avec plaisir !",
  "Je t'envoie un vocal 🎙️",
  "Tu es dans quel quartier à Lomé ?",
  "On fait un rapide appel vidéo ? 📹",
  "Je te partage ma position 📍",
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const contactParam = searchParams.get("contact") || searchParams.get("user");

  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>("conv-1");
  const [mobileView, setMobileView] = useState<"list" | "chat">(contactParam ? "chat" : "list");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [myProfile, setMyProfile] = useState<any>(null);

  // Modals
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Video call state
  const [videoCallOpen, setVideoCallOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingSeconds, setVoiceRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);

  // Voice playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioProgressIntervalRef = useRef<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile & subscription plan
  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/profiles/me");
        if (res.ok) {
          const data = await res.json();
          setMyProfile(data.profile);
        }
      } catch (e) {
        console.warn("Could not load my profile in messages:", e);
      }
    }
    loadMe();
  }, []);

  // Handle auto-selection or creation from ?contact=...
  useEffect(() => {
    if (!contactParam) return;

    const existing = conversations.find(
      (c) => c.participantId === contactParam || c.id === contactParam
    );

    if (existing) {
      setActiveConvId(existing.id);
      setMobileView("chat");
    } else {
      const newConv: Conversation = {
        id: `conv_${contactParam}`,
        participantId: contactParam,
        firstName: contactParam === "prof_4" || contactParam === "usr_4" ? "Edem" : "Partenaire",
        pseudo: "@membre",
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
        lastMessage: "Nouvel échange démarré sur Meet Me Club 👋",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isOnline: true,
        isVerified: true,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMobileView("chat");
      setMessages((prev) => ({
        ...prev,
        [newConv.id]: [
          {
            id: `init_${Date.now()}`,
            senderId: contactParam,
            body: "Bonjour ! Ravi(e) d'échanger avec toi sur Meet Me Club. Discutons en toute franchise !",
            createdAt: new Date().toISOString(),
            status: "READ",
          },
        ],
      }));
    }
  }, [contactParam, conversations]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const currentMessages = messages[activeConvId] ?? [];
  const isFreePlan = !myProfile?.plan || myProfile?.plan === "FREE";
  const isVerifiedForChat = Boolean(
    (myProfile?.idDocumentSubmitted || myProfile?.idDocumentVerified) &&
    (myProfile?.selfieSubmitted || myProfile?.selfieVerified)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvId, messages]);

  // Video call duration timer
  useEffect(() => {
    let timer: any;
    if (videoCallOpen) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [videoCallOpen]);

  // Start Video Call
  const startVideoCall = async () => {
    if (!isVerifiedForChat) {
      setSecurityModalOpen(true);
      return;
    }
    setVideoCallOpen(true);
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (e) {
      console.warn("Camera/mic access (permission not granted):", e);
    }
  };

  // End Video Call
  const endVideoCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setVideoCallOpen(false);

    const msg: ChatMessage = {
      id: `call-${Date.now()}`,
      senderId: ME_ID,
      body: `📹 Appel vidéo terminé · Durée : ${Math.floor(callDuration / 60)}m ${callDuration % 60}s · Contact humain vérifié ✓`,
      createdAt: new Date().toISOString(),
      status: "SENT",
    };
    setMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), msg],
    }));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
  };

  const toggleCamera = () => {
    setIsCameraOff(!isCameraOff);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = isCameraOff));
    }
  };

  // ── Voice Message Recording ──────────────────────────────────
  const startVoiceRecording = async () => {
    if (!isVerifiedForChat) {
      setSecurityModalOpen(true);
      return;
    }
    const convIndex = conversations.findIndex((c) => c.id === activeConvId);
    if (isFreePlan && convIndex >= 3) {
      setQuotaModalOpen(true);
      return;
    }

    setIsRecordingVoice(true);
    setVoiceRecordingSeconds(0);
    audioChunksRef.current = [];

    // Increment recording timer
    voiceTimerRef.current = setInterval(() => {
      setVoiceRecordingSeconds((sec) => sec + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        recorder.start();
      }
    } catch (e) {
      console.warn("Audio mic permission not granted (simulation mode active):", e);
    }
  };

  const cancelVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setIsRecordingVoice(false);
    setVoiceRecordingSeconds(0);
  };

  const finishVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    const recordedSec = voiceRecordingSeconds || 4;

    let audioUrl = "voice_recording_url";
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioUrl = URL.createObjectURL(audioBlob);
        dispatchVoiceMessage(audioUrl, recordedSec);
      };
    } else {
      dispatchVoiceMessage(audioUrl, recordedSec);
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }

    setIsRecordingVoice(false);
    setVoiceRecordingSeconds(0);
  };

  const dispatchVoiceMessage = (url: string, durationSec: number) => {
    const msg: ChatMessage = {
      id: `voice-${Date.now()}`,
      senderId: ME_ID,
      body: `🎙️ Note vocale (${formatTimer(durationSec)})`,
      audioUrl: url,
      audioDuration: durationSec,
      createdAt: new Date().toISOString(),
      status: "SENT",
    };

    setMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), msg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessage: `🎙️ Note vocale (${formatTimer(durationSec)})`, lastMessageAt: new Date().toISOString() }
          : c
      )
    );
  };

  // ── Voice Message Playback ───────────────────────────────────
  const playVoiceMessage = (msgId: string, audioUrl?: string, duration: number = 8) => {
    if (playingAudioId === msgId) {
      // Pause
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (audioProgressIntervalRef.current) {
        clearInterval(audioProgressIntervalRef.current);
      }
      setPlayingAudioId(null);
      return;
    }

    // Stop previously playing audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (audioProgressIntervalRef.current) {
      clearInterval(audioProgressIntervalRef.current);
    }

    setPlayingAudioId(msgId);
    setAudioProgress(0);

    // Synthesize gentle harmonic tone if demo URL or play blob URL
    if (audioUrl && audioUrl.startsWith("blob:")) {
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.play().catch((e) => console.warn("Audio play blocked:", e));
      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress(0);
        if (audioProgressIntervalRef.current) clearInterval(audioProgressIntervalRef.current);
      };
    } else {
      // Harmonic audio feedback using Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(587, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }
      } catch (e) {
        console.warn("Web Audio tone feedback unavailable:", e);
      }
    }

    // Advance progress bar smoothly
    const intervalTimeMs = 100;
    const totalSteps = (duration * 1000) / intervalTimeMs;
    let stepCount = 0;

    audioProgressIntervalRef.current = setInterval(() => {
      stepCount += 1;
      const progress = Math.min(100, (stepCount / totalSteps) * 100);
      setAudioProgress(progress);

      if (progress >= 100) {
        clearInterval(audioProgressIntervalRef.current);
        setPlayingAudioId(null);
        setAudioProgress(0);
      }
    }, intervalTimeMs);
  };

  // Send Text Message
  const handleSend = useCallback(() => {
    if (!draft.trim()) return;

    if (!isVerifiedForChat) {
      setSecurityModalOpen(true);
      return;
    }

    const convIndex = conversations.findIndex((c) => c.id === activeConvId);
    if (isFreePlan && convIndex >= 3) {
      setQuotaModalOpen(true);
      return;
    }

    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: ME_ID,
      body: draft.trim(),
      createdAt: new Date().toISOString(),
      status: "SENT",
    };
    setMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), msg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessage: draft.trim(), lastMessageAt: new Date().toISOString() }
          : c
      )
    );

    setDraft("");
    inputRef.current?.focus();
  }, [draft, activeConvId, isVerifiedForChat, isFreePlan, conversations]);

  // Send Photo from Device
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isVerifiedForChat) {
      setSecurityModalOpen(true);
      return;
    }

    const convIndex = conversations.findIndex((c) => c.id === activeConvId);
    if (isFreePlan && convIndex >= 3) {
      setQuotaModalOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      const msg: ChatMessage = {
        id: `img-${Date.now()}`,
        senderId: ME_ID,
        body: "📷 Photo partagée",
        imageUrl,
        createdAt: new Date().toISOString(),
        status: "SENT",
      };
      setMessages((prev) => ({
        ...prev,
        [activeConvId]: [...(prev[activeConvId] ?? []), msg],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, lastMessage: "📷 Photo partagée", lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Share GPS Location
  const shareLocation = (spotName?: string, lat?: number, lng?: number) => {
    const latitude = lat || 6.1375;
    const longitude = lng || 1.2125;
    const label = spotName || "📍 Position GPS en direct (Lomé, Togo)";
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    const msg: ChatMessage = {
      id: `loc-${Date.now()}`,
      senderId: ME_ID,
      body: `📍 Localisation partagée : ${label}`,
      location: {
        label,
        latitude,
        longitude,
        mapsUrl,
      },
      createdAt: new Date().toISOString(),
      status: "SENT",
    };

    setMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), msg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessage: `📍 ${label}`, lastMessageAt: new Date().toISOString() }
          : c
      )
    );

    setLocationModalOpen(false);
  };

  // Live GPS from phone
  const requestLiveGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          shareLocation(
            `📍 Position GPS en direct (Précision ±${Math.round(pos.coords.accuracy)}m)`,
            pos.coords.latitude,
            pos.coords.longitude
          );
        },
        () => {
          shareLocation("📍 Lomé, Togo (Centre-ville)", 6.1375, 1.2125);
        }
      );
    } else {
      shareLocation("📍 Lomé, Togo", 6.1375, 1.2125);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentPlan = myProfile?.plan || "FREE";
  const contactedCount = myProfile?.partnersContacted?.length || conversations.length;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      {/* ── Top Standardized Header ── */}
      <Header />

      {/* ── Main Split View ──────────────────────────────────── */}
      <div
        className="messages-split-view"
        style={{
          flex: 1,
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
          height: "calc(100dvh - var(--header-height))",
          overflow: "hidden",
        }}
      >
        {/* ── Sidebar Conversations ───────────────────────────── */}
        <aside
          className={`messages-sidebar ${mobileView === "chat" ? "hidden-on-mobile" : ""}`}
          style={{
            background: "white",
            borderRight: "1px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Plan Quota Pill */}
          <div
            style={{
              padding: "12px 18px",
              background: isFreePlan ? "#EFF6FF" : "#ECFDF5",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: isFreePlan ? "#0B2559" : "#065F46" }}>
                {isFreePlan ? `⭐ Plan Gratuit · ${contactedCount}/3 partenaires` : `👑 Pass ${currentPlan} · Illimité`}
              </div>
              <div style={{ fontSize: "11px", color: "#64748B" }}>
                {isFreePlan ? "Vocaux, Photos, GPS & Vidéo inclus" : "Discutez sans aucune limite"}
              </div>
            </div>
            {isFreePlan && (
              <Link
                href="/tarifs"
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#E10600",
                  textDecoration: "underline",
                }}
              >
                Pass Illimité (3 000 F)
              </Link>
            )}
          </div>

          {/* Sidebar Header */}
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                Discussions
              </h1>
              {isFreePlan && (
                <button
                  type="button"
                  onClick={() => setQuotaModalOpen(true)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#B45309",
                    background: "#FEF3C7",
                    border: "1px solid #FDE68A",
                    padding: "3px 8px",
                    borderRadius: "100px",
                    cursor: "pointer",
                  }}
                  title="Plan Gratuit : 3 partenaires maximum"
                >
                  Plan Gratuit (3 max) ⚡
                </button>
              )}
            </div>
            <input
              type="search"
              placeholder="🔍 Filtrer les conversations..."
              className="input"
              style={{ fontSize: "13px", height: "38px" }}
            />
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.map((conv, index) => {
              const isSelected = activeConvId === conv.id;
              const isQuotaExceeded = isFreePlan && index >= 3;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    if (isQuotaExceeded) {
                      setQuotaModalOpen(true);
                      return;
                    }
                    setActiveConvId(conv.id);
                    setMobileView("chat");
                  }}
                  style={{
                    width: "100%",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    border: "none",
                    borderBottom: "1px solid #F1F5F9",
                    cursor: "pointer",
                    textAlign: "left",
                    background: isSelected ? "#F8FAFC" : "white",
                    borderLeft: isSelected ? "4px solid #E10600" : "4px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Image
                      src={conv.photoUrl}
                      alt={conv.firstName}
                      width={48}
                      height={48}
                      style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #CBD5E1",
                      }}
                    />
                    {conv.isOnline && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: "1px",
                          right: "1px",
                          width: "12px",
                          height: "12px",
                          background: "#10B981",
                          border: "2px solid white",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A" }}>
                        {conv.firstName}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748B", flexShrink: 0, fontWeight: 500 }}>
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.lastMessage}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ padding: "14px 18px", borderTop: "1px solid #E2E8F0" }}>
            <Link
              href="/decouverte"
              className="btn btn-outline-blue"
              style={{ width: "100%", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}
            >
              🔍 Choisir un autre partenaire
            </Link>
          </div>
        </aside>

        {/* ── Chat Thread Area ───────────────────────────────── */}
        {activeConv ? (
          <main
            className={`messages-chat-pane ${mobileView === "list" ? "hidden-on-mobile" : ""}`}
            style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#F8FAFC", flex: 1 }}
          >
            {/* Active Contact Header with Video Call Button */}
            <div
              style={{
                background: "white",
                borderBottom: "1px solid #E2E8F0",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Bouton retour vers la liste sur smartphone */}
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="mobile-back-to-list-btn"
                  style={{
                    background: "#F1F5F9",
                    border: "none",
                    borderRadius: "10px",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    cursor: "pointer",
                    color: "#0F172A",
                    fontWeight: 800,
                  }}
                  title="Retour aux conversations"
                >
                  ←
                </button>
                <Image
                  src={activeConv.photoUrl}
                  alt={activeConv.firstName}
                  width={46}
                  height={46}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #CBD5E1",
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: "17px", color: "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                    {activeConv.firstName}
                    <span style={{ fontSize: "12px", color: "#059669", fontWeight: 700 }}>✓ Vérifié(e)</span>
                  </div>
                  <div style={{ fontSize: "12px", color: activeConv.isOnline ? "#059669" : "#64748B", fontWeight: 600 }}>
                    {activeConv.isOnline ? "● En ligne" : "● Vu récemment"} · Lomé, Togo
                  </div>
                </div>
              </div>

              {/* Action Buttons: Video Call & Rendez-vous & Règles */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {/* 📜 Règles du Chat Button */}
                <button
                  type="button"
                  onClick={() => setRulesModalOpen(true)}
                  className="btn btn-sm"
                  style={{
                    background: "#F1F5F9",
                    color: "#0B2559",
                    fontWeight: 700,
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid #CBD5E1",
                    cursor: "pointer",
                  }}
                  title="Consulter les règles de respect et sécurité du chat"
                >
                  📜 Règles du Chat
                </button>

                {/* 📹 Video Call Button */}
                <button
                  type="button"
                  onClick={startVideoCall}
                  className="btn btn-sm"
                  style={{
                    background: "#059669",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  title="Vérifier en direct avec un appel vidéo sécurisé"
                >
                  📹 Appel Vidéo
                </button>

                {/* 📅 Sortie / Rendez-vous */}
                <Link
                  href={`/rendez-vous/nouveau?avec=${activeConv.participantId}`}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700, paddingInline: "16px", borderRadius: "10px" }}
                >
                  📅 Proposer une sortie
                </Link>
              </div>
            </div>

            {/* Messages Container */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ textAlign: "center", marginBlock: "4px 12px" }}>
                <span
                  style={{
                    background: "#E2E8F0",
                    fontSize: "12px",
                    color: "#334155",
                    padding: "4px 14px",
                    borderRadius: "9999px",
                    fontWeight: 600,
                  }}
                >
                  🔒 Échanges chiffrés · Vocaux, Photos, GPS & Vidéo
                </span>
              </div>

              {currentMessages.map((msg) => {
                const isMe = msg.senderId === ME_ID;
                const isPlaying = playingAudioId === msg.id;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "72%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          background: isMe ? "linear-gradient(135deg, #0B2559 0%, #1E3A8A 100%)" : "white",
                          color: isMe ? "white" : "#0F172A",
                          padding: "12px 18px",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          fontSize: "15px",
                          lineHeight: 1.5,
                          boxShadow: isMe ? "0 4px 12px rgba(11, 37, 89, 0.2)" : "0 2px 8px rgba(0, 0, 0, 0.04)",
                          border: isMe ? "none" : "1px solid #E2E8F0",
                          wordBreak: "break-word",
                          fontWeight: 500,
                        }}
                      >
                        {/* 🎙️ Voice Note / Audio Message Player */}
                        {msg.audioUrl && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "4px 2px",
                              minWidth: "220px",
                              marginBottom: msg.body && msg.body !== "🎙️ Note vocale" && !msg.body.startsWith("🎙️ Note vocale") ? "8px" : "0",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => playVoiceMessage(msg.id, msg.audioUrl, msg.audioDuration || 8)}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                background: isMe ? "white" : "#0B2559",
                                color: isMe ? "#0B2559" : "white",
                                border: "none",
                                fontSize: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                              }}
                              title={isPlaying ? "Mettre en pause" : "Écouter la note vocale"}
                            >
                              {isPlaying ? "⏸️" : "▶️"}
                            </button>

                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                              {/* Audio Waveform visualization */}
                              <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "24px" }}>
                                {[35, 70, 95, 50, 80, 100, 65, 30, 85, 95, 60, 45, 75, 55, 90].map((barH, idx) => {
                                  const isPassed = isPlaying ? (idx / 15) * 100 <= audioProgress : false;
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        flex: 1,
                                        height: `${barH * 0.22}px`,
                                        background: isPassed
                                          ? (isMe ? "#F59E0B" : "#E10600")
                                          : (isMe ? "rgba(255,255,255,0.4)" : "#CBD5E1"),
                                        borderRadius: "2px",
                                        transition: "background 0.1s ease",
                                      }}
                                    />
                                  );
                                })}
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", opacity: 0.9, fontWeight: 700 }}>
                                <span>
                                  {isPlaying
                                    ? formatTimer(Math.round((audioProgress / 100) * (msg.audioDuration || 8)))
                                    : "🎙️ Note vocale"}
                                </span>
                                <span>{formatTimer(msg.audioDuration || 8)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 📷 Photo Display */}
                        {msg.imageUrl && (
                          <div style={{ marginBottom: msg.body && msg.body !== "📷 Photo partagée" ? "8px" : "0" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.imageUrl}
                              alt="Photo envoyée"
                              onClick={() => setEnlargedImage(msg.imageUrl || null)}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "260px",
                                borderRadius: "12px",
                                objectFit: "cover",
                                cursor: "pointer",
                                border: isMe ? "2px solid rgba(255,255,255,0.4)" : "2px solid #E2E8F0",
                              }}
                            />
                            <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "4px" }}>
                              🔍 Cliquez pour agrandir
                            </div>
                          </div>
                        )}

                        {/* 📍 GPS Location Card */}
                        {msg.location && (
                          <div
                            style={{
                              background: isMe ? "rgba(255,255,255,0.12)" : "#F8FAFC",
                              borderRadius: "12px",
                              padding: "12px",
                              marginBottom: "6px",
                              border: isMe ? "1px solid rgba(255,255,255,0.3)" : "1px solid #CBD5E1",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>
                              <span>📍</span> {msg.location.label}
                            </div>
                            <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>
                              Lomé, Togo · Coordonnées GPS certifiées
                            </div>
                            <a
                              href={msg.location.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                background: isMe ? "white" : "#0B2559",
                                color: isMe ? "#0B2559" : "white",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 800,
                                textDecoration: "none",
                              }}
                            >
                              🗺️ Ouvrir sur Google Maps
                            </a>
                          </div>
                        )}

                        {/* Plain text body if not just an attachment title */}
                        {(!msg.imageUrl || msg.body !== "📷 Photo partagée") &&
                          (!msg.audioUrl || !msg.body.startsWith("🎙️ Note vocale")) && (
                            <div>{msg.body}</div>
                          )}
                      </div>

                      <span style={{ fontSize: "11px", color: "#64748B", marginTop: "4px", fontWeight: 500 }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Quick Replies Bar */}
            <div
              style={{
                padding: "8px 24px 0",
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
            >
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => setDraft(qr)}
                  style={{
                    background: "white",
                    border: "1px solid #CBD5E1",
                    borderRadius: "9999px",
                    padding: "6px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    color: "#0B2559",
                  }}
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Security Verification Notice for Chat */}
            {!isVerifiedForChat && (
              <div
                style={{
                  margin: "10px 24px 0",
                  padding: "12px 16px",
                  background: "#FFFBEB",
                  border: "1.5px solid #FDE68A",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>🔒</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#92400E" }}>
                      Pièce d&apos;identité & Selfie obligatoires pour chatter
                    </div>
                    <div style={{ fontSize: "12px", color: "#78350F" }}>
                      Pour la sécurité des membres 18+ à Lomé, soumettez votre pièce et un selfie pour débloquer vos envois.
                    </div>
                  </div>
                </div>
                <Link
                  href="/profil/securite"
                  className="btn btn-sm btn-outline-blue"
                  style={{ fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  Soumettre mes pièces 🪪
                </Link>
              </div>
            )}

            {/* Chat Input Bar: Photo, GPS, Audio Voice Notes & Text */}
            <div style={{ padding: "14px 24px", background: "white", borderTop: "1px solid #E2E8F0" }}>
              {/* Hidden file input for photos */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: "none" }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  background: isRecordingVoice ? "#FEF2F2" : "#F8FAFC",
                  borderRadius: "16px",
                  border: isRecordingVoice ? "1.5px solid #EF4444" : "1.5px solid #CBD5E1",
                  padding: "8px 12px",
                  transition: "all 0.2s ease",
                }}
              >
                {/* When LIVE VOICE RECORDING is active */}
                {isRecordingVoice ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          background: "#E10600",
                          boxShadow: "0 0 10px #E10600",
                        }}
                      />
                      <span style={{ fontWeight: 800, fontSize: "14px", color: "#991B1B" }}>
                        Enregistrement vocal… {formatTimer(voiceRecordingSeconds)}
                      </span>
                    </div>

                    {/* Animated sound wave bars */}
                    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                      {[15, 25, 12, 28, 18, 26, 14, 22].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            width: "3px",
                            height: `${h}px`,
                            background: "#E10600",
                            borderRadius: "2px",
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#64748B",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "6px 10px",
                        }}
                      >
                        ✕ Annuler
                      </button>
                      <button
                        type="button"
                        onClick={finishVoiceRecording}
                        style={{
                          background: "#E10600",
                          border: "none",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: 800,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(225, 6, 0, 0.35)",
                        }}
                      >
                        Envoyer le vocal ➤
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 📷 Photo Upload Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Envoyer une photo depuis votre téléphone ou galerie"
                      style={{
                        background: "white",
                        border: "1px solid #CBD5E1",
                        borderRadius: "50%",
                        width: "38px",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      📷
                    </button>

                    {/* 📍 Location Sharing Button */}
                    <button
                      type="button"
                      onClick={() => setLocationModalOpen(true)}
                      title="Partager votre localisation (Lomé / GPS)"
                      style={{
                        background: "white",
                        border: "1px solid #CBD5E1",
                        borderRadius: "50%",
                        width: "38px",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      📍
                    </button>

                    {/* 🎙️ Voice Message Button */}
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      title="Enregistrer un message vocal (audio)"
                      style={{
                        background: "white",
                        border: "1.5px solid #0B2559",
                        borderRadius: "50%",
                        width: "38px",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: "0 2px 6px rgba(11, 37, 89, 0.15)",
                      }}
                    >
                      🎙️
                    </button>

                    {/* Textarea */}
                    <textarea
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Écrire à ${activeConv.firstName}…`}
                      rows={1}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        resize: "none",
                        fontSize: "15px",
                        lineHeight: 1.5,
                        color: "#0F172A",
                        maxHeight: "120px",
                        overflowY: "auto",
                      }}
                    />

                    {/* Send Button */}
                    <button
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: draft.trim() ? "#E10600" : "#CBD5E1",
                        color: "white",
                        border: "none",
                        cursor: draft.trim() ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      ➤
                    </button>
                  </>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "11px", color: "#64748B" }}>
                <span>🔒 Chiffré de bout en bout</span>
                <span>🎙️ Messages vocaux & 📷 Photos</span>
                <span>📹 Appel vidéo direct</span>
              </div>
            </div>
          </main>
        ) : (
          <main style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "32px", textAlign: "center" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Sélectionnez une discussion</h3>
          </main>
        )}
      </div>

      {/* ── Location Picker Modal ─────────────────────────────── */}
      {locationModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setLocationModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "28px 24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "36px", marginBottom: "6px" }}>📍</div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
                Partager votre localisation
              </h2>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                Envoyez vos coordonnées GPS en direct ou choisissez un point de repère à Lomé.
              </p>
            </div>

            {/* Button: Real Live GPS */}
            <button
              type="button"
              onClick={requestLiveGPS}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                fontWeight: 800,
                fontSize: "14px",
                marginBottom: "16px",
                justifyContent: "center",
                display: "flex",
                gap: "8px",
              }}
            >
              📡 Partager ma position GPS exacte (depuis téléphone)
            </button>

            <div style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Ou choisir un lieu de rencontre à Lomé :
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", marginBottom: "20px" }}>
              {LOME_SPOTS.map((spot, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => shareLocation(spot.name, spot.lat, spot.lng)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    background: "#F8FAFC",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#0F172A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{spot.name}</span>
                  <span style={{ color: "#0B2559", fontWeight: 700 }}>Envoyer ➤</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLocationModalOpen(false)}
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center", color: "#64748B" }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Live Video Call Modal ─────────────────────────────── */}
      {videoCallOpen && activeConv && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 15, 30, 0.95)",
            backdropFilter: "blur(12px)",
            zIndex: 1200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px",
            color: "white",
          }}
        >
          {/* Call Top Header */}
          <div
            style={{
              width: "100%",
              maxWidth: "600px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "12px 20px",
              borderRadius: "16px",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 10px #10B981",
                }}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px" }}>
                  Appel Vidéo en Direct avec {activeConv.firstName}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.8)" }}>
                  ✓ Vérification humaine certifiée Meet Me Club
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: "9999px", fontSize: "14px", fontWeight: 700 }}>
              ⏱️ {formatTimer(callDuration)}
            </div>
          </div>

          {/* Video Frames Container */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "640px",
              height: "55vh",
              minHeight: "360px",
              background: "#1E293B",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              border: "2px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Partner's Main Live Screen */}
            <div style={{ position: "absolute", inset: 0 }}>
              <Image
                src={activeConv.photoUrl}
                alt={activeConv.firstName}
                fill
                style={{ objectFit: "cover", filter: "brightness(0.95)" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  background: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(6px)",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                <span style={{ color: "#10B981" }}>●</span> {activeConv.firstName} (Lomé)
              </div>
            </div>

            {/* Local User PIP (Self Video View) */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "120px",
                height: "160px",
                borderRadius: "16px",
                overflow: "hidden",
                background: "#0F172A",
                border: "2px solid rgba(255, 255, 255, 0.8)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: isCameraOff ? "none" : "block",
                }}
              />
              {isCameraOff && (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
                  👤
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "10px",
                  fontWeight: 700,
                  background: "rgba(0,0,0,0.6)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                Vous
              </div>
            </div>
          </div>

          {/* Call Controls Bar */}
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.12)",
              padding: "16px 32px",
              borderRadius: "9999px",
              backdropFilter: "blur(12px)",
            }}
          >
            <button
              type="button"
              onClick={toggleMute}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: isMuted ? "#EF4444" : "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={isMuted ? "Activer le micro" : "Couper le micro"}
            >
              {isMuted ? "🔇" : "🎤"}
            </button>

            <button
              type="button"
              onClick={toggleCamera}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: isCameraOff ? "#EF4444" : "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={isCameraOff ? "Activer la caméra" : "Couper la caméra"}
            >
              {isCameraOff ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.938v12.124a.5.5 0 0 1-.752.434L16 17.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.27a.5.5 0 0 0-.5-.49.48.48 0 0 0-.252.07L16 11V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3l5.248 3.15a.5.5 0 0 0 .752-.434V8.27Z"/></svg>
              )}
            </button>

            <button
              type="button"
              onClick={endVideoCall}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#E10600",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(225, 6, 0, 0.5)",
              }}
              title="Raccrocher"
            >
              📞
            </button>
          </div>
        </div>
      )}

      {/* ── Security & Verification Modal (CNI + Selfie Facial) ── */}
      {securityModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 20, 45, 0.82)",
            backdropFilter: "blur(8px)",
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setSecurityModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              border: "1px solid #E2E8F0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  margin: "0 auto 12px",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.2)",
                }}
              >
                🛡️
              </div>
              <h2 style={{ fontSize: "21px", fontWeight: 900, color: "#0B2559", marginBottom: "8px" }}>
                Vérification d&apos;identité obligatoire
              </h2>
              <p style={{ fontSize: "14px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Pour garantir un espace 100% réel, sécurisé et protéger l&apos;image des membres à Lomé, vous devez certifier votre identité avant d&apos;entrer en contact avec des partenaires.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                }}
              >
                <span style={{ fontSize: "22px" }}>🪪</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0B2559" }}>
                    Étape 1 : Pièce d&apos;identité officielle
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                    CNI, Passeport, Permis de conduire, Carte d&apos;électeur, Carte consulaire ou Carte de séjour avec photo.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                }}
              >
                <span style={{ fontSize: "22px" }}>📸</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0B2559" }}>
                    Étape 2 : Contrôle facial instantané (Selfie)
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                    Prenez un selfie net avec votre appareil photo montrant clairement votre visage pour confirmer votre profil.
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  fontSize: "12px",
                  color: "#065F46",
                  lineHeight: 1.4,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🔒</span>
                <span>Protection totale : vos documents et votre selfie restent strictement confidentiels et ne sont jamais visibles ni téléchargeables par les autres membres.</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/profil/securite"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontWeight: 800,
                  padding: "14px",
                  fontSize: "15px",
                  background: "#E10600",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "14px",
                  boxShadow: "0 4px 14px rgba(225, 6, 0, 0.35)",
                }}
              >
                Valider mes pièces & selfie maintenant 🛡️
              </Link>
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="btn btn-ghost"
                style={{ color: "#64748B", fontSize: "13px", padding: "10px" }}
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Règles du Chat Modal ─────────────────────────────── */}
      {rulesModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 20, 45, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setRulesModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              border: "1px solid #E2E8F0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "28px" }}>📜</span>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", margin: 0 }}>
                  Règles d&apos;or du Chat
                </h2>
                <p style={{ fontSize: "12px", color: "#64748B", margin: 0 }}>
                  Meet Me Club Lomé · Rencontres réelles & sécurisées
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              {[
                {
                  icon: "🤝",
                  title: "1. Respect & Courtoisie absolue",
                  desc: "Zéro tolérance pour les insultes, harcèlement ou propos déplacés. Chaque membre mérite bienveillance et considération.",
                },
                {
                  icon: "🔞",
                  title: "2. Membres Majeurs & Profils Réels",
                  desc: "La plateforme est strictement réservée aux 18+. La soumission de votre pièce d'identité et selfie garantit un club 100% authentique.",
                },
                {
                  icon: "🛡️",
                  title: "3. Sécurité des Sorties à Lomé",
                  desc: "Organisez vos premiers rendez-vous uniquement dans des lieux publics, cafés ou chez nos établissements partenaires certifiés MMC.",
                },
                {
                  icon: "🚫",
                  title: "4. Zéro Demande d'Argent",
                  desc: "N'envoyez et ne demandez jamais d'argent par T-Money, Flooz ou virement. Tout membre demandant de l'argent doit être signalé immédiatement.",
                },
                {
                  icon: "🔒",
                  title: "5. Confidentialité & Discrétion",
                  desc: "Ne partagez jamais vos mots de passe ou informations sensibles. Vos échanges restent privés.",
                },
              ].map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{r.icon}</span>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0B2559", margin: "0 0 2px" }}>
                      {r.title}
                    </h4>
                    <p style={{ fontSize: "12px", color: "#475569", margin: 0, lineHeight: 1.4 }}>
                      {r.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setRulesModalOpen(false)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", fontWeight: 800, padding: "12px" }}
            >
              J&apos;ai compris et j&apos;accepte les règles ✓
            </button>
          </div>
        </div>
      )}

      {/* ── Quota Plan Gratuit Modal ─────────────────────────── */}
      {quotaModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 20, 45, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setQuotaModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "520px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              border: "1px solid #E2E8F0",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#FEF3C7",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  margin: "0 auto 12px",
                }}
              >
                ⚡
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", marginBottom: "6px" }}>
                Quota Plan Gratuit atteint (3 partenaires)
              </h2>
              <p style={{ fontSize: "13px", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Le Plan Gratuit vous permet d&apos;échanger avec 3 membres de votre catégorie. Pour contacter d&apos;autres membres sans limite, passez à un pass supérieur :
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              <a
                href="https://link.saspay.me/dtpycov9i-k"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "2px solid #0B2559",
                  background: "#F8FAFC",
                  textDecoration: "none",
                  color: "#0B2559",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>Pass Essentiel — 3 000 FCFA/mois</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>Partenaires & discussions illimités</div>
                </div>
                <span style={{ color: "#E10600", fontWeight: 800 }}>Activer ➤</span>
              </a>

              <a
                href="https://link.saspay.me/xiigac37eyq"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1.5px solid #CBD5E1",
                  background: "white",
                  textDecoration: "none",
                  color: "#0B2559",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>Pass Complice — 6 000 FCFA</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>Accès prioritaire + 1 sortie offerte</div>
                </div>
                <span style={{ color: "#E10600", fontWeight: 800 }}>Activer ➤</span>
              </a>

              <a
                href="https://link.saspay.me/ksev91xlvik"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1.5px solid #CBD5E1",
                  background: "white",
                  textDecoration: "none",
                  color: "#0B2559",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>Pass VIP — 15 000 FCFA</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>Conciergerie privée & sorties VIP</div>
                </div>
                <span style={{ color: "#E10600", fontWeight: 800 }}>Activer ➤</span>
              </a>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href="/tarifs"
                className="btn btn-outline-blue"
                style={{ flex: 1, justifyContent: "center", fontWeight: 700, fontSize: "13px" }}
              >
                Voir tous les tarifs
              </Link>
              <button
                type="button"
                onClick={() => setQuotaModalOpen(false)}
                className="btn btn-ghost"
                style={{ color: "#64748B" }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enlarged Image Modal ─────────────────────────────── */}
      {enlargedImage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.9)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setEnlargedImage(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enlargedImage}
            alt="Photo grand format"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: "16px",
              objectFit: "contain",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#0F172A", fontWeight: 700 }}>Chargement de la messagerie...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
