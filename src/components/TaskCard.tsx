import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { Clock, ShoppingCart, ChefHat, Flower, Laptop, Users, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MapDisplay from "./MapDisplay";
import { useAuth } from "@/hooks/useAuth";
import { updateTask, updateHelperPoints, createNotification } from "@/utils/supabaseRPC";

interface TaskCardProps {
  task: Task;
  userType: "elderly" | "helper";
  onTaskUpdate?: (taskId: string, status: "pending" | "waiting_approval" | "assigned" | "completed" | "cancelled") => void;
}

const TaskCard = ({ task, userType, onTaskUpdate }: TaskCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showMap, setShowMap] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleAccept = async () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const success = await updateTask(task.id, {
        status: "waiting_approval", 
        helperAssigned: user.id
      });
      
      if (success && onTaskUpdate) {
        onTaskUpdate(task.id, "waiting_approval");
        
        const elderlyName = task.requestedByName || "Une personne senior";
        
        await createNotification(
          user.id,
          `Vous avez proposé votre aide à ${elderlyName} pour ${getTaskName()} à ${task.location}. Attendez la confirmation.`,
          task.id
        );
        
        if (task.requestedBy) {
          await createNotification(
            task.requestedBy,
            `${user.name || "Un jeune"} a proposé son aide pour ${getTaskName()}. Veuillez confirmer cette demande.`,
            task.id
          );
        }
        
        toast({
          title: "Demande envoyée",
          description: `Vous avez proposé votre aide à ${elderlyName}. Attendez la confirmation.`,
        });
      }
    } catch (error) {
      console.error("Error accepting task:", error);
      toast({
        title: "Erreur",
        description: "Nous n'avons pas pu traiter votre demande. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleConfirmHelper = async () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const success = await updateTask(task.id, { status: "assigned" });
      
      if (success && onTaskUpdate) {
        onTaskUpdate(task.id, "assigned");
        
        if (task.helperAssigned) {
          await createNotification(
            task.helperAssigned,
            `${task.requestedByName || "Le senior"} a confirmé votre aide pour ${getTaskName()}.`,
            task.id
          );
        }
        
        await createNotification(
          user.id,
          `Vous avez confirmé ${task.helperAssigned ? "l'aide proposée" : "l'aidant"} pour ${getTaskName()}.`,
          task.id
        );
        
        toast({
          title: "Aide confirmée",
          description: "Vous avez accepté l'aide proposée. L'aidant a été notifié.",
        });
      }
    } catch (error) {
      console.error("Error confirming helper:", error);
      toast({
        title: "Erreur",
        description: "Nous n'avons pas pu confirmer l'aide. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeclineHelper = async () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const success = await updateTask(task.id, { 
        status: "pending",
        helperAssigned: undefined
      });
      
      if (success && onTaskUpdate) {
        onTaskUpdate(task.id, "pending");
        
        if (task.helperAssigned) {
          await createNotification(
            task.helperAssigned,
            `${task.requestedByName || "Le senior"} a décliné votre proposition d'aide pour ${getTaskName()}.`,
            task.id
          );
        }
        
        await createNotification(
          user.id,
          `Vous avez décliné la proposition d'aide pour ${getTaskName()}.`,
          task.id
        );
        
        toast({
          title: "Aide déclinée",
          description: "Vous avez décliné cette proposition d'aide.",
        });
      }
    } catch (error) {
      console.error("Error declining helper:", error);
      toast({
        title: "Erreur",
        description: "Nous n'avons pas pu décliner l'aide. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancel = async () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const success = await updateTask(task.id, { status: "cancelled" });
      
      if (success && onTaskUpdate) {
        onTaskUpdate(task.id, "cancelled");
        
        await createNotification(
          user.id,
          `Vous avez annulé votre demande pour ${getTaskName()}.`,
          task.id
        );
        
        if (task.helperAssigned) {
          await createNotification(
            task.helperAssigned,
            `Une tâche que vous aviez acceptée (${getTaskName()}) a été annulée.`,
            task.id
          );
        }
        
        toast({
          title: "Tâche annulée",
          description: "Votre demande a été annulée.",
        });
      }
    } catch (error) {
      console.error("Error cancelling task:", error);
      toast({
        title: "Erreur",
        description: "Nous n'avons pas pu annuler cette tâche. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleComplete = async () => {
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const success = await updateTask(task.id, { status: "completed" });
      
      if (success && onTaskUpdate) {
        onTaskUpdate(task.id, "completed");
        
        if (userType === "helper") {
          const currentPoints = await updateHelperPoints(user.id, 50);
          
          await createNotification(
            user.id,
            `Félicitations ! Vous avez gagné 50 points pour avoir terminé la tâche "${getTaskName()}".`,
            task.id
          );
          
          if (task.requestedBy) {
            await createNotification(
              task.requestedBy,
              `${user.name || "Votre aidant"} a marqué la tâche "${getTaskName()}" comme terminée.`,
              task.id
            );
          }
          
          toast({
            title: "Tâche terminée",
            description: `Merci pour votre aide ! Vous avez gagné 50 points.`,
          });
        } else {
          await createNotification(
            user.id,
            `Vous avez confirmé que la tâche "${getTaskName()}" est terminée.`,
            task.id
          );
          
          if (task.helperAssigned) {
            await createNotification(
              task.helperAssigned,
              `${task.requestedByName || "Le senior"} a confirmé que la tâche "${getTaskName()}" est bien terminée. Merci !`,
              task.id
            );
          }
          
          toast({
            title: "Tâche terminée",
            description: "Merci d'avoir confirmé que la tâche est terminée !",
          });
        }
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Erreur",
        description: "Nous n'avons pas pu marquer cette tâche comme terminée. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "waiting_approval": return "bg-yellow-100 text-yellow-800";
      case "assigned": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "waiting_approval": return "En attente de confirmation";
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
          <Button 
            className="bg-app-blue hover:bg-app-blue/90" 
            onClick={handleAccept}
            disabled={isProcessing}
          >
            {isProcessing ? "En cours..." : "Proposer mon aide"}
          </Button>
        ) : userType === "elderly" && task.status === "waiting_approval" ? (
          <>
            <Button 
              variant="outline" 
              onClick={handleDeclineHelper}
              disabled={isProcessing}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              {isProcessing ? "En cours..." : "Décliner"}
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={handleConfirmHelper}
              disabled={isProcessing}
            >
              {isProcessing ? "En cours..." : "Confirmer l'aidant"}
            </Button>
          </>
        ) : userType === "elderly" && task.status === "pending" ? (
          <Button 
            variant="destructive" 
            onClick={handleCancel}
            disabled={isProcessing}
          >
            {isProcessing ? "En cours..." : "Annuler la demande"}
          </Button>
        ) : userType === "helper" && task.status === "waiting_approval" ? (
          <p className="text-amber-600 font-medium">En attente de confirmation par le senior</p>
        ) : userType === "helper" && task.status === "assigned" ? (
          <Button 
            className="bg-green-600 hover:bg-green-700" 
            onClick={handleComplete}
            disabled={isProcessing}
          >
            {isProcessing ? "En cours..." : "Marquer comme terminée"}
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
