
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-center mb-6">
          <img 
            src="/lovable-uploads/f1b9232c-75a0-48df-87a6-0afc8c9de81b.png" 
            alt="Logo GénérAction" 
            className="w-16 h-16"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-3">Gener-Action</h3>
            <p className="text-gray-600">
              Connecter les jeunes adultes avec des séniors pour les aider dans leurs tâches quotidiennes.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Liens</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-600 hover:text-app-blue">Accueil</Link></li>
              <li><Link to="/about" className="text-gray-600 hover:text-app-blue">À propos</Link></li>
              <li><Link to="/dashboard" className="text-gray-600 hover:text-app-blue">Tableau de bord</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Légal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-gray-600 hover:text-app-blue">Conditions d'utilisation</Link></li>
              <li><Link to="/privacy" className="text-gray-600 hover:text-app-blue">Politique de confidentialité</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600">
            &copy; {new Date().getFullYear()} Gener-Action. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
