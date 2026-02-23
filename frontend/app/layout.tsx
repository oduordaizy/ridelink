import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "iTravas",
    template: "%s | iTravas",
  },
  description: "iTravas connects drivers and passengers for affordable, safe, and convenient ridesharing across Kenya. Find carpool rides in Nairobi, Mombasa, Kisumu and beyond. Save money and travel smarter.",
  applicationName: "iTravas",
  keywords: [
    "ridesharing Kenya",
    "carpooling Nairobi",
    "affordable rides Kenya",
    "carpool app Kenya",
    "Nairobi rideshare",
    "Mombasa rideshare",
    "Kisumu rides",
    "Kenya transport app",
    "share a ride Kenya",
    "intercity carpooling Kenya",
    "iTravas",
    "cheap travel Kenya",
    "passenger driver matching Kenya",
  ],
  authors: [{ name: "iTravas Team", url: "https://itravas.com" }],
  creator: "iTravas",
  metadataBase: new URL("https://itravas.com"),
  manifest: "/manifest.json",
  icons: {
    icon: "/page-logo.png",
    shortcut: "/page-logo.png",
    apple: "/page-logo.png",
  },
  openGraph: {
    title: "iTravas",
    description: "Connecting drivers and passengers for affordable, secure, and convenient rides across Kenya.",
    url: "https://itravas.com",
    siteName: "iTravas",
    images: [
      {
        url: "/page-logo.png",
        width: 512,
        height: 512,
        alt: "iTravas Ridesharing Application",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iTravas",
    description: "Find affordable and secure rides across Kenya with iTravas.",
    images: ["/page-logo.png"],
    creator: "@itravas",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // ── Additional meta tags ─────────────────────────────────────────────────
  other: {
    "apple-mobile-web-app-title": "iTravas",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    // Geo tags help with local/regional search relevance
    "geo.region": "KE",
    "geo.placename": "Kenya",
    "geo.position": "-1.286389;36.817223", // Nairobi coordinates
    ICBM: "-1.286389, 36.817223",
  },
  alternates: {
    canonical: "https://itravas.com",
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <ToastContainer position="top-right" autoClose={3000} />
          {/* WebSite and Organization JSON-LD is consolidated in page.tsx for better homepage signal */}
        </AuthProvider>
      </body>
    </html>
  );
}
