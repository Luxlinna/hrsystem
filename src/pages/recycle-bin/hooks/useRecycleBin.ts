import { usePermissions } from "@/hooks/usePermissions";
import { useRecycleBinData } from "./useRecycleBinData";
import { useRecycleBinMutations } from "./useRecycleBinMutations";

export function useRecycleBin() {
  const { isAdmin } = usePermissions();
  const data = useRecycleBinData();
  const mutations = useRecycleBinMutations({
    isAdmin,
    loadItems: data.loadItems,
  });

  return {
    isAdmin,
    ...data,
    ...mutations,
  };
}
