import { useRequest } from "ahooks";
import { toast } from "sonner";

import { deleteTagByID } from "../actions";

export const useDeleteTag = () => {
  return useRequest(deleteTagByID, {
    manual: true,
    onSuccess() {
      toast.success("标签已删除");
    },
    onError(error) {
      toast.error(`标签删除失败: ${error.message}`);
    },
  });
};
