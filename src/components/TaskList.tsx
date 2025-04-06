
import { useState } from "react";
import TaskCard from "./TaskCard";
import { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, ShoppingCart, ChefHat, Flower, Laptop, Users } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  userType: "elderly" | "helper";
  onTaskUpdate?: (taskId: string, status: string) => void;
}

const TaskList = ({ tasks, userType, onTaskUpdate }: TaskListProps) => {
  const [filter, setFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("available");
  const [sortByProximity, setSortByProximity] = useState<boolean>(false);
  
  // Si aucune tâche n'est disponible, afficher un message
  if (!tasks || tasks.length === 0) {
    return (
      <div className={`text-center p-8 ${userType === "elderly" ? "text-xl" : "text-lg"}`}>
        {userType === "helper" 
          ? "Aucune tâche disponible pour le moment." 
          : "Vous n'avez pas encore de demandes d'aide."}
      </div>
    );
  }
  
  // Filter tasks based on user type
  const userId = localStorage.getItem("userId");
  
  // Pour les seniors: voir uniquement leurs propres tâches
  // Pour les jeunes aidants: voir toutes les tâches créées par les seniors
  const relevantTasks = userType === "elderly" 
    ? tasks.filter(task => task.requestedBy === userId)
    : tasks.filter(task => task.status !== "cancelled" && task.status !== "completed");
  
  // Filtrer les tâches annulées ou complétées pour les seniors
  const availableTasks = userType === "elderly"
    ? relevantTasks.filter(task => task.status !== "cancelled" && task.status !== "completed")
    : relevantTasks;
  
  // Filtrer selon le statut de la tâche
  const pendingTasks = availableTasks.filter(task => task.status === "pending");
  const waitingApprovalTasks = availableTasks.filter(task => task.status === "waiting_approval");
  const assignedTasks = availableTasks.filter(task => task.status === "assigned");
  
  // Fonction pour trier les tâches par proximité
  const sortTasksByProximity = (tasksToSort: Task[]) => {
    // Récupérer la position de l'utilisateur depuis localStorage
    const userLocation = localStorage.getItem("userLocation");
    
    if (!userLocation || !sortByProximity) {
      return tasksToSort;
    }
    
    try {
      const userCoordinates = JSON.parse(userLocation);
      
      // Fonction pour calculer la distance entre deux points géographiques
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Rayon de la Terre en km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance en km
        return distance;
      };
      
      // Pour chaque tâche, calculer la distance et ajouter cette information
      const tasksWithDistance = tasksToSort.map(task => {
        // Extraire les coordonnées de la tâche depuis la location
        // Format attendu: "Ville (lat,lon)" ou simplement "Ville"
        let distance = Infinity;
        const locationMatch = task.location.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/);
        
        if (locationMatch) {
          const taskLat = parseFloat(locationMatch[1]);
          const taskLon = parseFloat(locationMatch[2]);
          
          if (!isNaN(taskLat) && !isNaN(taskLon)) {
            distance = calculateDistance(
              userCoordinates.latitude,
              userCoordinates.longitude,
              taskLat,
              taskLon
            );
          }
        }
        
        return { ...task, distance };
      });
      
      // Trier les tâches par distance
      return tasksWithDistance.sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );
    } catch (error) {
      console.error("Error sorting tasks by proximity:", error);
      return tasksToSort;
    }
  };
  
  // Appliquer le filtre (type de tâche) sur les tâches selon l'onglet actif
  const filteredPendingTasks = filter 
    ? pendingTasks.filter(task => task.type === filter) 
    : pendingTasks;
    
  const filteredWaitingApprovalTasks = filter 
    ? waitingApprovalTasks.filter(task => task.type === filter) 
    : waitingApprovalTasks;
    
  const filteredAssignedTasks = filter 
    ? assignedTasks.filter(task => task.type === filter) 
    : assignedTasks;
  
  // Déterminer les tâches à afficher selon l'onglet actif
  let displayedTasks;
  
  if (userType === "elderly") {
    // Pour les seniors, afficher toutes leurs tâches actives (pending + waiting_approval + assigned)
    displayedTasks = filter 
      ? availableTasks.filter(task => task.type === filter)
      : availableTasks;
  } else {
    // Pour les helpers, respecter le système d'onglets et appliquer le tri par proximité
    let tasksBeforeSorting;
    if (activeTab === "available") {
      tasksBeforeSorting = filteredPendingTasks;
    } else if (activeTab === "waiting") {
      tasksBeforeSorting = filteredWaitingApprovalTasks;
    } else {
      tasksBeforeSorting = filteredAssignedTasks;
    }
    displayedTasks = sortTasksByProximity(tasksBeforeSorting);
  }
  
  if (availableTasks.length === 0) {
    return (
      <div className={`text-center p-8 ${userType === "elderly" ? "text-xl" : "text-lg"}`}>
        {userType === "helper" 
          ? "Aucune tâche disponible pour le moment." 
          : "Vous n'avez pas encore de demandes d'aide."}
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {userType === "helper" && (
        <Tabs defaultValue="available" className="w-full mb-6" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="available">Tâches disponibles</TabsTrigger>
            <TabsTrigger value="waiting">En attente</TabsTrigger>
            <TabsTrigger value="accepted">Tâches acceptées</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge 
          className={`cursor-pointer py-2 px-4 ${filter === null ? "bg-app-blue" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} 
          onClick={() => setFilter(null)}
        >
          Tout
        </Badge>
        <Badge 
          className={`cursor-pointer py-2 px-4 ${filter === "groceries" ? "bg-app-blue" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} 
          onClick={() => setFilter("groceries")}
        >
          <ShoppingCart className="w-4 h-4 mr-1" /> Courses
        </Badge>
        <Badge 
          className={`cursor-pointer py-2 px-4 ${filter === "cooking" ? "bg-app-blue" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} 
          onClick={() => setFilter("cooking")}
        >
          <ChefHat className="w-4 h-4 mr-1" /> Cuisine
        </Badge>
        <Badge 
          className={`cursor-pointer py-2 px-4 ${filter === "gardening" ? "bg-app-blue" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} 
          onClick={() => setFilter("gardening")}
        >
          <Flower className="w-4 h-4 mr-1" /> Jardinage
        </Badge>
        <Badge 
          className={`cursor-pointer py-2 px-4 ${filter === "technology" ? "bg-app-blue" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} 
          onClick={() => setFilter("technology")}
        >
          <Laptop className="w-4 h-4 mr-1" /> Technologie
        </Badge>
        <Badge 
          className={`cursor-pointer py-2 px-4 ${filter === "accompaniment" ? "bg-app-blue" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} 
          onClick={() => setFilter("accompaniment")}
        >
          <Users className="w-4 h-4 mr-1" /> Accompagnement
        </Badge>
        
        {userType === "helper" && (
          <Badge 
            className={`cursor-pointer py-2 px-4 ml-auto ${sortByProximity ? "bg-app-blue" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`} 
            onClick={() => setSortByProximity(!sortByProximity)}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Trier par proximité
          </Badge>
        )}
      </div>
      
      {displayedTasks.length === 0 ? (
        <div className={`text-center p-8 ${userType === "elderly" ? "text-xl" : "text-lg"}`}>
          {userType === "elderly"
            ? "Vous n'avez aucune demande d'aide active."
            : activeTab === "available" 
              ? "Aucune tâche disponible ne correspond à votre filtre."
              : activeTab === "waiting"
                ? "Aucune tâche en attente de confirmation."
                : "Aucune tâche acceptée ne correspond à votre filtre."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              userType={userType} 
              onTaskUpdate={onTaskUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
