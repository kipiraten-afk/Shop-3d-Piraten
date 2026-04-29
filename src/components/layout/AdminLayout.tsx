import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { LayoutDashboard, Package, RefreshCw, LogOut } from 'lucide-react';

export default function AdminLayout() {
  const { user, isAdmin, loading, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-200 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 font-display font-medium text-xl tracking-tight border-b border-zinc-800">
          MANUFAKTUR Admin
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium">
            <LayoutDashboard className="w-5 h-5" /> Übersicht
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium">
            <Package className="w-5 h-5" /> Bestellungen
          </Link>
          <Link to="/admin/categories" className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium">
            <LayoutDashboard className="w-5 h-5" /> Kategorien
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium">
            <Package className="w-5 h-5" /> Produkte
          </Link>
          <Link to="/admin/update" className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium text-amber-400">
            <RefreshCw className="w-5 h-5" /> Update & Export
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" /> Abmelden
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
