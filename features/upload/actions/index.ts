"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import imageType from "image-type";
import path from "node:path";
import sharp from "sharp";

import { R2_BUCKET, R2_UPLOAD_DIR } from "@/config";

import { ERROR_NO_PERMISSION } from "@/constants";
import { noPermission } from "@/features/user";
import { createCuid } from "@/lib/cuid";
import { s3 } from "@/lib/r2-storage";
import {
  getCurrentUserId,
  logFileActivity,
} from "@/lib/utils/activity-logger-helper";

const ONE_MIB = 1024 * 1024;

type UploadResult = { error?: string; url?: string };

interface ImageInfo {
  buffer: Buffer;
  isImage: boolean;
  isGif: boolean;
  isWebp: boolean;
}

interface ImageUploadOptions {
  uploadDir: string;
  sizeLimit: number;
  sizeLimitError: string;
  metadataType?: string;
  sizeLimitReason: string;
  compressFailureReason: string;
  uploadFailureReason: string;
}

const getImageInfo = async (file: File): Promise<ImageInfo> => {
  const buffer = Buffer.from(await file.arrayBuffer());
  const typeInfo = await imageType(buffer);

  return {
    buffer,
    isImage: Boolean(typeInfo),
    isGif: typeInfo?.ext === "gif",
    isWebp: typeInfo?.ext === "webp",
  };
};

const compressImage = async (image: ImageInfo): Promise<Buffer> => {
  if (!image.isImage || image.isWebp) {
    return image.buffer;
  }

  try {
    return await sharp(image.buffer, image.isGif ? { animated: true } : {})
      .webp({ quality: 66, lossless: false })
      .toBuffer();
  } catch {
    throw new Error("Failed to compress image");
  }
};

const getContentType = (fileName: string): string => {
  const ext = path.extname(fileName).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
};

const uploadToR2 = async (
  file: File,
  body: Buffer,
  options: {
    useWebp: boolean;
    uploadDir: string;
  },
) => {
  const fileExtension = options.useWebp ? ".webp" : path.extname(file.name);
  const key = `${options.uploadDir}${new Date().toISOString().slice(0, 10)}/${
    createCuid() + fileExtension
  }`;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: options.useWebp ? "image/webp" : getContentType(file.name),
    }),
  );

  return `https://r2.jiachz.com/${key}`;
};

const withUploadType = (
  metadataType: string | undefined,
  metadata: Record<string, unknown>,
) => (metadataType ? { type: metadataType, ...metadata } : metadata);

const logUploadFailure = async (
  userId: string | null,
  fileName: string,
  metadataType: string | undefined,
  metadata: Record<string, unknown>,
  errorMessage: string,
) => {
  await logFileActivity(
    userId,
    "FILE_UPLOAD",
    "FAILED",
    fileName,
    withUploadType(metadataType, metadata),
    errorMessage,
  );
};

const handleImageUpload = async (
  formData: FormData,
  userId: string | null,
  options: ImageUploadOptions,
): Promise<UploadResult> => {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    await logUploadFailure(
      userId,
      "unknown",
      options.metadataType,
      { reason: "没有找到文件" },
      "No file found",
    );
    return { error: "No file found" };
  }

  const image = await getImageInfo(file);
  const baseMetadata = {
    fileName: file.name,
    fileSize: file.size,
  };

  if (!image.isImage) {
    await logUploadFailure(
      userId,
      file.name,
      options.metadataType,
      {
        ...baseMetadata,
        reason: "不是图片文件",
      },
      "Uploaded file is not an image",
    );
    return { error: "Uploaded file is not an image" };
  }

  if (file.size > options.sizeLimit) {
    await logUploadFailure(
      userId,
      file.name,
      options.metadataType,
      {
        ...baseMetadata,
        sizeLimit: options.sizeLimit,
        reason: options.sizeLimitReason,
      },
      options.sizeLimitError,
    );
    return { error: options.sizeLimitError };
  }

  const shouldCompress = !image.isWebp && file.size >= ONE_MIB;

  try {
    const body = shouldCompress ? await compressImage(image) : image.buffer;
    const uploadedUrl = await uploadToR2(file, body, {
      useWebp: shouldCompress,
      uploadDir: options.uploadDir,
    });

    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "SUCCESS",
      file.name,
      withUploadType(options.metadataType, {
        ...baseMetadata,
        ...(shouldCompress ? { originalSize: file.size } : {}),
        ...(shouldCompress ? { compressedSize: body.length } : {}),
        uploadUrl: uploadedUrl,
        compressed: shouldCompress,
        format: shouldCompress ? "webp" : image.isWebp ? "webp" : "original",
      }),
    );

    return { url: uploadedUrl };
  } catch {
    await logUploadFailure(
      userId,
      file.name,
      options.metadataType,
      {
        ...baseMetadata,
        reason: shouldCompress
          ? options.compressFailureReason
          : options.uploadFailureReason,
      },
      "Upload failed",
    );
    return { error: "Upload failed" };
  }
};

export const uploadFile = async (formData: FormData): Promise<UploadResult> => {
  const userId = await getCurrentUserId();
  const hasNoPermission = await noPermission();

  if (hasNoPermission) {
    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "BLOCKED",
      "unknown",
      { reason: "权限不足" },
      ERROR_NO_PERMISSION.message,
    );
    return { error: ERROR_NO_PERMISSION.message };
  }

  return handleImageUpload(formData, userId, {
    uploadDir: R2_UPLOAD_DIR ?? "uploads/",
    sizeLimit: 30 * ONE_MIB,
    sizeLimitError: "File size too large",
    sizeLimitReason: "文件大小超出限制",
    compressFailureReason: "压缩或上传失败",
    uploadFailureReason: "上传失败",
  });
};

export const uploadAvatar = async (
  formData: FormData,
): Promise<UploadResult> => {
  const userId = await getCurrentUserId();

  return handleImageUpload(formData, userId, {
    uploadDir: "avatars/",
    sizeLimit: ONE_MIB,
    sizeLimitError: "File size too large (max 1MB)",
    metadataType: "avatar",
    sizeLimitReason: "头像文件大小超出限制",
    compressFailureReason: "头像压缩或上传失败",
    uploadFailureReason: "头像上传失败",
  });
};
