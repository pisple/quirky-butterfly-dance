
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { Clock, ShoppingCart, ChefHat, Flower, Laptop, Users, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MapDisplay from "./MapDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TaskCardProps {
  task: Task;
  userType: "elderly" | "helper";
  onTaskUpdate?: (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => void;
}

const TaskCard = ({ task, userType, onTaskUpdate }: TaskCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showMap, setShowMap] = useState(false);
  const [requesterName, setRequesterName] = useState<string>("");
  
  // Charger le nom du demandeur pour les aidants
  useEffect(() => {
    if (userType === "helper" && task.requested_by) {
      const fetchRequester = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', task.requested_by)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setRequesterName(data.name);
          }
        } catch (error) {
          console.error("Erreur lors du chargement du nom du demandeur:", error);
          setRequesterName("Senior");
        }
      };
      
      fetchRequester();
    }
  }, [task.requested_by, userType]);
  
  const handleAccept = () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, "assigned");
    }
  };
  
  const handleCancel = () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, "cancelled");
    }
  };
  
  const handleComplete = () => {
    if (onTaskUpdate) {
      onTaskUpdate(task.id, "completed");
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

  // Vérifier si l'utilisateur est l'aidant assigné à cette tâche
  const isAssignedHelper = user && task.helper_assigned === user.id;
  
  // Vérifier si l'utilisateur est le demandeur de cette tâche
  const isRequester = user && task.requested_by === user.id;

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
            <span>Date: {new Date(task.requested_date).toLocaleDateString()}</span>
          </div>
        </div>
        {userType === "helper" && requesterName && (
          <div className="mt-3">
            <span className="font-semibold">Demandé par:</span> {requesterName}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2">
        {userType === "helper" && task.status === "pending" ? (
          <Button className="bg-app-blue hover:bg-app-blue/90" onClick={handleAccept}>
            Accepter cette tâche
          </Button>
        ) : userType === "elderly" && task.status === "pending" && isRequester ? (
          <Button variant="destructive" onClick={handleCancel}>
            Annuler la demande
          </Button>
        ) : (userType === "helper" && task.status === "assigned" && isAssignedHelper) || 
             (userType === "elderly" && task.status === "assigned" && isRequester) ? (
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
