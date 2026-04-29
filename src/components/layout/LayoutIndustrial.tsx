import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag, Menu, Cpu } from 'lucide-react';
import { useCart } from '../../lib/cart';

export default function LayoutIndustrial() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      {/* Industrial Header */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-zinc-900 bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-display font-bold tracking-tighter flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#ff5e00]" />
            MANUFAKTUR<span className="text-[#ff5e00]">.</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono uppercase tracking-widest text-zinc-300">
            <Link to="/shop" className="hover:text-white transition-colors border-r border-zinc-700 pr-6">Shop</Link>
            <Link to="/kategorie/industrie" className="hover:text-white transition-colors border-r border-zinc-700 pr-6">Industrie</Link>
            <Link to="/kategorie/vanlife" className="hover:text-white transition-colors border-r border-zinc-700 pr-6">Vanlife</Link>
            <Link to="/about" className="hover:text-[#ff5e00] transition-colors">Über Mich</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative p-2 text-zinc-300 hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff5e00] text-black text-[10px] flex items-center justify-center rounded-none font-black">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8">
        <div className="border-2 border-zinc-900 bg-white shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
          <Outlet />
        </div>
      </main>

      {/* Industrial Footer */}
      <footer className="bg-zinc-900 text-zinc-500 py-12 border-t-2 border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 font-mono text-xs">
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white font-bold mb-4 uppercase">Manufaktur.Data</h4>
            <p className="leading-relaxed">
              Industrielle Präzision und Handwerkskunst.<br />
              Individuelle Anfertigungen, modulare Komponenten.<br />
              Berlin, Deutschland.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase">Links</h4>
            <ul className="space-y-2">
              <li><Link to="/impressum" className="hover:text-[#ff5e00]">Impressum</Link></li>
              <li><Link to="/datenschutz" className="hover:text-[#ff5e00]">Datenschutz</Link></li>
              <li><Link to="/agb" className="hover:text-[#ff5e00]">AGB</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
