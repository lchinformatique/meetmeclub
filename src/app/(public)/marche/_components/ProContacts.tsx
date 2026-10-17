// Contacts d'un annonceur (membres connectés) : messagerie Meet Me Club en premier, puis les
// coordonnées choisies par l'annonceur, et la règle de paiement (toujours prévenir l'équipe).

import Link from "next/link";
import { Globe, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { facebookLink, whatsappLink, type ProSpace } from "@/lib/market";
import { FacebookIcon, WhatsAppIcon } from "./BrandIcons";
import s from "../marche.module.css";

export default function ProContacts({
  pro,
  chatHref,
  isMine,
  subject,
}: {
  pro: ProSpace;
  chatHref: string;
  isMine: boolean;
  /** Ce sur quoi porte l'échange (titre de l'annonce ou « votre vitrine ») */
  subject: string;
}) {
  const wa = whatsappLink(pro.whatsapp, `Bonjour ${pro.name}, je vous contacte via Meet Me Club.`);
  const fb = facebookLink(pro.facebook);
  const payMsg = `Bonjour l'équipe, je souhaite payer ${pro.name} pour ${subject}. Pouvez-vous valider avant que je paie ?`;

  return (
    <div className={s.contactBtns}>
      {isMine ? (
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>C&apos;est votre espace : les membres vous écrivent dans votre messagerie.</p>
      ) : (
        <Link href={chatHref} className={s.btnNavy} style={{ width: "100%" }}>
          <MessageCircle size={18} /> Discuter sur Meet Me Club
        </Link>
      )}

      {(pro.phone || wa || fb || pro.website) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          {pro.phone && (
            <a href={`tel:${pro.phone.replace(/\s/g, "")}`} className={s.btnGhost} style={{ width: "100%", fontSize: 14 }}>
              <Phone size={16} /> {pro.phone}
            </a>
          )}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={s.btnGhost} style={{ width: "100%", fontSize: 14, color: "#2E7D5B" }}>
              <WhatsAppIcon size={16} /> WhatsApp
            </a>
          )}
          {fb && (
            <a href={fb} target="_blank" rel="noopener noreferrer" className={s.btnGhost} style={{ width: "100%", fontSize: 14, color: "#3B5FB0" }}>
              <FacebookIcon size={16} /> Facebook
            </a>
          )}
          {pro.website && (
            <a href={pro.website} target="_blank" rel="noopener noreferrer" className={s.btnGhost} style={{ width: "100%", fontSize: 14 }}>
              <Globe size={16} /> Site web
            </a>
          )}
        </div>
      )}

      {!isMine && (
        <div style={{ background: "#FFF8EC", border: "1px solid #F3DFB5", borderRadius: 14, padding: "12px 14px", display: "grid", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13.5, color: "#7A5418", lineHeight: 1.5 }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Aucun paiement sans l&apos;équipe Meet Me Club.</strong> Avant de payer quoi que ce soit, prévenez
              l&apos;équipe : elle vérifie l&apos;annonceur et vous confirme que vous pouvez payer.
            </span>
          </span>
          <Link href={`/support?message=${encodeURIComponent(payMsg)}`} className={s.btn} style={{ width: "100%", background: "#C8862F", fontSize: 14 }}>
            Prévenir l&apos;équipe avant de payer
          </Link>
        </div>
      )}
    </div>
  );
}
