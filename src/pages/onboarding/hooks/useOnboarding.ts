import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabase";
import { useOnboardingData } from "./useOnboardingData";
import { useOnboardingCalculations } from "./useOnboardingCalculations";
import { useOnboardingFilters } from "./useOnboardingFilters";
import { useOnboardingMutations } from "./useOnboardingMutations";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";

export function useOnboarding() {
  const { user } = useAuth();
  const { role } = usePermissions();

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

  const actorName =
    currentEmployeeName ||
    (user?.user_metadata?.display_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : "") ||
    (user?.email ? user.email.split("@")[0] : "Admin User");

  // 1. Filters hook
  const filters = useOnboardingFilters([], []);

  // 2. Data hook
  const data = useOnboardingData((id) => {
    filters.setStatusFilter("all");
    filters.setStageFilter("all");
    filters.setExpandedRequest(id);
  });

  // Re-run filter hook with real requests and documents
  const dynamicFilters = useOnboardingFilters(data.requests, data.documents);

  // 3. Calculations hook
  const calculations = useOnboardingCalculations(
    data.requests,
    data.documents,
    data.employees,
    ""
  );

  // 4. Mutations hook
  const mutations = useOnboardingMutations({
    requests: data.requests,
    documents: data.documents,
    employees: data.employees,
    actorName,
    roleName: role?.name,
    loadData: data.loadData,
    setRequests: data.setRequests,
    setExpandedRequest: dynamicFilters.setExpandedRequest,
    getDocsForRequestAndStage: calculations.getDocsForRequestAndStage,
  });

  // Calculations with mutations' empSearch
  const dynamicCalculations = useOnboardingCalculations(
    data.requests,
    data.documents,
    data.employees,
    mutations.empSearch
  );

  return {
    user,
    role,
    actorName,
    ...data,
    ...dynamicFilters,
    ...dynamicCalculations,
    ...mutations,
  };
}
