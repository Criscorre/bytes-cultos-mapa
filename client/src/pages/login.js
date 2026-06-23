import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { API_URL } from '@/config';
import { LogIn, Mail, Lock, ShieldAlert } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Complete todos los campos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al iniciar sesión.');
      }

      // Save token and user details
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Trigger custom storage event for navbar to sync
      window.dispatchEvent(new Event('storage'));

      // Redirect depending on user role
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard/profile');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="CultoSIG - Iniciar Sesión">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
          
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-900 text-white rounded-xl shadow-md flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H7M19 9H5" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ingresar al Sistema</h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Accede al panel administrativo municipal o de tu congregación.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center space-x-2 text-xs font-semibold animate-shake">
              <ShieldAlert size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Correo Electrónico</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@culto.gob.ar"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                  required
                />
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contraseña</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                  required
                />
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg transition shadow-md hover:shadow flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Public Access/Register helper */}
          <div className="text-center border-t border-slate-100 pt-4 mt-6">
            <span className="text-xs text-slate-500">¿Eres una institución y no tienes cuenta?</span>
            <Link href="/register" className="text-xs text-blue-800 font-bold hover:underline block mt-1">
              Registrar Nueva Congregación
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
