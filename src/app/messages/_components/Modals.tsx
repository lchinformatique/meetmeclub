"use client";
// Fenêtres de la messagerie : fiche membre, photo plein écran, VIP, quota, position, règles

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  CalendarHeart,
  Crown,
  Heart,
  LocateFixed,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Video,
  X,
  Zap,
} from "lucide-react";
import styles from "../messages.module.css";
import Avatar from "./Avatar";
import { GOAL_LABELS, LOME_SPOTS, VICTOIRE_ID, isRenderableUrl, type Member } from "../_lib/chat-utils";
import { SASPAY_LINKS } from "@/lib/subscription-constants";
import { countryName } from "@/lib/countries";

function Sheet({ onClose, children, label }: { onClose: () => void; children: React.ReactNode; label: string }) {
  return (
    <div className={`${styles.modalBackdrop} protected-content`} onClick={onClose} role="dialog" aria-label={label}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fermer">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function PlanBadge({ plan }: { plan?: string }) {
  if (!plan || plan === "FREE") return null;
  return (
    <span className={`${styles.planBadge} ${plan === "VIP" ? styles.planVip : ""}`}>
      {plan === "VIP" && <Crown size={11} />}
      {plan === "VIP" ? "VIP" : plan === "COMPLICE" ? "Complice" : "Essentiel"}
    </span>
  );
}

export function PartnerSheet({
  member,
  online,
  onClose,
  onMessage,
  onCall,
  onOpenImage,
}: {
  member: Member;
  online: boolean;
  onClose: () => void;
  onMessage?: () => void;
  onCall?: (kind: "audio" | "video") => void;
  onOpenImage: (url: string) => void;
}) {
  const photos = (member.photos || []).filter((p) => isRenderableUrl(p.url)).slice(0, 4);
  return (
    <Sheet onClose={onClose} label={`Profil de ${member.firstName}`}>
      <div className={styles.sheetHead}>
        <Avatar name={member.firstName} url={member.photoUrl} size={88} online={online} ring />
        <div className={styles.sheetName}>
          {member.firstName}
          {member.age ? `, ${member.age} ans` : ""}
          {member.userId !== VICTOIRE_ID && <BadgeCheck size={18} className={styles.verified} />}
        </div>
        <div className={styles.sheetSub}>
          {member.pseudo ? `@${member.pseudo.replace(/^@/, "")} · ` : ""}
          <span className={online ? styles.statusOnline : styles.statusOffline}>{online ? "En ligne" : "Hors ligne"}</span>
        </div>
        <PlanBadge plan={member.plan} />
      </div>

      <div className={styles.sheetFacts}>
        <span>
          <MapPin size={15} /> {[member.city, countryName(member.country)].filter(Boolean).join(", ") || "—"}
        </span>
        {member.profession && (
          <span>
            <Briefcase size={15} /> {member.profession}
          </span>
        )}
        {member.relationshipGoal && (
          <span>
            <Heart size={15} /> {GOAL_LABELS[member.relationshipGoal] || member.relationshipGoal}
          </span>
        )}
      </div>

      {member.bio && <p className={styles.sheetBio}>{member.bio}</p>}

      {photos.length > 0 && (
        <div className={styles.sheetPhotos}>
          {photos.map((ph, i) => (
            <button key={i} type="button" onClick={() => onOpenImage(ph.url)} aria-label={`Photo ${i + 1}`} onContextMenu={(e) => e.preventDefault()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt="" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}

      <div className={styles.sheetActions}>
        {onMessage && (
          <button type="button" className={styles.primaryBtn} onClick={onMessage}>
            <MessageCircle size={18} /> Envoyer un message
          </button>
        )}
        {onCall && (
          <div className={styles.sheetActionRow}>
            <button type="button" className={styles.secondaryBtn} onClick={() => onCall("audio")}>
              <Phone size={17} /> Appel
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => onCall("video")}>
              <Video size={17} /> Vidéo
            </button>
          </div>
        )}
        <Link href={`/rendez-vous/nouveau?avec=${member.userId}`} className={styles.secondaryBtn}>
          <CalendarHeart size={17} /> Proposer une sortie
        </Link>
      </div>
    </Sheet>
  );
}

export function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className={`${styles.lightbox} protected-content`} onClick={onClose} role="dialog" aria-label="Photo">
      <button type="button" className={styles.lightboxClose} onClick={onClose} aria-label="Fermer">
        <X size={22} />
      </button>
      <div className={styles.lightboxFrame} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" draggable={false} />
      </div>
    </div>
  );
}

export function VipModal({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} label="Appels réservés au VIP">
      <div className={styles.modalIcon} style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
        <Crown size={28} />
      </div>
      <h3 className={styles.modalTitle}>Appels audio & vidéo réservés au VIP</h3>
      <p className={styles.modalText}>
        Passez au <strong>Pass VIP (15 000 FCFA)</strong> pour appeler les membres en audio et en vidéo, en direct et en
        toute sécurité. Messages, photos et notes vocales restent inclus dans votre pass actuel.
      </p>
      <a href={SASPAY_LINKS.VIP} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
        <Crown size={18} /> Activer le Pass VIP
      </a>
      <button type="button" className={styles.ghostBtn} onClick={onClose}>
        Plus tard
      </button>
    </Sheet>
  );
}

export function ExpiredModal({ onClose, wasTrial }: { onClose: () => void; wasTrial: boolean }) {
  return (
    <Sheet onClose={onClose} label="Période terminée">
      <div className={styles.modalIcon} style={{ background: "linear-gradient(135deg,#0B2559,#163B8A)" }}>
        <Zap size={26} />
      </div>
      <h3 className={styles.modalTitle}>{wasTrial ? "Votre essai gratuit de 3 jours est terminé" : "Votre pass est arrivé à échéance"}</h3>
      <p className={styles.modalText}>
        Continuez à discuter avec tous les membres grâce au <strong>Pass Essentiel</strong> : discussions illimitées
        pendant 30 jours.
      </p>
      <a href={SASPAY_LINKS.ESSENTIAL} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
        Continuer avec le Pass Essentiel · 3 000 F
      </a>
      <Link href="/tarifs" className={styles.ghostBtn}>
        Voir tous les pass
      </Link>
    </Sheet>
  );
}

export function QuotaModal({ onClose }: { onClose: () => void }) {
  const plans = [
    { name: "Pass Essentiel", price: "3 000 FCFA / mois", desc: "Discussions illimitées", url: SASPAY_LINKS.ESSENTIAL },
    { name: "Pass Complice", price: "6 000 FCFA", desc: "Accès prioritaire + 1 sortie offerte", url: SASPAY_LINKS.COMPLICE },
    { name: "Pass VIP", price: "15 000 FCFA", desc: "Appels audio & vidéo + accès total", url: SASPAY_LINKS.VIP },
  ];
  return (
    <Sheet onClose={onClose} label="Limite du plan gratuit">
      <div className={styles.modalIcon} style={{ background: "linear-gradient(135deg,#E10600,#B30500)" }}>
        <Zap size={26} />
      </div>
      <h3 className={styles.modalTitle}>Plan gratuit : 3 discussions maximum</h3>
      <p className={styles.modalText}>Pour échanger avec plus de membres, choisissez un pass :</p>
      <div className={styles.planList}>
        {plans.map((p) => (
          <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className={styles.planItem}>
            <span>
              <strong>{p.name}</strong>
              <small>{p.desc}</small>
            </span>
            <em>{p.price}</em>
          </a>
        ))}
      </div>
      <Link href="/tarifs" className={styles.ghostBtn}>
        Comparer tous les plans
      </Link>
    </Sheet>
  );
}

export function LocationModal({
  onClose,
  onShare,
}: {
  onClose: () => void;
  onShare: (label: string, lat: number, lng: number) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareLive = () => {
    if (!navigator.geolocation) {
      setError("La localisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onShare(`Ma position actuelle (±${Math.round(pos.coords.accuracy)} m)`, pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setLocating(false);
        setError("Autorisez la localisation pour partager votre position.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <Sheet onClose={onClose} label="Partager une position">
      <h3 className={styles.modalTitle}>Partager une position</h3>
      <button type="button" className={styles.primaryBtn} onClick={shareLive} disabled={locating}>
        <LocateFixed size={18} /> {locating ? "Localisation…" : "Ma position actuelle"}
      </button>
      {error && <p className={styles.formError}>{error}</p>}
      {LOME_SPOTS.length > 0 && <div className={styles.spotList}>
        <span className={styles.spotTitle}>Lieux de rendez-vous suggérés</span>
        {LOME_SPOTS.map((s) => (
          <button key={s.name} type="button" onClick={() => onShare(s.name, s.lat, s.lng)}>
            <MapPin size={16} /> {s.name}
          </button>
        ))}
      </div>}
    </Sheet>
  );
}

export function RulesModal({ onClose }: { onClose: () => void }) {
  const rules = [
    ["Respect & courtoisie", "Aucune insulte, aucun harcèlement. Chaque membre mérite la bienveillance."],
    ["Membres majeurs & profils réels", "Le club est réservé aux plus de 18 ans, avec vérification d'identité."],
    ["Rendez-vous en lieu public", "Premières rencontres dans des lieux publics ou chez nos partenaires."],
    ["Aucune demande d'argent", "Ne demandez et n'envoyez jamais d'argent (T-Money, Flooz…). Signalez tout abus."],
    ["Confidentialité", "Ne partagez jamais vos mots de passe ou informations sensibles."],
  ];
  return (
    <Sheet onClose={onClose} label="Règles du chat">
      <div className={styles.modalIcon} style={{ background: "linear-gradient(135deg,#0B2559,#163B8A)" }}>
        <ShieldCheck size={26} />
      </div>
      <h3 className={styles.modalTitle}>Règles d&apos;or du chat</h3>
      <ol className={styles.rulesList}>
        {rules.map(([title, desc]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span>{desc}</span>
          </li>
        ))}
      </ol>
      <button type="button" className={styles.primaryBtn} onClick={onClose}>
        J&apos;ai compris
      </button>
    </Sheet>
  );
}
