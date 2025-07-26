import { useRequest } from "ahooks";
import { toast } from "sonner";

import { type CreateBlogDTO } from "../types";

interface BlogAPIResponse {
  success: boolean;
  error?: string;
  blog?: unknown;
}

const createBlogAPI = async (data: CreateBlogDTO): Promise<BlogAPIResponse> => {
  const response = await fetch("/api/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = (await response.json()) as BlogAPIResponse;

  if (!response.ok) {
    throw new Error(result.error ?? "创建博客失败");
  }

  return result;
};

export const useCreateBlog = () => {
  return useRequest(createBlogAPI, {
    manual: true,
    loadingDelay: 300,
    onSuccess(result) {
      if (result.success) {
        toast.success("博客创建成功");
      } else {
        toast.error(`博客创建失败: ${result.error}`);
      }
    },
    onError(error) {
      toast.error(`博客创建失败: ${error.message}`);
    },
  });
};
