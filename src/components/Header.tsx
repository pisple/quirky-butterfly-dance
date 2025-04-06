
import { useState } from "react";
import { Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserType } from "@/types";
import Notifications from "./Notifications";

interface HeaderProps {
  userType?: UserType;
  children?: React.ReactNode;
}

const Header = ({ userType, children }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link to="/" className="text-xl md:text-2xl font-bold text-app-blue">
              Gener-Action
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-app-blue">
              Accueil
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-app-blue">
                  Tableau de bord
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-app-blue">
                  Profil
                </Link>
                {/* Show task-specific links for each user type */}
                {userType === "elderly" ? (
                  <Link to="/task-request" className="text-gray-700 hover:text-app-blue">
                    Demander de l'aide
                  </Link>
                ) : (
                  <Link to="/accepted-tasks" className="text-gray-700 hover:text-app-blue">
                    Mes tâches
                  </Link>
                )}
                {children}
                <Button 
                  variant="outline"
                  onClick={handleLogout}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/about" className="text-gray-700 hover:text-app-blue">
                  À propos
                </Link>
                <Link to="/login">
                  <Button variant="ghost">Connexion</Button>
                </Link>
                <Link to="/register">
                  <Button>Inscription</Button>
                </Link>
              </>
            )}
          </nav>
          
          <div className="md:hidden flex items-center">
            {user && children}
            <Button 
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu />
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t">
            <Link to="/" className="block py-2 text-gray-700">
              Accueil
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block py-2 text-gray-700">
                  Tableau de bord
                </Link>
                <Link to="/profile" className="block py-2 text-gray-700">
                  Profil
                </Link>
                {userType === "elderly" ? (
                  <Link to="/task-request" className="block py-2 text-gray-700">
                    Demander de l'aide
                  </Link>
                ) : (
                  <Link to="/accepted-tasks" className="block py-2 text-gray-700">
                    Mes tâches
                  </Link>
                )}
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/about" className="block py-2 text-gray-700">
                  À propos
                </Link>
                <Link to="/login" className="block py-2 text-gray-700">
                  Connexion
                </Link>
                <Link to="/register" className="block py-2 text-gray-700">
                  Inscription
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
