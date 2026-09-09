import { useState, useEffect, useRef } from "react";
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
      .limit(1)
      .then(({ data: rows }) => {
        const data = rows && rows.length > 0 ? rows[0] : null;
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

  const highlightHandlerRef = useRef<(id: string) => void>(() => {});
  const data = useOnboardingData((id) => highlightHandlerRef.current(id));
  const filters = useOnboardingFilters(data.requests, data.documents);
  highlightHandlerRef.current = (id: string) => {
    filters.setStatusFilter("all");
    filters.setStageFilter("all");
    filters.setExpandedRequest(id);
  };

  const mutations = useOnboardingMutations({
    requests: data.requests,
    documents: data.documents,
    employees: data.employees,
    actorName,
    roleName: role?.name,
    loadData: data.loadData,
    setRequests: data.setRequests,
    setExpandedRequest: filters.setExpandedRequest,
    getDocsForRequestAndStage: (reqId: string, stageKey: string) =>
      data.documents.filter((d) => d.onboarding_request_id === reqId && d.stage === stageKey),
  });

  const calculations = useOnboardingCalculations(
    data.requests,
    data.documents,
    data.employees,
    mutations.empSearch,
    data.allRequests
  );

  return {
    user,
    role,
    actorName,
    ...data,
    ...filters,
    ...calculations,
    ...mutations,
  };
}
