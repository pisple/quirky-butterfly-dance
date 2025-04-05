
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Terms = () => {
  const { contentType } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      
      const contentId = contentType === "privacy" 
        ? "privacy" 
        : contentType === "about" 
          ? "about" 
          : "terms";
      
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("title, content")
          .eq("id", contentId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setContent(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du contenu:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le contenu demandé.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [contentType, toast]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Chargement...</p>
          </div>
        ) : (
          <Card className="w-full max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div 
                className="prose max-w-none" 
                dangerouslySetInnerHTML={{ __html: content.content }} 
              />
              
              <div className="mt-8 flex justify-center">
                <Button 
                  variant="outline" 
                  className="mx-2"
                  onClick={() => navigate(-1)}
                >
                  Retour
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
