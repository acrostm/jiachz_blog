import { useRequest } from "ahooks";

import { showErrorToast, showSuccessToast } from "@/components/ui/toast";

export const useDeleteUser = () => {
  return useRequest(
    async (id: string) => {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "删除失败",
        );
      }
      return data;
    },
    {
      manual: true,
      loadingDelay: 300,
      onSuccess() {
        showSuccessToast("用户已删除");
      },
      onError(error) {
        showErrorToast(
          `用户删除失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      },
    },
  );
};
