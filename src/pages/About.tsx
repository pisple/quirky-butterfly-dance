
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteContent } from "@/utils/supabaseRPC";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteContent } from "@/types";

const About = () => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      const aboutContent = await getSiteContent("about");
      if (aboutContent) {
        setContent(aboutContent.content);
      } else {
        // Fallback content
        setContent(`
          <div class="prose max-w-none">
            <h1>À propos de Gener-Action</h1>
            <p>Application créée par les apprenants de l'IFAPME de Charleroi</p>
            <p>Rue Square des martyrs 1<br>6000 Charleroi</p>
            <p>Notre application a pour but de mettre en relation des personnes âgées ayant besoin d'aide avec des bénévoles prêts à leur venir en aide.</p>
            <h2>Notre mission</h2>
            <p>Faciliter l'entraide intergénérationnelle et améliorer la qualité de vie de nos aînés.</p>
            <h2>Nos services</h2>
            <ul>
              <li>Aide aux courses</li>
              <li>Aide à la cuisine</li>
              <li>Accompagnement</li>
              <li>Jardinage</li>
              <li>Assistance technologique</li>
            </ul>
          </div>
        `);
      }
      setLoading(false);
    }

    loadContent();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
