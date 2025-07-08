import { useRequest } from "ahooks";
import { toast } from "sonner";

import { deleteSnippetByID } from "../actions";

export const useDeleteSnippet = () => {
  return useRequest(deleteSnippetByID, {
    manual: true,
    loadingDelay: 300,
    onSuccess() {
      toast.success("片段已删除");
    },
    onError(error) {
      toast.error(`片段删除失败: ${error.message}`);
    },
  });
};
