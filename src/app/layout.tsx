import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "T³ — AI Operating System",
  description:
    "T³ — an AI operating system UI with a real on-device shell, live device monitor, file browser, generative themes, and an Omni-UI design engine. Supercharged web edition.",
  keywords: [
    "T³", "AI OS", "operating system", "terminal", "file browser",
    "system monitor", "generative themes", "Gemini Live", "Omni-UI",
  ],
  authors: [{ name: "T³" }],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%23C1613D'/%3E%3Ctext x='52' y='62' font-family='Georgia,serif' font-size='52' font-weight='700' fill='%23FCF9F3'%3ET%3C/text%3E%3Ctext x='74' y='40' font-family='Georgia,serif' font-size='20' font-weight='700' fill='%23FCF9F3'%3E3%3C/text%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#F4EEE4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
