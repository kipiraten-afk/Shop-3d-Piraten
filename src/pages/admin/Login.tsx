import { useAuth } from '../../lib/auth';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, isAdmin, loading, login, logout } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
  }

  if (user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 text-center">
        <h1 className="text-3xl font-display font-medium tracking-tight mb-2">Admin Login</h1>
        
        {user && !isAdmin ? (
          <div>
            <p className="text-zinc-600 mb-6 font-sans">
              Du bist eingeloggt als <strong className="text-zinc-900">{user.email}</strong>, hast aber keine Admin-Rechte für diesen Shop.
            </p>
            <div className="space-y-3">
              <button
                onClick={logout}
                className="w-full bg-zinc-900 text-white py-4 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
              >
                Von diesem Kunden-Konto abmelden
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-zinc-600 mb-8 font-sans">
              Dieser Bereich ist nur für den Shop-Inhaber zugänglich.
            </p>
            <button
              onClick={login}
              className="w-full bg-zinc-900 text-white py-4 rounded-xl font-medium hover:bg-[#ff5e00] transition-colors"
            >
              Mit Google anmelden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
