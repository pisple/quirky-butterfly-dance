
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { SiteContent } from "@/types";

const Terms = () => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTerms = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('key', 'terms')
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setContent(data.content);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des conditions générales:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTerms();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl">Chargement...</p>
          </div>
        ) : (
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
