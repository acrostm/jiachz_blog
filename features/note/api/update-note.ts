import { useRequest } from "ahooks";
import { toast } from "sonner";

import { toggleNotePublished, updateNote } from "../actions";

export const useUpdateNote = () => {
  return useRequest(updateNote, {
    manual: true,
    loadingDelay: 300,
    onSuccess(result) {
      if (result.success) {
        toast.success("笔记已更新");
      } else {
        toast.error(`笔记更新失败: ${result.error}`);
      }
    },
    onError(error) {
      toast.error(`笔记更新失败: ${error.message}`);
    },
  });
};

export const useToggleNotePublish = () => {
  return useRequest(toggleNotePublished, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("笔记发布状态已更新");
    },
    onError(error) {
      toast.error(`笔记更新失败: ${error.message}`);
    },
  });
};
