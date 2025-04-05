
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Gener-Action. Tous droits réservés.
            </p>
          </div>
          <div className="flex space-x-4">
            <Link to="/terms" className="text-gray-500 text-sm hover:text-app-blue transition">
              Conditions générales
            </Link>
            <Link to="/terms/privacy" className="text-gray-500 text-sm hover:text-app-blue transition">
              Politique de confidentialité
            </Link>
            <Link to="/terms/about" className="text-gray-500 text-sm hover:text-app-blue transition">
              À propos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
