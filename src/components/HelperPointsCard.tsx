
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function HelperPointsCard() {
  const { user } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [level, setLevel] = useState<number>(1);
  const [nextLevelPoints, setNextLevelPoints] = useState<number>(100);

  const getLevelFromPoints = (points: number) => {
    // Simple niveau basé sur les points (100 points = niveau 2, 250 = niveau 3, etc.)
    if (points >= 500) return 5;
    if (points >= 250) return 4;
    if (points >= 100) return 3;
    if (points >= 50) return 2;
    return 1;
  };

  const getNextLevelPoints = (level: number) => {
    // Retourne le nombre de points requis pour le niveau suivant
    switch (level) {
      case 1: return 50;
      case 2: return 100;
      case 3: return 250;
      case 4: return 500;
      default: return 999;
    }
  };

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("helper_points")
          .select("points")
          .eq("helper_id", user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setPoints(data.points);
          const calculatedLevel = getLevelFromPoints(data.points);
          setLevel(calculatedLevel);
          setNextLevelPoints(getNextLevelPoints(calculatedLevel));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des points:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoints();
    
    // S'abonner aux mises à jour des points
    const pointsSubscription = supabase
      .channel("helper-points-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "helper_points",
          filter: `helper_id=eq.${user?.id}`,
        },
        (payload: any) => {
          const newPoints = payload.new.points;
          setPoints(newPoints);
          const newLevel = getLevelFromPoints(newPoints);
          setLevel(newLevel);
          setNextLevelPoints(getNextLevelPoints(newLevel));
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(pointsSubscription);
    };
  }, [user?.id]);

  const getLevelTitle = (level: number) => {
    switch (level) {
      case 1: return "Débutant";
      case 2: return "Aide volontaire";
      case 3: return "Assistant expérimenté";
      case 4: return "Expert de l'entraide";
      case 5: return "Maître de la générosité";
      default: return "Débutant";
    }
  };

  const progress = level < 5 
    ? Math.round(((points - getNextLevelPoints(level - 1)) / (nextLevelPoints - getNextLevelPoints(level - 1))) * 100) 
    : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
          Mon niveau d'aide
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Chargement...</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Award size={48} className="text-app-blue mr-3" />
                <div>
                  <h3 className="text-2xl font-bold">{points} points</h3>
                  <p className="text-gray-600">{getLevelTitle(level)}</p>
                </div>
              </div>
              <div className="bg-yellow-100 text-yellow-800 font-bold rounded-full h-12 w-12 flex items-center justify-center text-xl">
                {level}
              </div>
            </div>
            
            {level < 5 && (
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Progression vers niveau {level + 1}</span>
                  <span className="text-sm font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Encore {nextLevelPoints - points} points pour débloquer le niveau {level + 1}
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2 flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" /> Accomplissements
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <div className={`h-2 w-2 rounded-full ${points >= 0 ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                  Première aide apportée {points >= 50 ? '✓' : ''}
                </li>
                <li className="flex items-center text-sm">
                  <div className={`h-2 w-2 rounded-full ${points >= 50 ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                  5 tâches complétées {points >= 250 ? '✓' : ''}
                </li>
                <li className="flex items-center text-sm">
                  <div className={`h-2 w-2 rounded-full ${points >= 250 ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                  Aidant régulier {points >= 500 ? '✓' : ''}
                </li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
