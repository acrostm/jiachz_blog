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

const getImageInfo = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const typeInfo = await imageType(new Uint8Array(buffer));

  return {
    info: typeInfo,
    isImage: Boolean(typeInfo),
    isGif: typeInfo ? typeInfo.ext === "gif" : false,
    isWebp: typeInfo ? typeInfo.ext === "webp" : false,
  };
};

const compressImage = async (file: File): Promise<Buffer> => {
  const buffer = await file.arrayBuffer();
  const { isGif, isImage, isWebp } = await getImageInfo(file);

  // 如果不是图片，或者已经是 WebP 格式，直接返回原始文件数据
  if (!isImage || isWebp) {
    return Buffer.from(buffer);
  }

  // 如果是 GIF 动图，设置 animated 为 true
  const options = isGif ? { animated: true } : {};

  try {
    // 使用 sharp 将图像转换为 WebP 格式
    return await sharp(Buffer.from(buffer), options)
      .webp({ quality: 66, lossless: false }) // 设置质量和无损/有损压缩
      .toBuffer();
  } catch (error) {
    throw new Error(`Failed to compress image`);
  }
};

const uploadToR2 = async (
  file: File,
  compressedFile: Buffer,
  useWebp: boolean,
  upload_dir: string,
) => {
  // 使用 WebP 格式时，手动设置扩展名为 .webp
  const fileExtension = useWebp ? ".webp" : path.extname(file.name);

  const key = `${upload_dir}${new Date().toISOString().split("T")[0]}/${
    createCuid() + fileExtension
  }`;

  const uploadParams = {
    Bucket: R2_BUCKET,
    Key: key,
    Body: compressedFile,
    // 根据实际的压缩格式来确定 Content-Type
    ContentType: useWebp ? "image/webp" : getContentType(file.name),
  };

  const command = new PutObjectCommand(uploadParams);
  await s3.send(command);

  return `https://r2.jiachz.com/${key}`;
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

export const uploadFile = async (
  formData: FormData,
): Promise<{ error?: string; url?: string }> => {
  const userId = await getCurrentUserId();

  if (await noPermission()) {
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

  // Get file from formData
  const file = formData.get("file") as File;
  if (!file) {
    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "FAILED",
      "unknown",
      { reason: "没有找到文件" },
      "No file found",
    );
    return { error: "No file found" };
  }

  const { isImage, isWebp } = await getImageInfo(file);
  if (!isImage) {
    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "FAILED",
      file.name,
      {
        fileName: file.name,
        fileSize: file.size,
        reason: "不是图片文件",
      },
      "Uploaded file is not an image",
    );
    return { error: "Uploaded file is not an image" };
  }

  const fileSize = file.size;
  const sizeLimit = 1024 * 1024 * 30; // 30MB

  if (fileSize > sizeLimit) {
    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "FAILED",
      file.name,
      {
        fileName: file.name,
        fileSize,
        sizeLimit,
        reason: "文件大小超出限制",
      },
      "File size too large",
    );
    return { error: "File size too large" };
  }

  if (!(isWebp || fileSize < 1024 * 1024)) {
    try {
      const compressedFile = await compressImage(file);
      const uploadedUrl = await uploadToR2(
        file,
        compressedFile,
        true,
        R2_UPLOAD_DIR ?? "uploads/",
      ); // 使用 WebP 格式

      await logFileActivity(userId, "FILE_UPLOAD", "SUCCESS", file.name, {
        fileName: file.name,
        originalSize: fileSize,
        compressedSize: compressedFile.length,
        uploadUrl: uploadedUrl,
        compressed: true,
        format: "webp",
      });

      return { url: uploadedUrl };
    } catch (error) {
      await logFileActivity(
        userId,
        "FILE_UPLOAD",
        "FAILED",
        file.name,
        {
          fileName: file.name,
          fileSize,
          reason: "压缩或上传失败",
        },
        "Upload failed",
      );
      return { error: "Upload failed" };
    }
  } else {
    try {
      const uploadedUrl = await uploadToR2(
        file,
        Buffer.from(await file.arrayBuffer()),
        false,
        R2_UPLOAD_DIR ?? "uploads/",
      );

      await logFileActivity(userId, "FILE_UPLOAD", "SUCCESS", file.name, {
        fileName: file.name,
        fileSize,
        uploadUrl: uploadedUrl,
        compressed: false,
        format: isWebp ? "webp" : "original",
      });

      return { url: uploadedUrl };
    } catch (error) {
      await logFileActivity(
        userId,
        "FILE_UPLOAD",
        "FAILED",
        file.name,
        {
          fileName: file.name,
          fileSize,
          reason: "上传失败",
        },
        "Upload failed",
      );
      return { error: "Upload failed" };
    }
  }
};

