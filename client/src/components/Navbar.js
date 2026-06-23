import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Map, LogIn, UserPlus, LogOut, LayoutDashboard, User, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check localStorage for logged user
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    
    // Listen to storage changes
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, [router.asPath]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-[1000] w-full border-b bg-white/85 backdrop-blur-md border-slate-200 shadow-sm px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand/Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="bg-blue-900 text-white p-2 rounded-lg group-hover:bg-blue-800 transition shadow-md flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H7M19 9H5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900 text-lg tracking-tight leading-none">CultoSIG</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 border px-1.5 py-0.2 rounded font-semibold uppercase">
                José C. Paz
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">Desarrollado por Bytes Creativos</span>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link
            href="/"
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition ${router.pathname === '/' ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <Map size={16} className="mr-1.5" />
            <span className="hidden sm:inline">Mapa</span>
          </Link>

          {!user ? (
            <>
              <Link
                href="/register"
                className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition ${router.pathname === '/register' ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <UserPlus size={16} className="mr-1.5" />
                <span>Registrar</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center bg-blue-900 hover:bg-blue-800 text-white px-3.5 py-1.5 text-sm font-semibold rounded-lg transition shadow-sm hover:shadow"
              >
                <LogIn size={16} className="mr-1.5" />
                <span>Ingresar</span>
              </Link>
            </>
          ) : (
            <>
              {/* Dashboard Link for Admin / Superadmin */}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <Link
                  href="/dashboard"
                  className={`flex items-center px-3 py-1.5 text-sm font-bold rounded-md transition ${router.pathname.startsWith('/dashboard') && router.pathname !== '/dashboard/profile' ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <LayoutDashboard size={16} className="mr-1.5 text-blue-700" />
                  <span>Panel Admin</span>
                </Link>
              )}

              {/* Profile Link for Institution */}
              {user.role === 'institution' && (
                <Link
                  href="/dashboard/profile"
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition ${router.pathname === '/dashboard/profile' ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  <User size={16} className="mr-1.5" />
                  <span>Mi Perfil</span>
                </Link>
              )}

              {/* Session indicator */}
              <div className="hidden lg:flex items-center bg-slate-100 rounded-lg px-3 py-1 text-xs font-semibold text-slate-700 space-x-1.5">
                {user.role === 'admin' ? (
                  <ShieldAlert size={12} className="text-amber-600" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                )}
                <span className="truncate max-w-[150px]">{user.email}</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center border border-slate-200 hover:bg-slate-50 text-slate-600 px-3.5 py-1.5 text-sm font-semibold rounded-lg transition shadow-sm"
              >
                <LogOut size={16} className="mr-1.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}
