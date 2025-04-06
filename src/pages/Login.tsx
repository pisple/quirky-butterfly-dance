
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
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserType>("elderly");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log("Login data:", data);
    
    try {
      // Connexion via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error("Identifiants invalides");
      }
      
      // Récupérer les informations du profil utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) {
        console.error("Erreur lors de la récupération du profil:", profileError);
      }
      
      // Utiliser le type d'utilisateur du profil ou celui sélectionné dans le formulaire
      const actualUserType = profileData?.type as UserType || userType;
      
      // Stocker les informations utilisateur dans localStorage pour compatibilité
      localStorage.setItem("userType", actualUserType);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userId", authData.user.id);
      localStorage.setItem("userName", profileData?.name || "");
      localStorage.setItem("isLoggedIn", "true");
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Gener-Action !",
      });
      
      // Rediriger vers le tableau de bord
      navigate("/dashboard", { state: { userType: actualUserType } });
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Identifiants invalides",
        variant: "destructive"
      });
    }
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
                        onClick={() => navigate("/register")}
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
