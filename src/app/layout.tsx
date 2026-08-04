import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { UserDataProvider } from "@/context/user-profile-context";

export const metadata: Metadata = {
  title: "NeoFit | نئوفیت",
  description: "رابط کامل فارسی نئوفیت برای برنامه تمرین، تغذیه و پیگیری پیشرفت",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserDataProvider>{children}</UserDataProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
