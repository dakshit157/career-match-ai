import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerMatch AI — AI-Powered Resume & Job Match Analyzer",
  description: "Analyze how well your resume matches any job description with Google Gemini AI. Discover missing skills, resume improvement tips, and a personalized learning roadmap.",
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