export const uploadAvatar = async (
  formData: FormData,
): Promise<{ error?: string; url?: string }> => {
  // 不做权限校验，注册时可用，但记录日志
  const userId = await getCurrentUserId();

  const file = formData.get("file") as File;
  if (!file) {
    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "FAILED",
      "unknown",
      { type: "avatar", reason: "没有找到文件" },
      "No file found",
    );
    return { error: "No file found" };
  }

  const { isImage, isWebp } = await getImageInfo(file);
  if (!isImage) {
    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "FAILED",
      file.name,
      {
        type: "avatar",
        fileName: file.name,
        fileSize: file.size,
        reason: "不是图片文件",
      },
      "Uploaded file is not an image",
    );
    return { error: "Uploaded file is not an image" };
  }

  const fileSize = file.size;
  const sizeLimit = 1024 * 1024 * 1; // 1MB

  if (fileSize > sizeLimit) {
    await logFileActivity(
      userId,
      "FILE_UPLOAD",
      "FAILED",
      file.name,
      {
        type: "avatar",
        fileName: file.name,
        fileSize,
        sizeLimit,
        reason: "头像文件大小超出限制",
      },
      "File size too large (max 1MB)",
    );
    return { error: "File size too large (max 1MB)" };
  }

  if (!(isWebp || fileSize < 1024 * 1024)) {
    try {
      const compressedFile = await compressImage(file);
      const uploadedUrl = await uploadToR2(
        file,
        compressedFile,
        true,
        "avatars/",
      ); // 使用 WebP 格式

      await logFileActivity(userId, "FILE_UPLOAD", "SUCCESS", file.name, {
        type: "avatar",
        fileName: file.name,
        originalSize: fileSize,
        compressedSize: compressedFile.length,
        uploadUrl: uploadedUrl,
        compressed: true,
        format: "webp",
      });

      return { url: uploadedUrl };
    } catch (error) {
      await logFileActivity(
        userId,
        "FILE_UPLOAD",
        "FAILED",
        file.name,
        {
          type: "avatar",
          fileName: file.name,
          fileSize,
          reason: "头像压缩或上传失败",
        },
        "Upload failed",
      );
      return { error: "Upload failed" };
    }
  } else {
    try {
      const uploadedUrl = await uploadToR2(
        file,
        Buffer.from(await file.arrayBuffer()),
        false,
        "avatars/",
      );

      await logFileActivity(userId, "FILE_UPLOAD", "SUCCESS", file.name, {
        type: "avatar",
        fileName: file.name,
        fileSize,
        uploadUrl: uploadedUrl,
        compressed: false,
        format: isWebp ? "webp" : "original",
      });

      return { url: uploadedUrl };
    } catch (error) {
      await logFileActivity(
        userId,
        "FILE_UPLOAD",
        "FAILED",
        file.name,
        {
          type: "avatar",
          fileName: file.name,
          fileSize,
          reason: "头像上传失败",
        },
        "Upload failed",
      );
      return { error: "Upload failed" };
    }
  }
};
