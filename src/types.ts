
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
  helperAssigned?: string;
}

export interface KeywordOption {
  value: string;
  label: string;
}

export interface City {
  name: string;
  distance?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  type: UserType;
  location?: string;
  email?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface HelperPoints {
  helper_id: string;
  points: number;
  updated_at: string;
}
