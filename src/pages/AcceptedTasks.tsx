
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getUserTasks, updateLocalTask, updateHelperPoints, getAllTasks } from "@/utils/localTaskStorage";

const AcceptedTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>("helper");
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!user) {
      toast({
        title: "Veuillez vous connecter",
        description: "Vous devez être connecté pour accéder à cette page.",
      });
      navigate("/login");
      return;
    }

    // Set user type
    if (user.type) {
      setUserType(user.type as UserType);
    }
    
    // Load tasks from localStorage
    loadTasks();
  }, [user, navigate, toast]);
  
  const loadTasks = () => {
    if (!user) return;
    
    if (userType === "elderly") {
      // Pour les seniors, récupérer toutes leurs tâches, y compris celles en attente d'approbation
      const allTasks = getAllTasks();
      const userTasks = allTasks.filter(task => 
        task.requestedBy === user.id && 
        (task.status === "waiting_approval" || task.status === "assigned")
      );
      setTasks(userTasks);
    } else {
      // Pour les helpers, récupérer leurs tâches en attente d'approbation et assignées
      const allTasks = getAllTasks();
      
      // Filtrer pour obtenir les tâches assignées à cet helper et celles en attente d'approbation
      const helperTasks = allTasks.filter(task => 
        (task.helperAssigned === user.id && 
         (task.status === "assigned" || task.status === "waiting_approval"))
      );
      
      setTasks(helperTasks);
    }
  };

  const handleTaskUpdate = (taskId: string, status: "pending" | "waiting_approval" | "assigned" | "completed" | "cancelled") => {
    if (!user) return;
    
    const success = updateLocalTask(taskId, { status });
    
    if (success) {
      // Update local state
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      );
      
      setTasks(updatedTasks);
      
      if (status === "completed") {
        // Add 50 points for the helper when a task is completed
        if (userType === "helper" && user.id) {
          const newPoints = updateHelperPoints(user.id, 50);
          
          toast({
            title: "Tâche terminée",
            description: `La tâche a été marquée comme terminée avec succès. Vous avez gagné 50 points! Vous avez maintenant ${newPoints} points au total.`
          });
        } else {
          toast({
            title: "Tâche terminée",
            description: "La tâche a été marquée comme terminée avec succès."
          });
        }
      } else if (status === "cancelled") {
        toast({
          title: "Tâche annulée",
          description: "La tâche a été annulée avec succès."
        });
      } else if (status === "waiting_approval") {
        toast({
          title: "Proposition envoyée",
          description: "Votre proposition d'aide a été envoyée au senior."
        });
      } else if (status === "assigned") {
        toast({
          title: "Aide confirmée",
          description: "Le senior a confirmé votre aide."
        });
      }
    }
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          {userType === "elderly" ? "Mes demandes en cours" : "Mes tâches acceptées"}
        </h1>
        
        <TaskList tasks={tasks} userType={userType} onTaskUpdate={handleTaskUpdate} />
      </main>
      
      <Footer />
    </div>
  );
};

export default AcceptedTasks;
