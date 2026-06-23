import { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import PrivateRoute from '@/components/PrivateRoute';
import { API_URL } from '@/config';
import { 
  TableProperties, BarChart3, Download, FileSpreadsheet, FileText, 
  Layers, CheckCircle2, ShieldAlert 
} from 'lucide-react';

export default function Reports() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const triggerDownload = async (endpoint, format, defaultFilename) => {
    try {
      setDownloading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/${endpoint}?format=${format}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Error al descargar el archivo. Verifique su sesión.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PrivateRoute allowedRoles={['admin', 'superadmin']}>
      <Layout title="CultoSIG - Reportes">
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden bg-slate-900" style={{ minHeight: 'calc(100vh - 65px)' }}>
          
          {/* Sidebar Menu */}
          <div className="w-full lg:w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-2 flex-shrink-0 text-slate-300">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4 px-2">Navegación</span>
            
            <Link href="/dashboard" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <BarChart3 size={18} />
              <span>Estadísticas</span>
            </Link>

            <Link href="/dashboard/institutions" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition font-medium">
              <TableProperties size={18} />
              <span>Aprobaciones</span>
            </Link>

            <Link href="/dashboard/reports" className="flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-blue-950 text-white font-bold transition">
              <Download size={18} />
              <span>Reportes</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="flex-grow p-6 space-y-6 overflow-y-auto text-slate-100">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Exportar Reportes Estadísticos
              </h2>
              <p className="text-slate-400 text-xs">Descarga las planillas oficiales estructuradas de cultos del municipio.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs font-semibold max-w-2xl">
                ⚠️ {error}
              </div>
            )}

            {/* Download Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              
              {/* Report 1: General Excel */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="bg-emerald-950 text-emerald-400 p-3 rounded-xl w-max border border-emerald-900">
                    <FileSpreadsheet size={24} />
                  </div>
                  <h3 className="font-extrabold text-md text-white">Listado Padrón General (Excel)</h3>
                  <p className="text-slate-400 text-xs leading-normal">
                    Genera una planilla completa en formato Excel conteniendo todos los datos de contacto privados del responsable, personería jurídica, credo, asistentes y estado de aprobación.
                  </p>
                </div>
                <button
                  onClick={() => triggerDownload('reports/institutions', 'excel', `padron_general_cultos_${Date.now()}.xls`)}
                  disabled={downloading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download size={14} />
                  <span>{downloading ? 'Descargando...' : 'Descargar Excel'}</span>
                </button>
              </div>

              {/* Report 2: General CSV */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="bg-blue-950 text-blue-400 p-3 rounded-xl w-max border border-blue-900">
                    <FileText size={24} />
                  </div>
                  <h3 className="font-extrabold text-md text-white">Listado Padrón General (CSV)</h3>
                  <p className="text-slate-400 text-xs leading-normal">
                    Descarga el listado estructurado compatible con bases de datos y sistemas de información geográfica de terceros (QGIS, ArcGIS) delimitado por comas.
                  </p>
                </div>
                <button
                  onClick={() => triggerDownload('reports/institutions', 'csv', `padron_general_cultos_${Date.now()}.csv`)}
                  disabled={downloading}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download size={14} />
                  <span>{downloading ? 'Descargando...' : 'Descargar CSV'}</span>
                </button>
              </div>

              {/* Report 3: Social Action CSV */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4 md:col-span-2">
                <div className="space-y-2">
                  <div className="bg-purple-950 text-purple-400 p-3 rounded-xl w-max border border-purple-900">
                    <Layers size={24} />
                  </div>
                  <h3 className="font-extrabold text-md text-white">Planilla de Acción Social Activa (Comedores/Roperos)</h3>
                  <p className="text-slate-400 text-xs leading-normal">
                    Filtra automáticamente la base de datos municipal y descarga exclusivamente los registros de iglesias y capillas que informaron tener comedor social, ropería, dispensario médico o entrega de alimentos activos.
                  </p>
                </div>
                <button
                  onClick={() => triggerDownload('reports/social-actions', 'csv', `accion_social_cultos_${Date.now()}.csv`)}
                  disabled={downloading}
                  className="w-full bg-purple-750 hover:bg-purple-700 text-white font-bold py-2 rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download size={14} />
                  <span>{downloading ? 'Descargando...' : 'Descargar Planilla Social'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </Layout>
    </PrivateRoute>
  );
}
