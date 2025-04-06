
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getUserTasks, updateLocalTask, updateHelperPoints, getAllTasks } from "@/utils/localTaskStorage";
import { getTasks, getTasksByUser, updateTask } from "@/utils/supabaseRPC";

const AcceptedTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>("helper");
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
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
    
    // Load tasks from database and localStorage
    loadTasks();
  }, [user, navigate, toast]);
  
  const loadTasks = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // First, try to get tasks from Supabase (if connected)
      let tasksData: Task[] = [];
      
      if (userType === "elderly") {
        // Pour les seniors, récupérer toutes leurs tâches en cours de traitement (en attente ou assignées)
        try {
          tasksData = await getTasksByUser(user.id, "requestedBy");
          // Filtrer pour ne garder que les tâches en attente d'approbation ou assignées
          tasksData = tasksData.filter(task => 
            task.status === "waiting_approval" || task.status === "assigned"
          );
        } catch (error) {
          console.error("Error fetching tasks from Supabase:", error);
          // Fallback to localStorage if Supabase fails
          const allTasks = getAllTasks();
          tasksData = allTasks.filter(task => 
            task.requestedBy === user.id && 
            (task.status === "waiting_approval" || task.status === "assigned")
          );
        }
      } else {
        // Pour les helpers, récupérer leurs tâches en attente d'approbation et assignées
        try {
          tasksData = await getTasksByUser(user.id, "helperAssigned");
          // Filtrer pour ne garder que les tâches en attente d'approbation ou assignées
          tasksData = tasksData.filter(task => 
            task.status === "waiting_approval" || task.status === "assigned"
          );
        } catch (error) {
          console.error("Error fetching tasks from Supabase:", error);
          // Fallback to localStorage if Supabase fails
          const allTasks = getAllTasks();
          tasksData = allTasks.filter(task => 
            task.helperAssigned === user.id && 
            (task.status === "waiting_approval" || task.status === "assigned")
          );
        }
      }
      
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, status: "pending" | "waiting_approval" | "assigned" | "completed" | "cancelled") => {
    if (!user) return;
    
    try {
      // Try to update task in Supabase first
      let success = false;
      try {
        success = await updateTask(taskId, { status });
      } catch (error) {
        console.error("Error updating task in Supabase:", error);
        // Fallback to localStorage
        success = updateLocalTask(taskId, { status });
      }
      
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
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          {userType === "elderly" ? "Mes demandes en cours" : "Mes tâches acceptées"}
        </h1>
        
        {isLoading ? (
          <div className="text-center py-8">Chargement des tâches...</div>
        ) : (
          <TaskList tasks={tasks} userType={userType} onTaskUpdate={handleTaskUpdate} />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AcceptedTasks;
