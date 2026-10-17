"use client";
// Galerie photos d'une annonce

import { useState } from "react";
import s from "../../marche.module.css";

export default function Gallery({ photos, title, icon }: { photos: string[]; title: string; icon: string }) {
  const [current, setCurrent] = useState(0);
  if (photos.length === 0) {
    return <div className={s.galleryMain} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, background: "#E2E8F0" }}>{icon}</div>;
  }
  return (
    <div className={s.gallery}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[current]} alt={title} className={s.galleryMain} />
      {photos.length > 1 && (
        <div className={s.thumbs}>
          {photos.map((p, i) => (
            <button key={p} type="button" onClick={() => setCurrent(i)} style={{ padding: 0, border: i === current ? "3px solid #E10600" : "3px solid transparent", borderRadius: 13, background: "none", cursor: "pointer" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`${title} — photo ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
