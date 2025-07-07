import React from "react";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

// eslint-disable-next-line import/no-unresolved
import { GoogleAnalytics } from "@next/third-parties/google";

import { NODE_ENV } from "@/config";

import { ThemeProvider } from "@/providers";

import { ClickSpark } from "@/components/ui/click-spark";
import { ReactHotToaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Console } from "@/components/console";
import { Favicon } from "@/components/favicon";
import { Fingerprint } from "@/components/fingerprint";

import { ImageAssets, NICKNAME, SLOGAN, WEBSITE } from "@/constants";
import "@/styles/custom-code-block.css";
import "@/styles/global.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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
      {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
      <body className={inter.className} suppressHydrationWarning={true}>
        <ClickSpark
          sparkColor="--click-spark"
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}

              <Favicon />
              <ReactHotToaster />

              <Console />

              <Fingerprint />
            </TooltipProvider>
          </ThemeProvider>
        </ClickSpark>
      </body>

      {/*TODO*/}
      {/* Google Analytics  */}
      {NODE_ENV === "production" && <GoogleAnalytics gaId="G-1MVP2JY3JG" />}
    </html>
  );
}
