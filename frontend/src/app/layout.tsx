import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell/AppShell";

export const metadata: Metadata = {
  title: "Premium Streaming | Voice AI",
  description: "Next Generation Video Streaming Platform with Voice AI",
};

import { Providers } from "@/components/layout/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
