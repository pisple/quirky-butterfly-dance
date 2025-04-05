
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
            <CardTitle className="text-center text-2xl">Sénior</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-24 h-24 bg-app-blue/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-blue"><path d="M11 21H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h5l2 3h9a2 2 0 0 1 2 2v2M21.12 15.88l-4.24 4.24M16.88 15.88l4.24 4.24"/></svg>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-center text-lg">
              J'ai besoin d'aide pour mes courses ou la cuisine
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
            <CardTitle className="text-center text-2xl">Jeune</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-24 h-24 bg-app-teal/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-teal"><path d="M14 11c5.333 0 5.333-8 0-8"/><path d="M6 11h8"/><path d="M6 15h8"/><path d="M9 21a2 2 0 0 0 2-2v-6"/><path d="M4 15a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2"/><path d="M10 7V3"/></svg>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-center text-lg">
              Je souhaite aider les personnes séniors (18+ ans)
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
