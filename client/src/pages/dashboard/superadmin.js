import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { API_URL } from '@/config';
import { 
  Building, Users, Landmark, Plus, CheckCircle, ShieldAlert, 
  MapPin, Settings, UserPlus, TableProperties, BarChart3, Download 
} from 'lucide-react';

export default function SuperadminPanel() {
  const [municipalities, setMunicipalities] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muniSuccess, setMuniSuccess] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states - Municipality
  const [muniForm, setMuniForm] = useState({
    name: '',
    province: 'Buenos Aires',
    center_lat: '',
    center_lng: '',
    zoom_level: '13'
  });

  // Form states - Admin Office
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    municipality_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      // Fetch municipalities
      const muniRes = await fetch(`${API_URL}/municipality/all`);
      if (muniRes.ok) {
        const muniData = await muniRes.json();
        setMunicipalities(muniData);
      }

      // Fetch admins
      const adminRes = await fetch(`${API_URL}/auth/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        setAdmins(adminData);
      }

    } catch (err) {
      console.error('Error fetching superadmin data:', err);
      setError('Error al conectar con la API.');
    } finally {
      setLoading(false);
    }
  };

  const handleMuniSubmit = async (e) => {
    e.preventDefault();
    if (!muniForm.name || !muniForm.center_lat || !muniForm.center_lng) {
      setError('Complete todos los campos del municipio.');
      return;
    }

    try {
      setMuniSuccess('');
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/municipality`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(muniForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar el municipio.');
      }

      setMuniSuccess('Municipio registrado exitosamente.');
      setMuniForm({
        name: '',
        province: 'Buenos Aires',
        center_lat: '',
        center_lng: '',
        zoom_level: '13'
      });
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminForm.email || !adminForm.password || !adminForm.municipality_id) {
      setError('Complete todos los campos del administrador.');
      return;
    }

    try {
      setAdminSuccess('');
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/register-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminForm)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar el administrador.');
      }

      setAdminSuccess('Oficina municipal (Administrador) registrada exitosamente.');
      setAdminForm({ email: '', password: '', municipality_id: '' });
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PrivateRoute allowedRoles={['superadmin']}>
      <Layout title="CultoSIG - Panel Global Superadmin">
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden bg-slate-900" style={{ minHeight: 'calc(100vh - 65px)' }}>
          
          {/* Sidebar Menu */}
          <div className="w-full lg:w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-2 flex-shrink-0 text-slate-300">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4 px-2">Navegación Global</span>
            
            <Link href="/dashboard/superadmin" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-blue-950 text-white font-bold transition">
              <Settings size={18} />
              <span>Municipios y Oficinas</span>
            </Link>

            <Link href="/dashboard" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <BarChart3 size={18} />
              <span>Estadísticas</span>
            </Link>

            <Link href="/dashboard/institutions" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <TableProperties size={18} />
              <span>Aprobaciones</span>
            </Link>
          </div>

          {/* Main Space */}
          <div className="flex-grow p-6 space-y-8 overflow-y-auto text-slate-100">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Panel Global SaaS: Bytes Creativos
              </h2>
              <p className="text-slate-400 text-xs">Crea municipios y asigna accesos administrativos a nuevas oficinas de culto de Argentina.</p>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs font-semibold max-w-4xl">
                ⚠️ {error}
              </div>
            )}

            {/* Layout forms grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl">
              
              {/* Card 1: Add Municipality */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <Landmark size={14} />
                  1. Registrar Nuevo Municipio (SaaS Tenant)
                </span>
                
                {muniSuccess && <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-2.5 rounded text-xs">{muniSuccess}</div>}

                <form onSubmit={handleMuniSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-slate-400">Nombre del Municipio</label>
                      <input 
                        type="text" 
                        value={muniForm.name}
                        onChange={e => setMuniForm({...muniForm, name: e.target.value})}
                        placeholder="Ej: San Miguel" 
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Provincia</label>
                      <input 
                        type="text" 
                        value={muniForm.province}
                        onChange={e => setMuniForm({...muniForm, province: e.target.value})}
                        placeholder="Buenos Aires" 
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-slate-400">Latitud Centro</label>
                      <input 
                        type="number" 
                        step="0.000001" 
                        value={muniForm.center_lat}
                        onChange={e => setMuniForm({...muniForm, center_lat: e.target.value})}
                        placeholder="-34.542" 
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Longitud Centro</label>
                      <input 
                        type="number" 
                        step="0.000001" 
                        value={muniForm.center_lng}
                        onChange={e => setMuniForm({...muniForm, center_lng: e.target.value})}
                        placeholder="-58.712" 
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Zoom Inicial</label>
                      <input 
                        type="number" 
                        value={muniForm.zoom_level}
                        onChange={e => setMuniForm({...muniForm, zoom_level: e.target.value})}
                        placeholder="13" 
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900"
                        required 
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 rounded transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <Plus size={14} />
                    <span>Crear Municipio</span>
                  </button>
                </form>
              </div>

              {/* Card 2: Add Admin User */}
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <UserPlus size={14} />
                  2. Asignar Acceso a Oficina (Administrador Municipal)
                </span>

                {adminSuccess && <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-2.5 rounded text-xs">{adminSuccess}</div>}

                <form onSubmit={handleAdminSubmit} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-400">Municipio de la Oficina</label>
                    <select
                      value={adminForm.municipality_id}
                      onChange={e => setAdminForm({...adminForm, municipality_id: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900 text-slate-200"
                      required
                    >
                      <option value="">Seleccione...</option>
                      {municipalities.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.province})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-slate-400">Correo Electrónico (Login)</label>
                      <input 
                        type="email" 
                        value={adminForm.email}
                        onChange={e => setAdminForm({...adminForm, email: e.target.value})}
                        placeholder="culto@sanmiguel.gob.ar" 
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Contraseña de Acceso</label>
                      <input 
                        type="password" 
                        value={adminForm.password}
                        onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                        placeholder="••••••••" 
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 focus:outline-none focus:border-blue-900"
                        required 
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded transition flex items-center justify-center space-x-1.5 shadow"
                  >
                    <Plus size={14} />
                    <span>Habilitar Oficina Municipal</span>
                  </button>
                </form>
              </div>

            </div>

            {/* Lists grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl">
              
              {/* Municipality Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Landmark size={16} className="text-blue-400" />
                  Listado de Municipios Activos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3">Municipio</th>
                        <th className="p-3">Provincia</th>
                        <th className="p-3">Centro Geográfico</th>
                        <th className="p-3 text-center">Zoom</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {municipalities.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-900/30 transition text-slate-300">
                          <td className="p-3 font-bold text-slate-200">{m.name}</td>
                          <td className="p-3">{m.province}</td>
                          <td className="p-3 font-mono text-slate-400">{m.center_lat.toFixed(4)}, {m.center_lng.toFixed(4)}</td>
                          <td className="p-3 text-center font-mono">{m.zoom_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admins Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Users size={16} className="text-amber-400" />
                  Accesos Habilitados (Oficinas de Culto)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-3">Correo Oficina</th>
                        <th className="p-3">Municipio Administrado</th>
                        <th className="p-3">Fecha Alta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {admins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-slate-900/30 transition text-slate-300">
                          <td className="p-3 font-semibold text-slate-200">{admin.email}</td>
                          <td className="p-3 font-bold text-blue-400">{admin.municipality_name}</td>
                          <td className="p-3 text-slate-400">{admin.created_at.substring(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      </Layout>
    </PrivateRoute>
  );
}
