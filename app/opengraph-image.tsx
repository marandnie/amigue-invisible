import { ImageResponse } from "next/og";

// Imagen para la vista previa del link (WhatsApp, redes). Se genera en el build.
export const alt = "Amigo Invisible: el sorteo, sin papelitos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #991b1b 0%, #b91c1c 55%, #166534 100%)",
          color: "#fff7ed",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, color: "#fcd34d" }}>
          AMIGOINVISIBLE.COM.AR
        </div>
        <div style={{ display: "flex", fontSize: 104, fontWeight: 700, marginTop: 24, lineHeight: 1.05 }}>
          Amigo Invisible
        </div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 28, maxWidth: 900 }}>
          Armá el grupo, mandá los links y sorteá. Cada quien ve solo a quién le regala.
        </div>
      </div>
    ),
    size,
  );
}
