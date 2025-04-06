
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { TaskType, KeywordOption, BelgianCity } from "@/types";
import belgianCities from "@/data/belgian-cities";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { createTask as createSupabaseTask } from "@/utils/supabaseRPC";
import { createTask as createLocalTask } from "@/utils/localTaskStorage";

// Keywords for different task types
const taskKeywords: Record<TaskType, KeywordOption[]> = {
  groceries: [
    { value: "supermarché", label: "Supermarché" },
    { value: "pharmacie", label: "Pharmacie" },
    { value: "boulangerie", label: "Boulangerie" },
    { value: "courses lourdes", label: "Courses lourdes" },
    { value: "livraison", label: "Livraison" }
  ],
  cooking: [
    { value: "repas simple", label: "Repas simple" },
    { value: "repas traditionnel", label: "Repas traditionnel" },
    { value: "pâtisserie", label: "Pâtisserie" },
    { value: "régime spécial", label: "Régime spécial" }
  ],
  gardening: [
    { value: "tonte de pelouse", label: "Tonte de pelouse" },
    { value: "taille de haies", label: "Taille de haies" },
    { value: "plantation", label: "Plantation" },
    { value: "désherbage", label: "Désherbage" }
  ],
  technology: [
    { value: "ordinateur", label: "Ordinateur" },
    { value: "smartphone", label: "Smartphone" },
    { value: "internet", label: "Internet" },
    { value: "télévision", label: "Télévision" },
    { value: "imprimante", label: "Imprimante" }
  ],
  accompaniment: [
    { value: "rendez-vous médical", label: "Rendez-vous médical" },
    { value: "promenade", label: "Promenade" },
    { value: "événement social", label: "Événement social" },
    { value: "démarches administratives", label: "Démarches administratives" }
  ]
};

// Generate city options
const cityOptions: BelgianCity[] = belgianCities;

const TaskRequestForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [taskType, setTaskType] = useState<TaskType>("groceries");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationOptions, setShowLocationOptions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<BelgianCity[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [submitting, setSubmitting] = useState(false);
  
  // Filter cities based on search term
  const handleLocationSearch = (searchTerm: string) => {
    setLocationSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setFilteredCities([]);
      setShowLocationOptions(false);
      return;
    }
    
    const filtered = cityOptions
      .filter(city => 
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 results
    
    setFilteredCities(filtered);
    setShowLocationOptions(true);
  };
  
  const selectCity = (city: BelgianCity) => {
    setLocation(`${city.name} (${city.latitude},${city.longitude})`);
    setLocationSearch(city.name);
    setShowLocationOptions(false);
  };
  
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => 
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };
  
  const addCustomKeyword = () => {
    if (!customKeyword.trim()) return;
    
    if (!selectedKeywords.includes(customKeyword.trim())) {
      setSelectedKeywords(prev => [...prev, customKeyword.trim()]);
    }
    
    setCustomKeyword("");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour soumettre une demande.",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    
    if (selectedKeywords.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un mot-clé.",
        variant: "destructive"
      });
      return;
    }
    
    if (!location) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un lieu.",
        variant: "destructive"
      });
      return;
    }
    
    if (!date) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const newTask = {
        type: taskType,
        keywords: selectedKeywords,
        location: location,
        requestedBy: user.id,
        requestedByName: user.name,
        requestedDate: date.toISOString().split('T')[0],
        status: "pending" as const
      };
      
      console.log("Attempting to create task:", newTask);
      
      // Try to create task in Supabase
      try {
        const createdTask = await createSupabaseTask(newTask);
        if (createdTask) {
          console.log("Task created successfully in Supabase:", createdTask);
          toast({
            title: "Demande soumise",
            description: "Votre demande a été soumise avec succès.",
          });
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error creating task in Supabase:", error);
        // Fall back to local storage
        console.log("Falling back to local storage for task creation");
      }
      
      // If Supabase fails, create in local storage
      const localTaskId = createLocalTask(newTask);
      if (localTaskId) {
        console.log("Task created in local storage with ID:", localTaskId);
        toast({
          title: "Demande soumise (mode hors ligne)",
          description: "Votre demande a été enregistrée localement.",
        });
        navigate("/dashboard");
      } else {
        throw new Error("Failed to create task locally");
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="taskType" className="text-lg">Type d'aide</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button 
                type="button"
                variant={taskType === "groceries" ? "default" : "outline"}
                className={taskType === "groceries" ? "bg-app-blue" : ""}
                onClick={() => setTaskType("groceries")}
              >
                Courses
              </Button>
              <Button 
                type="button"
                variant={taskType === "cooking" ? "default" : "outline"}
                className={taskType === "cooking" ? "bg-app-blue" : ""}
                onClick={() => setTaskType("cooking")}
              >
                Cuisine
              </Button>
              <Button 
                type="button"
                variant={taskType === "gardening" ? "default" : "outline"}
                className={taskType === "gardening" ? "bg-app-blue" : ""}
                onClick={() => setTaskType("gardening")}
              >
                Jardinage
              </Button>
              <Button 
                type="button"
                variant={taskType === "technology" ? "default" : "outline"}
                className={taskType === "technology" ? "bg-app-blue" : ""}
                onClick={() => setTaskType("technology")}
              >
                Technologie
              </Button>
              <Button 
                type="button"
                variant={taskType === "accompaniment" ? "default" : "outline"}
                className={taskType === "accompaniment" ? "bg-app-blue" : ""}
                onClick={() => setTaskType("accompaniment")}
                className="col-span-2 md:col-span-1"
              >
                Accompagnement
              </Button>
            </div>
          </div>
          
          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-lg">Mots-clés</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {taskKeywords[taskType].map((keyword) => (
                <Badge
                  key={keyword.value}
                  variant="outline"
                  className={cn(
                    "cursor-pointer text-base py-1.5 px-3",
                    selectedKeywords.includes(keyword.value) 
                      ? "bg-app-blue text-white" 
                      : "bg-gray-100"
                  )}
                  onClick={() => toggleKeyword(keyword.value)}
                >
                  {keyword.label}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                id="customKeyword"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder="Ajouter un autre mot-clé"
                className="flex-1"
              />
              <Button 
                type="button"
                onClick={addCustomKeyword}
              >
                Ajouter
              </Button>
            </div>
          </div>
          
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-lg">Lieu</Label>
            <div className="relative">
              <Input
                id="location"
                value={locationSearch}
                onChange={(e) => handleLocationSearch(e.target.value)}
                placeholder="Entrez une ville ou un code postal"
              />
              
              {showLocationOptions && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => (
                      <div
                        key={`${city.name}-${city.latitude}-${city.longitude}`}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => selectCity(city)}
                      >
                        {city.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500">Aucune ville trouvée</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-lg">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Sélectionnez une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-app-blue hover:bg-app-blue/90 text-lg py-6"
            disabled={submitting}
          >
            {submitting ? "En cours..." : "Soumettre ma demande d'aide"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TaskRequestForm;
