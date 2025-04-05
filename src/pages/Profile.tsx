
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserType } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserType>("elderly");
  
  useEffect(() => {
    // Get user type from localStorage
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType === "elderly" || savedUserType === "helper") {
      setUserType(savedUserType);
    } else {
      // If no user type is found, redirect to home
      navigate("/");
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem("userType");
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/");
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          Profil
        </h1>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className={userType === "elderly" ? "text-2xl" : ""}>
              Informations personnelles
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className={`flex flex-col ${userType === "elderly" ? "text-lg" : ""}`}>
              <p className="text-gray-500">Nom</p>
              <p className="font-medium">{userType === "elderly" ? "Marie Dupont" : "Lucas Bernard"}</p>
            </div>
            
            <div className={`flex flex-col ${userType === "elderly" ? "text-lg" : ""}`}>
              <p className="text-gray-500">Type de profil</p>
              <p className="font-medium">{userType === "elderly" ? "Personne Sénior" : "Aidant"}</p>
            </div>
            
            <div className={`flex flex-col ${userType === "elderly" ? "text-lg" : ""}`}>
              <p className="text-gray-500">Adresse</p>
              <p className="font-medium">12 Rue des Lilas, 75001 Paris</p>
            </div>
            
            <div className={`flex flex-col ${userType === "elderly" ? "text-lg" : ""}`}>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">
                {userType === "elderly" ? "marie.dupont@example.com" : "lucas.bernard@example.com"}
              </p>
            </div>
            
            <div className={`flex flex-col ${userType === "elderly" ? "text-lg" : ""}`}>
              <p className="text-gray-500">Téléphone</p>
              <p className="font-medium">06 12 34 56 78</p>
            </div>
            
            {userType === "helper" && (
              <div className="flex flex-col">
                <p className="text-gray-500">Âge</p>
                <p className="font-medium">24 ans</p>
              </div>
            )}
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                className={`flex-1 ${userType === "elderly" ? "text-lg py-6" : ""}`}
                onClick={() => navigate("/dashboard")}
              >
                Retour au tableau de bord
              </Button>
              
              <Button 
                variant="destructive" 
                className={`flex-1 ${userType === "elderly" ? "text-lg py-6" : ""}`}
                onClick={handleLogout}
              >
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
