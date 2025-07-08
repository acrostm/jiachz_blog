"use client";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  currentImage?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  onUploadSuccess?: (newImageUrl: string) => void;
}

export function AvatarUpload({
  currentImage,
  userName,
  userEmail,
  onUploadSuccess,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      toast.error("图片大小不能超过1MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    void uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setIsUploading(true);
    try {
      // Upload to R2
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const uploadResult = (await uploadResponse.json()) as {
        error?: string;
        url?: string;
      };

      if (!uploadResponse.ok || uploadResult.error) {
        throw new Error(uploadResult.error ?? "上传失败");
      }

      // Update user avatar in database
      const updateResponse = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: uploadResult.url,
        }),
      });

      const updateResult = (await updateResponse.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!updateResponse.ok || updateResult.error) {
        throw new Error(updateResult.error ?? "更新头像失败");
      }

      toast.success("头像更新成功");

      // Update local state
      setCurrentAvatar(uploadResult.url ?? "");
      setPreviewImage(null);
      onUploadSuccess?.(uploadResult.url ?? "");

      // Refresh the page to update session data
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        <Avatar className="size-20">
          <AvatarImage
            src={previewImage ?? currentAvatar ?? undefined}
            alt={userName ?? userEmail ?? "头像"}
          />
          <AvatarFallback>
            {userName?.[0] ?? userEmail?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="text-white hover:bg-white/20"
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload button - only show on mobile or when not hovering */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleUploadClick}
        disabled={isUploading}
        className="mt-2 md:hidden"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            上传中...
          </>
        ) : (
          <>
            <Upload className="mr-2 size-4" />
            更换头像
          </>
        )}
      </Button>
    </div>
  );
}
