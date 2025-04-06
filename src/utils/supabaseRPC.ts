
import { supabase } from "@/integrations/supabase/client";
import { SiteContent, Notification, BelgianCity, Task, DbTask } from "@/types";
import { adaptTaskFromDb } from "./taskAdapter";

// Site content operations
export async function getSiteContent(key: string): Promise<SiteContent | null> {
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("key", key)
    .single();

  if (error) {
    console.error(`Error fetching ${key} content:`, error);
    return null;
  }

  return data;
}

// Helper points operations
export async function getHelperPoints(helperId: string): Promise<number> {
  const { data, error } = await supabase
    .from("helper_points")
    .select("points")
    .eq("helper_id", helperId)
    .single();

  if (error) {
    console.error("Error fetching helper points:", error);
    return 0;
  }

  return data?.points || 0;
}

export async function updateHelperPoints(helperId: string, points: number): Promise<boolean> {
  const { error } = await supabase
    .from("helper_points")
    .upsert({ helper_id: helperId, points })
    .single();

  if (error) {
    console.error("Error updating helper points:", error);
    return false;
  }

  return true;
}

// Notifications operations
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }

  return true;
}

export async function createNotification(
  userId: string,
  message: string,
  relatedTaskId?: string
): Promise<boolean> {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      message,
      related_task_id: relatedTaskId,
    });

  if (error) {
    console.error("Error creating notification:", error);
    return false;
  }

  return true;
}

// Tasks operations
export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return (data || []).map(adaptTaskFromDb);
}

export async function getTasksByUser(userId: string, type: "requestedBy" | "helperAssigned"): Promise<Task[]> {
  const dbField = type === "requestedBy" ? "requested_by" : "helper_assigned";
  
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq(dbField, userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching tasks for user ${userId}:`, error);
    return [];
  }

  return (data || []).map(adaptTaskFromDb);
}

export async function createTask(task: Task): Promise<Task | null> {
  const dbTask = adaptTaskToDb(task);
  
  const { data, error } = await supabase
    .from("tasks")
    .insert(dbTask)
    .select()
    .single();

  if (error) {
    console.error("Error creating task:", error);
    return null;
  }

  return adaptTaskFromDb(data);
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
  // Convert camelCase properties to snake_case for DB
  const dbUpdates: Record<string, any> = {};
  
  if (updates.helperAssigned !== undefined) dbUpdates.helper_assigned = updates.helperAssigned;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.keywords !== undefined) dbUpdates.keywords = updates.keywords;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.requestedDate !== undefined) dbUpdates.requested_date = updates.requestedDate;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update(dbUpdates)
    .eq("id", taskId);

  if (error) {
    console.error("Error updating task:", error);
    return false;
  }

  return true;
}
