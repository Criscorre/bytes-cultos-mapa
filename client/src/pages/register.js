import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { API_URL, NEIGHBORHOODS, DENOMINATIONS } from '@/config';
import { Sparkles, MapPin, Search, Mail, Lock, CheckCircle, ChevronRight, ChevronLeft, Building } from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 flex items-center justify-center bg-slate-100 rounded-xl border">
      <div className="flex flex-col items-center space-y-2">
        <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500">Cargando mapa de geolocalización...</span>
      </div>
    </div>
  )
});

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    denomination: '',
    congregation: '',
    address: '',
    neighborhood: '',
    type: 'Sede',
    edifice_state: 'Bueno',
    property_type: 'Alquilado',
    latitude: -34.515,
    longitude: -58.768,
    municipality_id: ''
  });

  useEffect(() => {
    fetchMunicipalities();
  }, []);

  const fetchMunicipalities = async () => {
    try {
      const res = await fetch(`${API_URL}/municipality/all`);
      if (res.ok) {
        const data = await res.json();
        setMunicipalities(data);
      }
    } catch (err) {
      console.error('Error fetching municipalities:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: Validation and Next
  const handleStep1Next = () => {
    if (!formData.denomination || !formData.congregation || !formData.address || !formData.neighborhood || !formData.municipality_id) {
      setError('Complete todos los campos obligatorios (incluyendo el Municipio).');
      return;
    }
    setError('');
    // Automatically trigger a geocoding search for Step 2
    handleGeocodeSearch();
    setStep(2);
  };

  // Step 2: Nominatim Geocoding
  const handleGeocodeSearch = async () => {
    if (!formData.address || !formData.municipality_id) return;
    try {
      setGeocodingLoading(true);
      setError('');

      const selectedMuni = municipalities.find(m => String(m.id) === String(formData.municipality_id));
      const muniName = selectedMuni ? selectedMuni.name : 'José C. Paz';
      const centerLat = selectedMuni ? selectedMuni.center_lat : -34.515;
      const centerLon = selectedMuni ? selectedMuni.center_lng : -58.768;

      const fullQuery = `${formData.address}, ${muniName}, Buenos Aires, Argentina`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
        } else {
          // Fallback to selected municipality center coordinates
          setFormData(prev => ({ ...prev, latitude: centerLat, longitude: centerLon }));
          setError('No pudimos localizar la dirección exacta automáticamente. Por favor arrastra el pin en el mapa para ubicarla manualmente.');
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleMarkerDrag = (lat, lng) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  // Final submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Complete el correo y la contraseña.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al procesar el registro.');
      }

      setSuccess(true);
      setStep(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="CultoSIG - Registro de Institución">
      <div className="flex-grow flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-2xl w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
          
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Registro del Relevamiento CultoSIG</h2>
            <p className="mt-1 text-xs text-slate-500">
              Registra tu congregación religiosa en el padrón georeferenciado del municipio.
            </p>
          </div>

          {/* Stepper progress */}
          {step < 4 && (
            <div className="flex items-center justify-center space-x-4 pb-4">
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-400'}`}>1</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${step >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>Datos</span>
              </div>
              <div className="w-10 h-0.5 bg-slate-200"></div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-400'}`}>2</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${step >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Mapa</span>
              </div>
              <div className="w-10 h-0.5 bg-slate-200"></div>
              <div className="flex items-center space-x-1.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-blue-900 text-white shadow' : 'bg-slate-100 text-slate-400'}`}>3</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${step >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>Cuenta</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* STEP 1: INSTITUTIONAL DATA */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Municipio de Pertenencia *</label>
                  <select
                    name="municipality_id"
                    value={formData.municipality_id}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                    required
                  >
                    <option value="">Seleccione un municipio...</option>
                    {municipalities.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Denominación / Credo *</label>
                  <select
                    name="denomination"
                    value={formData.denomination}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                    required
                  >
                    <option value="">Seleccione...</option>
                    {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre de la Congregación *</label>
                  <input
                    type="text"
                    name="congregation"
                    value={formData.congregation}
                    onChange={handleChange}
                    placeholder="Ej: Parroquia San José Obrero"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                    required
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dirección (Calle y Altura) *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Ej: Roque Sáenz Peña 1450"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Barrio de José C. Paz *</label>
                  <select
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                    required
                  >
                    <option value="">Seleccione un barrio...</option>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Tipo de Sede</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
                    <option value="Sede">Sede Central</option>
                    <option value="Filial">Filial</option>
                    <option value="Anexo">Anexo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Estado Edificio</label>
                  <select name="edifice_state" value={formData.edifice_state} onChange={handleChange} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
                    <option value="Excelente">Excelente</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Precario">Precario</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Inmueble</label>
                  <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full border rounded-lg px-2.5 py-1.5 text-xs">
                    <option value="Propio">Propio</option>
                    <option value="Alquilado">Alquilado</option>
                    <option value="Casa de familia">Casa de familia</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleStep1Next}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-lg transition flex items-center space-x-1 shadow-md"
                >
                  <span>Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GEOLOCALIZATION MAP */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-950 flex items-start space-x-2">
                <Sparkles size={16} className="text-blue-900 mt-0.5 flex-shrink-0" />
                <div>
                  <b>Geolocalización en el Territorio:</b> Ubica el marcador en el mapa. 
                  Puedes escribir otra dirección alternativa abajo y buscar, o arrastrar el pin libremente para situarlo exactamente sobre tu templo.
                </div>
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Calle y Número, José C. Paz"
                  className="flex-grow bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
                <button
                  type="button"
                  onClick={handleGeocodeSearch}
                  disabled={geocodingLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition flex items-center space-x-1"
                >
                  <Search size={14} />
                  <span>{geocodingLoading ? 'Buscando...' : 'Localizar'}</span>
                </button>
              </div>

              <div className="h-80 rounded-xl overflow-hidden shadow-inner border border-slate-200">
                <MapView
                  editable={true}
                  editableCoords={{ lat: formData.latitude, lng: formData.longitude }}
                  onMarkerDrag={handleMarkerDrag}
                  center={[formData.latitude, formData.longitude]}
                  zoom={15}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep(1)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-lg transition flex items-center space-x-1"
                >
                  <ChevronLeft size={16} />
                  <span>Atrás</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-5 py-2 rounded-lg transition flex items-center space-x-1 shadow-md"
                >
                  <span>Continuar</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ACCOUNT & PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 flex items-center space-x-3">
                <Building size={20} className="text-slate-400" />
                <div>
                  Resumen: <b>{formData.congregation}</b> ({formData.type})<br />
                  Dirección: <b>{formData.address}, Barrio {formData.neighborhood}</b>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Correo Electrónico de Contacto *</label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="iglesia@gmail.com"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                    required
                  />
                  <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cree una Contraseña *</label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
                    required
                  />
                  <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-lg transition flex items-center space-x-1"
                >
                  <ChevronLeft size={16} />
                  <span>Atrás</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-5 py-2.5 rounded-lg transition flex items-center space-x-2 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Registrar Congregación</span>
                      <CheckCircle size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS SCREEN */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="flex justify-center text-emerald-500 animate-bounce">
                <CheckCircle size={56} className="fill-emerald-50 bg-white rounded-full" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">¡Registro Enviado Exitosamente!</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                La solicitud para <b>{formData.congregation}</b> fue creada correctamente. El Administrador Municipal de la Dirección de Cultos revisará la información y aprobará su cuenta.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 text-left max-w-md mx-auto">
                💡 <b>¿Qué sigue?</b><br />
                Una vez aprobada tu cuenta, recibirás un correo de confirmación. Podrás iniciar sesión para completar tu perfil, cargar fotos obligatorias (Fachada e Interior) e ingresar los datos del pastor/responsable.
              </div>
              <div className="pt-4">
                <button
                  onClick={() => router.push('/login')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg transition shadow-md"
                >
                  Ir al Login
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
