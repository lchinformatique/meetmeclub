// src/app/(public)/layout.tsx
// Public pages layout — shared header/footer

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Header unifié avec bouton retour mobile et navigation complète */}
      <Header />

      {/* Content */}
      <main style={{ minHeight: "calc(100vh - var(--header-height) - 36px)" }}>
        {children}
      </main>

      {/* Footer épuré scindé en 3 parties */}
      <Footer />
    </>
  );
}
