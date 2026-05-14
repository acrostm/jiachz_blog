import React from "react";

import { type Metadata } from "next";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BotIdClient } from "botid/client";

import { NODE_ENV } from "@/config";

import { ThemeProvider } from "@/providers";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Console } from "@/components/console";
import { Favicon } from "@/components/favicon";
import { Fingerprint } from "@/components/fingerprint";
import { FutureShell } from "@/components/future-shell";

import { ImageAssets, NICKNAME, SLOGAN, WEBSITE } from "@/constants";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: {
    template: `%s - ${WEBSITE}`,
    default: `${WEBSITE}`,
  },
  description: `${SLOGAN}`,
  keywords: NICKNAME,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <BotIdClient
          protect={[
            { path: "/api/auth/callback/credentials", method: "POST" },
            { path: "/api/message-board", method: "POST" },
            { path: "/api/auth/register", method: "POST" },
          ]}
        />
        <link rel="icon" type="image/svg+xml" href={ImageAssets.logoDark} />
        {/*TODO*/}
        {/* Google Search Console 验证 */}
        <meta
          name="google-site-verification"
          content="DTiRVawomypV2iRoz9UUw2P0wAxnPs-kffJl6MNevdM"
        />
        <script
          defer
          src="https://umami.jiachz.com/script.js"
          data-website-id="56094296-ecd7-4340-bc0b-dfc93a182c75"
        ></script>
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <FutureShell>
              {children}

              <Favicon />
              <Toaster />

              <Console />

              <Fingerprint />
            </FutureShell>
          </TooltipProvider>
        </ThemeProvider>
      </body>

      {/*TODO*/}
      {/* Google Analytics  */}
      {NODE_ENV === "production" && <GoogleAnalytics gaId="G-1MVP2JY3JG" />}
      <Analytics />
      <SpeedInsights />
    </html>
  );
}
