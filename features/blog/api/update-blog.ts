import { useRequest } from "ahooks";
import { toast } from "sonner";

import { toggleBlogPublished, updateBlog } from "../actions";

export const useUpdateBlog = () => {
  return useRequest(updateBlog, {
    manual: true,
    loadingDelay: 300,
    onSuccess(result) {
      if (result.success) {
        toast.success("博客已更新");
      } else {
        toast.error(`博客更新失败: ${result.error}`);
      }
    },
    onError(error) {
      toast.error(`博客更新失败: ${error.message}`);
    },
  });
};

export const useToggleBlogPublish = () => {
  return useRequest(toggleBlogPublished, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("博客发布状态已更新");
    },
    onError(error) {
      toast.error(`博客发布状态更新失败: ${error.message}`);
    },
  });
};
