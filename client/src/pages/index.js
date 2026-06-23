import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { API_URL, NEIGHBORHOODS, DENOMINATIONS } from '@/config';
import { Search, MapPin, Phone, MessageSquare, Globe, Heart, Clock, ChevronRight, X, Image as ImageIcon, Sparkles } from 'lucide-react';

// Import MapView dynamically to prevent SSR errors (Leaflet relies on 'window')
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-500">Cargando visualizador GIS...</span>
      </div>
    </div>
  )
});

export default function Home() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInst, setSelectedInst] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [selectedDenomination, setSelectedDenomination] = useState('');
  const [filterComedor, setFilterComedor] = useState(false);
  const [filterRoperia, setFilterRoperia] = useState(false);
  const [filterAlimentos, setFilterAlimentos] = useState(false);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/institutions/public`);
      if (res.ok) {
        const data = await res.json();
        setInstitutions(data);
      }
    } catch (err) {
      console.error('Error fetching public institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered List
  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = 
      inst.congregation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.denomination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesNeighborhood = selectedNeighborhood ? inst.neighborhood === selectedNeighborhood : true;
    const matchesDenomination = selectedDenomination ? inst.denomination === selectedDenomination : true;
    
    const matchesComedor = filterComedor ? inst.has_comedor === 1 : true;
    const matchesRoperia = filterRoperia ? inst.has_roperia === 1 : true;
    const matchesAlimentos = filterAlimentos ? inst.has_food_distribution === 1 : true;

    return matchesSearch && matchesNeighborhood && matchesDenomination && matchesComedor && matchesRoperia && matchesAlimentos;
  });

  return (
    <Layout title="CultoSIG - Mapa Interactivo de José C. Paz">
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative" style={{ height: 'calc(100vh - 65px)' }}>
        
        {/* Left Control Panel */}
        <div className="w-full md:w-[380px] bg-white border-r border-slate-200 flex flex-col z-20 shadow-lg md:shadow-none">
          
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles size={18} className="text-blue-900 animate-pulse" />
              Relevamiento Territorial
            </h1>
            <p className="text-xs text-slate-500 mb-4">Encuentra y gestiona instituciones de culto locales.</p>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por congregación, dirección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Barrio</label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
              >
                <option value="">Todos los barrios</option>
                {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Denominación</label>
              <select
                value={selectedDenomination}
                onChange={(e) => setSelectedDenomination(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900 truncate"
              >
                <option value="">Todas las denominaciones</option>
                {DENOMINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Social Service Checkboxes */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Acción Social</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setFilterComedor(!filterComedor)}
                  className={`border rounded px-2 py-1 text-[10px] font-semibold transition truncate text-center ${filterComedor ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  Comedor
                </button>
                <button
                  onClick={() => setFilterRoperia(!filterRoperia)}
                  className={`border rounded px-2 py-1 text-[10px] font-semibold transition truncate text-center ${filterRoperia ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  Ropería
                </button>
                <button
                  onClick={() => setFilterAlimentos(!filterAlimentos)}
                  className={`border rounded px-2 py-1 text-[10px] font-semibold transition truncate text-center ${filterAlimentos ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}
                >
                  Alimentos
                </button>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-xs">Buscando congregaciones...</span>
              </div>
            ) : filteredInstitutions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron iglesias con los filtros seleccionados.
              </div>
            ) : (
              filteredInstitutions.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className={`w-full text-left p-3.5 hover:bg-slate-50 transition flex justify-between items-start ${selectedInst?.id === inst.id ? 'bg-blue-50/50 border-l-4 border-blue-900 pl-2.5' : ''}`}
                >
                  <div className="min-w-0 flex-grow pr-2">
                    <span className="text-[9px] uppercase font-bold text-blue-600 block mb-0.5">
                      {inst.denomination}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm truncate">{inst.congregation}</h4>
                    <p className="text-slate-500 text-xs truncate mt-0.5">{inst.address}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[9px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                        {inst.neighborhood}
                      </span>
                      {inst.has_comedor === 1 && (
                        <span className="text-[9px] font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-100 flex items-center">
                          <Heart size={8} className="mr-0.5 fill-emerald-600 stroke-none" />
                          Comedor
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 mt-1 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Map Panel */}
        <div className="flex-grow h-full relative z-10">
          <MapView
            institutions={filteredInstitutions}
            selectedId={selectedInst?.id}
            onSelectInstitution={(inst) => setSelectedInst(inst)}
          />
        </div>

        {/* Slide-over Detail Sheet (Right Side) */}
        {selectedInst && (
          <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white border-l border-slate-200 z-[1001] shadow-2xl flex flex-col animate-slide-in">
            
            {/* Detail Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block mb-0.5">
                  {selectedInst.denomination}
                </span>
                <h2 className="font-bold text-slate-800 text-lg leading-tight truncate">
                  {selectedInst.congregation}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInst(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Detail Body */}
            <div className="flex-grow overflow-y-auto p-5 space-y-6">
              
              {/* Photo Gallery / Main Photo */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Galería de Fotos
                </span>
                {selectedInst.photos && selectedInst.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedInst.photos.map((photo, i) => (
                      <div key={photo.id} className="h-28 rounded-lg overflow-hidden border bg-slate-100 group relative">
                        <img
                          src={photo.url}
                          alt={`${selectedInst.congregation} photo`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute bottom-1 left-1 bg-slate-900/60 backdrop-blur-sm text-white text-[8px] font-semibold uppercase px-1 rounded-sm">
                          {photo.type}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-32 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                    <ImageIcon size={24} className="mb-1" />
                    Sin fotografías disponibles.
                  </div>
                )}
              </div>

              {/* General Data Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-start text-xs">
                  <MapPin size={16} className="text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Dirección</span>
                    <p className="text-slate-500 mt-0.5">{selectedInst.address}</p>
                    <span className="inline-block bg-white text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded text-[10px] font-medium mt-1">
                      Barrio: {selectedInst.neighborhood}
                    </span>
                  </div>
                </div>

                <div className="flex items-start text-xs border-t border-slate-100 pt-3">
                  <Clock size={16} className="text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Horarios de Reuniones</span>
                    <p className="text-slate-500 mt-0.5">
                      {selectedInst.meeting_days ? `${selectedInst.meeting_days} a las ${selectedInst.meeting_hours}` : 'Sin horarios cargados.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start text-xs border-t border-slate-100 pt-3">
                  <Heart size={16} className="text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Responsable Público</span>
                    <p className="text-slate-500 mt-0.5">
                      {selectedInst.resp_first_name ? `${selectedInst.resp_first_name} ${selectedInst.resp_last_name} (${selectedInst.resp_role})` : 'Por completar'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registry numbers */}
              <div className="grid grid-cols-3 gap-2">
                <div className="border border-slate-200 rounded-lg p-2 text-center bg-white">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Registro Cultos</span>
                  <span className="text-[10px] font-semibold text-slate-700 truncate block mt-0.5">
                    {selectedInst.rnc_number || 'N/C'}
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg p-2 text-center bg-white">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Personería Jurídica</span>
                  <span className="text-[10px] font-semibold text-slate-700 truncate block mt-0.5">
                    {selectedInst.legal_person_number || 'N/C'}
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg p-2 text-center bg-white">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Bien Público</span>
                  <span className="text-[10px] font-semibold text-slate-700 truncate block mt-0.5">
                    {selectedInst.public_welfare_number || 'N/C'}
                  </span>
                </div>
              </div>

              {/* Social Action detail */}
              {selectedInst.social_description && (
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Acción Social y Comunitaria
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed italic bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5">
                    "{selectedInst.social_description}"
                  </p>
                </div>
              )}

              {/* Quick Contacts */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Contacto Directo
                </span>
                
                {selectedInst.institutional_whatsapp && (
                  <a
                    href={`https://wa.me/54${selectedInst.institutional_whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2.5 text-xs font-bold transition shadow-sm"
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Enviar WhatsApp Institucional
                  </a>
                )}

                {selectedInst.website && (
                  <a
                    href={selectedInst.website.startsWith('http') ? selectedInst.website : `https://${selectedInst.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg py-2.5 text-xs font-bold transition shadow-sm bg-white"
                  >
                    <Globe size={16} className="mr-2 text-slate-400" />
                    Visitar Sitio Web
                  </a>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
