
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getUserTasks, updateLocalTask, updateHelperPoints } from "@/utils/localTaskStorage";

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
    
    // For elderly, get tasks they requested
    // For helpers, get tasks they are assigned to
    const type = userType === "elderly" ? "requestedBy" : "helperAssigned";
    const userTasks = getUserTasks(user.id, type);
    
    setTasks(userTasks);
  };

  const handleTaskUpdate = (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => {
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
