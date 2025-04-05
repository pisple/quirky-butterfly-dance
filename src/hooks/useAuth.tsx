
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserType } from '@/types';
import { useToast } from './use-toast';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: UserType;
  age?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string, userType: UserType) => Promise<void>;
  signUp: (name: string, email: string, password: string, age: number, userType: UserType) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier la session utilisateur au chargement
    const getUser = async () => {
      try {
        // Vérifier si l'utilisateur est déjà connecté
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (sessionData?.session) {
          // L'utilisateur est connecté, récupérer ses informations
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();
            
          if (userError) {
            throw userError;
          }
          
          if (userData) {
            setUser({
              id: userData.id,
              email: sessionData.session.user.email || '',
              name: userData.name,
              type: userData.type as UserType,
              age: userData.age || undefined
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
    
    // S'abonner aux changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // L'utilisateur vient de se connecter, récupérer ses informations
          try {
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (userError) {
              throw userError;
            }
            
            if (userData) {
              setUser({
                id: userData.id,
                email: session.user.email || '',
                name: userData.name,
                type: userData.type as UserType,
                age: userData.age || undefined
              });
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          // L'utilisateur s'est déconnecté
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (name: string, email: string, password: string, age: number, userType: UserType) => {
    try {
      setLoading(true);
      
      // 1. Créer un compte utilisateur avec Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            type: userType
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("Erreur lors de la création du compte utilisateur");
      }
      
      // 2. Créer un profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: name,
            type: userType,
            age: age
          }
        ]);
        
      if (profileError) throw profileError;
      
      // 3. Si c'est un helper, créer une entrée dans helper_points
      if (userType === 'helper') {
        const { error: pointsError } = await supabase
          .from('helper_points')
          .insert([
            {
              helper_id: authData.user.id,
              points: 0
            }
          ]);
          
        if (pointsError) throw pointsError;
      }
      
      // 4. Définir l'utilisateur dans le contexte
      setUser({
        id: authData.user.id,
        email: authData.user.email || '',
        name: name,
        type: userType,
        age: age
      });
      
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Gener-Action !",
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);
      toast({
        title: "Échec de l'inscription",
        description: error.message || "Une erreur s'est produite lors de l'inscription.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, userType: UserType) => {
    try {
      setLoading(true);
      
      // 1. Connexion avec Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error("Erreur lors de la connexion");
      }
      
      // 2. Vérifier que le type d'utilisateur correspond
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) throw profileError;
      
      if (!profileData) {
        throw new Error("Profil utilisateur non trouvé");
      }
      
      if (profileData.type !== userType) {
        throw new Error(`Type d'utilisateur incorrect. Vous êtes un ${profileData.type}, pas un ${userType}.`);
      }
      
      // 3. Définir l'utilisateur dans le contexte
      setUser({
        id: authData.user.id,
        email: authData.user.email || '',
        name: profileData.name,
        type: profileData.type as UserType,
        age: profileData.age || undefined
      });
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Gener-Action !",
      });
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      toast({
        title: "Échec de la connexion",
        description: error.message || "Identifiants incorrects ou utilisateur non trouvé",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la déconnexion.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<AuthUser>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Mise à jour du profil utilisateur
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name || user.name,
          age: data.age || user.age,
          // Ne pas mettre à jour le type car cela pourrait causer des problèmes
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Mise à jour du contexte
      setUser({ ...user, ...data });
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Échec de la mise à jour",
        description: error.message || "Une erreur s'est produite lors de la mise à jour du profil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
