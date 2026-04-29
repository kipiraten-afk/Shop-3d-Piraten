import { ArrowRight, Box, PenTool, Printer, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    id: 'industrie',
    title: 'Industrie & Frästeile',
    desc: 'Präzisions-CNC-Fertigung für industrielle Anforderungen.',
    icon: Box,
    color: 'bg-zinc-900',
    img: 'https://images.unsplash.com/photo-1565439390141-866ce00d3db5?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'vanlife',
    title: 'Vanlife & Custom',
    desc: 'Stauraumlösungen, Getränkehalter und Konsolen für Deinen Bulli.',
    icon: Truck,
    color: 'bg-[#ff5e00]',
    img: 'https://images.unsplash.com/photo-1522080472483-b78f44d85e7a?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'lasergravur',
    title: 'Lasergravur & Holz',
    desc: 'Schneebretter und Wandbilder – individuell graviert.',
    icon: PenTool,
    color: 'bg-stone-800',
    img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '3ddruck',
    title: '3D-Druck Prototypen',
    desc: 'Rapid Prototyping mit großformatigen 3D-Druckern.',
    icon: Printer,
    color: 'bg-zinc-800',
    img: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=800&auto=format&fit=crop'
  }
];

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 lg:px-8 max-w-7xl mx-auto flex flex-col items-start gap-8">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter max-w-4xl font-display leading-[0.9]">
          PRÄZISION <br/><span className="text-[#ff5e00] italic pr-4">AUS DER </span> <br/>MANUFAKTUR.
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 max-w-xl font-sans mt-4">
          Dein Partner für CNC-Frästeile, 3D-Druck, Vanlife-Ausbauten und individuelle Lasergravuren. Alles aus einer Hand, direkt aus der heimischen Werkstatt.
        </p>
        <Link 
          to="/shop" 
          className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-full font-medium hover:bg-[#ff5e00] transition-colors"
        >
          Zum Shop <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Bento Grid Categories */}
      <section className="px-4 py-12 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl md:text-4xl font-display font-medium tracking-tight">Fertigungsbereiche</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link 
                key={cat.id} 
                to={`/kategorie/${cat.id}`}
                className={`group relative overflow-hidden rounded-3xl aspect-square md:aspect-[3/4] flex flex-col justify-end p-6 ${cat.color} text-white`}
              >
                <img 
                  src={cat.img} 
                  alt={cat.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700"
                />
                <div className="relative z-10 flex flex-col gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-display font-medium">{cat.title}</h3>
                  <p className="text-sm text-white/80 line-clamp-2">{cat.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
      
      {/* Short About Section */}
      <section className="px-4 py-24 md:px-8 max-w-7xl mx-auto border-t border-zinc-200 mt-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-5xl font-display font-bold mb-6 tracking-tight">
              Echtes Handwerk.<br />Moderne Technik.
            </h2>
            <p className="text-lg text-zinc-600 mb-6">
              Als Ein-Mann-Unternehmen betreue ich jedes Projekt persönlich. Zwei präzise CNC-Fräsmaschinen, ein großformatiger 3D-Drucker und leistungsstarke Lasertechnik ermöglichen es mir, von der Idee bis zum fertigen Produkt alles unter einem Dach zu produzieren.
            </p>
            <Link to="/about" className="text-zinc-900 font-medium underline underline-offset-4 hover:text-[#ff5e00] transition-colors">
              Mehr über mich erfahren
            </Link>
          </div>
          <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 p-8 flex items-center justify-center">
             <div className="text-center text-zinc-400 font-display">
                [ Hier kommt ein gutes Maschinen- oder Werkstattbild hin ]
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
