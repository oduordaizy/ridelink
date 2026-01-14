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
    default: "Travas - Reliable Ridesharing in Kenya",
    template: "%s | Travas",
  },
  description: "Connect with drivers and passengers for affordable, secure, and convenient rides across Kenya. Save money and travel comfortably with Travas.",
  keywords: ["ridesharing", "carpooling", "Kenya travel", "affordable rides", "Travas", "transport", "Nairobi rides", "Mombasa rides"],
  authors: [{ name: "Travas Team", url: "https://travas.co.ke" }],
  creator: "Travas",
  metadataBase: new URL("https://travas.co.ke"),
  manifest: "/manifest.json",
  openGraph: {
    title: "Travas - Reliable Ridesharing in Kenya",
    description: "Connect with drivers and passengers for affordable, secure, and convenient rides across Kenya.",
    url: "https://travas.co.ke",
    siteName: "Travas",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Travas Ridesharing Application",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travas - Reliable Ridesharing in Kenya",
    description: "Find affordable and secure rides across Kenya with Travas.",
    images: ["/twitter-image.png"],
    creator: "@travas_ke",
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
        </AuthProvider>
      </body>
    </html>
  );
}
