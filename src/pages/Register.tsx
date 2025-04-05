
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserType } from "@/types";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from 'uuid';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Le nom est trop court" }),
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
  age: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 18, {
    message: "Vous devez avoir au moins 18 ans",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserType>("elderly");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      age: "",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    console.log("Register data:", data);
    
    // Enregistrer l'utilisateur dans le localStorage
    const userId = uuidv4();
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const newUser = {
      id: userId,
      name: data.name,
      email: data.email,
      age: data.age,
      type: userType
    };
    
    localStorage.setItem("users", JSON.stringify([...existingUsers, newUser]));
    
    // Stocker également les informations de session de l'utilisateur
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", data.name);
    localStorage.setItem("userEmail", data.email);
    localStorage.setItem("userType", userType);
    localStorage.setItem("isLoggedIn", "true");
    
    if (userType === "helper") {
      // Initialiser les points pour les aidants
      localStorage.setItem("helperPoints", "0");
    }
    
    toast({
      title: "Inscription réussie",
      description: "Bienvenue sur Gener-Action !",
    });
    
    navigate("/dashboard", { state: { userType } });
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Inscription à Gener-Action
        </h1>
        
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Créer un compte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <h3 className={`font-medium ${userType === "elderly" ? "text-lg" : ""}`}>Je suis :</h3>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={userType === "elderly" ? "default" : "outline"}
                    className={`flex-1 ${userType === "elderly" ? "text-lg py-6 flex items-center justify-center" : ""}`}
                    onClick={() => setUserType("elderly")}
                  >
                    {userType === "elderly" && <span className="text-xl mr-2">👵</span>}
                    Senior
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "helper" ? "default" : "outline"}
                    className={`flex-1 ${userType === "elderly" ? "text-lg py-6 flex items-center justify-center" : ""}`}
                    onClick={() => setUserType("helper")}
                  >
                    {userType === "helper" && <span className="text-xl mr-2">🧑</span>}
                    Jeune aidant
                  </Button>
                </div>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={userType === "elderly" ? "text-lg" : ""}>Nom complet</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Votre nom"
                            className={userType === "elderly" ? "text-lg p-6" : ""}
                          />
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
                        <FormLabel className={userType === "elderly" ? "text-lg" : ""}>Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="votre@email.com"
                            className={userType === "elderly" ? "text-lg p-6" : ""}
                          />
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
                        <FormLabel className={userType === "elderly" ? "text-lg" : ""}>Mot de passe</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="••••••••"
                            className={userType === "elderly" ? "text-lg p-6" : ""}
                          />
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
                        <FormLabel className={userType === "elderly" ? "text-lg" : ""}>Âge</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="18"
                            placeholder="Votre âge"
                            className={userType === "elderly" ? "text-lg p-6" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className={`w-full bg-app-blue hover:bg-app-blue/90 ${userType === "elderly" ? "text-lg py-6" : ""}`}
                  >
                    S'inscrire
                  </Button>
                  
                  <div className="text-center">
                    <p className={userType === "elderly" ? "text-lg" : ""}>
                      Déjà inscrit ?{" "}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => navigate("/login")}
                      >
                        Se connecter
                      </Button>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
