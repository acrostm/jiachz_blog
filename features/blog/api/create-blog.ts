import { useRequest } from "ahooks";
import { toast } from "sonner";

import { createBlog } from "../actions";

export const useCreateBlog = () => {
  return useRequest(createBlog, {
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
