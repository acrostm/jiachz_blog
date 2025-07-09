import { useRequest } from "ahooks";
import { toast } from "sonner";

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
        toast.success("用户已删除");
      },
      onError(error) {
        toast.error(`用户删除失败: ${error.message}`);
      },
    },
  );
};
