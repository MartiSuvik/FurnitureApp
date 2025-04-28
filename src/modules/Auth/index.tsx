import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import AuthForm from './components/AuthForm';
import SocialAuth from './components/SocialAuth';
import { supabase } from '../../services/supabaseClient';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<any>(null);

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
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-800">Welcome</h2>
              <p className="mt-2 text-gray-600">{user.email}</p>
            </div>
            <div className="mt-6">
              <button
                onClick={handleSignOut}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Sparkles className="h-10 w-10 text-blue-600" />
        </div>
        <h2 className="mt-3 text-center text-3xl font-bold text-gray-900">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <AuthForm 
            mode={mode} 
            switchMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
          />
          <SocialAuth />
        </div>
      </div>
    </div>
  );
};

export default Auth;