
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  userType?: "elderly" | "helper";
}

export const Header = ({ userType: propsUserType }: HeaderProps) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  
  // Utiliser le type d'utilisateur des props si disponible, sinon utiliser celui de l'utilisateur connecté
  const userType = propsUserType || (user?.type as "elderly" | "helper" | undefined);
  const isLoggedIn = !!user;
  
  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <span className={`font-semibold text-app-blue ${userType === "elderly" ? "text-2xl" : "text-xl"}`}>
              Gener-Action
            </span>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className={`text-app-dark hover:text-app-blue transition ${userType === "elderly" ? "text-xl" : ""}`}>
                  Tableau de bord
                </Link>
                {userType === "elderly" ? (
                  <Link to="/task-request" className="text-app-dark hover:text-app-blue transition text-xl">
                    Demander de l'aide
                  </Link>
                ) : (
                  <>
                    <Link to="/accepted-tasks" className="text-app-dark hover:text-app-blue transition">
                      Tâches acceptées
                    </Link>
                  </>
                )}
                <Link to="/profile" className={`text-app-dark hover:text-app-blue transition ${userType === "elderly" ? "text-xl" : ""}`}>
                  Profil
                </Link>
                <Button 
                  variant="outline" 
                  className={`ml-4 ${userType === "elderly" ? "text-lg px-6 py-5" : ""}`}
                  onClick={handleLogout}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => navigate("/login")}
                >
                  Connexion
                </Button>
                <Button 
                  variant="default" 
                  className="bg-app-blue hover:bg-app-blue/90"
                  onClick={() => navigate("/register")}
                >
                  S'inscrire
                </Button>
              </>
            )}
          </nav>
        </div>
        
        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 space-y-3">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="block py-2 text-app-dark hover:text-app-blue transition">
                  Tableau de bord
                </Link>
                {userType === "elderly" ? (
                  <Link to="/task-request" className="block py-2 text-app-dark hover:text-app-blue transition">
                    Demander de l'aide
                  </Link>
                ) : (
                  <>
                    <Link to="/accepted-tasks" className="block py-2 text-app-dark hover:text-app-blue transition">
                      Tâches acceptées
                    </Link>
                  </>
                )}
                <Link to="/profile" className="block py-2 text-app-dark hover:text-app-blue transition">
                  Profil
                </Link>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleLogout}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full mb-2"
                  onClick={() => navigate("/login")}
                >
                  Connexion
                </Button>
                <Button
                  variant="default"
                  className="w-full bg-app-blue hover:bg-app-blue/90"
                  onClick={() => navigate("/register")}
                >
                  S'inscrire
                </Button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
