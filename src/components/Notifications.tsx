
import { useState, useEffect } from "react";
import { Bell, Check, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getUserNotifications, markNotificationAsRead } from "@/utils/supabaseRPC";
import { Notification } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);
  
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const userNotifications = await getUserNotifications(user.id);
    setNotifications(userNotifications);
    setLoading(false);
  };
  
  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    for (const notification of notifications.filter(n => !n.is_read)) {
      await markNotificationAsRead(notification.id);
    }
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={loading}
            >
              <Check className="mr-1 h-4 w-4" /> Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-2 border-b p-4",
                    !notification.is_read && "bg-blue-50"
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">Aucune notification</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
