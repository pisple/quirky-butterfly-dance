
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskRequestForm from "@/components/TaskRequestForm";
import { UserType } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const TaskRequests = () => {
  const [userType, setUserType] = useState<UserType>("elderly");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }
      
      // Fetch user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('type')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer votre profil.",
          variant: "destructive"
        });
      } else if (profileData) {
        setUserType(profileData.type as UserType);
        
        // Only elderly can request tasks
        if (profileData.type !== 'elderly') {
          toast({
            title: "Accès refusé",
            description: "Seuls les seniors peuvent créer des demandes d'aide.",
            variant: "destructive"
          });
          navigate("/dashboard");
        }
      }
      
      setLoading(false);
    };
    
    checkSession();
  }, [navigate, toast]);

  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Demander de l'aide
        </h1>
        
        {loading ? (
          <div className="text-center py-10">Chargement...</div>
        ) : (
          <TaskRequestForm />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default TaskRequests;
