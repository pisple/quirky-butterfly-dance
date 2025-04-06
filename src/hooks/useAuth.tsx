
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
        const { data } = await supabase
          .from('users')
          .select('*')
          .limit(1)
          .single();

        if (data) {
          setUser(data as AuthUser);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const signUp = async (name: string, email: string, password: string, age: number, userType: UserType) => {
    try {
      setLoading(true);
      
      // Insérer directement dans la table users
      const { data, error } = await supabase
        .from('users')
        .insert([
          { 
            name, 
            email, 
            password, // Note: En production, il faudrait hasher le mot de passe
            age, 
            type: userType
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUser(data as AuthUser);
        toast({
          title: "Inscription réussie",
          description: "Bienvenue sur Gener-Action !",
        });
      }
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
      
      // Vérifier les identifiants dans la table users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Note: En production, comparer avec un hash
        .eq('type', userType)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUser(data as AuthUser);
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Gener-Action !",
        });
      } else {
        throw new Error("Identifiants incorrects ou type d'utilisateur non correspondant");
      }
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
      setUser(null);
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (data: Partial<AuthUser>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
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
