
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getUserTasks as getLocalTasks, updateLocalTask, updateHelperPoints as updateLocalHelperPoints, getAllTasks as getLocalAllTasks } from "@/utils/localTaskStorage";
import { getTasks, getTasksByUser, updateTask, updateHelperPoints as updateSupabaseHelperPoints } from "@/utils/supabaseRPC";

const AcceptedTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>("helper");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    
    // Load tasks
    loadTasks();
  }, [user, navigate, toast]);
  
  const loadTasks = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      // First try to get tasks from Supabase
      let loadedTasks: Task[] = [];
      
      try {
        if (userType === "helper") {
          // For helpers, load all pending tasks (created by seniors) and their assigned tasks
          const allTasks = await getTasks();
          
          if (allTasks.length > 0) {
            // Filter tasks for helpers: show pending tasks and tasks assigned to them
            loadedTasks = allTasks.filter(task => 
              // Show all pending tasks (available for help)
              (task.status === "pending") ||
              // Or show tasks assigned to this helper or waiting approval
              (task.helperAssigned === user.id && 
               (task.status === "assigned" || task.status === "waiting_approval"))
            );
          }
        } else {
          // For elderly, show all their tasks including those waiting for approval
          console.log("Attempting to fetch tasks for elderly user:", user.id);
          const userTasks = await getTasksByUser(user.id, "requestedBy");
          
          if (userTasks.length > 0) {
            console.log("Tasks fetched from Supabase for elderly:", userTasks);
            loadedTasks = userTasks;
          }
        }
      } catch (error) {
        console.error("Error fetching tasks from Supabase:", error);
        console.log("Falling back to local storage for tasks");
        
        // If Supabase fails, fall back to local storage
        if (userType === "elderly") {
          // For seniors, get all their tasks including those waiting for approval
          const allTasks = getLocalAllTasks();
          loadedTasks = allTasks.filter(task => task.requestedBy === user.id);
          console.log("Loaded tasks from local storage for elderly:", loadedTasks);
        } else {
          // For helpers, get all tasks (including those created by seniors)
          const allTasks = getLocalAllTasks();
          
          // Show all pending tasks (available for help) and tasks assigned to this helper
          loadedTasks = allTasks.filter(task => 
            // Show all pending tasks
            (task.status === "pending") ||
            // Or show tasks assigned to this helper
            (task.helperAssigned === user.id && 
             (task.status === "assigned" || task.status === "waiting_approval"))
          );
        }
      }
      
      console.log("Final loaded tasks for user:", user.id, "userType:", userType, "tasks:", loadedTasks);
      
      setTasks(loadedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tâches. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, status: "pending" | "waiting_approval" | "assigned" | "completed" | "cancelled") => {
    if (!user) return;
    
    try {
      // Try to update in Supabase first
      let success = false;
      
      try {
        success = await updateTask(taskId, { status });
      } catch (error) {
        console.error("Error updating task in Supabase:", error);
      }
      
      if (!success) {
        // Fall back to local storage if Supabase update fails
        console.log("Falling back to local storage for task update");
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
            let newPoints = 0;
            
            try {
              // Try Supabase first
              newPoints = await updateSupabaseHelperPoints(user.id, 50);
            } catch (error) {
              // Fall back to local storage
              console.log("Falling back to local storage for helper points");
              newPoints = updateLocalHelperPoints(user.id, 50);
            }
            
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
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la tâche. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          {userType === "elderly" ? "Mes demandes en cours" : "Tâches disponibles"}
        </h1>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-app-blue"></div>
          </div>
        ) : (
          <TaskList tasks={tasks} userType={userType} onTaskUpdate={handleTaskUpdate} />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AcceptedTasks;
