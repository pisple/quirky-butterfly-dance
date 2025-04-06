
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSiteContent } from "@/utils/supabaseRPC";

interface ContentData {
  title: string;
  content: string;
}

const Terms = () => {
  const { contentType = "terms" } = useParams();
  const [content, setContent] = useState<ContentData>({ title: "", content: "" });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        const data = await getSiteContent(contentType);
        
        if (data) {
          setContent({ 
            title: data.title, 
            content: data.content 
          });
        }
      } catch (error) {
        console.error(`Erreur lors du chargement du contenu ${contentType}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [contentType]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card>
          <Tabs defaultValue={contentType} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terms" asChild>
                <Link to="/terms/terms">Conditions d'utilisation</Link>
              </TabsTrigger>
              <TabsTrigger value="privacy" asChild>
                <Link to="/terms/privacy">Politique de confidentialité</Link>
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="pt-6">
              {isLoading ? (
                <p className="text-center py-8">Chargement...</p>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-6">{content.title}</h1>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.content }} />
                </>
              )}
              
              <div className="mt-8 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                >
                  Retour
                </Button>
              </div>
            </CardContent>
          </Tabs>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
