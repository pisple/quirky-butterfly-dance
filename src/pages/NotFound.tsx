
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const userType = localStorage.getItem("userType") as "elderly" | "helper" | null;

  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType || undefined} />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-6xl font-bold text-app-blue mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">
            Oups ! La page que vous cherchez n'existe pas.
          </p>
          <Button 
            onClick={() => navigate("/")}
            className={`bg-app-blue hover:bg-app-blue/90 ${userType === "elderly" ? "text-xl px-8 py-6" : ""}`}
          >
            Retourner à l'accueil
          </Button>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
