
import { supabase } from '@/integrations/supabase/client';
import { SiteContent, Notification, BelgianCity } from '@/types';

export async function getSiteContent(contentId: string): Promise<SiteContent | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_site_content', { content_id: contentId });
      
    if (error) {
      console.error("Error fetching site content:", error);
      throw error;
    }
    
    return data as SiteContent;
  } catch (error) {
    console.error(`Error in getSiteContent for ${contentId}:`, error);
    return null;
  }
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_notifications', { user_id: userId });
      
    if (error) {
      console.error("Error fetching user notifications:", error);
      throw error;
    }
    
    return data as Notification[] || [];
  } catch (error) {
    console.error(`Error in getUserNotifications for ${userId}:`, error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .rpc('mark_notification_as_read', { notification_id: notificationId });
      
    if (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in markNotificationAsRead for ${notificationId}:`, error);
    return false;
  }
}

export async function getBelgianCities(): Promise<BelgianCity[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_belgian_cities');
      
    if (error) {
      console.error("Error fetching Belgian cities:", error);
      throw error;
    }
    
    return data as BelgianCity[] || [];
  } catch (error) {
    console.error("Error in getBelgianCities:", error);
    return [];
  }
}

export async function getNearestCities(latitude: number, longitude: number, limit: number = 10): Promise<BelgianCity[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_nearest_cities', { 
        user_lat: latitude, 
        user_long: longitude,
        result_limit: limit
      });
      
    if (error) {
      console.error("Error fetching nearest cities:", error);
      throw error;
    }
    
    return data as BelgianCity[] || [];
  } catch (error) {
    console.error("Error in getNearestCities:", error);
    return [];
  }
}
