import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { API_URL, NEIGHBORHOODS, DENOMINATIONS } from '@/config';
import { 
  Building, User, Heart, Image as ImageIcon, CheckCircle, 
  ShieldAlert, Sparkles, Save, Info, AlertTriangle 
} from 'lucide-react';

export default function Profile() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('templo');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    // Institution
    denomination: '',
    congregation: '',
    start_date: '',
    type: 'Sede',
    address: '',
    postal_address: '',
    rnc_number: '',
    legal_person_number: '',
    public_welfare_number: '',
    edifice_state: 'Bueno',
    property_type: 'Alquilado',
    covered_area: '',
    avg_attendees: '',
    meeting_days: '',
    meeting_hours: '',
    other_activities: '',
    latitude: -34.515,
    longitude: -58.768,
    neighborhood: '',
    status: 'pending',
    status_note: '',

    // Responsible
    resp_first_name: '',
    resp_last_name: '',
    resp_dni: '',
    resp_role: '',
    resp_birth_date: '',
    resp_civil_activity: '',
    resp_education: '',
    resp_theological_studies: '',
    resp_formation_institution: '',
    resp_study_years: '',
    resp_home_address: '',
    resp_personal_phone: '',
    resp_personal_email: '',

    // Social actions
    has_comedor: false,
    has_roperia: false,
    has_health_center: false,
    has_food_distribution: false,
    has_medicine_distribution: false,
    has_other: false,
    social_description: '',

    // Networks
    website: '',
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    institutional_whatsapp: '',

    // Photos
    photos: []
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('No se pudo verificar la sesión.');
      }

      const data = await res.json();
      setUser(data.user);
      
      if (data.institution) {
        const inst = data.institution;
        const resp = inst.responsible || {};
        const sa = inst.socialActions || {};
        const sn = inst.socialNetworks || {};

        setFormData({
          denomination: inst.denomination || '',
          congregation: inst.congregation || '',
          start_date: inst.start_date || '',
          type: inst.type || 'Sede',
          address: inst.address || '',
          postal_address: inst.postal_address || '',
          rnc_number: inst.rnc_number || '',
          legal_person_number: inst.legal_person_number || '',
          public_welfare_number: inst.public_welfare_number || '',
          edifice_state: inst.edifice_state || 'Bueno',
          property_type: inst.property_type || 'Alquilado',
          covered_area: inst.covered_area || '',
          avg_attendees: inst.avg_attendees || '',
          meeting_days: inst.meeting_days || '',
          meeting_hours: inst.meeting_hours || '',
          other_activities: inst.other_activities || '',
          latitude: inst.latitude || -34.515,
          longitude: inst.longitude || -58.768,
          neighborhood: inst.neighborhood || '',
          status: inst.status || 'pending',
          status_note: inst.status_note || '',

          // Responsible
          resp_first_name: resp.first_name || '',
          resp_last_name: resp.last_name || '',
          resp_dni: resp.dni || '',
          resp_role: resp.role || '',
          resp_birth_date: resp.birth_date || '',
          resp_civil_activity: resp.civil_activity || '',
          resp_education: resp.education || '',
          resp_theological_studies: resp.theological_studies || '',
          resp_formation_institution: resp.formation_institution || '',
          resp_study_years: resp.study_years || '',
          resp_home_address: resp.home_address || '',
          resp_personal_phone: resp.personal_phone || '',
          resp_personal_email: resp.personal_email || '',

          // Social actions
          has_comedor: sa.has_comedor === 1,
          has_roperia: sa.has_roperia === 1,
          has_health_center: sa.has_health_center === 1,
          has_food_distribution: sa.has_food_distribution === 1,
          has_medicine_distribution: sa.has_medicine_distribution === 1,
          has_other: sa.has_other === 1,
          social_description: sa.description || '',

          // Networks
          website: sn.website || '',
          facebook: sn.facebook || '',
          instagram: sn.instagram || '',
          youtube: sn.youtube || '',
          tiktok: sn.tiktok || '',
          institutional_whatsapp: sn.institutional_whatsapp || '',

          // Photos
          photos: inst.photos || []
        });
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Mock photo upload
  const simulatePhotoUpload = (type) => {
    let url = '';
    if (type === 'fachada') {
      url = 'https://images.unsplash.com/photo-1548625361-155deee223d0?w=800&auto=format&fit=crop&q=60';
    } else if (type === 'interior') {
      url = 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&auto=format&fit=crop&q=60';
    } else {
      url = 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=800&auto=format&fit=crop&q=60';
    }

    const newPhoto = { id: Date.now(), type, url };
    setFormData(prev => {
      // Overwrite if same type exists
      const filtered = prev.photos.filter(p => p.type !== type);
      return { ...prev, photos: [...filtered, newPhoto] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      const instId = user.institutionId;

      const res = await fetch(`${API_URL}/institutions/${instId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al guardar los cambios.');
      }

      setSuccess('Ficha guardada exitosamente. Si modificó campos clave, su estado volverá a "Pendiente" hasta ser aprobada de nuevo.');
      fetchProfileData(); // Refresh info
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <PrivateRoute allowedRoles={['institution']}>
      <Layout title="CultoSIG - Mi Ficha">
        <div className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                Panel de Congregación: {formData.congregation}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Completa los campos obligatorios del relevamiento municipal.</p>
            </div>

            {/* Approval Status indicators */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold uppercase">Estado:</span>
              {formData.status === 'approved' && (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                  <CheckCircle size={14} className="mr-1 fill-emerald-600 stroke-none" />
                  Aprobado (Público)
                </span>
              )}
              {formData.status === 'pending' && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold flex items-center animate-pulse">
                  <Info size={14} className="mr-1" />
                  Pendiente de Aprobación
                </span>
              )}
              {formData.status === 'correction' && (
                <span className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                  <AlertTriangle size={14} className="mr-1" />
                  Corrección Solicitada
                </span>
              )}
            </div>
          </div>

          {/* Correction Note Alert */}
          {formData.status === 'correction' && formData.status_note && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl text-xs space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <Sparkles size={14} className="text-blue-900 animate-spin" />
                Notas del Administrador Municipal:
              </span>
              <p className="italic">"{formData.status_note}"</p>
            </div>
          )}

          {/* Success / Error Notification */}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold">{success}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg text-xs font-semibold">{error}</div>}

          {/* Tab Selector */}
          <div className="flex border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 gap-2 overflow-x-auto pb-0.5">
            <button
              onClick={() => setActiveTab('templo')}
              className={`pb-2.5 px-3 border-b-2 transition ${activeTab === 'templo' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-slate-800'}`}
            >
              Templo
            </button>
            <button
              onClick={() => setActiveTab('responsable')}
              className={`pb-2.5 px-3 border-b-2 transition ${activeTab === 'responsable' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-slate-800'}`}
            >
              Responsable (Privado)
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`pb-2.5 px-3 border-b-2 transition ${activeTab === 'social' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-slate-800'}`}
            >
              Social y Redes
            </button>
            <button
              onClick={() => setActiveTab('fotos')}
              className={`pb-2.5 px-3 border-b-2 transition ${activeTab === 'fotos' ? 'border-blue-900 text-blue-900 font-bold' : 'border-transparent hover:text-slate-800'}`}
            >
              Fotos Obligatorias
            </button>
          </div>

          {/* Main Edit Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* TAB 1: TEMPLO DETAILS */}
            {activeTab === 'templo' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Building size={16} className="text-slate-400" />
                  Datos Físicos e Institucionales del Templo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Denominación</label>
                    <select name="denomination" value={formData.denomination} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                      {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Congregación</label>
                    <input type="text" name="congregation" value={formData.congregation} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dirección</label>
                    <input type="text" name="address" value={formData.address} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm" required />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Barrio</label>
                    <select name="neighborhood" value={formData.neighborhood} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                      {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Matrícula RNC</label>
                    <input type="text" name="rnc_number" value={formData.rnc_number} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Personería Jurídica</label>
                    <input type="text" name="legal_person_number" value={formData.legal_person_number} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Entidad Bien Público</label>
                    <input type="text" name="public_welfare_number" value={formData.public_welfare_number} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Fecha de Inicio Actividades</label>
                    <input type="date" name="start_date" value={formData.start_date} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Asistentes Promedio</label>
                    <input type="number" name="avg_attendees" value={formData.avg_attendees} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Metros Cubiertos</label>
                    <input type="number" name="covered_area" value={formData.covered_area} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Días de Reunión</label>
                    <input type="text" name="meeting_days" value={formData.meeting_days} onChange={handleTextChange} placeholder="Martes, Domingo" className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Horarios</label>
                    <input type="text" name="meeting_hours" value={formData.meeting_hours} onChange={handleTextChange} placeholder="19:00, 10:00" className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RESPONSIBLE (PRIVATE DATA) */}
            {activeTab === 'responsable' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <User size={16} className="text-slate-400" />
                  Datos del Responsable de la Institución (Información Protegida)
                </h3>
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-[11px] leading-relaxed flex items-start gap-1.5">
                  <ShieldAlert size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <b>Resguardo de Datos Personales (Ley 25.326):</b> La información de contacto del responsable (DNI, teléfono, dirección particular) no es de acceso público y queda reservada de forma confidencial para uso interno de la Dirección General de Cultos del Municipio.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre</label>
                      <input type="text" name="resp_first_name" value={formData.resp_first_name} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Apellido</label>
                      <input type="text" name="resp_last_name" value={formData.resp_last_name} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DNI</label>
                    <input type="text" name="resp_dni" value={formData.resp_dni} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Cargo / Función</label>
                      <input type="text" name="resp_role" value={formData.resp_role} onChange={handleTextChange} placeholder="Pastor, Sacerdote, etc." className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Fecha Nacimiento</label>
                      <input type="date" name="resp_birth_date" value={formData.resp_birth_date} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Domicilio Particular</label>
                    <input type="text" name="resp_home_address" value={formData.resp_home_address} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Teléfono Personal</label>
                      <input type="text" name="resp_personal_phone" value={formData.resp_personal_phone} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Email Personal</label>
                      <input type="email" name="resp_personal_email" value={formData.resp_personal_email} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actividad Civil Principal</label>
                    <input type="text" name="resp_civil_activity" value={formData.resp_civil_activity} onChange={handleTextChange} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs border-t border-slate-100 pt-4">
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Estudios Teológicos</label>
                    <input type="text" name="resp_theological_studies" value={formData.resp_theological_studies} onChange={handleTextChange} placeholder="Bachillerato, Licenciatura en Teología" className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Seminario / Formación</label>
                    <input type="text" name="resp_formation_institution" value={formData.resp_formation_institution} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Años de Estudio</label>
                    <input type="number" name="resp_study_years" value={formData.resp_study_years} onChange={handleTextChange} className="w-full border rounded-lg px-2.5 py-1.5" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SOCIAL ACTION & NETWORKS */}
            {activeTab === 'social' && (
              <div className="space-y-4">
                
                {/* Checkboxes for social actions */}
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 mb-3">
                    <Heart size={16} className="text-slate-400" />
                    Acción Social Realizada en el Territorio
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <label className="flex items-center space-x-2 border rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" name="has_comedor" checked={formData.has_comedor} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-900 rounded" />
                      <span className="font-semibold text-slate-700">Comedor Comunitario</span>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" name="has_roperia" checked={formData.has_roperia} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-900 rounded" />
                      <span className="font-semibold text-slate-700">Ropería</span>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" name="has_health_center" checked={formData.has_health_center} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-900 rounded" />
                      <span className="font-semibold text-slate-700">Centro de Salud / Dispensario</span>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" name="has_food_distribution" checked={formData.has_food_distribution} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-900 rounded" />
                      <span className="font-semibold text-slate-700">Distribución de Alimentos</span>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" name="has_medicine_distribution" checked={formData.has_medicine_distribution} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-900 rounded" />
                      <span className="font-semibold text-slate-700">Distribución de Medicamentos</span>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" name="has_other" checked={formData.has_other} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-900 rounded" />
                      <span className="font-semibold text-slate-700">Otro tipo de asistencia</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Descripción detallada de la Asistencia</label>
                  <textarea
                    name="social_description"
                    value={formData.social_description}
                    onChange={handleTextChange}
                    rows="3"
                    placeholder="Describa los días, horarios y cantidad de personas que asisten al comedor o reciben medicamentos..."
                    className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>

                {/* Networks links */}
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="font-extrabold text-sm text-slate-800 mb-3">Redes Sociales y Canales Oficiales</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">WhatsApp Institucional (Publico)</label>
                      <input type="text" name="institutional_whatsapp" value={formData.institutional_whatsapp} onChange={handleTextChange} placeholder="11-5829-1029" className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Sitio Web</label>
                      <input type="text" name="website" value={formData.website} onChange={handleTextChange} placeholder="www.iglesiadelcamino.org" className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Facebook</label>
                      <input type="text" name="facebook" value={formData.facebook} onChange={handleTextChange} placeholder="facebook.com/iglesiadelcamino" className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Instagram</label>
                      <input type="text" name="instagram" value={formData.instagram} onChange={handleTextChange} placeholder="instagram.com/iglesiadelcamino" className="w-full border rounded-lg px-2.5 py-1.5" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: COMPULSORY PHOTOS */}
            {activeTab === 'fotos' && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <ImageIcon size={16} className="text-slate-400" />
                  Carga de Fotografías Obligatorias
                </h3>
                <p className="text-xs text-slate-500">
                  Suba fotografías nítidas para validar físicamente la institución en el mapa interactivo. Las fotos de fachada principal e interior son obligatorias.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Photo 1: Fachada */}
                  <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between items-center text-center bg-slate-50 space-y-3">
                    <div className="w-full h-32 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center border relative shadow-inner">
                      {formData.photos.find(p => p.type === 'fachada') ? (
                        <img 
                          src={formData.photos.find(p => p.type === 'fachada').url} 
                          alt="fachada" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Foto Fachada Pendiente</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => simulatePhotoUpload('fachada')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-4 rounded text-xs transition"
                    >
                      Simular Subir Fachada
                    </button>
                  </div>

                  {/* Photo 2: Interior */}
                  <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between items-center text-center bg-slate-50 space-y-3">
                    <div className="w-full h-32 rounded-lg bg-slate-200 overflow-hidden flex items-center justify-center border relative shadow-inner">
                      {formData.photos.find(p => p.type === 'interior') ? (
                        <img 
                          src={formData.photos.find(p => p.type === 'interior').url} 
                          alt="interior" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Foto Interior Pendiente</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => simulatePhotoUpload('interior')}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-4 rounded text-xs transition"
                    >
                      Simular Subir Interior
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* Form Footer Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100 gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </Layout>
    </PrivateRoute>
  );
}
