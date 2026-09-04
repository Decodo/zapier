export type ErrorResponse = {
  status: string;
  message: string;
  errors?: unknown[];
};

export type ScrapingEntry = {
  content: unknown;
  status_code: number;
  url?: string;
  task_id: string;
  created_at: string;
  updated_at: string;
};

export type SyncResponse = {
  results: ScrapingEntry[];
};
