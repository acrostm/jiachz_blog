'use client';

import React, { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { NEXT_PUBLIC_TURNSTILE_SITE_KEY } from '@/config/env';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ onVerify, onError, onExpire }) => {
  if (!NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    console.error('Turnstile site key is not configured.');
    return <p>Turnstile无法加载：站点密钥未配置。</p>;
  }

  return (
    <Turnstile
      siteKey={NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      onSuccess={onVerify}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: 'auto', // 或者 'dark', 'auto'
        size: 'compact', // 或者 'compact'
        retry: 'auto', // 或者 'never'
        // 您可以在此处添加更多Turnstile选项
      }}
    />
  );
};

export default TurnstileWidget;