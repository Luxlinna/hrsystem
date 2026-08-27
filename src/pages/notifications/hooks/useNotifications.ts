import { useNotificationsData } from "./useNotificationsData";
import { useNotificationsFilter } from "./useNotificationsFilter";
import { useNotificationsMutations } from "./useNotificationsMutations";

export function useNotifications() {
  const data = useNotificationsData();
  const filters = useNotificationsFilter(data.notifs, data.user?.id);
  const mutations = useNotificationsMutations({
    setNotifs: data.setNotifs,
    visibleNotifs: filters.visibleNotifs,
    can: filters.can,
  });

  return {
    ...data,
    ...filters,
    ...mutations,
  };
}
