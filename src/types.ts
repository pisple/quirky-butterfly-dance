
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
}

export interface KeywordOption {
  value: string;
  label: string;
}

export interface City {
  name: string;
  distance?: number;
}
