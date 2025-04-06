
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getTasks, getTasksByUser, updateTask, getHelperPoints } from "@/utils/supabaseRPC";
import Notifications from "@/components/Notifications";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [userType, setUserType] = useState<UserType>("elderly");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [helperPoints, setHelperPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
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
    
    loadData();
  }, [user, navigate, toast]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Load tasks
      let userTasks: Task[] = [];
      
      if (userType === "elderly") {
        // Senior users see their own tasks
        userTasks = await getTasksByUser(user.id, "requestedBy");
      } else {
        // Helpers see all tasks plus their accepted tasks
        const allTasks = await getTasks();
        const acceptedTasks = await getTasksByUser(user.id, "helperAssigned");
        
        // Merge and deduplicate tasks
        const tasksMap = new Map<string, Task>();
        [...allTasks, ...acceptedTasks].forEach(task => {
          tasksMap.set(task.id, task);
        });
        
        userTasks = Array.from(tasksMap.values());
      }
      
      setTasks(userTasks);
      
      // Load points for helpers
      if (userType === "helper") {
        const points = await getHelperPoints(user.id);
        setHelperPoints(points);
        
        // Get user location for proximity sorting
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
              // Use a default location for Belgium if geolocation fails
              const defaultLocation = {
                latitude: 50.8503, // Brussels latitude
                longitude: 4.3517, // Brussels longitude
              };
              localStorage.setItem("userLocation", JSON.stringify(defaultLocation));
            }
          );
        }
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Erreur",
        description: "Nous n'avons pas pu charger vos données. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => {
    if (!user) return;
    
    try {
      // Update in Supabase
      const updates: Partial<Task> = { status };
      
      // If assigning to a helper, update the helper assigned field
      if (status === "assigned" && userType === "helper") {
        updates.helperAssigned = user.id;
      }
      
      const success = await updateTask(taskId, updates);
      
      if (success) {
        // Update local state
        const updatedTasks = tasks.map(task => 
          task.id === taskId ? { ...task, ...updates } : task
        );
        setTasks(updatedTasks);
        
        // Refresh points if task completed by helper
        if (status === "completed" && userType === "helper") {
          const points = await getHelperPoints(user.id);
          setHelperPoints(points);
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erreur",
        description: "Nous n'avons pas pu mettre à jour cette tâche. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };
  
  const countTasksByStatus = (status: string) => {
    if (userType === "elderly") {
      return tasks.filter(t => t.status === status && t.requestedBy === user?.id).length;
    } else {
      return tasks.filter(t => t.status === status).length;
    }
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType}>
        {user && <Notifications />}
      </Header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          {userType === "elderly" ? "Tableau de bord - Sénior" : "Tableau de bord - Jeune"}
        </h1>
        
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
            <Card>
              <CardHeader>
                <CardTitle>Mes points</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{helperPoints}</p>
                <p className="text-gray-600">
                  points gagnés
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Vous gagnez 50 points par tâche complétée
                </p>
              </CardContent>
            </Card>
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
        
        {loading ? (
          <div className="text-center py-10">Chargement des données...</div>
        ) : (
          <TaskList tasks={tasks} userType={userType} onTaskUpdate={handleTaskUpdate} />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
