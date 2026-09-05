import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useChecklistData } from "./useChecklistData";
import { useChecklistCalculations } from "./useChecklistCalculations";
import { useChecklistFilters } from "./useChecklistFilters";
import { useChecklistMutations } from "./useChecklistMutations";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";

export function useOnboardingChecklist() {
  const { user } = useAuth();
  const [currentEmployeeName, setCurrentEmployeeName] = useState<string>("");

  useEffect(() => {
    if (!user?.email) return;
    const empQuery = applyUserEmployeeFilter(
      supabase
        .from("employees")
        .select("first_name, last_name, role"),
      user.email
    );
    empQuery
      .maybeSingle()
      .then(({ data }) => {
        if (data && (data.first_name || data.last_name)) {
          setCurrentEmployeeName(`${data.first_name} ${data.last_name}`.trim());
        }
      });
  }, [user?.email]);

  const completerName =
    currentEmployeeName ||
    (user?.user_metadata?.display_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : "") ||
    (user?.email ? user.email.split("@")[0] : "HR Manager");

  // 1. Data hook
  const data = useChecklistData();

  // 2. Calculations hook
  const calculations = useChecklistCalculations(data.selectedHire, data.tasks);

  // 3. Filters hook
  const filters = useChecklistFilters(data.hires, calculations.hireTasks);

  // 4. Mutations hook
  const mutations = useChecklistMutations({
    selectedHire: data.selectedHire,
    hireTasks: calculations.hireTasks,
    completerName,
    isTaskLocked: calculations.isTaskLocked,
    loadData: data.loadData,
    setTasks: data.setTasks,
    setSelectedHire: data.setSelectedHire,
    setHires: data.setHires,
  });

  return {
    user,
    completerName,
    ...data,
    ...calculations,
    ...filters,
    ...mutations,
  };
}
