import { useRequest } from "ahooks";
import { toast } from "sonner";

import { deleteBlogByID } from "../actions";

export const useDeleteBlog = () => {
  return useRequest(deleteBlogByID, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("博客已删除");
    },
    onError(error) {
      toast.error(`博客删除失败: ${error.message}`);
    },
  });
};
