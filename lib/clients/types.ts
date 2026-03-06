export type ClientStatus = "new" | "active" | "completed" | "archived";

export type Client = {
  id: string;
  org_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
