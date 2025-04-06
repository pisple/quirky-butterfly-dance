
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UserTypeSelection from "@/components/UserTypeSelection";
import { UserType } from "@/types";
import { getSiteContent } from "@/utils/supabaseRPC";

const Index = () => {
  const navigate = useNavigate();
  const [showSelection, setShowSelection] = useState(false);
  const [aboutContent, setAboutContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    async function loadAboutContent() {
      setIsLoading(true);
      const content = await getSiteContent("about");
      if (content) {
        setAboutContent(content.content);
      }
      setIsLoading(false);
    }

    loadAboutContent();
  }, []);
  
  const handleUserTypeSelection = (type: UserType) => {
    console.log(`Selected user type: ${type}`);
    navigate("/register", { state: { userType: type } });
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-app-blue/5">
      <Header />
      
      <main className="flex-grow">
        {showSelection ? (
          <section className="py-12 md:py-20">
            <UserTypeSelection onSelection={handleUserTypeSelection} />
          </section>
        ) : (
          <>
            {/* Hero Section */}
            <section className="py-12 md:py-20">
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 text-app-blue">
                  Renforcer les liens intergénérationnels
                </h1>
                <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-700">
                  Gener-Action connecte les personnes séniors avec des jeunes adultes prêts à les aider dans leurs tâches quotidiennes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate("/register")}
                    className="text-lg px-8 py-6 bg-app-blue hover:bg-app-blue/90"
                  >
                    Créer un compte
                  </Button>
                  <Button 
                    onClick={() => navigate("/login")}
                    className="text-lg px-8 py-6 bg-gray-700 hover:bg-gray-800"
                  >
                    Se connecter
                  </Button>
                </div>
              </div>
            </section>
            
            {/* Features Section */}
            <section className="py-16 bg-white">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-4xl font-bold mb-12 text-center">
                  Comment ça fonctionne
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {/* Feature 1 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-app-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-app-blue">1</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Demandez de l'aide</h3>
                    <p className="text-gray-600">
                      Les personnes séniors peuvent facilement demander de l'aide pour leurs courses ou la cuisine.
                    </p>
                  </div>
                  
                  {/* Feature 2 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-app-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-app-blue">2</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Trouvez des aidants</h3>
                    <p className="text-gray-600">
                      Des jeunes adultes bienveillants peuvent accepter d'aider selon leur disponibilité.
                    </p>
                  </div>
                  
                  {/* Feature 3 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-app-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-app-blue">3</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Créer des liens</h3>
                    <p className="text-gray-600">
                      Facilitez les tâches quotidiennes tout en créant des connexions humaines précieuses.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* About Section */}
            <section className="py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-4xl font-bold mb-8 text-center">
                  À propos de nous
                </h2>
                {isLoading ? (
                  <div className="text-center">Chargement...</div>
                ) : (
                  <div 
                    className="max-w-4xl mx-auto"
                    dangerouslySetInnerHTML={{ __html: aboutContent }}
                  />
                )}
              </div>
            </section>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
