import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "From Images to Places — Opening Study",
  description: "A cinematic opening about the transition from flat images to captured spatial fields.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
