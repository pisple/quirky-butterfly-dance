
import { useState, useEffect } from "react";
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

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserType>("elderly");
  const [existingUsers, setExistingUsers] = useState<{email: string, userId: string}[]>([]);

  useEffect(() => {
    // Charger les utilisateurs existants depuis le localStorage
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      setExistingUsers(JSON.parse(storedUsers));
    } else {
      // Créer quelques utilisateurs par défaut si aucun n'existe
      const defaultUsers = [
        { email: "senior@example.com", userId: "senior1" },
        { email: "helper@example.com", userId: "helper1" }
      ];
      localStorage.setItem("users", JSON.stringify(defaultUsers));
      setExistingUsers(defaultUsers);
    }
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log("Login data:", data);
    
    // Vérifier si l'email existe dans la liste des utilisateurs
    const existingUser = existingUsers.find(user => user.email === data.email);
    
    if (!existingUser) {
      toast({
        title: "Compte non trouvé",
        description: "Aucun compte n'existe avec cette adresse email. Veuillez vous inscrire.",
        variant: "destructive"
      });
      return;
    }
    
    // Simuler une connexion réussie
    toast({
      title: "Connexion réussie",
      description: "Bienvenue sur Gener-Action !",
    });
    
    // Générer un ID utilisateur s'il n'existe pas déjà
    const userId = existingUser.userId || uuidv4();
    
    // Stocker les informations utilisateur dans le localStorage
    localStorage.setItem("userType", userType);
    localStorage.setItem("userEmail", data.email);
    localStorage.setItem("userId", userId);
    localStorage.setItem("isLoggedIn", "true");
    
    // Rediriger vers le tableau de bord
    navigate("/dashboard", { state: { userType } });
  };
  
  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Connexion à Gener-Action
        </h1>
        
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-center">Connectez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  
                  <div className="space-y-4">
                    <h3 className={`font-medium ${userType === "elderly" ? "text-lg" : ""}`}>Je suis :</h3>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={userType === "elderly" ? "default" : "outline"}
                        className={`flex-1 ${userType === "elderly" ? "text-lg py-6" : ""}`}
                        onClick={() => setUserType("elderly")}
                      >
                        Senior
                      </Button>
                      <Button
                        type="button"
                        variant={userType === "helper" ? "default" : "outline"}
                        className={`flex-1 ${userType === "elderly" ? "text-lg py-6" : ""}`}
                        onClick={() => setUserType("helper")}
                      >
                        Jeune
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className={`w-full bg-app-blue hover:bg-app-blue/90 ${userType === "elderly" ? "text-lg py-6" : ""}`}
                  >
                    Se connecter
                  </Button>
                  
                  <div className="text-center">
                    <p className={userType === "elderly" ? "text-lg" : ""}>
                      Pas encore de compte ?{" "}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => navigate("/")}
                      >
                        S'inscrire
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

export default Login;
