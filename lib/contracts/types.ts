export type ContractStatus = "draft" | "sent" | "signed" | "completed" | "cancelled";

export type Contract = {
  id: string;
  org_id: string;
  client_id: string;
  title: string;
  value: number | null;
  service_date: string | null;
  status: ContractStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractWithClient = Contract & {
  client_name: string;
};
