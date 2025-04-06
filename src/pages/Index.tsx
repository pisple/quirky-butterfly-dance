
// Remplacer l'appel à site_content par une fonction RPC
const fetchAbout = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_site_content', { content_id: 'about' });
      
    if (error) {
      throw error;
    }
    
    if (data) {
      setAboutContent(data.content);
    }
  } catch (error) {
    console.error("Erreur lors du chargement du contenu à propos:", error);
  }
};
