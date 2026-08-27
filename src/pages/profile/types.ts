export interface MyEmployee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  join_date: string;
  phone: string | null;
  reports_to: string | null;
  branches: { name: string } | null;
}

export interface DirectReport {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
}
