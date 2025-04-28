import React from 'react';
import { Sparkles, User, LogOut } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
  user: any;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onAuthClick }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-gray-900 text-white py-6 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-white" />
          <h1 className="text-2xl font-bold">ArtificialVision</h1>
        </div>
        <nav>
          <ul className="flex space-x-6 items-center">
            <li>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Gallery
              </a>
            </li>
            <li>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">{user.email}</span>
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-1 text-white hover:text-gray-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onAuthClick} 
                  className="flex items-center gap-1 hover:text-gray-300 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;