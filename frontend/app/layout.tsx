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
    default: "iTravas | Reliable Ridesharing in Kenya",
    template: "%s | iTravas",
  },
  description: "Connecting with drivers and passengers for affordable, secure, and convenient rides across Kenya. Save money and travel comfortably with iTravas.",
  applicationName: "iTravas",
  other: {
    "apple-mobile-web-app-title": "iTravas",
  },
  keywords: ["ridesharing", "carpooling", "Kenya travel", "affordable rides", "iTravas", "transport", "Nairobi rides", "Mombasa rides"],
  authors: [{ name: "iTravas Team", url: "https://itravas.com" }],
  creator: "iTravas",
  metadataBase: new URL("https://itravas.com"),
  manifest: "/manifest.json",
  openGraph: {
    title: "iTravas - Reliable Ridesharing in Kenya",
    description: "Connecting with drivers and passengers for affordable, secure, and convenient rides across Kenya.",
    url: "https://itravas.com",
    siteName: "iTravas",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "iTravas Ridesharing Application",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iTravas - Reliable Ridesharing in Kenya",
    description: "Find affordable and secure rides across Kenya with iTravas.",
    images: ["/twitter-image.png"],
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
