
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TaskType, KeywordOption, City } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChefHat, Store, PillIcon, MapPin, Cookie, Truck, Calendar, Weight } from "lucide-react";

// Importation des villes belges depuis un fichier séparé pour une meilleure organisation
import { BELGIAN_CITIES } from "@/data/belgian-cities";

const taskRequestSchema = z.object({
  type: z.enum(["groceries", "cooking"], { 
    required_error: "Veuillez sélectionner un type d'aide" 
  }),
  keywords: z.array(z.string()).min(1, { message: "Veuillez sélectionner au moins un mot-clé" }),
  location: z.string().min(1, { message: "La ville est requise" }),
  date: z.string().min(1, { message: "La date est requise" }),
});

type TaskRequestFormValues = z.infer<typeof taskRequestSchema>;

const GROCERIES_KEYWORDS: KeywordOption[] = [
  { value: "supermarché", label: "Supermarché" },
  { value: "pharmacie", label: "Pharmacie" },
  { value: "marché", label: "Marché" },
  { value: "épicerie", label: "Épicerie" },
  { value: "boulangerie", label: "Boulangerie" },
  { value: "livraison", label: "Livraison à domicile" },
  { value: "courses-hebdomadaires", label: "Courses hebdomadaires" },
  { value: "produits-lourds", label: "Produits lourds" }
];

const COOKING_KEYWORDS: KeywordOption[] = [
  { value: "repas-simple", label: "Repas simple" },
  { value: "repas-complet", label: "Repas complet" },
  { value: "régime-spécial", label: "Régime spécial" },
  { value: "préparation", label: "Préparation" },
  { value: "cuisson", label: "Cuisson" },
  { value: "pâtisserie", label: "Pâtisserie" },
  { value: "plats-à-emporter", label: "Plats à emporter" },
  { value: "aide-au-service", label: "Aide au service" }
];

