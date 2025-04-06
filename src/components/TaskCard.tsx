
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { Clock, ShoppingCart, ChefHat, Flower, Laptop, Users, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MapDisplay from "./MapDisplay";
import { supabase } from "@/integrations/supabase/client";

interface TaskCardProps {
  task: Task;
  userType: "elderly" | "helper";
  onTaskUpdate?: (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => void;
}

const TaskCard = ({ task, userType, onTaskUpdate }: TaskCardProps) => {
  const { toast } = useToast();
  const [showMap, setShowMap] = useState(false);
  
  const handleAccept = async () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, "assigned");
      
      // Get the elderly's name for the notification
      const elderlyName = task.requestedByName || "Une personne senior";
      
      // Show notification toast to the helper
      toast({
        title: "Tâche acceptée",
        description: `Vous avez accepté d'aider ${elderlyName} avec ${getTaskName()} à ${task.location}.`,
      });
      
      try {
        // Créer une notification pour le senior
        await supabase.from("notifications").insert({
          user_id: task.requestedBy,
          message: `Un jeune aidant a accepté votre demande d'aide pour "${getTaskName()}" à ${task.location}.`,
          related_task_id: task.id,
        });
      } catch (error) {
        console.error("Erreur lors de l'envoi de la notification:", error);
      }
      
      // Store that a notification has been sent
      const updatedTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      const taskIndex = updatedTasks.findIndex((t: Task) => t.id === task.id);
      if (taskIndex !== -1) {
        updatedTasks[taskIndex].notificationSent = true;
        localStorage.setItem("tasks", JSON.stringify(updatedTasks));
      }
    }
  };
  
  const handleCancel = () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, "cancelled");
      
      toast({
        title: "Tâche annulée",
        description: "Votre demande a été annulée.",
      });
    }
  };
  
  const handleComplete = async () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, "completed");
      
      if (userType === "helper") {
        try {
          // Vérifier si l'utilisateur a déjà un enregistrement de points
          const userId = localStorage.getItem("userId");
          if (!userId) return;
          
          // Récupérer les points actuels depuis Supabase
          const { data: existingPoints, error: fetchError } = await supabase
            .from("helper_points")
            .select("*")
            .eq("helper_id", userId)
            .maybeSingle();
            
          if (fetchError && fetchError.code !== "PGRST116") {
            throw fetchError;
          }
          
          const newPoints = existingPoints ? existingPoints.points + 50 : 50;
          
          // Mettre à jour ou insérer des points
          if (existingPoints) {
            await supabase
              .from("helper_points")
              .update({ points: newPoints })
              .eq("helper_id", userId);
          } else {
            await supabase
              .from("helper_points")
              .insert({ helper_id: userId, points: newPoints });
          }
          
          // Envoyer une notification au senior
          await supabase.from("notifications").insert({
            user_id: task.requestedBy,
            message: `Votre demande d'aide pour "${getTaskName()}" à ${task.location} a été marquée comme terminée.`,
            related_task_id: task.id,
          });
          
          toast({
            title: "Tâche terminée",
            description: `Merci pour votre aide ! Vous avez gagné 50 points. Vous avez maintenant ${newPoints} points.`,
          });
        } catch (error) {
          console.error("Erreur lors de la mise à jour des points:", error);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la mise à jour des points.",
            variant: "destructive"
          });
        }
      } else {
        try {
          // Envoyer une notification au jeune qui a aidé
          if (task.helperAssigned) {
            await supabase.from("notifications").insert({
              user_id: task.helperAssigned,
              message: `La personne que vous avez aidée a confirmé que la tâche "${getTaskName()}" à ${task.location} est terminée.`,
              related_task_id: task.id,
            });
          }
          
          toast({
            title: "Tâche terminée",
            description: "Merci d'avoir confirmé que la tâche est terminée !",
          });
        } catch (error) {
          console.error("Erreur lors de l'envoi de la notification:", error);
        }
      }
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "assigned": return "Assignée";
      case "completed": return "Terminée";
      case "cancelled": return "Annulée";
      default: return status;
    }
  };

  const getTaskIcon = () => {
    switch (task.type) {
      case "groceries": return <ShoppingCart className="text-app-blue" size={userType === "elderly" ? 28 : 20} />;
      case "cooking": return <ChefHat className="text-app-blue" size={userType === "elderly" ? 28 : 20} />;
      case "gardening": return <Flower className="text-app-blue" size={userType === "elderly" ? 28 : 20} />;
      case "technology": return <Laptop className="text-app-blue" size={userType === "elderly" ? 28 : 20} />;
      case "accompaniment": return <Users className="text-app-blue" size={userType === "elderly" ? 28 : 20} />;
      default: return <ShoppingCart className="text-app-blue" size={userType === "elderly" ? 28 : 20} />;
    }
  };
  
  const getTaskEmoji = () => {
    switch (task.type) {
      case "groceries": return "🛒";
      case "cooking": return "👨‍🍳";
      case "gardening": return "🌻";
      case "technology": return "📱";
      case "accompaniment": return "👥";
      default: return "";
    }
  };
  
  const getTaskName = () => {
    switch (task.type) {
      case "groceries": return "Courses";
      case "cooking": return "Cuisine";
      case "gardening": return "Jardinage";
      case "technology": return "Aide technologie";
      case "accompaniment": return "Accompagnement";
      default: return task.type;
    }
  };

  if (task.status === "cancelled" || task.status === "completed") {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`flex items-center gap-2 ${userType === "elderly" ? "text-xl" : ""}`}>
          {userType === "elderly" ? (
            <span className="text-2xl mr-2">{getTaskEmoji()}</span>
          ) : (
            getTaskIcon()
          )}
          {getTaskName()}
        </CardTitle>
        <Badge className={`${getStatusColor(task.status)} ${userType === "elderly" ? "text-lg px-3 py-1" : ""}`}>
          {getStatusText(task.status)}
        </Badge>
      </CardHeader>
      
      <CardContent className={`${userType === "elderly" ? "text-lg" : ""}`}>
        <p className="mb-2">{task.keywords.join(", ")}</p>
        <div className="mt-4 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span className="font-semibold">Lieu:</span> {task.location}
            <Button 
              variant="outline" 
              size="sm"
              className="ml-2"
              onClick={() => setShowMap(true)}
            >
              Voir carte
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={16} />
            <span>Date: {new Date(task.requestedDate).toLocaleDateString()}</span>
          </div>
        </div>
        {userType === "helper" && task.requestedByName && (
          <div className="mt-3">
            <span className="font-semibold">Demandé par:</span> {task.requestedByName}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {userType === "helper" && task.status === "pending" ? (
          <Button className="bg-app-blue hover:bg-app-blue/90" onClick={handleAccept}>
            Accepter cette tâche
          </Button>
        ) : userType === "elderly" && task.status === "pending" ? (
          <Button variant="destructive" onClick={handleCancel}>
            Annuler la demande
          </Button>
        ) : userType === "helper" && task.status === "assigned" ? (
          <Button className="bg-green-600 hover:bg-green-700" onClick={handleComplete}>
            Marquer comme terminée
          </Button>
        ) : null}
      </CardFooter>

      {showMap && (
        <MapDisplay location={task.location} onClose={() => setShowMap(false)} />
      )}
    </Card>
  );
};

export default TaskCard;
