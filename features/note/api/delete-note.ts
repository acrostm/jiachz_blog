import { useRequest } from "ahooks";
import { toast } from "sonner";

import { deleteNoteByID } from "../actions";

export const useDeleteNote = () => {
  return useRequest(deleteNoteByID, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("笔记已删除");
    },
    onError(error) {
      toast.error(`笔记删除失败: ${error.message}`);
    },
  });
};
