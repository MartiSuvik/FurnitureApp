import { useState, useEffect } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import ImageGeneration from './modules/ImageGeneration';
import VideoCreation from './modules/VideoCreation';
import Auth from './modules/Auth';
import { TabsProvider } from './contexts/TabsContext';
import { supabase } from './services/supabaseClient';

function App() {
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState(false);
  const [selectedImageForVideo, setSelectedImageForVideo] = useState(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          setAuthView(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleAuthView = () => {
    setAuthView(!authView);
  };

  return (
    <TabsProvider>
      <div className="min-h-screen bg-cream font-sans">
        <Header user={user} onAuthClick={toggleAuthView} />
        {authView ? (
          <Auth />
        ) : (
          <main className="container mx-auto px-4 py-8">
            <TabNavigation />
            <div className="mt-6">
              <ImageGeneration onUseInVideo={setSelectedImageForVideo} />
              <VideoCreation selectedImageForVideo={selectedImageForVideo} onImageUsed={() => setSelectedImageForVideo(null)} />
            </div>
          </main>
        )}
      </div>
    </TabsProvider>
  );
}

export default App;