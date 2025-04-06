
export type UserType = "elderly" | "helper";

export type TaskType = "groceries" | "cooking" | "gardening" | "technology" | "accompaniment";

export interface Task {
  id: string;
  type: TaskType;
  keywords: string[];
  location: string;
  requestedBy: string;
  requestedByName?: string;
  requestedDate: string;
  status: "pending" | "waiting_approval" | "assigned" | "completed" | "cancelled";
  helperAssigned?: string;
  notificationSent?: boolean;
}

export interface City {
  name: string;
  distance?: number;
}

export interface KeywordOption {
  value: string;
  label: string;
}

// New interfaces for Supabase tables
export interface DbTask {
  id: string;
  type: string;
  keywords: string[];
  location: string;
  requested_by: string;
  requested_date: string;
  status: string;
  helper_assigned?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  related_task_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SiteContent {
  id: string;
  key: string;
  content: string;
  last_updated: string;
}

export interface HelperPoints {
  helper_id: string;
  points: number;
  updated_at: string;
}

export interface BelgianCity {
  name: string;
  latitude: number;
  longitude: number;
}
