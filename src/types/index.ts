
export type UserType = "elderly" | "helper";

export type TaskType = "groceries" | "cooking";

export interface KeywordOption {
  value: string;
  label: string;
}

export interface City {
  name: string;
  distance?: number; // distance en kilomètres depuis la position de l'utilisateur
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
}
