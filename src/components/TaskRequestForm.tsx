
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
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChefHat, Flower, Laptop, Users, MapPin, Calendar, Weight, Store, PillIcon, Cookie, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Schema de validation pour le formulaire de demande d'aide
const taskRequestSchema = z.object({
  type: z.enum(["groceries", "cooking", "gardening", "technology", "accompaniment"], { 
    required_error: "Veuillez sélectionner un type d'aide" 
  }),
  keywords: z.array(z.string()).min(1, { message: "Veuillez sélectionner au moins un mot-clé" }),
  location: z.string().min(1, { message: "La ville est requise" }),
  date: z.string().min(1, { message: "La date est requise" }),
});

type TaskRequestFormValues = z.infer<typeof taskRequestSchema>;

// Définitions des mots-clés par type de tâche
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

const GARDENING_KEYWORDS: KeywordOption[] = [
  { value: "tonte-pelouse", label: "Tonte de pelouse" },
  { value: "taille-haie", label: "Taille de haie" },
  { value: "désherbage", label: "Désherbage" },
  { value: "plantation", label: "Plantation" },
  { value: "arrosage", label: "Arrosage" },
  { value: "ramassage-feuilles", label: "Ramassage de feuilles" },
];

const TECHNOLOGY_KEYWORDS: KeywordOption[] = [
  { value: "ordinateur", label: "Aide ordinateur" },
  { value: "smartphone", label: "Aide smartphone" },
  { value: "internet", label: "Connexion internet" },
  { value: "email", label: "Gestion emails" },
  { value: "imprimante", label: "Imprimante" },
  { value: "tv", label: "Télévision" },
  { value: "formation", label: "Formation numérique" },
];

const ACCOMPANIMENT_KEYWORDS: KeywordOption[] = [
  { value: "rendez-vous-medical", label: "Rendez-vous médical" },
  { value: "demarches-administratives", label: "Démarches administratives" },
  { value: "promenade", label: "Promenade" },
  { value: "visite-culturelle", label: "Visite culturelle" },
  { value: "compagnie", label: "Simple compagnie" },
  { value: "lecture", label: "Lecture" },
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

// Fonction pour calculer la distance entre deux points géographiques
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

const TaskRequestForm = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [defaultCity, setDefaultCity] = useState<string>("");
  const [nearbyCities, setNearbyCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      toast({
        title: "Veuillez vous connecter",
        description: "Vous devez être connecté pour accéder à cette page.",
      });
      navigate("/login");
      return;
    }
    
    const loadUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data?.location) {
          setDefaultCity(data.location);
          form.setValue("location", data.location);
        } else {
          getCurrentLocation();
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        getCurrentLocation();
      }
    };
    
    const loadCities = async () => {
      setIsLoadingCities(true);
      try {
        const { data, error } = await supabase
          .from('belgian_cities')
          .select('name, latitude, longitude');
          
        if (error) throw error;
        
        if (data) {
          const cities = data.map(city => ({
            name: city.name,
            latitude: city.latitude,
            longitude: city.longitude,
            distance: undefined
          }));
          
          setNearbyCities(cities.slice(0, 20));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des villes:", error);
      } finally {
        setIsLoadingCities(false);
      }
    };

    loadUserProfile();
    loadCities();
  }, [user, navigate, toast]);

  const getCurrentLocation = () => {
    setIsLoadingCities(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Charger toutes les villes de la base de données
            const { data, error } = await supabase
              .from('belgian_cities')
              .select('name, latitude, longitude');
              
            if (error) throw error;
            
            if (data) {
              // Calculer la distance pour chaque ville
              const citiesWithDistance = data.map(city => ({
                name: city.name,
                latitude: city.latitude,
                longitude: city.longitude,
                distance: calculateDistance(latitude, longitude, city.latitude, city.longitude)
              }));
              
              // Trier par proximité
              const sortedCities = citiesWithDistance.sort((a, b) => a.distance - b.distance);
              
              setNearbyCities(sortedCities.slice(0, 20));
              
              if (sortedCities.length > 0) {
                setDefaultCity(sortedCities[0].name);
                form.setValue("location", sortedCities[0].name);
              }
            }
            
            // Mettre à jour le profil utilisateur avec les coordonnées
            if (user) {
              await supabase
                .from('profiles')
                .update({
                  location: data && data.length > 0 ? data[0].name : undefined,
                })
                .eq('id', user.id);
            }
          } catch (error) {
            console.error("Erreur lors du traitement des villes:", error);
          } finally {
            setIsLoadingCities(false);
          }
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          setIsLoadingCities(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setIsLoadingCities(false);
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
    switch (type) {
      case "groceries":
        return GROCERIES_KEYWORDS;
      case "cooking":
        return COOKING_KEYWORDS;
      case "gardening":
        return GARDENING_KEYWORDS;
      case "technology":
        return TECHNOLOGY_KEYWORDS;
      case "accompaniment":
        return ACCOMPANIMENT_KEYWORDS;
      default:
        return GROCERIES_KEYWORDS;
    }
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

  const onSubmit = async (values: TaskRequestFormValues) => {
    if (!user) return;
    
    setSubmitting(true);
    
    try {
      // Créer la tâche dans la base de données
      const { error } = await supabase
        .from('tasks')
        .insert([{
          type: values.type,
          keywords: values.keywords,
          location: values.location,
          requested_by: user.id,
          requested_date: values.date,
          status: 'pending'
        }]);
        
      if (error) throw error;
      
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'aide a été envoyée avec succès.",
      });
      
      // Réinitialiser le formulaire
      form.reset({
        type: "groceries", 
        keywords: [], 
        location: values.location, 
        date: new Date().toISOString().split("T")[0]
      });
      setSelectedKeywords([]);
      
      // Rediriger vers le tableau de bord
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur lors de la création de la demande:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi de votre demande.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl text-center">J'ai besoin d'aide</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-xl">Quel type d'aide cherchez-vous ?</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Button
                        type="button"
                        variant={field.value === "groceries" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center p-4 h-24 text-lg"
                        onClick={() => form.setValue("type", "groceries")}
                      >
                        <span className="text-3xl mb-2">🛒</span>
                        Courses
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "cooking" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center p-4 h-24 text-lg"
                        onClick={() => form.setValue("type", "cooking")}
                      >
                        <span className="text-3xl mb-2">👨‍🍳</span>
                        Cuisine
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "gardening" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center p-4 h-24 text-lg"
                        onClick={() => form.setValue("type", "gardening")}
                      >
                        <span className="text-3xl mb-2">🌻</span>
                        Jardinage
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "technology" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center p-4 h-24 text-lg"
                        onClick={() => form.setValue("type", "technology")}
                      >
                        <span className="text-3xl mb-2">📱</span>
                        Technologie
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === "accompaniment" ? "default" : "outline"}
                        className="flex flex-col items-center justify-center p-4 h-24 text-lg md:col-start-2"
                        onClick={() => form.setValue("type", "accompaniment")}
                      >
                        <span className="text-3xl mb-2">👥</span>
                        Accompagnement
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
                  <FormLabel className="text-xl">Précisions :</FormLabel>
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
                  <FormLabel className="text-xl">Où ?</FormLabel>
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
                  <FormLabel className="text-xl">Quand ?</FormLabel>
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
              {submitting ? "Envoi en cours..." : "Envoyer ma demande"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TaskRequestForm;
