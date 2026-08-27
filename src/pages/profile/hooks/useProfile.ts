import { useProfileData } from "./useProfileData";
import { useProfileMutations } from "./useProfileMutations";
import { calculateTenure, getUserInitials } from "../profileUtils";

export function useProfile() {
  const data = useProfileData();

  const mutations = useProfileMutations({
    employee: data.employee,
    setEmployee: data.setEmployee,
    displayName: data.displayName,
    phone: data.phone,
  });

  const tenure = calculateTenure(data.employee?.join_date);
  const initials = getUserInitials(data.displayName, data.user?.email);

  return {
    ...data,
    ...mutations,
    tenure,
    initials,
  };
}
