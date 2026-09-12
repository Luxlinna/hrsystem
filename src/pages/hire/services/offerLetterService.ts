/**
 * Offer Letter Service
 * 
 * Modular recruitment offer letter domain decomposed into focused sub-services:
 * - offerStorage: Local storage caching, remote Supabase sync, CRUD operations (<170 lines)
 * - offerProposalService: Salary proposal generation and initial routing (<160 lines)
 * - offerSignatories: Signatory data structures and role resolvers (<50 lines)
 * - offerApprovalNotifications: Multi-channel notifications for executive tiers (<100 lines)
 * - offerApprovalService: 4-tier executive approval workflow pipeline (<160 lines)
 * - offerDecisionService: Official issuance & candidate acceptance/rejection (<190 lines)
 */

export * from "./offers/offerStorage";
export * from "./offers/offerProposalService";
export * from "./offers/offerSignatories";
export * from "./offers/offerApprovalNotifications";
export * from "./offers/offerApprovalService";
export * from "./offers/offerDecisionService";
