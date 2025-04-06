import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import HelperPointsCard from "@/components/HelperPointsCard";
import { Task, UserType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { adaptTasksFromDB, adaptTaskFromDB } from "@/utils/taskAdapter";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType>("elderly");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [helperPoints, setHelperPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user) {
      setUserType(user.type);
    } else {
      toast({
        title: "Veuillez vous connecter",
        description: "Vous devez être connecté pour accéder à cette page.",
      });
      navigate("/login");
      return;
    }
    
    const fetchTasks = async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase
          .from('tasks')
          .select('*');

        if (error) throw error;

        if (data) {
          const adaptedTasks = adaptTasksFromDB(data);
          setTasks(adaptedTasks);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des tâches:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les tâches.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (user.type === 'helper' || (user.type === 'elderly' && payload.new.requested_by === user.id)) {
              const newTask = adaptTaskFromDB(payload.new);
              setTasks(current => [newTask, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = adaptTaskFromDB(payload.new);
            setTasks(current => 
              current.map(task => 
                task.id === updatedTask.id ? updatedTask : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(current => 
              current.filter(task => task.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [user?.id, userType, toast]);

  const handleTaskUpdate = async (taskId: string, newStatus: "pending" | "assigned" | "completed" | "cancelled") => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === "assigned" && user && userType === "helper") {
        updates.helper_assigned = user.id;
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
        
      if (error) throw error;
      
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus, helperAssigned: updates.helper_assigned || task.helperAssigned } 
          : task
      ));
      
      let message = '';
      switch (newStatus) {
        case "assigned":
          message = "Tâche acceptée avec succès!";
          break;
        case "completed":
          message = "Tâche marquée comme terminée!";
          break;
        case "cancelled":
          message = "Tâche annulée!";
          break;
        default:
          message = "Tâche mise à jour!";
      }
      
      toast({
        title: "Succès",
        description: message,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive",
      });
    }
  };
  
  const countTasksByStatus = (status: string) => {
    return tasks.filter(t => t.status === status && (userType === "helper" || t.requestedBy === user?.id)).length;
  };
  
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          {userType === "elderly" ? "Tableau de bord - Sénior" : "Tableau de bord - Jeune"}
        </h1>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg">Chargement...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <Card>
                <CardHeader>
                  <CardTitle className={userType === "elderly" ? "text-xl" : ""}>
                    {userType === "elderly" ? "Mes demandes" : "Tâches disponibles"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${userType === "elderly" ? "text-4xl" : ""}`}>
                    {countTasksByStatus("pending")}
                  </p>
                  <p className="text-gray-600">
                    {userType === "elderly" ? "en attente d'un aidant" : "tâches à accepter"}
                  </p>
                  {userType === "elderly" && (
                    <Button
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      onClick={() => navigate("/task-request")}
                    >
                      Nouvelle demande
                    </Button>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className={userType === "elderly" ? "text-xl" : ""}>
                    {userType === "elderly" ? "Aides acceptées" : "Mes tâches"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${userType === "elderly" ? "text-4xl" : ""}`}>
                    {countTasksByStatus("assigned")}
                  </p>
                  <p className="text-gray-600">
                    {userType === "elderly" ? "tâches avec un aidant" : "tâches que vous avez acceptées"}
                  </p>
                  <Button
                    className="w-full mt-4 bg-app-blue hover:bg-app-blue/90"
                    onClick={() => navigate("/accepted-tasks")}
                  >
                    Voir les détails
                  </Button>
                </CardContent>
              </Card>
              
              {userType === "helper" ? (
                <HelperPointsCard />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className={userType === "elderly" ? "text-xl" : ""}>
                      Aide reçue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-3xl font-bold ${userType === "elderly" ? "text-4xl" : ""}`}>
                      {countTasksByStatus("completed")}
                    </p>
                    <p className="text-gray-600">
                      tâches complétées
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              {userType === "elderly" ? "Mes demandes récentes" : "Tâches récentes"}
            </h2>
            
            <TaskList tasks={tasks} userType={userType} onTaskUpdate={handleTaskUpdate} />
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
