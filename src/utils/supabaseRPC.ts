
import { supabase } from "@/integrations/supabase/client";
import { SiteContent, Notification, Task, DbTask, HelperPoints } from "@/types";
import { adaptTaskFromDb } from "./taskAdapter";

// Site content operations
export async function getSiteContent(key: string): Promise<SiteContent | null> {
  try {
    const { data, error } = await supabase
      .from("site_content")
      .select("*")
      .eq("key", key)
      .single();

    if (error) {
      console.error(`Error fetching ${key} content:`, error);
      return null;
    }

    return data as SiteContent;
  } catch (error) {
    console.error(`Error in getSiteContent:`, error);
    return null;
  }
}

// Helper points operations
export async function getHelperPoints(helperId: string): Promise<number> {
  try {
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
  } catch (error) {
    console.error(`Error in getHelperPoints:`, error);
    return 0;
  }
}

export async function updateHelperPoints(helperId: string, points: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("helper_points")
      .upsert({ helper_id: helperId, points })
      .single();

    if (error) {
      console.error("Error updating helper points:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in updateHelperPoints:`, error);
    return false;
  }
}

// Notifications operations
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data as Notification[] || [];
  } catch (error) {
    console.error(`Error in getUserNotifications:`, error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in markNotificationAsRead:`, error);
    return false;
  }
}

export async function createNotification(
  userId: string,
  message: string,
  relatedTaskId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        message,
        related_task_id: relatedTaskId,
        is_read: false
      });

    if (error) {
      console.error("Error creating notification:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in createNotification:`, error);
    return false;
  }
}

// Tasks operations
export async function getTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }

    return (data || []).map(adaptTaskFromDb);
  } catch (error) {
    console.error(`Error in getTasks:`, error);
    return [];
  }
}

export async function getTasksByUser(userId: string, type: "requestedBy" | "helperAssigned"): Promise<Task[]> {
  const dbField = type === "requestedBy" ? "requested_by" : "helper_assigned";
  
  try {
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
  } catch (error) {
    console.error(`Error in getTasksByUser:`, error);
    return [];
  }
}

export async function createTask(task: Task): Promise<Task | null> {
  try {
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

    return adaptTaskFromDb(data as DbTask);
  } catch (error) {
    console.error(`Error in createTask:`, error);
    return null;
  }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
  try {
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
  } catch (error) {
    console.error(`Error in updateTask:`, error);
    return false;
  }
}
