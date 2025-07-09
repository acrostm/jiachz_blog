import { useRequest } from "ahooks";
import { toast } from "sonner";

import { createSnippet } from "../actions";

export const useCreateSnippet = () => {
  return useRequest(createSnippet, {
    manual: true,
    loadingDelay: 300,
    onSuccess(result) {
      if (result.success) {
        toast.success("片段已创建");
      } else {
        toast.error(`片段创建失败: ${result.error}`);
      }
    },
    onError(error) {
      toast.error(`片段创建失败: ${error.message}`);
    },
  });
};
