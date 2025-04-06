
import { Task, DbTask } from "@/types";

// Convert from database task to front-end task format
export const adaptTaskFromDb = (dbTask: DbTask): Task => {
  return {
    id: dbTask.id,
    type: dbTask.type as Task["type"],
    keywords: dbTask.keywords,
    location: dbTask.location,
    requestedBy: dbTask.requested_by,
    requestedDate: dbTask.requested_date,
    status: dbTask.status as Task["status"],
    helperAssigned: dbTask.helper_assigned || undefined,
  };
};

// Convert from front-end task to database format
export const adaptTaskToDb = (task: Task): DbTask => {
  return {
    id: task.id,
    type: task.type,
    keywords: task.keywords,
    location: task.location,
    requested_by: task.requestedBy,
    requested_date: task.requestedDate,
    status: task.status,
    helper_assigned: task.helperAssigned,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};
