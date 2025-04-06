import { Task } from "@/types";

// This function converts a database task to a Task object with properties for backward compatibility
export function adaptTaskFromDB(dbTask: any): Task {
  // Create a new object with camelCase properties
  const adaptedTask: Task = {
    id: dbTask.id,
    type: dbTask.type,
    keywords: dbTask.keywords || [],
    location: dbTask.location,
    requestedBy: dbTask.requested_by,
    requestedByName: dbTask.requestedByName || "", // Will be filled later if needed
    requestedDate: dbTask.requested_date,
    status: dbTask.status,
    helperAssigned: dbTask.helper_assigned,
    
    // Keep snake_case properties for direct database operations
    requested_by: dbTask.requested_by,
    requested_date: dbTask.requested_date,
    helper_assigned: dbTask.helper_assigned
  };
  
  return adaptedTask;
}

// This function converts an array of database tasks to an array of Task objects
export function adaptTasksFromDB(dbTasks: any[]): Task[] {
  return (dbTasks || []).map(adaptTaskFromDB);
}
