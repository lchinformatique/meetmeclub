"use client";
// src/components/realtime/CallManager.tsx
// Appels audio & vidéo pair-à-pair (WebRTC) — signalisation via Supabase Realtime

import { useCallback, useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, SwitchCamera, Lock } from "lucide-react";
import styles from "./realtime.module.css";
import { sendToUser } from "@/lib/realtime-client";
import { playHangupTone, startRingback, startRingtone } from "./tones";

export type CallKind = "audio" | "video";
export interface CallPeer {
  userId: string;
  firstName: string;
  photoUrl?: string | null;
}
type CallStatus = "outgoing" | "incoming" | "connecting" | "active" | "ended";

interface CallSession {
  callId: string;
  peer: CallPeer;
  kind: CallKind;
  conversationId?: string;
  direction: "out" | "in";
  status: CallStatus;
  startedAt?: number;
  endReason?: string;
}

const RING_TIMEOUT_MS = 45_000;

function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
  ];
  // Serveur relais TURN Metered (indispensable sur les réseaux mobiles 4G) : variables NEXT_PUBLIC_TURN_*
  const turn = process.env.NEXT_PUBLIC_TURN_URLS;
  if (turn) {
    servers.push({
      urls: turn.split(",").map((u) => u.trim()).filter(Boolean),
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
    });
  }
  return servers;
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function initials(name: string) {
  return (name || "M").trim().charAt(0).toUpperCase();
}

