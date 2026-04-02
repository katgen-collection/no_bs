import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cutive } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const cutive = Cutive({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cutive",
  display: "swap",
});

export const metadata: Metadata = {
  title: "no_bs — Chat",
  description: "Real-time chat, no nonsense.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${cutive.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-center"
              richColors
              toastOptions={{
                style: {
                  fontFamily: "var(--font-plus-jakarta), sans-serif",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
