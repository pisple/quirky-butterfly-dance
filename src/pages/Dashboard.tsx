
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
    // Utiliser le type d'utilisateur connecté
    if (user) {
      setUserType(user.type);
    } else {
      // Si pas d'utilisateur connecté, rediriger vers la connexion
      toast({
        title: "Veuillez vous connecter",
        description: "Vous devez être connecté pour accéder à cette page.",
      });
      navigate("/login");
      return;
    }
    
    const loadTasks = async () => {
      setLoading(true);
      try {
        let query = supabase.from('tasks').select('*');
        
        // Pour les seniors: voir uniquement leurs propres tâches
        if (user.type === 'elderly') {
          query = query.eq('requested_by', user.id);
        }
        
        // Charger les tâches
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          setTasks(data);
        }
        
        // Pour les aidants, charger aussi les points
        if (user.type === 'helper') {
          const { data: pointsData, error: pointsError } = await supabase
            .from('helper_points')
            .select('points')
            .eq('helper_id', user.id)
            .single();
            
          if (pointsError && pointsError.code !== 'PGRST116') throw pointsError;
          
          if (pointsData) {
            setHelperPoints(pointsData.points);
          }
          
          // Obtenir la position de l'utilisateur pour le tri par proximité
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const coordinates = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                localStorage.setItem("userLocation", JSON.stringify(coordinates));
              },
              (error) => {
                console.error("Error getting user location:", error);
                // Utiliser une position par défaut pour la Belgique si la géolocalisation échoue
                const defaultLocation = {
                  latitude: 50.8503, // Latitude de Bruxelles
                  longitude: 4.3517, // Longitude de Bruxelles
                };
                localStorage.setItem("userLocation", JSON.stringify(defaultLocation));
              }
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
    
    // S'abonner aux changements de tâches
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          // Mettre à jour la liste des tâches en fonction du type d'événement
          if (payload.eventType === 'INSERT') {
            if (user.type === 'helper' || (user.type === 'elderly' && payload.new.requested_by === user.id)) {
              setTasks(current => [payload.new as Task, ...current]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setTasks(current => 
              current.map(task => 
                task.id === payload.new.id ? (payload.new as Task) : task
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
  }, [user, navigate, toast]);

  const handleTaskUpdate = async (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => {
    try {
      const updatedTask = tasks.find(task => task.id === taskId);
      
      if (!updatedTask) return;
      
      // Pour les tâches assignées, ajouter l'ID de l'aidant
      let helperAssigned = updatedTask.helper_assigned;
      if (status === "assigned" && user?.type === "helper") {
        helperAssigned = user.id;
      }
      
      // Mettre à jour le statut de la tâche
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: status,
          helper_assigned: helperAssigned,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status, helperAssigned } : task
      ));
      
      // Afficher une notification appropriée
      const statusMessages = {
        assigned: "Tâche acceptée avec succès",
        completed: "Tâche marquée comme complétée",
        cancelled: "Demande annulée"
      };
      
      toast({
        title: statusMessages[status] || "Statut mis à jour",
        description: "La mise à jour a été enregistrée."
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la tâche:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche.",
        variant: "destructive"
      });
    }
  };
  
  const countTasksByStatus = (status: string) => {
    return tasks.filter(t => t.status === status && (userType === "helper" || t.requested_by === user?.id)).length;
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
              {/* Stats/Quick actions cards */}
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
