import { memo } from "react";
import type { Enrollment } from "../../types";
import { CertificateCard } from "./CertificateCard";

interface CertificatesGridViewProps {
  certificates: Enrollment[];
}

export const CertificatesGridView = memo(function CertificatesGridView({
  certificates,
}: CertificatesGridViewProps) {
  if (certificates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <i className="ri-award-line text-4xl text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-700">No certificates issued yet</p>
        <p className="text-xs text-gray-400 mt-1">
          When learners complete courses with issued certification enabled, their credentials will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {certificates.map((cert) => (
        <CertificateCard key={cert.id} enrollment={cert} />
      ))}
    </div>
  );
});