// Fonction pour associer un icône à chaque mot-clé
const getKeywordIcon = (keyword: string) => {
  switch (keyword) {
    case "supermarché":
      return <Store className="mr-2 h-4 w-4" />;
    case "pharmacie":
      return <PillIcon className="mr-2 h-4 w-4" />;
    case "marché":
      return <MapPin className="mr-2 h-4 w-4" />;
    case "épicerie":
      return <Store className="mr-2 h-4 w-4" />;
    case "boulangerie":
      return <Cookie className="mr-2 h-4 w-4" />;
    case "livraison":
      return <Truck className="mr-2 h-4 w-4" />;
    case "courses-hebdomadaires":
      return <Calendar className="mr-2 h-4 w-4" />;
    case "produits-lourds":
      return <Weight className="mr-2 h-4 w-4" />;
    default:
      return null;
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
};

const findNearestCities = (latitude: number, longitude: number, limit: number = 20): City[] => {
  const citiesWithDistance = BELGIAN_CITIES.map(city => ({
    name: city.name,
    distance: calculateDistance(latitude, longitude, city.latitude, city.longitude)
  }));

  return citiesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

const TaskRequestForm = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [defaultCity, setDefaultCity] = useState<string>("");
  const [nearbyCities, setNearbyCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const getUserLocation = () => {
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        try {
          const parsed = JSON.parse(userProfile);
          if (parsed.location) {
            setDefaultCity(parsed.location);
            form.setValue("location", parsed.location);
          }
          if (parsed.coordinates) {
            loadNearbyCities(parsed.coordinates.latitude, parsed.coordinates.longitude);
          } else {
            getCurrentLocation();
          }
        } catch (e) {
          console.error("Erreur lors de la lecture du profil utilisateur:", e);
          getCurrentLocation();
        }
      } else {
        const storedLocation = localStorage.getItem("userLocation");
        if (storedLocation) {
          setDefaultCity(storedLocation);
          form.setValue("location", storedLocation);
        }
        getCurrentLocation();
      }
    };

    getUserLocation();
  }, []);

  const getCurrentLocation = () => {
    setIsLoadingCities(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          loadNearbyCities(latitude, longitude);
          
          const userProfile = localStorage.getItem("userProfile");
          if (userProfile) {
            try {
              const parsed = JSON.parse(userProfile);
              const updatedProfile = {
                ...parsed,
                coordinates: { latitude, longitude }
              };
              localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
            } catch (e) {
              console.error("Erreur lors de la mise à jour des coordonnées:", e);
            }
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          setNearbyCities(BELGIAN_CITIES.slice(0, 20).map(city => ({
            name: city.name,
            distance: undefined
          })));
          setIsLoadingCities(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setNearbyCities(BELGIAN_CITIES.slice(0, 20).map(city => ({
        name: city.name,
        distance: undefined
      })));
      setIsLoadingCities(false);
    }
  };

  const loadNearbyCities = (latitude: number, longitude: number) => {
    const nearestCities = findNearestCities(latitude, longitude);
    setNearbyCities(nearestCities);
    setIsLoadingCities(false);
    
    if (!defaultCity && nearestCities.length > 0) {
      setDefaultCity(nearestCities[0].name);
      form.setValue("location", nearestCities[0].name);
    }
  };
  
  const form = useForm<TaskRequestFormValues>({
    resolver: zodResolver(taskRequestSchema),
    defaultValues: {
      type: "groceries",
      keywords: [],
      location: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const taskType = form.watch("type") as TaskType;
  
  useEffect(() => {
    setSelectedKeywords([]);
    form.setValue("keywords", []);
  }, [taskType, form]);
  
  const getKeywordsForType = (type: TaskType): KeywordOption[] => {
    return type === "groceries" ? GROCERIES_KEYWORDS : COOKING_KEYWORDS;
  };
  
  const toggleKeyword = (keyword: string) => {
    const isSelected = selectedKeywords.includes(keyword);
    let newSelectedKeywords: string[];
    
    if (isSelected) {
      newSelectedKeywords = selectedKeywords.filter(k => k !== keyword);
    } else {
      newSelectedKeywords = [...selectedKeywords, keyword];
    }
    
    setSelectedKeywords(newSelectedKeywords);
    form.setValue("keywords", newSelectedKeywords, { shouldValidate: true });
  };

  const onSubmit = (values: TaskRequestFormValues) => {
    setSubmitting(true);
    
    const userName = localStorage.getItem("userName") || "Utilisateur";
    const userId = localStorage.getItem("userId") || "user1";
    
    const newTask = {
      id: uuidv4(),
      type: values.type,
      keywords: values.keywords,
      location: values.location,
      requestedBy: userId,
      requestedByName: userName,
      requestedDate: values.date,
      status: "pending",
      helperAssigned: ""
    };
    
    const existingTasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    const updatedTasks = [...existingTasks, newTask];
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    
    setTimeout(() => {
      setSubmitting(false);
      console.log(values);
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'aide a été envoyée avec succès.",
      });
      form.reset({
        type: "groceries", 
        keywords: [], 
        location: values.location, 
        date: new Date().toISOString().split("T")[0]
      });
      setSelectedKeywords([]);
      
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl text-center">Demander de l'aide</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-xl">De quel type d'aide avez-vous besoin ?</FormLabel>
                  <FormControl>
                    <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4">
                      <Button
                        type="button"
                        variant={field.value === "groceries" ? "default" : "outline"}
                        className="flex-1 text-lg py-6"
                        onClick={() => form.setValue("type", "groceries")}
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Courses
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "cooking" ? "default" : "outline"}
                        className="flex-1 text-lg py-6"
                        onClick={() => form.setValue("type", "cooking")}
                      >
                        <ChefHat className="mr-2 h-5 w-5" />
                        Aide à la cuisine
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="keywords"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xl">De quoi avez-vous besoin spécifiquement ?</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {getKeywordsForType(taskType).map((keyword) => (
                        <Badge 
                          key={keyword.value}
                          className={`cursor-pointer py-2 px-3 text-base ${
                            selectedKeywords.includes(keyword.value) 
                              ? "bg-green-600 hover:bg-green-700" 
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          }`} 
                          onClick={() => toggleKeyword(keyword.value)}
                        >
                          {getKeywordIcon(keyword.value)}
                          {keyword.label}
                        </Badge>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl">Ville</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || defaultCity}
                  >
                    <FormControl>
                      <SelectTrigger className="text-lg p-4">
                        <SelectValue placeholder={isLoadingCities ? "Recherche des villes proches..." : "Sélectionnez une ville"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {isLoadingCities ? (
                        <SelectItem value="loading" disabled>
                          Recherche des villes les plus proches...
                        </SelectItem>
                      ) : (
                        nearbyCities.map((city) => (
                          <SelectItem key={city.name} value={city.name} className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4 inline-block" />
                            {city.name}{city.distance ? ` (${Math.round(city.distance)} km)` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl">Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="text-lg p-4" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full py-6 text-xl font-medium bg-green-600 hover:bg-green-700"
              disabled={submitting || selectedKeywords.length === 0}
            >
              {submitting ? "Envoi en cours..." : "Envoyer la demande"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TaskRequestForm;
