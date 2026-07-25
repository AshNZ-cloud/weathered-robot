import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Battle-worn Robot with Plasma Guns",
  description: "A 3D battle-worn robot with plasma guns and spaceship scene built with Three.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
