"use client";
// Avatar rond avec pastille « en ligne »

import styles from "../messages.module.css";
import { isRenderableUrl } from "../_lib/chat-utils";

export default function Avatar({
  name,
  url,
  size = 48,
  online = false,
  ring = false,
}: {
  name: string;
  url?: string | null;
  size?: number;
  online?: boolean;
  ring?: boolean;
}) {
  return (
    <span
      className={`${styles.avatar} ${ring ? styles.avatarRing : ""}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {isRenderableUrl(url) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} loading="lazy" />
      ) : (
        <span className={styles.avatarFallback}>{(name || "M").trim().charAt(0).toUpperCase()}</span>
      )}
      {online && <span className={styles.onlineDot} style={{ width: Math.max(10, size * 0.24), height: Math.max(10, size * 0.24) }} />}
    </span>
  );
}
