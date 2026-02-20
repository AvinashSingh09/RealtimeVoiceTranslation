import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoxFlow | Real-Time Voice Translation",
  description: "Cinematic real-time voice-to-voice translation powered by Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-zinc-100 min-h-screen relative overflow-x-hidden`}
      >
        {/* Subtle grid pattern overlay */}
        <div className="fixed inset-0 z-[-2] opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        {/* Radial glow from top center */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[-1] w-[80rem] h-[40rem] bg-yellow-500/5 rounded-full blur-[150px] pointer-events-none" />

        {children}
      </body>
    </html>
  );
}
