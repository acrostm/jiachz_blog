import { useRequest } from "ahooks";
import { toast } from "sonner";

import { toggleSnippetPublished, updateSnippet } from "../actions";

export const useUpdateSnippet = () => {
  return useRequest(updateSnippet, {
    manual: true,
    loadingDelay: 300,
    onSuccess(result) {
      if (result.success) {
        toast.success("片段已更新");
      } else {
        toast.error(`片段更新失败: ${result.error}`);
      }
    },
    onError(error) {
      toast.error(`片段更新失败: ${error.message}`);
    },
  });
};

export const useToggleSnippetPublish = () => {
  return useRequest(toggleSnippetPublished, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("片段发布状态已更新");
    },
    onError(error) {
      toast.error(`片段发布状态更新失败: ${error.message}`);
    },
  });
};
