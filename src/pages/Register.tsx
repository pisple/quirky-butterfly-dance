
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Base schema for all users
const baseSchema = {
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  email: z.string().email({ message: "Adresse email invalide" }),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }),
  userType: z.enum(["elderly", "helper"], { 
    required_error: "Veuillez sélectionner un type d'utilisateur" 
  }),
};

// Helper schema adds age verification
const helperSchema = z.object({
  ...baseSchema,
  age: z.coerce.number().min(18, { message: "Vous devez avoir au moins 18 ans" }),
  phone: z.string().optional(),
  location: z.string().optional(),
});

// Elderly schema is simpler (no age verification)
const elderlySchema = z.object({
  ...baseSchema,
  age: z.coerce.number().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
});

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"elderly" | "helper" | undefined>();
  
  // Create form with dynamic schema based on user type
  const form = useForm<z.infer<typeof helperSchema>>({
    resolver: zodResolver(userType === "elderly" ? elderlySchema : helperSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      userType: undefined,
      phone: "",
      location: "",
    },
  });

  // Update the schema when user type changes
  useEffect(() => {
    if (userType) {
      form.setValue("userType", userType);
    }
  }, [userType, form]);

  const onSubmit = (data: z.infer<typeof helperSchema>) => {
    setIsLoading(true);
    
    // Dans une vraie application, vous enverriez ces données à une API
    console.log("Données d'inscription:", data);
    
    // Simuler un délai réseau
    setTimeout(() => {
      // Stocker les informations utilisateur dans localStorage
      localStorage.setItem("userType", data.userType);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("isLoggedIn", "true");
      
      toast({
        title: "Inscription réussie !",
        description: "Votre compte a été créé avec succès.",
      });
      
      setIsLoading(false);
      navigate("/dashboard", { state: { userType: data.userType } });
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">
              Inscrivez-vous pour commencer à utiliser Gener-Action
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!userType ? (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-center">Je suis :</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setUserType("elderly")}
                    className="py-8 text-xl bg-app-blue hover:bg-app-blue/90"
                    variant="outline"
                    size="lg"
                  >
                    Sénior
                  </Button>
                  <Button 
                    onClick={() => setUserType("helper")}
                    className="py-8 text-xl"
                    variant="outline"
                    size="lg"
                  >
                    Jeune
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {userType === "elderly" ? (
                    // Formulaire simplifié pour les seniors
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xl">Votre nom</FormLabel>
                            <FormControl>
                              <Input placeholder="Entrez votre nom" {...field} className="text-lg p-6" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xl">Adresse email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="votre@email.fr" {...field} className="text-lg p-6" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xl">Mot de passe</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} className="text-lg p-6" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full bg-app-blue hover:bg-app-blue/90 text-xl py-6" disabled={isLoading}>
                        {isLoading ? "Inscription en cours..." : "S'inscrire"}
                      </Button>
                    </>
                  ) : (
                    // Formulaire complet pour les aidants
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom complet</FormLabel>
                              <FormControl>
                                <Input placeholder="Entrez votre nom" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Âge</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Votre âge" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="votre@email.fr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mot de passe</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de téléphone (optionnel)</FormLabel>
                              <FormControl>
                                <Input placeholder="06 XX XX XX XX" {...field} />
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
                              <FormLabel>Ville (optionnel)</FormLabel>
                              <FormControl>
                                <Input placeholder="Votre ville" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="w-full bg-app-blue hover:bg-app-blue/90" disabled={isLoading}>
                        {isLoading ? "Inscription en cours..." : "S'inscrire"}
                      </Button>
                    </>
                  )}
                </form>
              </Form>
            )}

            <div className="mt-6 text-center text-sm">
              Vous avez déjà un compte?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto text-app-blue" 
                onClick={() => navigate("/login")}
              >
                Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
