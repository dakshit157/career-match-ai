import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerMatch AI — AI-Powered Resume & Job Match Analyzer",
  description: "Analyze how well your resume matches any job description with advanced AI. Discover missing skills, resume improvement tips, and a personalized learning roadmap.",
  verification: {
    google: "OM26TomIKJd_-YET27Qlzh9aN2ok9yDpys_cSuX4kbs",
  },
  other: {
    "google-adsense-account": "ca-pub-3009851600481670",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3009851600481670"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
