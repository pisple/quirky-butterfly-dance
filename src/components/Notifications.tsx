
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

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Charger les notifications de l'utilisateur
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // On utilise une requête SQL brute pour cette table qui n'est pas dans le typage
        const { data, error } = await supabase
          .rpc('get_user_notifications', { user_id: user.id })
          .limit(10);

        if (error) {
          throw error;
        }

        if (data) {
          setNotifications(data as Notification[]);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // S'abonner aux modifications de notifications
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
          // Ajouter la nouvelle notification à la liste
          setNotifications(prev => [payload.new as Notification, ...prev]);
          
          // Afficher une notification toast
          toast({
            title: "Nouvelle notification",
            description: (payload.new as Notification).message,
          });
        }
      )
      .subscribe();
      
    return () => {
      // Se désabonner lorsque le composant est démonté
      supabase.removeChannel(notificationsSubscription);
    };
  }, [user?.id, toast]);

  const markAsRead = async (notificationId: string) => {
    try {
      // On utilise une requête SQL brute pour cette table qui n'est pas dans le typage
      const { error } = await supabase
        .rpc('mark_notification_as_read', { notification_id: notificationId });

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setNotifications(
        notifications.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error);
    }
  };

  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    try {
      // On utilise une requête SQL brute pour cette table qui n'est pas dans le typage
      const { error } = await supabase
        .rpc('mark_all_notifications_as_read', { uid: user?.id });

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setNotifications(
        notifications.map(n => ({ ...n, is_read: true }))
      );
      
      toast({
        title: "Notifications",
        description: "Toutes les notifications ont été marquées comme lues.",
      });
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
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
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucune notification
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
                      <span className="sr-only">Marquer comme lu</span>
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
