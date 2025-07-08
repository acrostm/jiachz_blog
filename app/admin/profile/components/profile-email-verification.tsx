"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { EmailVerificationDialog } from "@/components/email-verification-dialog";

interface ProfileEmailVerificationProps {
  userEmail: string;
}

export function ProfileEmailVerification({
  userEmail,
}: ProfileEmailVerificationProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const handleVerificationSuccess = () => {
    // 验证成功后刷新页面
    router.refresh();
  };

  return (
    <>
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
        <div className="flex items-center gap-2">
          <div className="text-orange-600 dark:text-orange-400">
            <svg
              className="size-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-orange-800 dark:text-orange-200">
              邮箱未验证
            </h3>
            <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
              为了保护您的账户安全，请验证您的邮箱地址。
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
          >
            立即验证
          </Button>
        </div>
      </div>

      <EmailVerificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userEmail={userEmail}
        onSuccess={handleVerificationSuccess}
      />
    </>
  );
}
