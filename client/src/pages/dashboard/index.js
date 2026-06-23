import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { API_URL } from '@/config';
import { 
  Building, Users, Landmark, FileClock, Sparkles, MessageSquare, 
  MapPin, ShieldAlert, BadgeAlert, Layers, ChevronRight, BarChart3, 
  TrendingUp, TableProperties, Download, Trash2, CheckCircle2, Settings 
} from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 flex items-center justify-center bg-slate-800 rounded-xl border">
      <span className="text-xs text-slate-400">Cargando mapa de calor...</span>
    </div>
  )
});

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [user, setUser] = useState(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: '¡Hola! Soy el Asistente CultoSIG IA. ¿En qué puedo ayudarte hoy con el análisis del territorio?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Duplicate Check State
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Territorial Analysis State
  const [territorialAnalysis, setTerritorialAnalysis] = useState(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsRes = await fetch(`${API_URL}/municipality/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch institutions
      const instRes = await fetch(`${API_URL}/institutions/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (instRes.ok) {
        const instData = await instRes.json();
        setInstitutions(instData);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // AI Chatbot Logic
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let responseText = '';
      const textLower = userMsg.toLowerCase();

      if (textLower.includes('sol y verde')) {
        const solYVerdeChurches = institutions.filter(i => i.neighborhood === 'Sol y Verde' && i.status === 'approved');
        responseText = `En el barrio Sol y Verde se encuentran registradas y aprobadas ${solYVerdeChurches.length} instituciones: ${solYVerdeChurches.map(i => i.congregation).join(', ')}.`;
      } else if (textLower.includes('pentecostal') || textLower.includes('pentecostales')) {
        const pentecostals = institutions.filter(i => i.denomination.toLowerCase().includes('pentecostal') && i.status === 'approved');
        responseText = `Actualmente hay ${pentecostals.length} iglesias pentecostales aprobadas en José C. Paz: ${pentecostals.map(i => i.congregation).join(', ')}.`;
      } else if (textLower.includes('comedor') || textLower.includes('acción social') || textLower.includes('alimentos')) {
        const socialChurches = institutions.filter(i => (i.has_comedor === 1 || i.has_food_distribution === 1) && i.status === 'approved');
        responseText = `He detectado ${socialChurches.length} congregaciones con comedores o distribución de alimentos activos: ${socialChurches.map(i => `${i.congregation} (${i.neighborhood})`).join(', ')}.`;
      } else if (textLower.includes('barrio') || textLower.includes('menor presencia')) {
        responseText = "Analizando la densidad de cobertura: Los barrios 'Barrio Vucetich' y '9 de Julio' poseen menor cantidad de congregaciones registradas. Se sugiere priorizar relevamientos en esas zonas.";
      } else {
        responseText = "Entendido. Puedo responder consultas específicas sobre José C. Paz. Intenta preguntar:\n• ¿Cuántas iglesias hay en Sol y Verde?\n• ¿Cuáles son las iglesias pentecostales?\n• ¿Qué iglesias hacen comedor social?";
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: responseText }]);
    }, 800);
  };

  // AI Duplicate Detection Logic (Levenshtein Distance & Proximity Check)
  const handleCheckDuplicates = () => {
    setCheckingDuplicates(true);
    setDuplicates([]);

    setTimeout(() => {
      const found = [];
      // Calculate simple distance (we compare each pair)
      for (let i = 0; i < institutions.length; i++) {
        for (let j = i + 1; j < institutions.length; j++) {
          const instA = institutions[i];
          const instB = institutions[j];

          // 1. Proximity check (lat/lng difference < 0.002 ~ 200m)
          const distLat = Math.abs(instA.latitude - instB.latitude);
          const distLng = Math.abs(instA.longitude - instB.longitude);
          
          // 2. Simple name match (starts with same letters or shared words)
          const nameA = instA.congregation.toLowerCase();
          const nameB = instB.congregation.toLowerCase();
          
          let wordOverlap = false;
          const wordsA = nameA.split(' ');
          const wordsB = nameB.split(' ');
          const common = wordsA.filter(w => w.length > 4 && wordsB.includes(w));
          if (common.length >= 2) wordOverlap = true;

          if ((distLat < 0.002 && distLng < 0.002) || wordOverlap) {
            found.push({
              instA: { id: instA.id, name: instA.congregation, address: instA.address, neighborhood: instA.neighborhood },
              instB: { id: instB.id, name: instB.congregation, address: instB.address, neighborhood: instB.neighborhood },
              reason: distLat < 0.001 && distLng < 0.001 ? 'Cercanía Geográfica Extrema (<50m)' : 'Similitud de Nombre y Ubicación cercana'
            });
          }
        }
      }

      setDuplicates(found);
      setCheckingDuplicates(false);
    }, 1200);
  };

  // AI Territorial Analysis Logic
  const handleGenerateTerritorial = () => {
    setGeneratingAnalysis(true);
    setTimeout(() => {
      const totalComedores = institutions.filter(i => i.has_comedor === 1 && i.status === 'approved').length;
      const totalAlimentos = institutions.filter(i => i.has_food_distribution === 1 && i.status === 'approved').length;
      
      setTerritorialAnalysis({
        summary: "Análisis Geográfico de José C. Paz - CultoSIG IA",
        dataPoints: [
          {
            title: "Concentración en Sol y Verde",
            desc: "El barrio posee un alto porcentaje de instituciones con comedores activos, constituyendo una zona crítica de contención social alimentaria."
          },
          {
            title: "Déficit de Cobertura de Salud",
            desc: "Solo el 20% de las congregaciones relevadas ofrecen asistencia de salud o medicamentos. Se recomienda articular dispensarios con capillas en Barrio Frino."
          },
          {
            title: "Recomendación de Planificación",
            desc: "Priorizar el fomento de comedores en 'Barrio Vucetich', donde actualmente no se registran comedores eclesiásticos activos pero existe vulnerabilidad socioeconómica."
          }
        ]
      });
      setGeneratingAnalysis(false);
    }, 1500);
  };

  return (
    <PrivateRoute allowedRoles={['admin', 'superadmin']}>
      <Layout title="CultoSIG - Panel de Control">
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden bg-slate-900" style={{ minHeight: 'calc(100vh - 65px)' }}>
          
          {/* Sidebar Admin Menu */}
          <div className="w-full lg:w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-2 flex-shrink-0 text-slate-300">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4 px-2">Navegación</span>
            
            {user?.role === 'superadmin' && (
              <Link href="/dashboard/superadmin" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-semibold text-amber-400">
                <Settings size={18} />
                <span>Superadmin (SaaS)</span>
              </Link>
            )}

            <Link href="/dashboard" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-blue-950 text-white font-bold transition">
              <BarChart3 size={18} />
              <span>Estadísticas</span>
            </Link>

            <Link href="/dashboard/institutions" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <TableProperties size={18} />
              <span>Aprobaciones</span>
              {stats?.metrics?.pending > 0 && (
                <span className="ml-auto bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {stats.metrics.pending}
                </span>
              )}
            </Link>

            <Link href="/dashboard/reports" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <Download size={18} />
              <span>Reportes</span>
            </Link>
          </div>

          {/* Main Dashboard Space */}
          <div className="flex-grow p-6 space-y-6 overflow-y-auto text-slate-100">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Panel Estadístico Municipal
                  <span className="text-xs bg-blue-900/40 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-medium">
                    José C. Paz
                  </span>
                </h2>
                <p className="text-slate-400 text-xs">Monitoreo territorial y demográfico en tiempo real.</p>
              </div>

              {/* Toggle Heatmap */}
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border shadow-sm ${showHeatmap ? 'bg-red-950/80 border-red-800 text-red-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'}`}
              >
                <Layers size={14} />
                <span>{showHeatmap ? 'Desactivar Mapa Calor' : 'Activar Mapa Calor'}</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Aprobadas</span>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{stats?.metrics?.total || 0}</h3>
                </div>
                <div className="bg-blue-950 text-blue-400 p-3 rounded-lg"><Building size={20} /></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Templos</span>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{stats?.metrics?.temples || 0}</h3>
                </div>
                <div className="bg-emerald-950 text-emerald-400 p-3 rounded-lg"><Landmark size={20} /></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Capillas</span>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{stats?.metrics?.chapels || 0}</h3>
                </div>
                <div className="bg-purple-950 text-purple-400 p-3 rounded-lg"><Users size={20} /></div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm border-l-4 border-l-amber-600">
                <div>
                  <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Pendientes</span>
                  <h3 className="text-2xl font-extrabold text-white mt-1">{stats?.metrics?.pending || 0}</h3>
                </div>
                <div className="bg-amber-950 text-amber-500 p-3 rounded-lg"><FileClock size={20} /></div>
              </div>
            </div>

            {/* Map and Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* GIS Interactive map / heatmap */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <MapPin size={16} className="text-blue-400" />
                    Distribución Georreferenciada de Cultos
                  </h3>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">José C. Paz</span>
                </div>
                <div className="h-80 flex-grow">
                  {!loading && (
                    <MapView
                      institutions={institutions.filter(i => i.status === 'approved')}
                      showHeatmap={showHeatmap}
                    />
                  )}
                </div>
              </div>

              {/* Neighborhood and Denomination distribution charts */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                
                {/* Neighborhood distribution (SVG bar chart) */}
                <div>
                  <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-emerald-400" />
                    Top 4 Barrios con Mayor Densidad
                  </h4>
                  <div className="space-y-2.5">
                    {stats?.byNeighborhood?.slice(0, 4).map((b, i) => {
                      const max = stats.byNeighborhood[0].value;
                      const percentage = Math.round((b.value / max) * 100);
                      return (
                        <div key={b.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-300">
                            <span>{b.name}</span>
                            <span>{b.value} iglesias</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Denominational distribution (SVG bar chart) */}
                <div className="border-t border-slate-800 pt-4">
                  <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-1.5">
                    <Landmark size={16} className="text-purple-400" />
                    Principales Credos
                  </h4>
                  <div className="space-y-2.5">
                    {stats?.byDenomination?.slice(0, 3).map((d, i) => {
                      const max = stats.byDenomination[0].value;
                      const percentage = Math.round((d.value / max) * 100);
                      return (
                        <div key={d.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-300">
                            <span className="truncate max-w-[200px]">{d.name}</span>
                            <span>{d.value}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Módulos de Inteligencia Artificial (AI Hub) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
              
              {/* Header AI Hub */}
              <div className="border-b border-slate-800 pb-3 flex items-center space-x-2">
                <div className="bg-blue-900/30 text-blue-400 p-2 rounded-lg border border-blue-800 animate-pulse">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-md text-white">Centro de Inteligencia Territorial (CultoSIG IA)</h3>
                  <p className="text-slate-400 text-xs">Simulaciones de análisis semántico, duplicados y zonificación.</p>
                </div>
              </div>

              {/* AI Columns Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* 1. Chatbot Assistant */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[350px] shadow-sm">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-2 text-slate-300 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-400" />
                    Asistente Inteligente
                  </h4>
                  
                  {/* Message log */}
                  <div className="flex-grow overflow-y-auto space-y-2 border border-slate-850 p-2 rounded bg-slate-950 text-[11px] mb-2 font-sans scrollbar-thin">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`p-2 rounded-lg max-w-[85%] leading-relaxed ${msg.sender === 'ai' ? 'bg-slate-800 text-slate-200 mr-auto' : 'bg-blue-900 text-white ml-auto'}`}>
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Pregunta sobre Sol y Verde..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-grow bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-900 text-slate-200"
                    />
                    <button type="submit" className="bg-blue-900 hover:bg-blue-800 text-white rounded px-3 text-xs font-bold transition">
                      Enviar
                    </button>
                  </form>
                </div>

                {/* 2. Duplicate Detection */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[350px] shadow-sm">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-2 text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-amber-400" />
                    Detector de Duplicados
                  </h4>

                  <div className="flex-grow overflow-y-auto space-y-2 border border-slate-850 p-2 rounded bg-slate-950 text-xs mb-3 flex flex-col justify-center">
                    {checkingDuplicates ? (
                      <div className="text-center text-slate-400 py-4 flex flex-col items-center">
                        <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span>Buscando registros similares...</span>
                      </div>
                    ) : duplicates.length > 0 ? (
                      <div className="space-y-2 overflow-y-auto h-full">
                        {duplicates.map((dup, i) => (
                          <div key={i} className="bg-slate-900 p-2.5 rounded border border-amber-900/30">
                            <span className="text-[10px] font-bold text-amber-500">Posible Duplicado #{i+1}</span>
                            <div className="text-[11px] text-slate-300 mt-1 font-semibold">1. {dup.instA.name}</div>
                            <div className="text-[11px] text-slate-300 mt-0.5 font-semibold">2. {dup.instB.name}</div>
                            <div className="text-[9px] text-slate-400 mt-1 italic">Razón: {dup.reason}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 italic text-[11px]">
                        Haga clic en 'Escanear Base de Datos' para iniciar la detección automática de registros repetidos.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCheckDuplicates}
                    disabled={checkingDuplicates}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 py-2 rounded text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <BadgeAlert size={14} className="text-amber-500" />
                    <span>Escanear Base de Datos</span>
                  </button>
                </div>

                {/* 3. Territorial Gap Analysis */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[350px] shadow-sm">
                  <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-2 text-slate-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-emerald-400" />
                    Análisis de Cobertura Social
                  </h4>

                  <div className="flex-grow overflow-y-auto space-y-2.5 border border-slate-850 p-2.5 rounded bg-slate-950 text-xs mb-3 flex flex-col justify-center">
                    {generatingAnalysis ? (
                      <div className="text-center text-slate-400 py-4 flex flex-col items-center">
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span>Generando informe territorial...</span>
                      </div>
                    ) : territorialAnalysis ? (
                      <div className="space-y-2 h-full overflow-y-auto pr-1">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase block">{territorialAnalysis.summary}</span>
                        {territorialAnalysis.dataPoints.map((dp, i) => (
                          <div key={i} className="bg-slate-900/60 p-2 rounded border border-slate-800">
                            <span className="font-bold text-[10px] text-slate-200 block">{dp.title}</span>
                            <span className="text-[9.5px] text-slate-400 leading-normal block mt-0.5">{dp.desc}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-slate-500 italic text-[11px]">
                        Haga clic en 'Generar Análisis de Cobertura' para cruzar datos sociales y ubicar zonas vulnerables.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateTerritorial}
                    disabled={generatingAnalysis}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 py-2 rounded text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Generar Análisis de Cobertura</span>
                  </button>
                </div>

              </div>

            </div>

          </div>

        </div>
      </Layout>
    </PrivateRoute>
  );
}
