import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import CreateListingModal from './CreateListingModal';
import { MessageSquare, PlusCircle, LogOut, Home, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleOpenCreate = () => {
    if (!user) {
      toast.error('Please sign in to post an item');
      setIsAuthOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  };

  return (
    <>
      {/* Desktop & Tablet Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 group">
            {/* Custom Logo from /public/logo.png */}
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-1 group-hover:scale-105 transition-transform flex-shrink-0">
              <img
                src="/logo.png"
                alt="CampusMarket Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              CampusMarket
            </span>
          </Link>

          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              <PlusCircle size={16} />
              <span>Sell Item</span>
            </button>

            {user ? (
              <>
                <Link
                  to="/inbox"
                  className={`p-2 rounded-xl border transition ${
                    location.pathname.startsWith('/inbox') || location.pathname.startsWith('/chat')
                      ? 'bg-slate-800 border-indigo-500/40 text-indigo-400'
                      : 'border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                  title="Messages"
                >
                  <MessageSquare size={18} />
                </Link>

                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-red-400 transition"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-medium transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< 640px) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-6 py-2 flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 text-[10px] ${
            location.pathname === '/' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Home size={20} />
          <span>Feed</span>
        </Link>

        <button
          onClick={handleOpenCreate}
          className="flex flex-col items-center py-1 text-[10px] text-indigo-400 font-semibold"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center -mt-4 shadow-lg shadow-indigo-600/40">
            <PlusCircle size={20} />
          </div>
          <span>Sell</span>
        </button>

        {user ? (
          <Link
            to="/inbox"
            className={`flex flex-col items-center py-1 text-[10px] ${
              location.pathname.startsWith('/inbox') || location.pathname.startsWith('/chat')
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <MessageSquare size={20} />
            <span>Chats</span>
          </Link>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex flex-col items-center py-1 text-[10px] text-slate-400"
          >
            <User size={20} />
            <span>Sign In</span>
          </button>
        )}
      </nav>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CreateListingModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}