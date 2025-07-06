"use client";

import React from "react";

import { Turnstile } from "@marsidev/react-turnstile";

import { NEXT_PUBLIC_TURNSTILE_SITE_KEY } from "@/config";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark";
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  theme,
}) => {
  if (!NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return <p>Turnstile无法加载：站点密钥未配置。</p>;
  }

  return (
    <Turnstile
      siteKey={NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      onSuccess={onVerify}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: theme ?? "auto",
        size: "compact",
        retry: "auto",
      }}
    />
  );
};

export default TurnstileWidget;
