
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const AcceptedTasks = () => {
  const [userType, setUserType] = useState<UserType>("helper");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }
      
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', session.user.id)
        .single();
      
      if (profileData) {
        setUserType(profileData.type as UserType);
      }
      
      // Fetch tasks
      fetchTasks(session.user.id, profileData?.type);
    };
    
    checkSession();
  }, [navigate]);
  
  const fetchTasks = async (userId: string, type?: string) => {
    try {
      let query = supabase.from('tasks').select(`
        id,
        type,
        keywords,
        location,
        requested_by,
        requested_date,
        status,
        helper_assigned,
        profiles:requested_by(name)
      `);
      
      // Filter based on user type
      if (type === 'elderly') {
        query = query.eq('requested_by', userId);
      } else if (type === 'helper') {
        query = query.or(`helper_assigned.eq.${userId},status.eq.pending`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les tâches.",
          variant: "destructive"
        });
      } else if (data) {
        // Transform data to match our Task interface
        const formattedTasks: Task[] = data.map(task => ({
          id: task.id,
          type: task.type,
          keywords: task.keywords,
          location: task.location,
          requestedBy: task.requested_by,
          requestedByName: task.profiles?.name || "Utilisateur",
          requestedDate: task.requested_date,
          status: task.status,
          helperAssigned: task.helper_assigned
        }));
        
        setTasks(formattedTasks);
      }
    } catch (error) {
      console.error("Error in fetchTasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour mettre à jour une tâche.",
          variant: "destructive"
        });
        return;
      }
      
      let updateData: any = { status };
      
      if (status === 'assigned') {
        updateData.helper_assigned = user.id;
      }
      
      // Update task in Supabase
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);
        
      if (error) {
        console.error("Error updating task:", error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de la mise à jour de la tâche.",
          variant: "destructive"
        });
        return;
      }
      
      // Update local state
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { ...task, status, ...(status === 'assigned' ? { helperAssigned: user.id } : {}) } : task
      );
      
      setTasks(updatedTasks);
      
      if (status === "completed" && userType === "helper") {
        // Add points for helper
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
          
          // Update points
          const { error: pointsUpdateError } = await supabase
            .from('helper_points')
            .update({ points: newPoints })
            .eq('helper_id', user.id);
            
          if (pointsUpdateError) {
            console.error("Error updating helper points:", pointsUpdateError);
          } else {
            toast({
              title: "Tâche terminée",
              description: "La tâche a été marquée comme terminée avec succès. Vous avez gagné 50 points!"
            });
          }
        }
      } else if (status === "cancelled") {
        toast({
          title: "Tâche annulée",
          description: "La tâche a été annulée avec succès."
        });
      } else if (status === "completed") {
        toast({
          title: "Tâche terminée",
          description: "La tâche a été marquée comme terminée avec succès."
        });
      }
    } catch (error) {
      console.error("Error in handleTaskUpdate:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour de la tâche.",
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
        
        {loading ? (
          <div className="text-center py-10">Chargement des tâches...</div>
        ) : (
          <TaskList tasks={tasks} userType={userType} onTaskUpdate={handleTaskUpdate} />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default AcceptedTasks;
