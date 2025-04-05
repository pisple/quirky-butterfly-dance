
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";

const AcceptedTasks = () => {
  const [userType, setUserType] = useState<UserType>("helper");
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    // Get user type from localStorage
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType === "elderly" || savedUserType === "helper") {
      setUserType(savedUserType as UserType);
    }
    
    // Load tasks from localStorage
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      setTasks([]);
    }
  }, []);

  const handleTaskUpdate = (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    );
    
    setTasks(updatedTasks);
    
    // Save to localStorage
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    
    if (status === "completed") {
      // Add 50 points for the helper when a task is completed
      if (userType === "helper") {
        const currentPoints = parseInt(localStorage.getItem("helperPoints") || "0");
        const newPoints = currentPoints + 50;
        localStorage.setItem("helperPoints", newPoints.toString());
        
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
