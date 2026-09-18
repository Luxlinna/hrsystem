import type { Candidate } from "@/pages/hire/types";

export type CandidateLike = Partial<Candidate> & { id: string; full_name: string };
