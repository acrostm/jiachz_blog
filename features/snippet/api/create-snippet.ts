import { useRequest } from "ahooks";
import { toast } from "sonner";

import { createSnippet } from "../actions";

export const useCreateSnippet = () => {
  return useRequest(createSnippet, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("片段已创建");
    },
    onError(error) {
      toast.error(`片段创建失败: ${error.message}`);
    },
  });
};
