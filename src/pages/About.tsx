
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteContent } from "@/utils/supabaseRPC";
import { Skeleton } from "@/components/ui/skeleton";

const About = () => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      const aboutContent = await getSiteContent("about");
      if (aboutContent) {
        setContent(aboutContent.content);
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
            <div dangerouslySetInnerHTML={{ __html: content }} className="about-page">
              <style jsx>{`
                .about-page .about-container {
                  display: flex;
                  flex-direction: column;
                  gap: 2rem;
                }
                
                .about-page h1 {
                  color: #2563eb;
                  margin-bottom: 2rem;
                }
                
                .about-page h2 {
                  color: #2563eb;
                  margin-bottom: 1rem;
                }
                
                .about-page .location, .about-page .mission, .about-page .team {
                  padding: 1rem;
                  border-radius: 0.5rem;
                  background-color: #f8fafc;
                }
                
                @media (min-width: 768px) {
                  .about-page .about-container {
                    flex-direction: row;
                    flex-wrap: wrap;
                  }
                  
                  .about-page .location, .about-page .mission, .about-page .team {
                    flex: 1 1 300px;
                  }
                }
              `}</style>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
