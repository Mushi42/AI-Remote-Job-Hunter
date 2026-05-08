export interface Job {
  _id: string;
  title: string;
  company: string;
  company_name?: string;        // enriched company name from n8n
  company_summary?: string;     // AI summary of the company
  location: string;
  url: string;
  apply_url: string;
  careers_url?: string;
  description: string;
  tags: string;
  source: string;
  salary: string;
  status: "new" | "applied" | "rejected" | "interview" | string;
  created_at: string;
  score: number;
  reason: string;
  email_subject: string;
  email_body: string;
  ai_processed_at: string;
  enriched_at?: string;
  // Company enrichment fields
  industry?: string;
  website?: string;
  linkedin?: string;
  hr_email_guess?: string;
  possible_hr_emails?: string[];
}

export interface GenerateEmailRequest {
  job: Job;
  resumeText: string;
}

export interface GenerateEmailResponse {
  subject: string;
  body: string;
  error?: string;
}
