
export type UserType = "elderly" | "helper";

export type TaskType = "groceries" | "cooking" | "gardening" | "technology" | "accompaniment";

export interface Task {
  id: string;
  type: TaskType;
  keywords: string[];
  location: string;
  requestedBy: string;
  requestedByName: string;
  requestedDate: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
  helperAssigned: string;
  notificationSent?: boolean;
}

export interface KeywordOption {
  value: string;
  label: string;
}

export interface City {
  name: string;
  distance?: number;
}

export interface SiteContent {
  id?: string;
  key: string;
  content: string;
  last_updated?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  related_task_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface HelperPoints {
  helper_id: string;
  points: number;
  updated_at: string;
}
