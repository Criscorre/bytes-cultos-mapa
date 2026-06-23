import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function ExcelImporter({ token, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB');
      return;
    }

    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/institutions/import-excel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al importar datos');
      }

      setSuccess(true);
      setFileInfo(data);
      if (onSuccess) {
        onSuccess();
      }

      // Clear input
      e.target.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 bg-blue-50 hover:bg-blue-100 transition cursor-pointer">
        <label className="flex flex-col items-center justify-center cursor-pointer">
          <Upload className="w-8 h-8 text-blue-600 mb-2" />
          <span className="text-sm font-semibold text-blue-900">
            Cargar archivo Excel
          </span>
          <span className="text-xs text-blue-600 mt-1">
            (.xlsx o .xls)
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-900 font-semibold">Procesando archivo...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-900 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {success && fileInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-900 font-semibold">{fileInfo.message}</p>
          </div>
          {fileInfo.successCount > 0 && (
            <p className="text-xs text-green-700 ml-7">
              ✓ {fileInfo.successCount} registro{fileInfo.successCount !== 1 ? 's' : ''} creado{fileInfo.successCount !== 1 ? 's' : ''}
            </p>
          )}
          {fileInfo.errorCount > 0 && (
            <details className="ml-7">
              <summary className="text-xs text-red-700 font-semibold cursor-pointer">
                {fileInfo.errorCount} error{fileInfo.errorCount !== 1 ? 'es' : ''} encontrado{fileInfo.errorCount !== 1 ? 's' : ''}
              </summary>
              <ul className="text-xs text-red-600 mt-2 space-y-1 ml-4">
                {fileInfo.errors?.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700">
        <p className="font-semibold mb-2">Formato esperado del Excel:</p>
        <ul className="space-y-1 text-slate-600">
          <li>• <strong>Denominación</strong> (requerido): Tipo de religión</li>
          <li>• <strong>Congregación</strong> (requerido): Nombre de la iglesia</li>
          <li>• <strong>Dirección</strong> (requerido): Calle y altura</li>
          <li>• <strong>Barrio</strong> (requerido): Barrio de ubicación</li>
          <li>• <strong>Municipio</strong> (requerido): Municipio de José C. Paz</li>
          <li>• <strong>Tipo Sede</strong> (opcional): Sede, Filial o Anexo</li>
          <li>• <strong>Estado Edificio</strong> (opcional): Excelente, Bueno o Precario</li>
          <li>• <strong>Tipo Propiedad</strong> (opcional): Alquilado, Propio, etc.</li>
        </ul>
      </div>
    </div>
  );
}
