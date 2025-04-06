
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskCard from "@/components/TaskCard"; // Fixed: Changed from named import to default import
import { useToast } from "@/hooks/use-toast";
import { Task, UserType } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { getTasksByUser, updateTask } from "@/utils/supabaseRPC";
import * as localTaskStorage from "@/utils/localTaskStorage";
import { Button } from "@/components/ui/button";

const AcceptedTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>("helper");
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    // Get user type from localStorage
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType === "elderly" || savedUserType === "helper") {
      setUserType(savedUserType);
    }
  }, []);
  
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get tasks that this user has accepted (as helper)
        console.log("Fetching accepted tasks for user:", user.id);
        let fetchedTasks: Task[] = [];
        
        try {
          // Try to get from Supabase first
          fetchedTasks = await getTasksByUser(user.id, "helperAssigned");
          console.log("Fetched tasks from Supabase:", fetchedTasks);
        } catch (error) {
          console.error("Error fetching tasks from Supabase:", error);
          // Fall back to local storage
          fetchedTasks = localTaskStorage.getUserTasks(user.id, "helperAssigned");
          console.log("Fetched tasks from local storage:", fetchedTasks);
        }
        
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error in fetchTasks:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos tâches acceptées.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, toast]);
  
  const handleMarkAsComplete = async (taskId: string) => {
    try {
      console.log("Marking task as complete:", taskId);
      let success = false;
      
      try {
        // Try to update in Supabase first
        success = await updateTask(taskId, { status: "completed" });
        console.log("Updated task in Supabase:", success);
      } catch (error) {
        console.error("Error updating task in Supabase:", error);
        // Fall back to local storage
        success = localTaskStorage.updateLocalTask(taskId, { status: "completed" });
        console.log("Updated task in local storage:", success);
      }
      
      if (success) {
        // Update local state
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId ? { ...task, status: "completed" } : task
          )
        );
        
        // Show success message
        toast({
          title: "Tâche terminée",
          description: "La tâche a été marquée comme terminée.",
        });
        
        // Add points to helper
        if (user) {
          try {
            // Points logic here (using either Supabase or local storage)
            const updatedPoints = localTaskStorage.updateHelperPoints(user.id, 10);
            console.log("Updated helper points:", updatedPoints);
          } catch (error) {
            console.error("Error updating helper points:", error);
          }
        }
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error marking task as complete:", error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la tâche comme terminée.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Mes tâches acceptées
        </h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-app-blue"></div>
          </div>
        ) : tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task}
                userType={userType}
                action={
                  task.status === "assigned" ? ( // Fixed: Changed from "in-progress" to "assigned"
                    <Button
                      onClick={() => handleMarkAsComplete(task.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Marquer comme terminée
                    </Button>
                  ) : null
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">
              Vous n'avez pas encore accepté de tâches.
            </p>
            <Button
              onClick={() => window.location.href = "/dashboard"}
              className="mt-4 bg-app-blue hover:bg-app-blue/90"
            >
              Voir les demandes disponibles
            </Button>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AcceptedTasks;
