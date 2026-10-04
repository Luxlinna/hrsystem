import { useState, useMemo } from "react";
import type { OfferLetter } from "../../../types";
import type { OfferMetrics } from "./OffersMetricsRow";

export function useOffersTabState(offers: OfferLetter[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const departments = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      if (o.department) set.add(o.department);
    });
    return Array.from(set);
  }, [offers]);

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = o.candidate_name.toLowerCase().includes(q);
        const matchTitle = o.job_title.toLowerCase().includes(q);
        const matchNum = o.offer_number.toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchNum) return false;
      }

      if (statusFilter !== "all") {
        if (statusFilter === "in_review") {
          if (
            ![
              "salary_proposal",
              "pending_bu_ceo",
              "pending_hr_manager",
              "pending_hr_director",
              "pending_chairwoman",
              "salary_approved",
              "draft_letter",
              "hr_review",
              "management_approval",
            ].includes(o.status)
          ) {
            return false;
          }
        } else if (statusFilter === "ready_to_issue") {
          if (o.status !== "approved") return false;
        } else if (o.status !== statusFilter) {
          return false;
        }
      }

      if (deptFilter !== "all" && o.department !== deptFilter) {
        return false;
      }

      return true;
    });
  }, [offers, search, statusFilter, deptFilter]);

  const metrics: OfferMetrics = useMemo(() => {
    const total = offers.length;
    const inReview = offers.filter((o) =>
      [
        "salary_proposal",
        "pending_bu_ceo",
        "pending_hr_manager",
        "pending_hr_director",
        "pending_chairwoman",
        "salary_approved",
        "draft_letter",
        "hr_review",
        "management_approval",
      ].includes(o.status)
    ).length;
    const readyToIssue = offers.filter((o) => o.status === "approved").length;
    const issued = offers.filter((o) => o.status === "issued").length;
    const accepted = offers.filter((o) => o.status === "accepted").length;
    const rejected = offers.filter((o) => o.status === "rejected").length;
    return { total, inReview, readyToIssue, issued, accepted, rejected };
  }, [offers]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    departments,
    filteredOffers,
    metrics,
  };
}
