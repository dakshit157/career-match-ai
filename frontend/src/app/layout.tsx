import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devpost Hackathon Project | AI Full-Stack",
  description: "Next.js + FastAPI + Google Gemini hackathon starter template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
