import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import Header from "../components/site/Header";
import Footer from "../components/site/Footer";
import ThemeProvider from "../components/ThemeProvider";
import { AuthProvider } from "../components/AuthProvider";
import Script from 'next/script';
import { cookies } from 'next/headers';

const notoSansKR = Noto_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "비로그",
  description: "Blog",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme cookie on the server to render a matching initial html class
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const serverThemeIsDark = themeCookie === 'dark';
  return (
    <html lang="ko" className={serverThemeIsDark ? 'dark' : ''}>
      <body
        className={`${notoSansKR.variable} font-sans antialiased touch-manipulation`}
      >
        {/* Initialize theme before React hydrates to avoid FOUC/hydration mismatch.
            We set the class based on the server-side value first so the client
            always matches the SSR HTML. Then fall back to reading cookie/localStorage
            to respect client-side changes. */}
        <Script id="init-theme" strategy="beforeInteractive">
          {`(function(){try{` +
            (serverThemeIsDark
              ? `document.documentElement.classList.add('dark');`
              : `document.documentElement.classList.remove('dark');`) +
            `var m=document.cookie.match(/(^|;)\\s*theme=([^;]+)/);var t=m?decodeURIComponent(m[2]):localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');else if(t==='light')document.documentElement.classList.remove('dark');}catch(e){} })();`}
        </Script>
        <AuthProvider>
          <ThemeProvider />
          <Header />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
