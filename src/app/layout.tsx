import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ToastProvider } from "../components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pick For Me - AI-Powered Decision Engine",
  description: "Eliminate choice paralysis for dining and local experiences with AI-powered decisions",
  keywords: [
    "AI restaurant picker",
    "decision engine",
    "restaurant recommendations",
    "Yelp AI",
    "autonomous booking",
    "food decisions",
    "restaurant finder",
    "AI assistant"
  ],
  authors: [{ name: "Pick For Me Team" }],
  creator: "Pick For Me",
  publisher: "Pick For Me",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Pick For Me - AI-Powered Decision Engine",
    description: "Eliminate choice paralysis for dining and local experiences with AI-powered decisions",
    url: '/',
    siteName: 'Pick For Me',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Pick For Me - AI-Powered Decision Engine',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Pick For Me - AI-Powered Decision Engine",
    description: "Eliminate choice paralysis for dining and local experiences with AI-powered decisions",
    images: ['/logo.png'],
    creator: '@pickforme',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icon-192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/icon-512.png',
      },
    ],
  },
  manifest: '/manifest.json',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFE66D' },
    { media: '(prefers-color-scheme: dark)', color: '#FFE66D' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional favicon and PWA meta tags */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA meta tags */}
        <meta name="application-name" content="Pick For Me" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pick For Me" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#FFE66D" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#FFE66D" />
        <meta name="color-scheme" content="light" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://api.yelp.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}