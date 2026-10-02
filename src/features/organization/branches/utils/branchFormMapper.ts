import type { Branch, BranchFormState } from "../types";

export function branchToFormState(branch: Branch): BranchFormState {
  return {
    name: branch.name,
    location: branch.location,
    manager_name: branch.manager_name,
    status: branch.status,
    latitude: branch.latitude != null ? String(branch.latitude) : "",
    longitude: branch.longitude != null ? String(branch.longitude) : "",
    geofence_radius_m: branch.geofence_radius_m != null ? String(branch.geofence_radius_m) : "100",
    work_start_time: branch.work_start_time || "",
    work_end_time: branch.work_end_time || "",
    late_grace_minutes: branch.late_grace_minutes != null ? String(branch.late_grace_minutes) : "15",
    early_leave_grace_minutes: branch.early_leave_grace_minutes != null ? String(branch.early_leave_grace_minutes) : "15",
    morning_check_in_start: branch.morning_check_in_start ? branch.morning_check_in_start.slice(0, 5) : "06:00",
    morning_check_in_end: branch.morning_check_in_end ? branch.morning_check_in_end.slice(0, 5) : "09:00",
    morning_check_out_start: branch.morning_check_out_start ? branch.morning_check_out_start.slice(0, 5) : "10:00",
    morning_check_out_end: branch.morning_check_out_end ? branch.morning_check_out_end.slice(0, 5) : "12:00",
    afternoon_check_in_start: branch.afternoon_check_in_start ? branch.afternoon_check_in_start.slice(0, 5) : "12:00",
    afternoon_check_in_end: branch.afternoon_check_in_end ? branch.afternoon_check_in_end.slice(0, 5) : "14:00",
    afternoon_check_out_start: branch.afternoon_check_out_start ? branch.afternoon_check_out_start.slice(0, 5) : "16:00",
    afternoon_check_out_end: branch.afternoon_check_out_end ? branch.afternoon_check_out_end.slice(0, 5) : "18:00",

    // 1. Company Info
    logo_url: branch.logo_url || "",
    company_name: branch.company_name || branch.name || "",
    registration_no: branch.registration_no || "",
    vat_no: branch.vat_no || "",
    industry: branch.industry || "",
    currency: branch.currency || "USD",
    rounding_digit: branch.rounding_digit != null ? String(branch.rounding_digit) : "2",

    // 2. Physical Address Info
    physical_address: branch.physical_address || branch.location || "",
    physical_city: branch.physical_city || "Phnom Penh",
    physical_province: branch.physical_province || "",
    physical_postal_code: branch.physical_postal_code || "",
    physical_country: branch.physical_country || "Cambodia",

    // 3. Mailing Address Info
    mailing_address: branch.mailing_address || branch.physical_address || branch.location || "",
    mailing_city: branch.mailing_city || "Phnom Penh",
    mailing_province: branch.mailing_province || "",
    mailing_postal_code: branch.mailing_postal_code || "",
    mailing_country: branch.mailing_country || "Cambodia",

    // 4. Contact Info
    phone_number: branch.phone_number || "",
    email: branch.email || "",
    website: branch.website || "",

    // 5. Legal Info
    legal_tax_number: branch.legal_tax_number || "",
    legal_name: branch.legal_name || "",
    legal_business_activity: branch.legal_business_activity || "",
    legal_address: branch.legal_address || "",
    legal_phone_number: branch.legal_phone_number || "",
    legal_email: branch.legal_email || "",
  };
}
