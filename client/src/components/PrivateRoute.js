import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ShieldAlert } from 'lucide-react';

export default function PrivateRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Not authorized role
        setAuthorized(false);
        setLoading(false);
      } else {
        setAuthorized(true);
        setLoading(false);
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-500">Verificando credenciales...</span>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 min-h-[400px] px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <div className="bg-red-50 text-red-700 p-4 rounded-full mb-4">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Acceso Denegado</h2>
          <p className="text-sm text-slate-500 mb-6">
            Su cuenta no cuenta con los privilegios necesarios para acceder a este panel. Póngase en contacto con el administrador de Bytes Creativos si cree que es un error.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg transition"
          >
            Volver al Mapa Público
          </button>
        </div>
      </div>
    );
  }

  return children;
}
