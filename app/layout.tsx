import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FROM PHOTOGRAPHS TO SPATIAL FIELDS — Gaussian Splatting",
  description: "An interactive spatial story about the transition from photographs and video to 3D and 4D Gaussian fields.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