export function useCallManager(me: CallPeer | null, isOnline: (userId: string) => boolean) {
  const [session, setSession] = useState<CallSession | null>(null);
  const sessionRef = useRef<CallSession | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const pendingOffer = useRef<RTCSessionDescriptionInit | null>(null);
  const stopToneRef = useRef<(() => void) | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const facingRef = useRef<"user" | "environment">("user");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const update = useCallback((s: CallSession | null) => {
    sessionRef.current = s;
    setSession(s);
  }, []);

  const stopTone = () => {
    stopToneRef.current?.();
    stopToneRef.current = null;
  };

  const cleanup = useCallback(() => {
    stopTone();
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    pendingIce.current = [];
    pendingOffer.current = null;
    setMuted(false);
    setCameraOff(false);
    facingRef.current = "user";
  }, []);

  const postCallLog = (s: CallSession, connected: boolean) => {
    if (!s.conversationId) return;
    const label = s.kind === "video" ? "vidéo" : "vocal";
    const body = connected && s.startedAt
      ? `📞 Appel ${label} · ${formatDuration(Date.now() - s.startedAt)}`
      : `📵 Appel ${label} manqué`;
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: s.conversationId, body }),
    })
      .then(() => window.dispatchEvent(new CustomEvent("mmc:call-logged", { detail: { conversationId: s.conversationId } })))
      .catch(() => {});
  };

  const finish = useCallback(
    (reason: string, notifyPeer: "end" | "cancel" | null) => {
      const s = sessionRef.current;
      if (!s || s.status === "ended") return;
      if (notifyPeer) sendToUser(s.peer.userId, `call-${notifyPeer}`, { callId: s.callId });
      const connected = s.status === "active";
      if (s.direction === "out") {
        postCallLog(s, connected);
        if (!connected && !isOnline(s.peer.userId)) {
          fetch("/api/calls/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: s.peer.userId, callType: s.kind, kind: "missed-call", conversationId: s.conversationId }),
          }).catch(() => {});
        }
      }
      cleanup();
      playHangupTone();
      update({ ...s, status: "ended", endReason: reason });
      setTimeout(() => {
        if (sessionRef.current?.callId === s.callId) update(null);
      }, 2200);
    },
    [cleanup, update, isOnline]
  );

  const markActive = useCallback(() => {
    const cur = sessionRef.current;
    stopTone();
    if (cur && cur.status !== "active" && cur.status !== "ended") update({ ...cur, status: "active", startedAt: Date.now() });
  }, [update]);

  const createPeer = useCallback(
    (s: CallSession) => {
      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      pc.onicecandidate = (e) => {
        if (e.candidate) sendToUser(s.peer.userId, "call-ice", { callId: s.callId, candidate: e.candidate.toJSON() });
      };
      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0] || new MediaStream([e.track]));
      };
      const onState = () => {
        const st = pc.connectionState || pc.iceConnectionState;
        if (st === "connected" || pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          markActive();
        } else if (st === "failed") {
          finish("Connexion impossible : réseau trop restrictif", "end");
        } else if (st === "disconnected") {
          timersRef.current.push(
            setTimeout(() => {
              if (pcRef.current === pc && pc.connectionState === "disconnected") finish("Connexion perdue", "end");
            }, 10_000)
          );
        }
      };
      pc.onconnectionstatechange = onState;
      pc.oniceconnectionstatechange = onState;
      pcRef.current = pc;
      return pc;
    },
    [finish, markActive]
  );

  const getMedia = async (kind: CallKind) => {
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video:
        kind === "video"
          ? { facingMode: facingRef.current, width: { ideal: 1280 }, height: { ideal: 720 } }
          : false,
    });
  };

  const flushIce = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingIce.current;
    pendingIce.current = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(c);
      } catch {}
    }
  };

  const canCall = () =>
    typeof window !== "undefined" &&
    typeof RTCPeerConnection !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  /** Lance un appel vers un membre */
  const startCall = useCallback(
    async (peer: CallPeer, kind: CallKind, conversationId?: string) => {
      if (!me || sessionRef.current) return;
      if (!canCall()) {
        setNotice("Votre navigateur ne permet pas les appels. Utilisez Chrome, Safari ou Firefox à jour.");
        return;
      }
      const callId = `${me.userId}-${Date.now()}`;
      const s: CallSession = { callId, peer, kind, conversationId, direction: "out", status: "outgoing" };
      update(s);

      let stream: MediaStream;
      try {
        stream = await getMedia(kind);
      } catch {
        update(null);
        setNotice(`Autorisez l'accès au micro${kind === "video" ? " et à la caméra" : ""} pour passer un appel.`);
        return;
      }
      // L'appel a pu être annulé pendant la demande d'autorisation
      if ((sessionRef.current as CallSession | null)?.callId !== callId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeer(s);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendToUser(peer.userId, "call-offer", {
        callId,
        kind,
        conversationId,
        sdp: { type: offer.type, sdp: offer.sdp },
        from: { userId: me.userId, firstName: me.firstName, photoUrl: me.photoUrl || null },
      });
      stopToneRef.current = startRingback();

      // Membre hors ligne : on le prévient sur son téléphone
      if (!isOnline(peer.userId)) {
        fetch("/api/calls/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: peer.userId, callType: kind, kind: "call", conversationId }),
        }).catch(() => {});
      }

      timersRef.current.push(
        setTimeout(() => {
          const cur = sessionRef.current;
          if (cur?.callId === callId && cur.status === "outgoing") finish("Pas de réponse", "cancel");
        }, RING_TIMEOUT_MS)
      );
    },
    [me, createPeer, finish, isOnline, update]
  );

  /** Décrocher */
  const accept = useCallback(async () => {
    const s = sessionRef.current;
    if (!s || s.status !== "incoming" || !pendingOffer.current) return;
    stopTone();
    update({ ...s, status: "connecting" });

    let stream: MediaStream;
    try {
      stream = await getMedia(s.kind);
    } catch {
      sendToUser(s.peer.userId, "call-reject", { callId: s.callId, reason: "declined" });
      setNotice(`Autorisez l'accès au micro${s.kind === "video" ? " et à la caméra" : ""} pour répondre.`);
      finish("Micro ou caméra non autorisés", null);
      return;
    }
    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = createPeer(s);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    await pc.setRemoteDescription(pendingOffer.current);
    await flushIce();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendToUser(s.peer.userId, "call-answer", { callId: s.callId, sdp: { type: answer.type, sdp: answer.sdp } });
  }, [createPeer, finish, update]);

  /** Refuser */
  const decline = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    sendToUser(s.peer.userId, "call-reject", { callId: s.callId, reason: "declined" });
    finish("Appel refusé", null);
  }, [finish]);

  /** Raccrocher */
  const hangup = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    if (s.status === "outgoing") finish("Appel annulé", "cancel");
    else finish("Appel terminé", "end");
  }, [finish]);

  /** Signaux reçus de l'autre membre */
  const handleSignal = useCallback(
    async (event: string, payload: any) => {
      const s = sessionRef.current;
      const sameCall = s && payload?.callId === s.callId;

      switch (event) {
        case "call-offer": {
          if (!payload?.from?.userId || !payload?.sdp) return;
          if (s) {
            if (!sameCall) sendToUser(payload.from.userId, "call-reject", { callId: payload.callId, reason: "busy" });
            return;
          }
          pendingOffer.current = payload.sdp;
          pendingIce.current = [];
          update({
            callId: payload.callId,
            peer: payload.from,
            kind: payload.kind === "video" ? "video" : "audio",
            conversationId: payload.conversationId,
            direction: "in",
            status: "incoming",
          });
          stopToneRef.current = startRingtone();
          if (
            document.hidden &&
            "serviceWorker" in navigator &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            navigator.serviceWorker.ready
              .then((reg) =>
                reg.showNotification(`📞 Appel ${payload.kind === "video" ? "vidéo" : "vocal"} entrant`, {
                  body: `${payload.from.firstName} vous appelle sur Meet Me Club`,
                  tag: `call-${payload.callId}`,
                  requireInteraction: true,
                  icon: "/icons/icon-192x192.png",
                  data: { url: "/messages" },
                })
              )
              .catch(() => {});
          }
          const callId = payload.callId;
          timersRef.current.push(
            setTimeout(() => {
              const cur = sessionRef.current as CallSession | null;
              if (cur && cur.callId === callId && cur.status === "incoming") finish("Appel manqué", null);
            }, RING_TIMEOUT_MS)
          );
          return;
        }
        case "call-answer": {
          if (!sameCall || s!.direction !== "out" || !pcRef.current) return;
          stopTone();
          update({ ...s!, status: "connecting" });
          await pcRef.current.setRemoteDescription(payload.sdp);
          await flushIce();
          return;
        }
        case "call-ice": {
          if (!sameCall || !payload.candidate) return;
          const pc = pcRef.current;
          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(payload.candidate);
            } catch {}
          } else {
            pendingIce.current.push(payload.candidate);
          }
          return;
        }
        case "call-reject":
          if (sameCall) finish(payload.reason === "busy" ? "Déjà en ligne sur un autre appel" : "Appel refusé", null);
          return;
        case "call-cancel":
          if (sameCall) finish("Appel manqué", null);
          return;
        case "call-end":
          if (sameCall) finish("Appel terminé", null);
          return;
      }
    },
    [finish, update]
  );

  const toggleMute = () => {
    const next = !muted;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  };

  const toggleCamera = () => {
    const next = !cameraOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCameraOff(next);
  };

  const switchCamera = async () => {
    const pc = pcRef.current;
    const stream = localStreamRef.current;
    if (!pc || !stream) return;
    facingRef.current = facingRef.current === "user" ? "environment" : "user";
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facingRef.current } });
      const newTrack = fresh.getVideoTracks()[0];
      const sender = pc.getSenders().find((snd) => snd.track?.kind === "video");
      await sender?.replaceTrack(newTrack);
      stream.getVideoTracks().forEach((t) => {
        t.stop();
        stream.removeTrack(t);
      });
      stream.addTrack(newTrack);
      setLocalStream(new MediaStream(stream.getTracks()));
    } catch {
      facingRef.current = facingRef.current === "user" ? "environment" : "user";
    }
  };

  // Chronomètre d'appel
  useEffect(() => {
    if (session?.status !== "active") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session?.status]);

  // Fermeture de l'onglet pendant un appel → prévenir l'autre membre
  useEffect(() => {
    const onUnload = () => {
      const s = sessionRef.current;
      if (s && s.status !== "ended") sendToUser(s.peer.userId, s.status === "outgoing" ? "call-cancel" : "call-end", { callId: s.callId });
    };
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  const ui = (
    <>
      {session && (
        <CallScreen
          session={session}
          localStream={localStream}
          remoteStream={remoteStream}
          muted={muted}
          cameraOff={cameraOff}
          now={now}
          onAccept={accept}
          onDecline={decline}
          onHangup={hangup}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onSwitchCamera={switchCamera}
        />
      )}
      {notice && (
        <div className={styles.callNotice} role="alert">
          {notice}
        </div>
      )}
    </>
  );

  return { session, startCall, handleSignal, ui, inCall: Boolean(session) };
}

// ── Écran d'appel (style WhatsApp, couleurs du club) ───────────────────────

function MediaVideo({ stream, muted, mirrored, className }: { stream: MediaStream | null; muted?: boolean; mirrored?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
    />
  );
}

function RemoteAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function CallScreen(props: {
  session: CallSession;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  cameraOff: boolean;
  now: number;
  onAccept: () => void;
  onDecline: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
}) {
  const { session, localStream, remoteStream, muted, cameraOff, now } = props;
  const isVideo = session.kind === "video";
  const showRemoteVideo = isVideo && remoteStream && (session.status === "active" || session.status === "connecting");
  const kindLabel = isVideo ? "Appel vidéo" : "Appel vocal";

  const statusText =
    session.status === "incoming"
      ? `${kindLabel} entrant…`
      : session.status === "outgoing"
        ? "Sonnerie…"
        : session.status === "connecting"
          ? "Connexion…"
          : session.status === "active"
            ? formatDuration(now - (session.startedAt || now))
            : session.endReason || "Appel terminé";

  return (
    <div className={styles.callOverlay} role="dialog" aria-label={`${kindLabel} avec ${session.peer.firstName}`}>
      {showRemoteVideo ? (
        <MediaVideo stream={remoteStream} className={styles.remoteVideo} />
      ) : (
        <div className={styles.callBackdrop}>
          {session.peer.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.peer.photoUrl} alt="" className={styles.callBackdropImg} />
          ) : null}
        </div>
      )}
      {!isVideo && <RemoteAudio stream={remoteStream} />}

      <div className={styles.callTop}>
        <div className={styles.callEncrypted}>
          <Lock size={12} /> Chiffré de bout en bout
        </div>
        {!showRemoteVideo && (
          <div className={`${styles.callAvatarWrap} ${session.status === "incoming" || session.status === "outgoing" ? styles.ringing : ""}`}>
            {session.peer.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.peer.photoUrl} alt={session.peer.firstName} className={styles.callAvatar} />
            ) : (
              <div className={styles.callAvatarFallback}>{initials(session.peer.firstName)}</div>
            )}
          </div>
        )}
        <div className={styles.callName}>{session.peer.firstName}</div>
        <div className={styles.callStatus}>{statusText}</div>
      </div>

      {isVideo && localStream && session.status !== "ended" && (
        <div className={styles.localVideoWrap}>
          {cameraOff ? (
            <div className={styles.localVideoOff}>
              <VideoOff size={22} />
            </div>
          ) : (
            <MediaVideo stream={localStream} muted mirrored className={styles.localVideo} />
          )}
        </div>
      )}

      <div className={styles.callControls}>
        {session.status === "incoming" ? (
          <div className={styles.incomingRow}>
            <div className={styles.ctrlCol}>
              <button type="button" className={`${styles.ctrlBtn} ${styles.ctrlDecline}`} onClick={props.onDecline} aria-label="Refuser">
                <PhoneOff size={28} />
              </button>
              <span>Refuser</span>
            </div>
            <div className={styles.ctrlCol}>
              <button type="button" className={`${styles.ctrlBtn} ${styles.ctrlAccept}`} onClick={props.onAccept} aria-label="Répondre">
                {isVideo ? <Video size={28} /> : <Phone size={28} />}
              </button>
              <span>Répondre</span>
            </div>
          </div>
        ) : session.status !== "ended" ? (
          <div className={styles.activeRow}>
            {isVideo && (
              <button type="button" className={styles.ctrlBtnSmall} onClick={props.onSwitchCamera} aria-label="Changer de caméra">
                <SwitchCamera size={22} />
              </button>
            )}
            {isVideo && (
              <button
                type="button"
                className={`${styles.ctrlBtnSmall} ${cameraOff ? styles.ctrlToggled : ""}`}
                onClick={props.onToggleCamera}
                aria-label={cameraOff ? "Activer la caméra" : "Couper la caméra"}
              >
                {cameraOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            )}
            <button
              type="button"
              className={`${styles.ctrlBtnSmall} ${muted ? styles.ctrlToggled : ""}`}
              onClick={props.onToggleMute}
              aria-label={muted ? "Réactiver le micro" : "Couper le micro"}
            >
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button type="button" className={`${styles.ctrlBtn} ${styles.ctrlDecline}`} onClick={props.onHangup} aria-label="Raccrocher">
              <PhoneOff size={26} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
