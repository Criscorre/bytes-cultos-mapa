import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { API_URL } from '@/config';
import { 
  TableProperties, BarChart3, Download, Search, Check, X, FileClock, 
  ChevronRight, BadgeHelp, ClipboardList, ShieldCheck, Landmark, MessageSquare, 
  MapPin, Clock, Calendar, Heart, ShieldAlert, Phone, Mail, UserCheck
} from 'lucide-react';

export default function AdminInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInst, setSelectedInst] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [actionNote, setActionNote] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState(''); // 'approved', 'rejected', 'correction'

  // Contact Note state
  const [contactSummary, setContactSummary] = useState('');
  const [contactNotes, setContactNotes] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/institutions/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data);
      }
    } catch (err) {
      console.error('Error fetching admin institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedInst || !targetStatus) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/institutions/admin/${selectedInst.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus, status_note: actionNote })
      });

      if (res.ok) {
        // Refresh detail
        const updated = { ...selectedInst, status: targetStatus, status_note: actionNote };
        setSelectedInst(updated);
        setShowActionModal(false);
        setActionNote('');
        fetchInstitutions(); // Refresh table list
      } else {
        const data = await res.json();
        alert(data.message || 'Error al cambiar estado.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddContactLog = async (e) => {
    e.preventDefault();
    if (!contactSummary.trim() || !selectedInst) return;

    try {
      setSubmittingContact(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/institutions/admin/${selectedInst.id}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ summary: contactSummary, notes: contactNotes })
      });

      if (res.ok) {
        // Add to local state list immediately
        const newLog = {
          id: Date.now(),
          contact_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
          summary: contactSummary,
          notes: contactNotes
        };
        setSelectedInst(prev => ({
          ...prev,
          contactHistories: [newLog, ...(prev.contactHistories || [])]
        }));
        setContactSummary('');
        setContactNotes('');
      }
    } catch (err) {
      console.error('Error logging contact:', err);
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleDeleteInstitution = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta institución? Esta acción borrará permanentemente sus datos y fotos.')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/institutions/admin/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedInst(null);
        fetchInstitutions();
      }
    } catch (err) {
      console.error('Error deleting institution:', err);
    }
  };

  const filteredInstitutions = institutions.filter(inst => {
    const matchesStatus = statusFilter === 'all' ? true : inst.status === statusFilter;
    const matchesSearch = 
      inst.congregation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.denomination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.resp_first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.resp_last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Aprobado</span>;
      case 'pending':
        return <span className="bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase animate-pulse">Pendiente</span>;
      case 'rejected':
        return <span className="bg-rose-950/80 text-rose-300 border border-rose-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Rechazado</span>;
      case 'correction':
        return <span className="bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">En Corrección</span>;
      default:
        return null;
    }
  };

  return (
    <PrivateRoute allowedRoles={['admin', 'superadmin']}>
      <Layout title="CultoSIG - Aprobaciones">
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden bg-slate-900" style={{ minHeight: 'calc(100vh - 65px)' }}>
          
          {/* Sidebar Menu */}
          <div className="w-full lg:w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-2 flex-shrink-0 text-slate-300">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4 px-2">Navegación</span>
            
            <Link href="/dashboard" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <BarChart3 size={18} />
              <span>Estadísticas</span>
            </Link>

            <Link href="/dashboard/institutions" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-blue-950 text-white font-bold transition">
              <TableProperties size={18} />
              <span>Aprobaciones</span>
            </Link>

            <Link href="/dashboard/reports" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <Download size={18} />
              <span>Reportes</span>
            </Link>
          </div>

          {/* Main List */}
          <div className="flex-grow p-6 space-y-6 overflow-y-auto text-slate-100 relative">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Registro de Solicitudes
                </h2>
                <p className="text-slate-400 text-xs">Administra las fichas de las iglesias locales, validación de coordenadas e historial.</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por congregación, responsable..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-900 transition"
                />
                <Search className="absolute left-3 top-2 text-slate-400" size={14} />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-900"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobados</option>
                  <option value="correction">En Corrección</option>
                  <option value="rejected">Rechazados</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Congregación / Denominación</th>
                      <th className="p-4">Barrio</th>
                      <th className="p-4">Dirección</th>
                      <th className="p-4">Responsable</th>
                      <th className="p-4 text-center">Estado</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500">Cargando registros...</td>
                      </tr>
                    ) : filteredInstitutions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-500">No se encontraron solicitudes.</td>
                      </tr>
                    ) : (
                      filteredInstitutions.map((inst) => (
                        <tr 
                          key={inst.id}
                          className={`hover:bg-slate-900/50 transition cursor-pointer ${selectedInst?.id === inst.id ? 'bg-slate-900' : ''}`}
                          onClick={() => setSelectedInst(inst)}
                        >
                          <td className="p-4">
                            <span className="font-bold text-slate-200 block">{inst.congregation}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{inst.denomination}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-300">{inst.neighborhood}</td>
                          <td className="p-4 text-slate-400">{inst.address}</td>
                          <td className="p-4 text-slate-400">
                            {inst.resp_first_name ? `${inst.resp_first_name} ${inst.resp_last_name}` : 'No ingresado'}
                          </td>
                          <td className="p-4 text-center">{getStatusBadge(inst.status)}</td>
                          <td className="p-4 text-right">
                            <ChevronRight size={16} className="text-slate-500" />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sliding Detail Drawer (Admin Panel Right) */}
            {selectedInst && (
              <div className="absolute top-0 right-0 h-full w-full xl:w-[500px] bg-slate-950 border-l border-slate-800 z-[1001] shadow-2xl flex flex-col animate-slide-in text-slate-300">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-start bg-slate-950/60">
                  <div className="min-w-0 pr-4">
                    <span className="text-[10px] uppercase font-bold text-blue-400 block mb-0.5">
                      Ficha Administrativa Interna
                    </span>
                    <h3 className="font-bold text-white text-lg leading-tight truncate">
                      {selectedInst.congregation}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedInst(null)}
                    className="p-1.5 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-5 space-y-6">
                  
                  {/* Photo Gallery */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Fotos de Fachada / Interior</span>
                    {selectedInst.photos && selectedInst.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedInst.photos.map(photo => (
                          <div key={photo.id} className="h-28 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 relative">
                            <img src={photo.url} alt="admin photo" className="w-full h-full object-cover" />
                            <div className="absolute bottom-1 left-1 bg-slate-950/80 text-white text-[8px] font-semibold uppercase px-1 rounded">
                              {photo.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-lg p-4 text-center text-xs text-slate-500">
                        No hay fotografías cargadas para esta congregación.
                      </div>
                    )}
                  </div>

                  {/* Private Contact Details (Only visible to officials) */}
                  <div className="bg-slate-900 rounded-xl border border-slate-850 p-4 space-y-4">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      Información de Contacto Privada (Dirección de Cultos)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block font-medium">Nombre de Responsable</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">
                          {selectedInst.resp_first_name ? `${selectedInst.resp_first_name} ${selectedInst.resp_last_name}` : 'N/C'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium">DNI</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">{selectedInst.resp_dni || 'N/C'}</span>
                      </div>
                      <div className="flex items-start">
                        <Phone size={12} className="text-slate-500 mr-1.5 mt-0.5" />
                        <div>
                          <span className="text-slate-500 block font-medium">Teléfono Personal</span>
                          <span className="font-bold text-slate-200 block">{selectedInst.resp_personal_phone || 'N/C'}</span>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Mail size={12} className="text-slate-500 mr-1.5 mt-0.5" />
                        <div>
                          <span className="text-slate-500 block font-medium">Email Personal</span>
                          <span className="font-bold text-slate-200 block">{selectedInst.resp_personal_email || 'N/C'}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block font-medium">Domicilio Particular</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">{selectedInst.resp_home_address || 'N/C'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block font-medium">Estudios cursados y Teología</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">
                          {selectedInst.resp_theological_studies ? `${selectedInst.resp_theological_studies} en ${selectedInst.resp_formation_institution || 'N/C'} (${selectedInst.resp_study_years || 0} años de estudio)` : 'N/C'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Public Data Summary */}
                  <div className="bg-slate-900 rounded-xl border border-slate-850 p-4 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                      Resumen Datos Ficha Pública
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Dirección</span>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedInst.address}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Barrio</span>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedInst.neighborhood}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Matrícula RNC</span>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedInst.rnc_number || 'No Registrada'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Personería Jurídica</span>
                        <p className="font-semibold text-slate-200 mt-0.5">{selectedInst.legal_person_number || 'No Registrada'}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Estado de Solicitud</span>
                        <div className="mt-1 flex items-center space-x-1.5">
                          {getStatusBadge(selectedInst.status)}
                          {selectedInst.status_note && (
                            <span className="text-[10px] text-slate-400 italic">
                              "{selectedInst.status_note}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Acciones de Aprobación</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => { setTargetStatus('approved'); setShowActionModal(true); }}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg py-2 text-xs font-bold transition flex items-center justify-center space-x-1"
                      >
                        <Check size={14} />
                        <span>Aprobar</span>
                      </button>
                      <button
                        onClick={() => { setTargetStatus('correction'); setShowActionModal(true); }}
                        className="bg-blue-700 hover:bg-blue-600 text-white rounded-lg py-2 text-xs font-bold transition flex items-center justify-center space-x-1"
                      >
                        <FileClock size={14} />
                        <span>Corrección</span>
                      </button>
                      <button
                        onClick={() => { setTargetStatus('rejected'); setShowActionModal(true); }}
                        className="bg-rose-700 hover:bg-rose-600 text-white rounded-lg py-2 text-xs font-bold transition flex items-center justify-center space-x-1"
                      >
                        <X size={14} />
                        <span>Rechazar</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteInstitution(selectedInst.id)}
                      className="w-full bg-slate-900 border border-red-950 text-red-400 hover:bg-red-950/20 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 size={14} />
                      <span>Eliminar Iglesia del Sistema</span>
                    </button>
                  </div>

                  {/* Contact Log Form */}
                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-slate-400" />
                      Registrar Contacto Manual (Interno)
                    </span>

                    <form onSubmit={handleAddContactLog} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Asunto: Visita pastoral, llamado preventivo, etc."
                        value={contactSummary}
                        onChange={(e) => setContactSummary(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-900 text-slate-200"
                        required
                      />
                      <textarea
                        placeholder="Escriba notas detalladas del contacto con el responsable..."
                        value={contactNotes}
                        onChange={(e) => setContactNotes(e.target.value)}
                        rows="2"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-900 text-slate-200"
                      />
                      <button
                        type="submit"
                        disabled={submittingContact || !contactSummary}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 rounded text-xs font-bold transition disabled:opacity-50"
                      >
                        Registrar Entrada
                      </button>
                    </form>
                  </div>

                  {/* Contact Log History List */}
                  <div className="border-t border-slate-800 pt-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Historial de Contacto</span>
                    
                    <div className="space-y-2.5">
                      {selectedInst.contactHistories && selectedInst.contactHistories.length > 0 ? (
                        selectedInst.contactHistories.map((log) => (
                          <div key={log.id} className="bg-slate-900/60 p-2.5 rounded border border-slate-850 text-xs">
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                              <span className="font-bold text-blue-400">{log.summary}</span>
                              <span>{log.contact_date}</span>
                            </div>
                            {log.notes && <p className="text-[11px] text-slate-400 mt-1">{log.notes}</p>}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic text-[11px] py-2">
                          Sin historial de contactos.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ACTION STATUS MODAL PROMPT */}
            {showActionModal && (
              <div className="fixed inset-0 bg-black/60 z-[1002] flex items-center justify-center p-4">
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-4">
                  <h4 className="font-extrabold text-sm text-white">
                    Confirmar Cambio de Estado
                  </h4>
                  <p className="text-xs text-slate-400">
                    Puedes ingresar una nota aclaratoria para la institución (ej: 'Falta foto fachada' o 'Aprobado correctamente').
                  </p>
                  <textarea
                    placeholder="Escriba un mensaje aclaratorio..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    rows="3"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-900"
                  />
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setShowActionModal(false)}
                      className="bg-slate-900 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded text-xs transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleStatusChange}
                      className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-1.5 px-4 rounded text-xs transition"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </Layout>
    </PrivateRoute>
  );
}
