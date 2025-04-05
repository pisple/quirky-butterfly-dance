
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserTypeSelectionProps {
  onSelection: (type: "elderly" | "helper") => void;
}

const UserTypeSelection = ({ onSelection }: UserTypeSelectionProps) => {
  const [selectedType, setSelectedType] = useState<"elderly" | "helper" | null>(null);
  const navigate = useNavigate();
  
  const handleSelection = (type: "elderly" | "helper") => {
    setSelectedType(type);
  };
  
  const handleContinue = () => {
    if (selectedType) {
      if (selectedType === "helper") {
        // Open age verification for helpers
        const age = prompt("Veuillez entrer votre âge:");
        
        if (age && parseInt(age) >= 18) {
          onSelection(selectedType);
          navigate("/dashboard", { state: { userType: selectedType } });
        } else {
          alert("Vous devez avoir au moins 18 ans pour être un aidant.");
          setSelectedType(null);
        }
      } else {
        // For elderly users, no age verification
        onSelection(selectedType);
        navigate("/dashboard", { state: { userType: selectedType } });
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
        Qui êtes-vous ?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full max-w-3xl">
        <Card 
          className={`cursor-pointer transition-all ${
            selectedType === "elderly" 
              ? "border-4 border-app-blue" 
              : "hover:border-app-blue hover:shadow-md"
          }`}
          onClick={() => handleSelection("elderly")}
        >
          <CardHeader>
            <CardTitle className="text-center text-2xl">Je suis senior</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-24 h-24 bg-app-blue/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">👵</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-center text-lg">
              J'ai besoin d'aide pour mes activités
            </p>
          </CardFooter>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${
            selectedType === "helper" 
              ? "border-4 border-app-teal" 
              : "hover:border-app-teal hover:shadow-md"
          }`}
          onClick={() => handleSelection("helper")}
        >
          <CardHeader>
            <CardTitle className="text-center text-2xl">Je suis jeune</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-24 h-24 bg-app-teal/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">🧑</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-center text-lg">
              Je souhaite aider des seniors (18+ ans)
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {selectedType && (
        <Button 
          onClick={handleContinue}
          className="mt-8 px-8 py-6 text-lg bg-app-blue hover:bg-app-blue/90"
        >
          Continuer
        </Button>
      )}
    </div>
  );
};

export default UserTypeSelection;
