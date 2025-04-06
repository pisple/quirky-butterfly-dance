
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
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
  const { signUp } = useAuth();
  const [userType, setUserType] = useState<UserType>("elderly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      age: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      await signUp(
        data.name, 
        data.email, 
        data.password, 
        Number(data.age), 
        userType
      );
      navigate("/dashboard", { state: { userType } });
    } catch (error) {
      console.error("Erreur d'inscription:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleItsmeRegistration = () => {
    alert("L'inscription via itsme n'est pas encore disponible.");
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
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Inscription rapide</span>
                </div>
              </div>
              
              <Button 
                type="button"
                variant="outline"
                className={`w-full mb-6 border-2 border-[#e10f20] ${userType === "elderly" ? "text-lg py-6" : ""}`}
                onClick={handleItsmeRegistration}
              >
                <div className="flex items-center justify-center">
                  <div className="bg-[#e10f20] text-white font-semibold px-2 py-1 rounded mr-2">itsme</div>
                  <span>S'inscrire avec itsme</span>
                </div>
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou</span>
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Inscription..." : "S'inscrire"}
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
