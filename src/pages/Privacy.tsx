
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSiteContent } from "@/utils/supabaseRPC";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteContent } from "@/types";

const Privacy = () => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      const privacyContent = await getSiteContent("privacy");
      if (privacyContent) {
        setContent(privacyContent.content);
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

export default Privacy;
