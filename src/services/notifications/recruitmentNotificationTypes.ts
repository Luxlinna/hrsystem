import type { Candidate } from "@/features/talent-recruitment/hire/types";

export type CandidateLike = Partial<Candidate> & { id: string; full_name: string };
