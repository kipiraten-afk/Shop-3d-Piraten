import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag, Menu } from 'lucide-react';
import { useCart } from '../../lib/cart';

export default function Layout() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-display font-bold tracking-tight">
            MANUFAKTUR<span className="text-[#ff5e00]">.</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <Link to="/shop" className="hover:text-zinc-900 transition-colors">Shop</Link>
            <Link to="/kategorie/industrie" className="hover:text-zinc-900 transition-colors">Industrie</Link>
            <Link to="/kategorie/vanlife" className="hover:text-zinc-900 transition-colors">Vanlife</Link>
            <Link to="/about" className="hover:text-zinc-900 transition-colors">Über Mich</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2 text-zinc-600 hover:text-zinc-900 transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff5e00] text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
            <button className="p-2 md:hidden text-zinc-600">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-zinc-950 text-zinc-400 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-2xl font-display font-bold text-white tracking-tight mb-4 block">
              MANUFAKTUR<span className="text-[#ff5e00]">.</span>
            </Link>
            <p className="max-w-sm text-sm">
              Individuelle Anfertigungen aus Holz, Kunststoff und Alu. Spezialisiert auf Vanlife, Industrie und Einzelanfertigungen.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              <li><Link to="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
              <li><Link to="/agb" className="hover:text-white transition-colors">AGB</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Kontakt</h4>
            <ul className="space-y-2 text-sm">
              <li>kontakt@manufaktur.de</li>
              <li>+49 123 4567890</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
