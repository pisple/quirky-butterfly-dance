import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "@/types";
import { getUserNotifications, markNotificationAsRead } from "@/utils/supabaseRPC";

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Load user notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await getUserNotifications(user.id);
        setNotifications(data);
      } catch (error) {
        console.error("Error loading notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Subscribe to notification changes
    const notificationsSubscription = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          // Add new notification to the list
          setNotifications(prev => [payload.new as Notification, ...prev]);
          
          // Show toast notification
          toast({
            title: "New notification",
            description: (payload.new as Notification).message,
          });
        }
      )
      .subscribe();
      
    return () => {
      // Unsubscribe when component unmounts
      supabase.removeChannel(notificationsSubscription);
    };
  }, [user?.id, toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      const success = await markNotificationAsRead(notificationId);

      if (success) {
        // Update local state
        setNotifications(
          notifications.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    try {
      // For each unread notification, mark it as read
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification.id);
      }

      // Update local state
      setNotifications(
        notifications.map(n => ({ ...n, is_read: true }))
      );
      
      toast({
        title: "Notifications",
        description: "All notifications have been marked as read.",
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-gray-50";
    
    switch (type) {
      case "task_accepted":
        return "bg-blue-50";
      case "task_completed":
        return "bg-green-50";
      case "points_earned":
        return "bg-yellow-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-red-500 p-0 text-white text-xs rounded-full"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={loading}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b ${getNotificationBgColor(
                  notification.type,
                  notification.is_read
                )}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm ${notification.is_read ? "text-gray-600" : "font-medium"}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check size={14} />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
