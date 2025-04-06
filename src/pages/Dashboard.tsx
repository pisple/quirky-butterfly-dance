
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskList from "@/components/TaskList";
import { Task, UserType, HelperPoints } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserType>("elderly");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [helperPoints, setHelperPoints] = useState<number>(0);
  
  useEffect(() => {
    // Get user type from location state or default to elderly
    const stateUserType = location.state?.userType as UserType;
    if (stateUserType) {
      setUserType(stateUserType);
      localStorage.setItem("userType", stateUserType);
    } else {
      // Try to get from localStorage
      const savedUserType = localStorage.getItem("userType");
      if (savedUserType === "elderly" || savedUserType === "helper") {
        setUserType(savedUserType as UserType);
      } else {
        // If no user type is found, show welcome message
        toast({
          title: "Bienvenue sur Gener-Action",
          description: "Veuillez vous connecter pour commencer.",
        });
        navigate("/login");
      }
    }
    
    // Load tasks from localStorage
    const loadTasks = () => {
      const storedTasks = localStorage.getItem("tasks");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    };
    
    // Load points for helpers from Supabase
    const loadHelperPoints = async () => {
      if (userType === "helper") {
        const userId = localStorage.getItem("userId");
        if (userId) {
          try {
            const { data, error } = await supabase
              .from("helper_points")
              .select("*")
              .eq("helper_id", userId)
              .maybeSingle();
              
            if (error && error.code !== "PGRST116") {
              throw error;
            }
            
            if (data) {
              setHelperPoints(data.points);
            }
          } catch (error) {
            console.error("Erreur lors du chargement des points:", error);
          }
        }
        
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
    };
    
    // Load tasks initially
    loadTasks();
    
    // Load helper points
    loadHelperPoints();
    
    // Set up event listener for storage changes (when tasks are created or modified)
    window.addEventListener('storage', loadTasks);
    
    // Cleanup function
    return () => {
      window.removeEventListener('storage', loadTasks);
    };
  }, [location.state, navigate, toast, userType]);

  // Reload tasks from localStorage to ensure we have the latest data
  useEffect(() => {
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
    
    // Also update points when reloading if userType is helper
    if (userType === "helper") {
      const loadHelperPointsFromSupabase = async () => {
        const userId = localStorage.getItem("userId");
        if (userId) {
          try {
            const { data, error } = await supabase
              .from("helper_points")
              .select("*")
              .eq("helper_id", userId)
              .maybeSingle();
              
            if (error && error.code !== "PGRST116") {
              throw error;
            }
            
            if (data) {
              setHelperPoints(data.points);
            }
          } catch (error) {
            console.error("Erreur lors du chargement des points:", error);
          }
        }
      };
      
      loadHelperPointsFromSupabase();
    }
  }, [userType]);

  const handleTaskUpdate = async (taskId: string, status: "pending" | "assigned" | "completed" | "cancelled") => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status, helperAssigned: status === "assigned" ? localStorage.getItem("userId") || "" : task.helperAssigned } : task
    );
    
    setTasks(updatedTasks);
    // Save to localStorage
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    
    // Update helper points if task completed
    if (status === "completed" && userType === "helper") {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          // Récupérer les points actuels depuis Supabase
          const { data, error: fetchError } = await supabase
            .from("helper_points")
            .select("*")
            .eq("helper_id", userId)
            .maybeSingle();
            
          if (fetchError && fetchError.code !== "PGRST116") {
            throw fetchError;
          }
          
          const currentPoints = data ? data.points : 0;
          const newPoints = currentPoints + 50;
          
          // Mettre à jour ou insérer des points
          if (data) {
            await supabase
              .from("helper_points")
              .update({ points: newPoints })
              .eq("helper_id", userId);
          } else {
            await supabase
              .from("helper_points")
              .insert({ helper_id: userId, points: newPoints });
          }
          
          setHelperPoints(newPoints);
        } catch (error) {
          console.error("Erreur lors de la mise à jour des points:", error);
        }
      }
    }
  };
  
  const countTasksByStatus = (status: string) => {
    if (userType === "elderly") {
      return tasks.filter(t => t.status === status && t.requestedBy === localStorage.getItem("userId")).length;
    } else {
      return tasks.filter(t => t.status === status).length;
    }
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
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
        
        <TaskList tasks={tasks} userType={userType} onTaskUpdate={handleTaskUpdate} />
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
