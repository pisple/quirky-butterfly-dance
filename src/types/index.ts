
export type UserType = "elderly" | "helper";

export type TaskType = "groceries" | "cooking" | "gardening" | "technology" | "accompaniment";

export interface KeywordOption {
  value: string;
  label: string;
}

export interface City {
  name: string;
  distance?: number; // distance en kilomètres depuis la position de l'utilisateur
  latitude?: number;
  longitude?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  type: UserType;
  age?: number;
  location?: string;
  phone?: string;
  email: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Task {
  id: string;
  type: TaskType;
  keywords: string[];
  location: string;
  requestedBy: string;
  requestedByName: string;
  requestedDate: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
  helperAssigned?: string;
  
  // For database compatibility (snake_case)
  requested_by?: string;
  requested_date?: string;
  helper_assigned?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  related_task_id: string;
  is_read: boolean;
  created_at: string;
}

export interface SiteContent {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

export interface BelgianCity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  province: string;
}
