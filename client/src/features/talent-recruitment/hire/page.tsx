import { useState, useCallback, useEffect } from "react";
import { HireHeader } from "./components/HireHeader";
import { HireTabsBar } from "./components/HireTabsBar";
import { HireActiveTabContent } from "./components/HireActiveTabContent";
import { HirePageModals } from "./components/modals/HirePageModals";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { supabase } from "@/lib/supabase";
import { useHire } from "./hooks/useHire";
import { useOfferLetters } from "./hooks/useOfferLetters";
import type { JobDescriptionTemplate, HireTab } from "./types";

const TAB_ORDER: HireTab[] = [
  "actions",
  "requests",
  "jobs",
  "candidates",
  "interviews",
  "offers",
  "pipeline",
];

export default function HirePage() {
  const h = useHire();
  const offersManager = useOfferLetters(h.actorName, h.loadData);
  const [slideDirection, setSlideDirection] = useState<"right" | "left" | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showJdModal, setShowJdModal] = useState(false);
  const [showCvBankModal, setShowCvBankModal] = useState(false);
  const [jdTemplates, setJdTemplates] = useState<JobDescriptionTemplate[]>([]);

  const handleSetTab = useCallback(
    (newTab: HireTab) => {
      const prevIdx = TAB_ORDER.indexOf(h.tab);
      const nextIdx = TAB_ORDER.indexOf(newTab);
      setSlideDirection(nextIdx >= prevIdx ? "right" : "left");
      h.setTab(newTab);
    },
    [h]
  );

  const loadJdTemplates = useCallback(async () => {
    const { data } = await supabase.from("job_description_templates").select("*").order("title");
    setJdTemplates(data || []);
  }, []);

  useEffect(() => {
    loadJdTemplates();
  }, [loadJdTemplates]);

  if (h.loading && h.jobs.length === 0 && h.candidates.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading recruitment operations...</p>
      </div>
    );
  }

  if (h.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <HireHeader
          activeJobsCount={0}
          candidatesCount={0}
          activeTab={h.tab}
          canManage={false}
          onOpenCreateJob={() => {}}
          onOpenCreateCandidate={() => {}}
          onOpenCreateInterview={() => {}}
          onOpenCreateRequest={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Recruitment & Talent Acquisition"
          userBranchName={h.userBranchName}
          hasNoBranch={!h.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <HireHeader
        activeJobsCount={h.jobs.filter((j) => j.status === "active").length || h.jobs.length}
        candidatesCount={h.candidates.length}
        activeTab={h.tab}
        canManage={h.canRequest}
        canManageCandidates={h.isAdminOrRecruiter}
        onOpenCreateJob={h.openCreateJob}
        onOpenCreateCandidate={() => h.openCreateCandidate()}
        onOpenImportCandidates={h.isAdminOrRecruiter ? () => setShowImportModal(true) : undefined}
        onOpenCreateInterview={() => h.openCreateInterview()}
        onOpenCreateRequest={() => h.openCreateRequest()}
        onOpenManageJd={h.isSuperAdmin || h.isAdmin ? () => setShowJdModal(true) : undefined}
        onOpenCvBank={h.isSuperAdmin || h.isAdmin ? () => setShowCvBankModal(true) : undefined}
        candidates={h.candidates}
        jobs={h.jobs}
        interviews={h.interviews}
        requests={h.hiringRequests}
      />

      <HireTabsBar
        tab={h.tab}
        setTab={handleSetTab}
        jobsCount={h.jobs.length}
        candidatesCount={h.candidates.length}
        interviewsCount={h.interviews.length}
        requestsCount={h.hiringRequests.length}
        pendingRequestsCount={h.hiringRequests.length}
        actionsCount={h.recruitmentActions.counts.total}
        offersCount={offersManager.counts.pendingAction || offersManager.offers.length}
        isHrDivisionScope={h.isHrDivisionScope}
        isChairman={h.isChairman}
      />

      <HireActiveTabContent
        h={h}
        offersManager={offersManager}
        slideDirection={slideDirection}
        onOpenImportModal={() => setShowImportModal(true)}
      />

      <HirePageModals
        h={h}
        offersManager={offersManager}
        showImportModal={showImportModal}
        setShowImportModal={setShowImportModal}
        showJdModal={showJdModal}
        setShowJdModal={setShowJdModal}
        showCvBankModal={showCvBankModal}
        setShowCvBankModal={setShowCvBankModal}
        jdTemplates={jdTemplates}
        loadJdTemplates={loadJdTemplates}
      />
    </div>
  );
}
