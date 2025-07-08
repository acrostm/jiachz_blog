import { useRequest } from "ahooks";
import { toast } from "sonner";

import { createNote } from "../actions";

export const useCreateNote = () => {
  return useRequest(createNote, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("笔记创建成功");
    },
    onError(error) {
      toast.error(`笔记创建失败: ${error.message}`);
    },
  });
};
