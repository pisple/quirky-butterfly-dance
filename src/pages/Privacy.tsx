
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { SiteContent } from "@/types";

const Privacy = () => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchPrivacy = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('key', 'privacy')
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setContent(data.content);
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la politique de confidentialité:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrivacy();
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

export default Privacy;
