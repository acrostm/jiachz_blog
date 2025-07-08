import { useRequest } from "ahooks";
import { toast } from "sonner";

import { updateTag } from "../actions";

export const useUpdateTag = () => {
  return useRequest(updateTag, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("标签已更新");
    },
    onError(error) {
      toast.error(`标签更新失败: ${error.message}`);
    },
  });
};
