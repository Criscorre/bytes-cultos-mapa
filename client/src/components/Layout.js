import Head from 'next/head';
import Navbar from './Navbar';

export default function Layout({ children, title = 'CultoSIG José C. Paz' }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Plataforma de georreferenciación y gestión de instituciones religiosas de José C. Paz - Desarrollado por Bytes Creativos." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} CultoSIG - Todos los derechos reservados.</span>
          <span className="flex items-center space-x-1">
            <span>Desarrollado para la Dirección de Cultos por</span>
            <a 
              href="https://bytescreativos.com.ar" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-900 font-semibold hover:underline"
            >
              Bytes Creativos
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
