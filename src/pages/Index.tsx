
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Rocket, Clock, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aboutContent, setAboutContent] = useState<string>("");
  
  useEffect(() => {
    // Rediriger vers le tableau de bord si l'utilisateur est connecté
    if (user) {
      navigate("/dashboard");
    }

    // Charger le contenu "À propos"
    const fetchAboutContent = async () => {
      const { data } = await supabase
        .from("site_content")
        .select("content")
        .eq("id", "about")
        .single();

      if (data) {
        setAboutContent(data.content);
      }
    };

    fetchAboutContent();
  }, [user, navigate]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-100 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-8 md:mb-0">
                <h1 className="text-3xl md:text-5xl font-bold text-app-blue mb-4">
                  Entraide intergénérationnelle
                </h1>
                <p className="text-lg md:text-xl text-gray-700 mb-6">
                  Gener-Action connecte les seniors ayant besoin d'aide pour des tâches quotidiennes avec des jeunes prêts à donner un coup de main.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="bg-app-blue hover:bg-app-blue/90 text-lg px-6 py-6"
                    onClick={() => navigate("/register", { state: { userType: "elderly" } })}
                  >
                    Je suis un senior
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-lg px-6 py-6"
                    onClick={() => navigate("/register", { state: { userType: "helper" } })}
                  >
                    Je veux aider
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <img 
                  src="/logo-generaction.png" 
                  alt="Gener-Action" 
                  className="max-w-full h-auto max-h-80"
                />
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-12">
              Comment ça fonctionne
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Heart className="h-8 w-8 text-app-blue" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Demandez de l'aide</h3>
                  <p className="text-gray-600">
                    Les seniors peuvent facilement demander de l'aide pour leurs besoins quotidiens : courses, jardinage, technologie, et plus encore.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <Rocket className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Connectez-vous</h3>
                  <p className="text-gray-600">
                    Les jeunes bénévoles peuvent voir les demandes près de chez eux et proposer leur aide quand ils le souhaitent.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Award className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Gagnez des points</h3>
                  <p className="text-gray-600">
                    Les jeunes aidants gagnent des points pour chaque tâche accomplie, valorisant leur engagement communautaire.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* About Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div 
                className="prose max-w-none" 
                dangerouslySetInnerHTML={{ __html: aboutContent }} 
              />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
