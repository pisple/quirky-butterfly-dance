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
  const [updating, setUpdating] = useState(false);
  
  const handleAccept = async () => {
    if (onTaskUpdate) {
      setUpdating(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Erreur",
            description: "Vous devez être connecté pour accepter une tâche.",
            variant: "destructive"
          });
          setUpdating(false);
          return;
        }
        
        const { error } = await supabase
          .from('tasks')
          .update({ 
            status: 'assigned', 
            helper_assigned: user.id 
          })
          .eq('id', task.id);
          
        if (error) {
          console.error("Error updating task:", error);
          toast({
            title: "Erreur",
            description: "Une erreur s'est produite lors de l'acceptation de la tâche.",
            variant: "destructive"
          });
        } else {
          onTaskUpdate(task.id, "assigned");
          
          toast({
            title: "Tâche acceptée",
            description: "Vous avez accepté cette tâche. La personne sénior sera notifiée.",
          });
        }
      } catch (error) {
        console.error("Error accepting task:", error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de l'acceptation de la tâche.",
          variant: "destructive"
        });
      }
      
      setUpdating(false);
    }
  };
  
  const handleCancel = async () => {
    if (onTaskUpdate) {
      setUpdating(true);
      
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'cancelled' })
          .eq('id', task.id);
          
        if (error) {
          console.error("Error cancelling task:", error);
          toast({
            title: "Erreur",
            description: "Une erreur s'est produite lors de l'annulation de la tâche.",
            variant: "destructive"
          });
        } else {
          onTaskUpdate(task.id, "cancelled");
          
          toast({
            title: "Tâche annulée",
            description: "Votre demande a été annulée.",
          });
        }
      } catch (error) {
        console.error("Error cancelling task:", error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de l'annulation de la tâche.",
          variant: "destructive"
        });
      }
      
      setUpdating(false);
    }
  };
  
  const handleComplete = async () => {
    if (onTaskUpdate) {
      setUpdating(true);
      
      try {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: 'completed' })
          .eq('id', task.id);
          
        if (taskError) {
          console.error("Error completing task:", taskError);
          toast({
            title: "Erreur",
            description: "Une erreur s'est produite lors de la complétion de la tâche.",
            variant: "destructive"
          });
          setUpdating(false);
          return;
        }
        
        if (userType === "helper") {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: pointsData, error: pointsGetError } = await supabase
              .from('helper_points')
              .select('points')
              .eq('helper_id', user.id)
              .single();
              
            if (pointsGetError) {
              console.error("Error getting helper points:", pointsGetError);
            } else {
              const currentPoints = pointsData?.points || 0;
              const newPoints = currentPoints + 50;
              
              const { error: pointsUpdateError } = await supabase
                .from('helper_points')
                .update({ points: newPoints })
                .eq('helper_id', user.id);
                
              if (pointsUpdateError) {
                console.error("Error updating helper points:", pointsUpdateError);
              }
            }
          }
        }
        
        onTaskUpdate(task.id, "completed");
        
        if (userType === "helper") {
          toast({
            title: "Tâche terminée",
            description: "Merci pour votre aide ! Vous avez gagné 50 points.",
          });
        } else {
          toast({
            title: "Tâche terminée",
            description: "Merci pour votre aide !",
          });
        }
      } catch (error) {
        console.error("Error completing task:", error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de la complétion de la tâche.",
          variant: "destructive"
        });
      }
      
      setUpdating(false);
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
