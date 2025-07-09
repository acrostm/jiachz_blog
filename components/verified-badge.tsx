"use client";

import { BadgeCheckIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showText?: boolean;
}

export function VerifiedBadge({
  className,
  size = "sm",
  showIcon = true,
  showText = true,
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-4 px-1.5 text-xs",
    md: "h-5 px-2 text-xs",
    lg: "h-6 px-2.5 text-sm",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30",
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && (
        <BadgeCheckIcon className={cn("flex-shrink-0", iconSizes[size])} />
      )}
      {showText && <span className="shrink-0">已验证</span>}
    </Badge>
  );
}
