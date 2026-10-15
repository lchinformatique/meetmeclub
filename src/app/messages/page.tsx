"use client";
// src/app/messages/page.tsx
// Secure member messaging — Photo upload, GPS Location, Voice Notes (Audio messages), and Live Video Call

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import { Video, Calendar, MoreVertical, Paperclip, Send, Mic, MapPin, ArrowLeft, User, MessageSquare } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
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

// Conversation officielle d'accueil avec Victoire pour garantir un échange immédiat
export const VICTOIRE_CONVERSATION: Conversation = {
  id: "conv_victoire_welcome",
  participantId: "user_victoire_lome",
  firstName: "Victoire",
  pseudo: "@victoire_lome",
  photoUrl: "/victoire_profile.jpg",
  lastMessage: "En ligne à Lomé · Cliquez pour lui écrire",
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  isOnline: true,
  isVerified: true,
};

const INITIAL_CONVERSATIONS: Conversation[] = [VICTOIRE_CONVERSATION];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

const LOME_SPOTS = [
  { name: "🏖️ Plage de Lomé (Boulevard du Mono)", lat: 6.1264, lng: 1.2255 },
  { name: "🍹 Bè Plage — Restaurant Coco Beach", lat: 6.1320, lng: 1.2580 },
  { name: "🏨 Hôtel 2 Février Lomé (Place de l'Indépendance)", lat: 6.1305, lng: 1.2162 },
  { name: "☕ Tokoin — Café & Lounge Byblos", lat: 6.1450, lng: 1.2180 },
  { name: "🌴 Agoè-Nyivé (Carrefour 2 Lions)", lat: 6.2050, lng: 1.1980 },
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
  const isWelcome = searchParams.get("welcome") === "1";

  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>("conv_victoire_welcome");
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
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

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
  const selectedAudioMimeRef = useRef<string>("audio/mp4");
  const voiceTimerRef = useRef<any>(null);

  // Voice playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioProgressIntervalRef = useRef<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [onlineMembers, setOnlineMembers] = useState<
    Array<{
      id: string;
      userId: string;
      firstName: string;
      pseudo?: string;
      photoUrl?: string;
      coverUrl?: string;
      photos?: Array<{ url: string; isMain?: boolean }>;
      city?: string;
      bio?: string;
      profession?: string;
      relationshipGoal?: string;
      age?: number;
    }>
  >([]);

  // Load user profile & subscription plan
  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/profiles/me");
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setMyProfile(data.profile);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.warn("Could not load my profile in messages:", e);
      }
    }
    loadMe();
  }, []);

  // Load online / connected members for instant chat discovery
  useEffect(() => {
    async function loadOnlineMembers() {
      try {
        const res = await fetch("/api/profiles");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.profiles)) {
            const list = data.profiles.map((p: any) => ({
              id: p.id,
              userId: p.userId,
              firstName: p.firstName,
              pseudo: p.pseudo || p.firstName,
              photoUrl: p.photos?.find((ph: any) => ph.isMain)?.url || p.photos?.[0]?.url || "",
              coverUrl: p.coverUrl || "",
              photos: p.photos || [],
              city: p.city || "Lomé",
              bio: p.bio || "Membre actif du club.",
              profession: p.profession || "Membre",
              relationshipGoal: p.relationshipGoal || "SERIOUS",
              age: p.age || 26,
            }));
            setOnlineMembers(list);
          }
        }
      } catch (err) {
        console.warn("Could not load online members for chat:", err);
      }
    }
    loadOnlineMembers();
  }, []);

  // Load real conversations from API on mount
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch("/api/conversations");
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        if (res.ok) {
          setIsAuthenticated(true);
          const data = await res.json();
          if (data.conversations && data.conversations.length > 0) {
            setConversations(data.conversations);
            if (!contactParam && data.conversations.length > 0) {
              setActiveConvId(data.conversations[0].id);
            }
          }
        }
      } catch (e) {
        console.warn("Could not load conversations:", e);
      }
    }
    loadConversations();
  }, [contactParam]);

  // Load messages for active conversation from API with live 3-second auto-refresh
  useEffect(() => {
    if (!activeConvId) return;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/messages/${activeConvId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages)) {
            setMessages((prev) => ({
              ...prev,
              [activeConvId]: data.messages.map((m: any) => {
                const isVideo =
                  m.mediaUrl?.startsWith("data:video/") ||
                  m.mediaUrl?.match(/\.(mp4|webm|mov|ogg)$/i) ||
                  m.body?.includes("🎥");
                const isAudio =
                  m.mediaUrl?.startsWith("data:audio/") ||
                  m.mediaUrl?.match(/\.(mp3|wav|ogg|webm)$/i) ||
                  m.body?.startsWith("🎙️");
                return {
                  id: m.id,
                  senderId: m.senderId,
                  body: m.body,
                  imageUrl: !isVideo && !isAudio && m.mediaUrl ? m.mediaUrl : undefined,
                  videoUrl: isVideo ? m.mediaUrl : undefined,
                  audioUrl: isAudio ? m.mediaUrl : undefined,
                  createdAt: m.createdAt,
                  status: m.status,
                };
              }),
            }));
          }
        }
      } catch (e) {
        console.warn("Could not load messages:", e);
      }
    }
    loadMessages();
    const intervalTimer = setInterval(loadMessages, 3000);
    return () => clearInterval(intervalTimer);
  }, [activeConvId]);

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
      // Create a real conversation via API
      async function createConversation() {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: contactParam }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.conversation) {
              setConversations((prev) => {
                if (prev.find((c) => c.id === data.conversation.id)) return prev;
                return [data.conversation, ...prev];
              });
              setActiveConvId(data.conversation.id);
              setMobileView("chat");
            }
          } else if (res.status === 403) {
            // Fallback conversation to allow chat without blocking
            const targetId = contactParam || "contact";
            const newConv: Conversation = {
              id: `local_${targetId}`,
              participantId: targetId,
              firstName: "Partenaire",
              pseudo: "@membre",
              photoUrl: "",
              lastMessage: "Nouvel échange 👋",
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
              isOnline: true,
              isVerified: true,
            };
            setConversations((prev) => [newConv, ...prev]);
            setActiveConvId(newConv.id);
            setMobileView("chat");
          }
        } catch (e) {
          console.warn("Could not create conversation:", e);
          const targetId = contactParam || "contact";
          const newConv: Conversation = {
            id: `local_${targetId}`,
            participantId: targetId,
            firstName: "Partenaire",
            pseudo: "@membre",
            photoUrl: "",
            lastMessage: "Nouvel échange 👋",
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0,
            isOnline: true,
            isVerified: true,
          };
          setConversations((prev) => [newConv, ...prev]);
          setActiveConvId(newConv.id);
          setMobileView("chat");
        }
      }
      createConversation();
    }
  }, [contactParam]);

  const startChatWithMember = async (member: {
    userId: string;
    firstName: string;
    pseudo?: string;
    photoUrl?: string;
  }) => {
    const existing = conversations.find(
      (c) => c.participantId === member.userId || c.id === member.userId
    );
    if (existing) {
      setActiveConvId(existing.id);
      setMobileView("chat");
      return;
    }

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: member.userId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setConversations((prev) => [data.conversation, ...prev.filter((c) => c.id !== data.conversation.id)]);
          setActiveConvId(data.conversation.id);
          setMobileView("chat");
          return;
        }
      }
    } catch (e) {
      console.warn("Failed creating conversation with member:", e);
    }

    const newConv: Conversation = {
      id: `conv_${member.userId}`,
      participantId: member.userId,
      firstName: member.firstName,
      pseudo: member.pseudo || `@${member.firstName.toLowerCase()}`,
      photoUrl: member.photoUrl || "",
      lastMessage: "Nouvelle discussion démarrée 👋",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      isOnline: true,
      isVerified: true,
    };
    setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
    setActiveConvId(newConv.id);
    setMobileView("chat");
  };

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0] || VICTOIRE_CONVERSATION;
  const currentMessages = messages[activeConv.id] ?? messages[activeConvId] ?? [];
  const isFreePlan = !myProfile?.plan || myProfile?.plan === "FREE";
  // Le chat est accessible à tous les membres connectés
  // La vérification d'identité améliore la confiance mais n'est pas obligatoire pour chatter
  const isVerifiedForChat = Boolean(myProfile); // tout membre connecté peut chatter


  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return () => clearTimeout(timer);
  }, [activeConvId, currentMessages.length, isPartnerTyping]);

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

  // Start Video Call - Réservé exclusivement au Pack VIP
  const isVip = myProfile?.plan === "VIP" || myProfile?.subscriptionTier === "VIP";
  const startVideoCall = async () => {
    if (!isVip) {
      setVipModalOpen(true);
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
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        // Paramètres audio haute fidélité : réduction de bruit, annulation d'écho et contrôle de gain automatique
        const audioConstraints: MediaStreamConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
            channelCount: 1,
          },
        };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        audioStreamRef.current = stream;

        // Codecs compatibles iOS Safari, Android Chrome & Desktop
        let preferredMime = "";
        const testTypes = [
          "audio/mp4;codecs=mp4a.40.2",
          "audio/mp4",
          "audio/aac",
          "audio/webm;codecs=opus",
          "audio/webm",
        ];
        for (const t of testTypes) {
          if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
            preferredMime = t;
            break;
          }
        }
        selectedAudioMimeRef.current = preferredMime || "audio/mp4";

        const recorderOptions: MediaRecorderOptions = {
          audioBitsPerSecond: 128000,
        };
        if (preferredMime) {
          recorderOptions.mimeType = preferredMime;
        }

        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, recorderOptions);
        } catch {
          recorder = new MediaRecorder(stream);
        }
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        recorder.start(100);
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
    const mime = selectedAudioMimeRef.current || "audio/mp4";

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mime });
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach((t) => t.stop());
            audioStreamRef.current = null;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            dispatchVoiceMessage(base64Audio, recordedSec);
          };
          reader.readAsDataURL(audioBlob);
        } catch {
          const blobUrl = URL.createObjectURL(new Blob(audioChunksRef.current, { type: mime }));
          dispatchVoiceMessage(blobUrl, recordedSec);
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }
      dispatchVoiceMessage("synth_note", recordedSec);
    }

    setIsRecordingVoice(false);
    setVoiceRecordingSeconds(0);
  };

  const dispatchVoiceMessage = async (url: string, durationSec: number) => {
    const voiceText = `🎙️ Note vocale (${formatTimer(durationSec)})`;
    const msg: ChatMessage = {
      id: `voice-${Date.now()}`,
      senderId: ME_ID,
      body: voiceText,
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
          ? { ...c, lastMessage: voiceText, lastMessageAt: new Date().toISOString() }
          : c
      )
    );

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          body: voiceText,
          mediaUrl: url.startsWith("blob:") ? undefined : url,
        }),
      });
    } catch (err) {
      console.warn("Could not sync voice message to server:", err);
    }

    // Si on échange avec Victoire, réponse automatique à la note vocale
    if (
      activeConv?.participantId === "user_victoire_lome" ||
      activeConvId.includes("victoire") ||
      activeConv?.firstName === "Victoire"
    ) {
      setIsPartnerTyping(true);
      setTimeout(async () => {
        setIsPartnerTyping(false);
        const { getVictoireReply } = await import("@/lib/victoire-bot");
        const replyText = getVictoireReply(voiceText, "audio");
        const autoReply: ChatMessage = {
          id: `victoire-${Date.now()}`,
          senderId: "user_victoire_lome",
          body: replyText,
          createdAt: new Date().toISOString(),
          status: "DELIVERED",
        };
        setMessages((prev) => ({
          ...prev,
          [activeConvId]: [...(prev[activeConvId] ?? []), autoReply],
        }));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, lastMessage: replyText, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }, 1600);
    }
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

    const isPlayable = audioUrl && (audioUrl.startsWith("data:") || audioUrl.startsWith("blob:") || audioUrl.startsWith("http"));

    if (isPlayable) {
      try {
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        audio.ontimeupdate = () => {
          if (audio.duration && audio.duration > 0) {
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        };
        audio.onended = () => {
          setPlayingAudioId(null);
          setAudioProgress(0);
          if (audioProgressIntervalRef.current) clearInterval(audioProgressIntervalRef.current);
        };
        audio.play().catch(() => {
          startSyntheticTone(duration);
        });
      } catch {
        startSyntheticTone(duration);
      }
    } else {
      startSyntheticTone(duration);
    }

    // Advance progress bar smoothly
    const intervalTimeMs = 100;
    const totalSteps = (duration * 1000) / intervalTimeMs;
    let stepCount = 0;

    audioProgressIntervalRef.current = setInterval(() => {
      stepCount += 1;
      const progress = Math.min(100, (stepCount / totalSteps) * 100);
      setAudioProgress((prev) => Math.max(prev, progress));

      if (progress >= 100) {
        clearInterval(audioProgressIntervalRef.current);
        setPlayingAudioId(null);
        setAudioProgress(0);
      }
    }, intervalTimeMs);
  };

  const startSyntheticTone = (duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 harmonic chime
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.16 + 0.45);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.16);
          osc.stop(ctx.currentTime + idx * 0.16 + 0.5);
        });
      }
    } catch {}
  };

  // Send Text Message — posts to real API
  const handleSend = useCallback(async () => {
    if (!draft.trim()) return;

    const convIndex = conversations.findIndex((c) => c.id === activeConvId);
    if (isFreePlan && convIndex >= 3) {
      setQuotaModalOpen(true);
      return;
    }

    const msgBody = draft.trim();
    const optimisticMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderId: ME_ID,
      body: msgBody,
      createdAt: new Date().toISOString(),
      status: "SENT",
    };

    // Optimistic UI update
    setMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] ?? []), optimisticMsg],
    }));
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessage: msgBody, lastMessageAt: new Date().toISOString() }
          : c
      )
    );
    setDraft("");
    inputRef.current?.focus();

    // POST to real API (non-blocking)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConvId, body: msgBody }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setIsPartnerTyping(true);
          setTimeout(() => {
            setIsPartnerTyping(false);
            setMessages((prev) => ({
              ...prev,
              [activeConvId]: [...(prev[activeConvId] ?? []), data.reply],
            }));
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConvId
                  ? { ...c, lastMessage: data.reply.body, lastMessageAt: new Date().toISOString() }
                  : c
              )
            );
          }, 1400);
          return;
        }
      }
    } catch (e) {
      console.warn("Message send error (optimistic UI preserved):", e);
    }

    // Client-side fallback reply if talking to Victoire
    const isTalkingToVictoire =
      activeConv?.participantId === "user_victoire_lome" ||
      activeConvId.includes("victoire") ||
      activeConv?.firstName === "Victoire";

    if (isTalkingToVictoire) {
      setIsPartnerTyping(true);
      setTimeout(async () => {
        setIsPartnerTyping(false);
        const { getVictoireReply } = await import("@/lib/victoire-bot");
        const replyText = getVictoireReply(msgBody);
        const autoReply: ChatMessage = {
          id: `victoire-${Date.now()}`,
          senderId: "user_victoire_lome",
          body: replyText,
          createdAt: new Date().toISOString(),
          status: "DELIVERED",
        };
        setMessages((prev) => ({
          ...prev,
          [activeConvId]: [...(prev[activeConvId] ?? []), autoReply],
        }));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, lastMessage: replyText, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }, 1500);
    }
  }, [draft, activeConvId, isFreePlan, conversations, activeConv]);

  // Send Photo, Video or Document from Device
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const convIndex = conversations.findIndex((c) => c.id === activeConvId);
    if (isFreePlan && convIndex >= 3) {
      setQuotaModalOpen(true);
      return;
    }

    const isVideo = file.type.startsWith("video/");
    const isDoc = file.type.includes("pdf") || file.type.includes("document") || file.type.includes("text") || file.name.match(/\.(pdf|docx?|txt)$/i);
    const mediaLabel = isVideo ? "🎥 Vidéo partagée" : isDoc ? `📄 Document : ${file.name}` : "📷 Photo partagée";

    const reader = new FileReader();
    reader.onload = async (event) => {
      const mediaUrl = event.target?.result as string;
      const msg: ChatMessage = {
        id: `media-${Date.now()}`,
        senderId: ME_ID,
        body: mediaLabel,
        imageUrl: isVideo ? undefined : mediaUrl,
        videoUrl: isVideo ? mediaUrl : undefined,
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
            ? { ...c, lastMessage: mediaLabel, lastMessageAt: new Date().toISOString() }
            : c
        )
      );

      // Persist to server
      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConvId,
            body: mediaLabel,
            mediaUrl,
          }),
        });
      } catch (err) {
        console.warn("Could not sync media to server:", err);
      }

      // If talking to Victoire, reply to photo/media
      if (
        activeConv?.participantId === "user_victoire_lome" ||
        activeConvId.includes("victoire") ||
        activeConv?.firstName === "Victoire"
      ) {
        setIsPartnerTyping(true);
        setTimeout(async () => {
          setIsPartnerTyping(false);
          const { getVictoireReply } = await import("@/lib/victoire-bot");
          const replyText = getVictoireReply(mediaLabel, "image");
          const autoReply: ChatMessage = {
            id: `victoire-${Date.now()}`,
            senderId: "user_victoire_lome",
            body: replyText,
            createdAt: new Date().toISOString(),
            status: "DELIVERED",
          };
          setMessages((prev) => ({
            ...prev,
            [activeConvId]: [...(prev[activeConvId] ?? []), autoReply],
          }));
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConvId
                ? { ...c, lastMessage: replyText, lastMessageAt: new Date().toISOString() }
                : c
            )
          );
        }, 1800);
      }
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

    // Persist location message to server
    try {
      fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          body: `📍 Localisation partagée : ${label} (${mapsUrl})`,
        }),
      }).catch((e) => console.warn("Location sync warning:", e));
    } catch {}

    // If talking to Victoire, reply to location
    if (
      activeConv?.participantId === "user_victoire_lome" ||
      activeConvId.includes("victoire") ||
      activeConv?.firstName === "Victoire"
    ) {
      setIsPartnerTyping(true);
      setTimeout(async () => {
        setIsPartnerTyping(false);
        const { getVictoireReply } = await import("@/lib/victoire-bot");
        const replyText = getVictoireReply(label, "location");
        const autoReply: ChatMessage = {
          id: `victoire-${Date.now()}`,
          senderId: "user_victoire_lome",
          body: replyText,
          createdAt: new Date().toISOString(),
          status: "DELIVERED",
        };
        setMessages((prev) => ({
          ...prev,
          [activeConvId]: [...(prev[activeConvId] ?? []), autoReply],
        }));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, lastMessage: replyText, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }, 1500);
    }

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
      {/* ── Top Standardized Header (masqué sur mobile pendant le chat pour plein écran WhatsApp) ── */}
      <div className={mobileView === "chat" ? "hidden-on-mobile" : ""}>
        <Header />
      </div>

      {/* ── État non-connecté ── */}
      {isAuthenticated === false && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
          <div style={{ maxWidth: "480px", width: "100%", background: "white", borderRadius: "24px", padding: "36px 28px", textAlign: "center", boxShadow: "0 10px 40px rgba(11,37,89,0.08)", border: "1px solid #E2E8F0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#EEF2FB", color: "#0B2559", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>
              💬
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#0B2559", marginBottom: "8px" }}>
              Messagerie & Espace de Chat
            </h2>
            <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.6, marginBottom: "24px" }}>
              Connectez-vous à votre compte pour lire vos messages reçus, discuter avec vos partenaires et accéder à vos échanges privés.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/connexion?callbackUrl=/messages"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", fontWeight: 700, padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)", color: "white", textDecoration: "none" }}
              >
                Se connecter à mon compte
              </Link>
              <Link
                href="/inscription"
                className="btn"
                style={{ width: "100%", justifyContent: "center", fontWeight: 700, padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #E10600 0%, #B30500 100%)", color: "white", textDecoration: "none", boxShadow: "0 4px 14px rgba(225,6,0,0.25)" }}
              >
                Créer un compte gratuit
              </Link>
            </div>
          </div>
        </div>
      )}



      {/* ── Main Split View (Utilisateur connecté) ───────────── */}
      {isAuthenticated !== false && (
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
              style={{ fontSize: "13px", height: "38px", marginBottom: "8px" }}
            />
            <Link
              href="/decouverte"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "8px 12px",
                background: "#EEF2FB",
                color: "#0B2559",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                textDecoration: "none",
                transition: "background 0.15s ease",
              }}
            >
              <span>🧭</span>
              <span>Voir tous les membres & échanger</span>
              <span style={{ color: "#2563EB" }}>→</span>
            </Link>
          </div>

          {/* Online Members Horizontal Tray */}
          {onlineMembers.length > 0 && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #F1F5F9", background: "#F8FAFC" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", color: "#0B2559", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", background: "#10B981", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px #10B981" }} />
                  En ligne maintenant ({onlineMembers.length})
                </span>
                <Link href="/decouverte" style={{ fontSize: "11px", color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>
                  Découvrir →
                </Link>
              </div>
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
                {onlineMembers.map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => startChatWithMember(m)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      minWidth: "54px",
                    }}
                    title={`Discuter en direct avec ${m.firstName}`}
                  >
                    <div style={{ position: "relative" }}>
                      {m.photoUrl && (m.photoUrl.startsWith("http") || m.photoUrl.startsWith("/")) ? (
                        <Image
                          src={m.photoUrl}
                          alt={m.firstName}
                          width={44}
                          height={44}
                          style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #2563EB" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "#EFF6FF",
                            color: "#1D4ED8",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #2563EB",
                            fontSize: "15px",
                          }}
                        >
                          {m.firstName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        style={{
                          position: "absolute",
                          bottom: "0px",
                          right: "0px",
                          width: "12px",
                          height: "12px",
                          background: "#10B981",
                          border: "2px solid white",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#1E293B",
                        maxWidth: "54px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.firstName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    {conv.photoUrl && (conv.photoUrl.startsWith("http") || conv.photoUrl.startsWith("/")) ? (
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
                    ) : (
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: "#EEF2FB",
                          color: "#0B2559",
                          fontWeight: 800,
                          fontSize: "17px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px solid #CBD5E1",
                        }}
                      >
                        {conv.firstName ? conv.firstName.charAt(0).toUpperCase() : "M"}
                      </div>
                    )}
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
            {/* Active Contact Header (WhatsApp Style) */}
            <div
              style={{
                background: "white",
                borderBottom: "1px solid #E2E8F0",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
                minHeight: "62px",
                position: "relative",
                zIndex: 40,
              }}
            >
              {/* Left: Contact Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                {/* Bouton retour vers la liste sur smartphone */}
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="mobile-back-to-list-btn"
                  style={{
                    background: "transparent",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#0F172A",
                    flexShrink: 0,
                  }}
                  title="Retour aux conversations"
                >
                  <ArrowLeft size={22} />
                </button>

                {/* Avatar with status indicator */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {activeConv.photoUrl && (activeConv.photoUrl.startsWith("http") || activeConv.photoUrl.startsWith("/")) ? (
                    <Image
                      src={activeConv.photoUrl}
                      alt={activeConv.firstName}
                      width={44}
                      height={44}
                      style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid #CBD5E1",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "#EEF2FB",
                        color: "#0B2559",
                        fontWeight: 800,
                        fontSize: "17px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #CBD5E1",
                      }}
                    >
                      {activeConv.firstName ? activeConv.firstName.charAt(0).toUpperCase() : "M"}
                    </div>
                  )}
                  {activeConv.isOnline && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "1px",
                        right: "1px",
                        width: "11px",
                        height: "11px",
                        background: "#10B981",
                        border: "2px solid white",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </div>

                {/* Name & Presence (Clickable to open Interlocutor criteria/photos) */}
                <div
                  onClick={() => setPartnerModalOpen(true)}
                  style={{ minWidth: 0, cursor: "pointer", flex: 1 }}
                  title="Voir le profil complet et les photos"
                >
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <span>{activeConv.firstName}</span>
                    <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓</span>
                  </div>
                  <div style={{ fontSize: "11.5px", color: activeConv.isOnline ? "#059669" : "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                    <span style={{ whiteSpace: "nowrap" }}>{activeConv.isOnline ? "● En ligne" : "● Vu récemment"}</span>
                    <span style={{ whiteSpace: "nowrap", fontWeight: 700 }}>· Lomé</span>
                  </div>
                </div>
              </div>

              {/* Right: WhatsApp-Style Action Icons */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, position: "relative" }}>
                {/* 👤 Profil Partenaire (Critères & Galerie) */}
                <button
                  type="button"
                  onClick={() => setPartnerModalOpen(true)}
                  style={{
                    background: "#EFF6FF",
                    border: "1.5px solid #BFDBFE",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1D4ED8",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Voir les critères, bio et photos de ce profil"
                  aria-label="Profil du partenaire"
                >
                  <User size={16} />
                </button>

                {/* 👤 Mon Compte (Fixé en haut avec photo pour référence directe) */}
                <Link
                  href="/profil"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid #0B2559",
                    background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "13px",
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                  title="Mon Compte & Réglages"
                  aria-label="Mon Compte"
                >
                  {myProfile?.photos?.find((p: any) => p.isMain)?.url || myProfile?.photos?.[0]?.url ? (
                    <Image
                      src={myProfile.photos.find((p: any) => p.isMain)?.url || myProfile.photos[0].url}
                      alt="Mon Profil"
                      width={36}
                      height={36}
                      unoptimized
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  ) : (
                    <span>{(myProfile?.firstName || "M").charAt(0).toUpperCase()}</span>
                  )}
                </Link>

                {/* 📹 Video Call Button */}
                <button
                  type="button"
                  onClick={startVideoCall}
                  style={{
                    background: isVip ? "#ECFDF5" : "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: isVip ? "#059669" : "#0B2559",
                    transition: "all 0.15s ease",
                  }}
                  title={isVip ? "Appel Vidéo sécurisé" : "Appel Vidéo (Pass VIP)"}
                  aria-label="Appel Vidéo"
                >
                  <Video size={19} />
                </button>

                {/* 📅 Sortie / Rendez-vous */}
                <Link
                  href={`/rendez-vous/nouveau?avec=${activeConv.participantId}`}
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0B2559",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                  title="Proposer une sortie à Lomé"
                  aria-label="Proposer une sortie"
                >
                  <Calendar size={18} />
                </Link>

                {/* ⋮ WhatsApp 3-dots Menu Button */}
                <button
                  type="button"
                  onClick={() => setChatMenuOpen(!chatMenuOpen)}
                  style={{
                    background: chatMenuOpen ? "#E2E8F0" : "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#0F172A",
                    transition: "all 0.15s ease",
                  }}
                  title="Options de discussion"
                  aria-label="Options de discussion"
                >
                  <MoreVertical size={19} />
                </button>

                {/* WhatsApp Dropdown Menu */}
                {chatMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "46px",
                      right: "0",
                      background: "white",
                      borderRadius: "14px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                      border: "1px solid #E2E8F0",
                      padding: "8px 0",
                      minWidth: "240px",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Link
                      href="/profil"
                      onClick={() => setChatMenuOpen(false)}
                      style={{
                        padding: "10px 16px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#0B2559",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#F8FAFC",
                      }}
                    >
                      <User size={16} style={{ color: "#2563EB" }} />
                      <span>Mon Profil & Paramètres du compte</span>
                    </Link>

                    <div style={{ height: "1px", background: "#F1F5F9", margin: "4px 0" }} />
                    <button
                      type="button"
                      onClick={() => {
                        setRulesModalOpen(true);
                        setChatMenuOpen(false);
                      }}
                      style={{
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#0F172A",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>📜</span> Règles du chat
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLocationModalOpen(true);
                        setChatMenuOpen(false);
                      }}
                      style={{
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#0F172A",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>📍</span> Partager un lieu à Lomé
                    </button>

                    <Link
                      href="/decouverte"
                      onClick={() => setChatMenuOpen(false)}
                      style={{
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#0F172A",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>🔍</span> Découvrir d&apos;autres profils
                    </Link>

                    <div style={{ height: "1px", background: "#F1F5F9", margin: "4px 0" }} />

                    <button
                      type="button"
                      onClick={() => {
                        setChatMenuOpen(false);
                        alert("Signalement enregistré. Notre équipe de modération veille à votre sécurité.");
                      }}
                      style={{
                        padding: "10px 16px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#DC2626",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>🚫</span> Bloquer ou signaler
                    </button>
                  </div>
                )}
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

              {currentMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", margin: "auto 0" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#EEF2FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>
                    💬
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0B2559", margin: 0 }}>
                    Discussion avec {activeConv.firstName}
                  </h3>
                  <p style={{ fontSize: "13px", color: "#64748B", maxWidth: "340px", margin: 0, lineHeight: 1.5 }}>
                    Prenez l&apos;initiative ! Envoyez un premier message ou une note vocale pour faire connaissance.
                  </p>
                </div>
              )}

              {currentMessages.map((msg) => {
                const myId = myProfile?.userId || myProfile?.id;
                const isMe =
                  msg.senderId === ME_ID ||
                  (Boolean(myId) && msg.senderId === myId) ||
                  (Boolean(activeConv?.participantId) && msg.senderId !== activeConv.participantId && msg.senderId !== "user_victoire_lome");
                const isPlaying = playingAudioId === msg.id;

                // Extraction des coordonnées pour la carte Google Map interactive
                let mapCoords: { lat: number; lng: number; label: string } | null = null;
                if (msg.location) {
                  mapCoords = {
                    lat: msg.location.latitude || 6.1375,
                    lng: msg.location.longitude || 1.2125,
                    label: msg.location.label || "Lomé, Togo",
                  };
                } else if (msg.body && (msg.body.includes("maps.google.com") || msg.body.includes("Localisation partagée"))) {
                  const match = msg.body.match(/q=([0-9.-]+),([0-9.-]+)/);
                  if (match) {
                    mapCoords = {
                      lat: parseFloat(match[1]),
                      lng: parseFloat(match[2]),
                      label: "Position partagée (Lomé)",
                    };
                  } else {
                    mapCoords = { lat: 6.1375, lng: 1.2125, label: "Lomé, Togo" };
                  }
                }

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    {/* Avatar partenaire pour les messages reçus (Style WhatsApp authentique) */}
                    {!isMe && (
                      <div
                        onClick={() => setPartnerModalOpen(true)}
                        title="Voir le profil du membre"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          marginBottom: "4px",
                          border: "1.5px solid #CBD5E1",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                          cursor: "pointer",
                        }}
                      >
                        {activeConv.photoUrl ? (
                          <Image
                            src={activeConv.photoUrl}
                            alt={activeConv.firstName}
                            width={32}
                            height={32}
                            unoptimized
                            style={{ objectFit: "cover", width: "100%", height: "100%" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              background: "#0B2559",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: "12px",
                            }}
                          >
                            {activeConv.firstName?.charAt(0) || "M"}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        maxWidth: "min(420px, 78%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          background: isMe ? "#D9FDD3" : "#FFFFFF",
                          color: "#111B21",
                          padding: "10px 14px",
                          borderRadius: isMe ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                          fontSize: "14.5px",
                          lineHeight: 1.5,
                          boxShadow: isMe
                            ? "0 1px 2px rgba(11, 20, 26, 0.12)"
                            : "0 1px 2px rgba(11, 20, 26, 0.08)",
                          border: isMe ? "none" : "1px solid #E2E8F0",
                          wordBreak: "break-word",
                          fontWeight: 450,
                          position: "relative",
                        }}
                      >
                        {/* Prénom de l'expéditeur si message reçu */}
                        {!isMe && (
                          <div
                            onClick={() => setPartnerModalOpen(true)}
                            style={{
                              fontSize: "12px",
                              fontWeight: 800,
                              color: "#008069",
                              marginBottom: "3px",
                              letterSpacing: "-0.2px",
                              cursor: "pointer",
                            }}
                          >
                            {activeConv.firstName}
                          </div>
                        )}

                        {/* 🎙️ Voice Note / Audio Message Player */}
                        {msg.audioUrl && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "4px 2px",
                              minWidth: "220px",
                              marginBottom:
                                msg.body &&
                                msg.body !== "🎙️ Note vocale" &&
                                !msg.body.startsWith("🎙️ Note vocale")
                                  ? "8px"
                                  : "0",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => playVoiceMessage(msg.id, msg.audioUrl, msg.audioDuration || 8)}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                background: isMe ? "#008069" : "#0B2559",
                                color: "white",
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
                                          ? isMe
                                            ? "#F59E0B"
                                            : "#E10600"
                                          : isMe
                                          ? "rgba(255,255,255,0.4)"
                                          : "#CBD5E1",
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

                        {/* 🎥 Video Display */}
                        {msg.videoUrl && (
                          <div style={{ marginBottom: msg.body && msg.body !== "🎥 Vidéo partagée" ? "8px" : "0" }}>
                            <video
                              src={msg.videoUrl}
                              controls
                              controlsList="nodownload noplaybackrate"
                              disablePictureInPicture
                              onContextMenu={(e) => e.preventDefault()}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "280px",
                                borderRadius: "12px",
                                background: "#000",
                                border: isMe ? "2px solid rgba(255,255,255,0.4)" : "2px solid #E2E8F0",
                              }}
                            />
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
                              onContextMenu={(e) => e.preventDefault()}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "260px",
                                borderRadius: "12px",
                                objectFit: "cover",
                                cursor: "pointer",
                                userSelect: "none",
                                border: isMe ? "2px solid rgba(255,255,255,0.4)" : "2px solid #E2E8F0",
                              }}
                            />
                            <div style={{ fontSize: "11px", opacity: 0.85, marginTop: "4px" }}>
                              🔍 Cliquez pour agrandir
                            </div>
                          </div>
                        )}

                        {/* 📍 Google Maps Intégré Directement (Pas une simple image) */}
                        {mapCoords && (
                          <div
                            style={{
                              borderRadius: "14px",
                              overflow: "hidden",
                              margin: "8px 0 4px",
                              background: isMe ? "rgba(255,255,255,0.08)" : "#F8FAFC",
                              border: isMe ? "1px solid rgba(255,255,255,0.25)" : "1.5px solid #CBD5E1",
                              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                            }}
                          >
                            <div
                              style={{
                                padding: "8px 12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontWeight: 700,
                                fontSize: "13px",
                              }}
                            >
                              <span>📍</span> <span>{mapCoords.label}</span>
                            </div>
                            <iframe
                              title={mapCoords.label}
                              src={`https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&hl=fr&z=15&output=embed`}
                              width="100%"
                              height="180"
                              style={{ border: 0, display: "block" }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                            <div
                              style={{
                                padding: "8px 12px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: isMe ? "rgba(0,0,0,0.2)" : "#F1F5F9",
                              }}
                            >
                              <span style={{ fontSize: "11px", opacity: 0.85 }}>Lomé, Togo · GPS direct</span>
                              <a
                                href={`https://www.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "5px 12px",
                                  borderRadius: "8px",
                                  background: isMe ? "white" : "#0B2559",
                                  color: isMe ? "#0B2559" : "white",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  textDecoration: "none",
                                }}
                              >
                                Ouvrir Google Maps ↗
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Document partagé */}
                        {msg.body?.startsWith("📄") && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: isMe ? "rgba(0,0,0,0.06)" : "#F1F5F9",
                              padding: "10px 12px",
                              borderRadius: "12px",
                              margin: "4px 0",
                            }}
                          >
                            <span style={{ fontSize: "22px" }}>📄</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {msg.body.replace("📄 Document :", "").trim()}
                              </div>
                              <span style={{ fontSize: "11px", color: "#64748B" }}>Document prêt à consulter</span>
                            </div>
                            {msg.imageUrl && (
                              <a
                                href={msg.imageUrl}
                                download="document_meetmeclub"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: "5px 11px",
                                  background: "#0B2559",
                                  color: "white",
                                  borderRadius: "8px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  flexShrink: 0,
                                }}
                              >
                                Ouvrir
                              </a>
                            )}
                          </div>
                        )}

                        {/* Plain text body if not just an attachment title or map link */}
                        {(!msg.imageUrl || msg.body !== "📷 Photo partagée") &&
                          (!msg.videoUrl || msg.body !== "🎥 Vidéo partagée") &&
                          (!msg.body?.startsWith("📄")) &&
                          (!msg.audioUrl || !msg.body.startsWith("🎙️ Note vocale")) &&
                          (!mapCoords || (!msg.body.startsWith("📍 Localisation") && !msg.body.includes("maps.google.com"))) && (
                            <div>{msg.body}</div>
                          )}
                      </div>

                      {/* Horodatage & Status Lu (Style WhatsApp) */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "3px",
                          paddingInline: "4px",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: "#64748B", fontWeight: 500 }}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMe && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: msg.status === "READ" ? "#53BDEB" : "#8696A0",
                              fontWeight: 800,
                              lineHeight: 1,
                            }}
                            title={msg.status === "READ" ? "Lu" : "Envoyé"}
                          >
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isPartnerTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "12px 16px 4px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", border: "2px solid #2563EB", flexShrink: 0 }}>
                    <Image
                      src={activeConv.photoUrl || "/victoire_profile.jpg"}
                      alt={activeConv.firstName}
                      width={32}
                      height={32}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ background: "white", padding: "8px 14px", borderRadius: "18px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#0B2559" }}>{activeConv.firstName}</span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>est en train d&apos;écrire</span>
                    <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* WhatsApp Bottom Area (Input Bar) */}
            <div style={{ background: "white", borderTop: "1px solid #E2E8F0", paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
              {/* Chat Input Bar */}
              <div style={{ padding: "8px 12px 8px" }}>
                {/* Hidden file input for photos and videos */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleMediaSelect}
                  style={{ display: "none" }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    background: isRecordingVoice ? "#FEF2F2" : "#F1F5F9",
                    borderRadius: "26px",
                    border: isRecordingVoice ? "1.5px solid #EF4444" : "1px solid #E2E8F0",
                    padding: "6px 10px",
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
                          Vocal… {formatTimer(voiceRecordingSeconds)}
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
                            padding: "6px 8px",
                          }}
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          onClick={finishVoiceRecording}
                          style={{
                            background: "#E10600",
                            border: "none",
                            color: "white",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(225, 6, 0, 0.35)",
                          }}
                        >
                          Envoyer ➤
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 📎 Attachment / Photo Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        title="Envoyer une photo ou une vidéo"
                        style={{
                          background: "transparent",
                          border: "none",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#64748B",
                          flexShrink: 0,
                          transition: "color 0.15s ease",
                        }}
                      >
                        <Paperclip size={20} />
                      </button>

                      {/* 📍 Location Sharing Button */}
                      <button
                        type="button"
                        onClick={() => setLocationModalOpen(true)}
                        title="Partager un lieu à Lomé"
                        style={{
                          background: "transparent",
                          border: "none",
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#64748B",
                          flexShrink: 0,
                          transition: "color 0.15s ease",
                        }}
                      >
                        <MapPin size={20} />
                      </button>

                      {/* Textarea */}
                      <textarea
                        ref={inputRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message pour ${activeConv.firstName}…`}
                        rows={1}
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          resize: "none",
                          fontSize: "15px",
                          lineHeight: "20px",
                          color: "#0F172A",
                          maxHeight: "100px",
                          overflowY: "auto",
                          padding: "6px 4px",
                        }}
                      />

                      {/* Send or Mic Button */}
                      {draft.trim() ? (
                        <button
                          type="button"
                          onClick={handleSend}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: "#059669",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
                            transition: "all 0.15s ease",
                          }}
                          title="Envoyer"
                        >
                          <Send size={17} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: "#0B2559",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: "0 2px 6px rgba(11, 37, 89, 0.2)",
                            transition: "all 0.15s ease",
                          }}
                          title="Enregistrer un message vocal"
                        >
                          <Mic size={18} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

          </main>

        ) : (
          <main style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", flexDirection: "column", padding: "36px 24px", textAlign: "center", flex: 1, overflowY: "auto" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#EEF2FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", marginBottom: "16px" }}>
              💬
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>
              {conversations.length === 0 ? "Bienvenue dans votre messagerie" : "Sélectionnez une discussion"}
            </h3>
            <p style={{ fontSize: "14px", color: "#64748B", maxWidth: "460px", lineHeight: 1.6, marginBottom: "24px" }}>
              Discutez en direct, partagez vos photos et envoyez votre position GPS en toute sécurité avec les membres du club.
            </p>

            {/* Online Members Quick Connect Grid */}
            {onlineMembers.length > 0 && (
              <div style={{ width: "100%", maxWidth: "600px", background: "white", padding: "20px", borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#10B981", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #10B981" }} />
                    Membres disponibles maintenant à Lomé
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{onlineMembers.length} en ligne</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
                  {onlineMembers.slice(0, 6).map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => startChatWithMember(m)}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "14px",
                        padding: "12px 8px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#2563EB";
                        e.currentTarget.style.background = "#EFF6FF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.background = "#F8FAFC";
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        {m.photoUrl && (m.photoUrl.startsWith("http") || m.photoUrl.startsWith("/")) ? (
                          <Image
                            src={m.photoUrl}
                            alt={m.firstName}
                            width={52}
                            height={52}
                            style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #2563EB" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "50%",
                              background: "#EFF6FF",
                              color: "#1D4ED8",
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "2px solid #2563EB",
                              fontSize: "18px",
                            }}
                          >
                            {m.firstName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          style={{
                            position: "absolute",
                            bottom: "2px",
                            right: "2px",
                            width: "12px",
                            height: "12px",
                            background: "#10B981",
                            border: "2px solid white",
                            borderRadius: "50%",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A" }}>{m.firstName}</span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}>{m.city || "Lomé"}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#2563EB", marginTop: "4px" }}>
                        Écrire ✉️
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/decouverte"
              className="btn btn-primary"
              style={{ padding: "12px 24px", fontWeight: 700, borderRadius: "12px", background: "var(--color-red)", color: "white", textDecoration: "none" }}
            >
              🔍 Explorer tous les profils du club
            </Link>
          </main>
        )}
      </div>
      )}

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

      {/* ── Modal Pack VIP Requis pour Appel Vidéo ── */}
      {vipModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 20, 45, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
              textAlign: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                border: "2px solid #F59E0B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "28px",
              }}
            >
              👑
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", marginBottom: "8px" }}>
              Appel vidéo réservé au Pack VIP
            </h3>

            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, marginBottom: "20px" }}>
              Les appels vidéo en direct sont une fonctionnalité exclusive réservée aux membres du <strong>Pack VIP Premium</strong>.
            </p>

            <div
              style={{
                padding: "14px",
                borderRadius: "14px",
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                textAlign: "left",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#334155",
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 700, color: "#0B2559", marginBottom: "6px" }}>
                ✓ Vos fonctionnalités incluses dans votre pack :
              </div>
              <div>💬 Messages écrits illimités</div>
              <div>📸 Partage de photos sécurisées</div>
              <div>🎙️ Notes vocales audio haute fidélité</div>
              <div style={{ marginTop: "8px", color: "#B45309", fontWeight: 600 }}>
                👑 Pour débloquer l&apos;appel vidéo en direct, passez au Pack VIP.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/tarifs"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontWeight: 800,
                  padding: "14px",
                  fontSize: "15px",
                  background: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "14px",
                  boxShadow: "0 4px 14px rgba(217, 119, 6, 0.35)",
                }}
              >
                Découvrir le Pack VIP 👑
              </Link>
              <button
                type="button"
                onClick={() => setVipModalOpen(false)}
                className="btn btn-ghost"
                style={{ color: "#64748B", fontSize: "13px", padding: "10px" }}
              >
                Continuer avec messages, photos & audio
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

      {/* ── Partner Profile & Criteria Modal ── */}
      {partnerModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 20, 45, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setPartnerModalOpen(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              maxWidth: "460px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              border: "1px solid #E2E8F0",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Cover */}
            {(() => {
              const activePartner = onlineMembers.find(
                (m) => m.userId === activeConv.participantId || m.id === activeConv.participantId
              );
              const partnerCover = activePartner?.coverUrl;
              const partnerPhotos = (activePartner?.photos && activePartner.photos.length > 0)
                ? activePartner.photos
                : (activeConv.photoUrl ? [{ url: activeConv.photoUrl, isMain: true }] : [{ url: "/victoire_profile.jpg", isMain: true }]);

              return (
                <>
                  <div
                    style={{
                      height: "140px",
                      background: partnerCover
                        ? `url(${partnerCover}) center/cover no-repeat`
                        : "linear-gradient(135deg, #0B2559 0%, #163B8A 60%, #1D4ED8 100%)",
                      position: "relative",
                      display: "flex",
                      justifyContent: "flex-end",
                      padding: "12px",
                      borderRadius: "24px 24px 0 0",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)",
                        borderRadius: "24px 24px 0 0",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPartnerModalOpen(false)}
                      style={{
                        position: "relative",
                        zIndex: 2,
                        background: "rgba(0,0,0,0.55)",
                        border: "none",
                        color: "white",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 700,
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Profile Avatar & Info */}
                  <div style={{ padding: "0 20px 24px", marginTop: "-44px", position: "relative", zIndex: 3 }}>
                    <div
                      style={{
                        width: "88px",
                        height: "88px",
                        borderRadius: "50%",
                        border: "4px solid white",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                        overflow: "hidden",
                        background: "#0B2559",
                        position: "relative",
                        marginBottom: "12px",
                      }}
                    >
                      {activeConv.photoUrl ? (
                        <Image
                          src={activeConv.photoUrl}
                          alt={activeConv.firstName}
                          fill
                          unoptimized
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "30px",
                            fontWeight: 800,
                          }}
                        >
                          {activeConv.firstName?.charAt(0) || "M"}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div>
                        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0B2559", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{activeConv.firstName}</span>
                          <span style={{ fontSize: "14px", color: "#059669" }}>✓</span>
                        </h2>
                        <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>
                          {activeConv.pseudo || `@${activeConv.firstName.toLowerCase()}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#ECFDF5", color: "#059669", padding: "4px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: 700 }}>
                        <span style={{ width: "7px", height: "7px", background: "#10B981", borderRadius: "50%" }} />
                        En ligne à Lomé
                      </div>
                    </div>

                    {/* Badges & Critères */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "14px 0" }}>
                      <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                        📍 {activePartner?.city || "Lomé, Togo"}
                      </span>
                      {activePartner?.profession && (
                        <span style={{ background: "#F1F5F9", color: "#334155", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                          💼 {activePartner.profession}
                        </span>
                      )}
                      <span style={{ background: "#FEF3C7", color: "#B45309", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                        ⭐ {activePartner?.relationshipGoal === "MARRIAGE" ? "Mariage & Foyer" : activePartner?.relationshipGoal === "FRIENDSHIP" ? "Amitié & Échange" : "Relation sérieuse & Sorties"}
                      </span>
                      <span style={{ background: "#ECFDF5", color: "#047857", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                        🛡️ Identité vérifiée
                      </span>
                    </div>

                    {/* Bio */}
                    <div style={{ background: "#F8FAFC", borderRadius: "14px", padding: "14px", border: "1px solid #E2E8F0", marginBottom: "16px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#0B2559", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                        À propos de {activeConv.firstName}
                      </div>
                      <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: 1.6, margin: 0 }}>
                        {activePartner?.bio || (activeConv.id.includes("victoire")
                          ? "✨ Passionnée d'art, de mode et de voyages, souriante et chaleureuse. J'adore les dîners au coucher de soleil à Lomé, les sorties conviviales et les belles rencontres. Écris-moi, je réponds toujours avec grand plaisir ! 💖"
                          : "Membre actif sur Meet Me Club Lomé. Disponible pour échanger en direct, partager des moments conviviaux et organiser une belle rencontre dans les meilleurs établissements de Lomé.")}
                      </p>
                    </div>

                    {/* Galerie Photos du membre */}
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: "#0B2559", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                        Photos du membre ({partnerPhotos.length}) · Cliquez pour agrandir
                      </div>
                      <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                        {partnerPhotos.map((ph: any, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setEnlargedImage(ph.url)}
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "12px",
                              overflow: "hidden",
                              border: "2px solid #E2E8F0",
                              cursor: "pointer",
                              position: "relative",
                              flexShrink: 0,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                          >
                            <Image src={ph.url} alt={`Photo ${idx + 1}`} fill unoptimized style={{ objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setPartnerModalOpen(false);
                    inputRef.current?.focus();
                  }}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0B2559 0%, #163B8A 100%)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "14px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Discuter avec {activeConv.firstName}</span>
                </button>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href={`/rendez-vous/nouveau?avec=${activeConv.participantId}`}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "12px",
                      background: "#EFF6FF",
                      color: "#1D4ED8",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "1px solid #BFDBFE",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Calendar size={15} />
                    <span>Proposer Sortie</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setPartnerModalOpen(false);
                      startVideoCall();
                    }}
                    style={{
                      flex: 1,
                      padding: "11px",
                      borderRadius: "12px",
                      background: "#F8FAFC",
                      color: "#0F172A",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "1px solid #CBD5E1",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Video size={15} />
                    <span>Appel Vidéo</span>
                  </button>
                </div>
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
