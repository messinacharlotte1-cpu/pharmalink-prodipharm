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
  title: "PharmaLink - Prodipharm",
  description: "Plateforme de Gestion des Délégués Médicaux pour Prodipharm",
  keywords: ["PharmaLink", "Prodipharm", "Délégué Médical", "CRM", "Pharmaceutique"],
  authors: [{ name: "Prodipharm" }],
  icons: {
    icon: "/favicon.ico",
  },
};

// Inline loading screen HTML - shows immediately before JS loads
const loadingHtml = `
<div id="initial-loader" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e293b 0%,#581c87 50%,#1e293b 100%);z-index:9999;transition:opacity 0.3s;">
  <div style="text-align:center;">
    <div style="width:64px;height:64px;margin:0 auto 24px;border:4px solid rgba(139,92,246,0.3);border-top-color:#8b5cf6;border-radius:50%;animation:spin 1s linear infinite;"></div>
    <h1 style="font-size:28px;font-weight:700;color:#fff;margin:0 0 8px;font-family:system-ui,sans-serif;">PharmaLink</h1>
    <p style="color:#c4b5fd;margin:0;">Chargement en cours...</p>
  </div>
</div>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <div dangerouslySetInnerHTML={{ __html: loadingHtml }} />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var hideLoader=function(){
                  var l=document.getElementById('initial-loader');
                  if(l){l.style.opacity='0';setTimeout(function(){l.style.display='none'},300)}
                };
                if(document.readyState==='complete')hideLoader();
                else window.addEventListener('load',function(){setTimeout(hideLoader,100)});
                setTimeout(hideLoader,10000);
              })();
            `
          }}
        />
      </body>
    </html>
  );
}
