import React from 'react';
import { motion } from 'motion/react';
import { Award, Target, Zap, Users } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-stone-100 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section - Industrial Style */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-950 text-white p-12 mb-16 border-b-8 border-[#ff5e00] shadow-[12px_12px_0px_0px_rgba(24,24,27,1)]"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="text-6xl font-display font-black tracking-tighter mb-4 leading-none">
                ÜBER <span className="text-[#ff5e00]">ELIAS.</span>
              </h1>
              <p className="font-mono text-zinc-400 text-sm uppercase tracking-widest leading-relaxed">
                Manufaktur-Inhaber // Lead Ingenieur // Revier-Manager
              </p>
            </div>
            <div className="bg-[#ff5e00] text-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-tighter">
              Status: In Produktion
            </div>
          </div>
        </motion.div>

        {/* Story Section */}
        <div className="bg-white border-2 border-zinc-900 p-8 mb-16 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)]">
          <div className="grid md:grid-cols-2 gap-12 items-center text-zinc-900">
            <div className="space-y-6">
              <h2 className="text-3xl font-display font-bold uppercase tracking-tight">Kreativität auf Samtpfoten</h2>
              <p className="leading-relaxed">
                Wer glaubt, dass Präzision nur von Menschenhänden (oder Robotern) kommt, hat Elias noch nicht bei der Arbeit gesehen. 
                Als Herzstück unserer Werkstatt überwacht unser Kater Elias jeden Prozess – vom ersten Klick im CAD bis zum finalen Schliff.
              </p>
              <p className="leading-relaxed">
                In einer Welt fließbandgefertigter Massenware setzen wir auf Charakter, Leidenschaft und ein wachsames Auge für Details. 
                Alles, was unser Haus verlässt, wurde unter strengster Aufsicht (und gelegentlichem Schnurren) gefertigt.
              </p>
            </div>
            <div className="bg-zinc-100 p-8 border-2 border-dashed border-zinc-300 flex items-center justify-center aspect-video">
              <div className="text-center group cursor-help">
                <Users className="w-12 h-12 text-[#ff5e00] mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-xs text-zinc-500 uppercase">Aufsicht & Abnahme durch Elias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Character Workflow Section - Image Placeholders */}
        <div className="grid md:grid-cols-3 gap-12 mb-24">
          {[
            { 
               title: "01. Konstruktion", 
               desc: "Elias am CAD-Monitor: Die Planung komplexer Baugruppen erfordert volle Konzentration.",
               imgAlt: "Elias (Kater) vor einem CAD-Monitor mit 3D-Modellen"
            },
            { 
               title: "02. Fertigung", 
               desc: "Werkzeugwechsel an der Fräse: Hier wird Präzision im Millimeterbereich überwacht.",
               imgAlt: "Elias (Kater) an einer CNC-Fräse beim Werkzeugwechsel"
            },
            { 
               title: "03. Finishing", 
               desc: "Materialkunde: Eichenkanten werden erst freigegeben, wenn die Haptik stimmt.",
               imgAlt: "Elias (Kater) prüft ein geschliffenes Eichenbrett"
            }
          ].map((item, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className="flex flex-col group"
             >
               <div className="aspect-square bg-zinc-200 border-2 border-zinc-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] relative">
                  <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-zinc-500 font-mono text-xs italic bg-zinc-100">
                    [ BILD-RESERVIERT: {item.imgAlt} ]
                  </div>
                  <div className="absolute bottom-4 left-4 bg-zinc-900 text-white px-2 py-1 text-[10px] font-mono">
                    CAM_0{i+1}
                  </div>
               </div>
               <h3 className="text-xl font-display font-black mt-6 mb-2 uppercase tracking-tight group-hover:text-[#ff5e00] transition-colors">{item.title}</h3>
               <p className="text-zinc-600 text-sm leading-relaxed font-medium">{item.desc}</p>
             </motion.div>
          ))}
        </div>

        {/* Industrial Stats/Values */}
        <div className="bg-zinc-900 text-white p-12 border-2 border-zinc-900 grid grid-cols-1 md:grid-cols-3 gap-12 font-mono">
          <div>
            <div className="text-[#ff5e00] text-3xl font-black mb-2">100%</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Materialintegrität</div>
            <p className="text-xs text-zinc-400 mt-4 leading-relaxed">Verwendung von zertifizierten Materialien und High-End 3D-Druck Filamenten.</p>
          </div>
          <div>
            <div className="text-[#ff5e00] text-3xl font-black mb-2">±0.05mm</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Fertigungstoleranz</div>
            <p className="text-xs text-zinc-400 mt-4 leading-relaxed">CAD-gestützte CNC-Bearbeitung für absolute Passgenauigkeit.</p>
          </div>
          <div>
            <div className="text-[#ff5e00] text-3xl font-black mb-2">RAW</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Design Philosophie</div>
            <p className="text-xs text-zinc-400 mt-4 leading-relaxed">Ehrlich, industriell und funktional – keine unnötigen Schnörkel.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
