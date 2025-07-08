import { useRequest } from "ahooks";
import { toast } from "sonner";

import { createTag } from "../actions";

export const useCreateTag = () => {
  return useRequest(createTag, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("标签已创建");
    },
    onError(error) {
      toast.error(`标签创建失败: ${error.message}`);
    },
  });
};
