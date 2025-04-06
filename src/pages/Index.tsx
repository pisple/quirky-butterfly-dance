
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteContent } from "@/utils/supabaseRPC";

const Index = () => {
  const [aboutContent, setAboutContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        setIsLoading(true);
        const data = await getSiteContent('about');
        
        if (data) {
          setAboutContent(data.content);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du contenu à propos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAbout();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Bienvenue sur Gener-Action
        </h1>
        
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <p className="text-center">Chargement...</p>
          ) : (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: aboutContent }} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
