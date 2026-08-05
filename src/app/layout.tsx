import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { UserDataProvider } from "@/context/user-profile-context";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "NeoFit | نئوفیت",
  description: "رابط کامل فارسی نئوفیت برای برنامه تمرین، تغذیه و پیگیری پیشرفت",
  applicationName: "NeoFit",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/neofit-icon.svg",
    apple: "/neofit-icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "نئوفیت",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#49b4a7" },
    { media: "(prefers-color-scheme: dark)", color: "#07111f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <a href="#main-content" className="skip-link">پرش به محتوای اصلی</a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserDataProvider>
            <div id="main-content" tabIndex={-1} className="min-h-screen outline-none">
              {children}
            </div>
          </UserDataProvider>
          <PwaRegister />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
