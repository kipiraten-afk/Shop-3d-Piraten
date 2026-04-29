import { Github, Globe, ArrowRight, ExternalLink, Zap, AlertTriangle } from 'lucide-react';

export default function Update() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-display font-bold mb-4">Shop Veröffentlichen</h1>
        <p className="text-zinc-500 text-lg leading-relaxed">
          Da Sie bereits Vercel, GitHub und Ihre Domain (3d-piraten.de) haben, ist dies der absolut einfachste und beste Weg. Keine Terminals, keine Befehle – alles vollautomatisch!
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Step 1: GitHub */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shrink-0">
            <Github className="w-8 h-8 text-white" />
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-2">Schritt 1: Code zu GitHub übertragen</h2>
            <p className="text-zinc-600 mb-4">
              Vercel meckert, dass das Repository "leer" ist? Das bedeutet, Sie haben das Repository vermutlich manuell auf GitHub angelegt, aber der Code aus diesem Studio wurde noch nicht dorthin übertragen!
            </p>
            
            <div className="bg-red-50 text-red-900 p-5 rounded-2xl border border-red-100 mb-4">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Lösung für "Repository is empty":
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Löschen Sie das leere Repository auf GitHub (oder nutzen Sie einfach einen <strong>neuen Namen</strong> wie <code className="bg-white px-1 py-0.5 rounded text-red-600">piraten-shop-live</code>).</li>
                <li>Gehen Sie hier in AI Studio oben rechts auf das <strong>Zahnrad-Symbol (Settings)</strong>.</li>
                <li>Klicken Sie auf <strong>"Export to GitHub"</strong>.</li>
                <li>Wählen Sie den <strong>neuen</strong> Namen (z.B. <code className="bg-white px-1 py-0.5 rounded text-red-600">piraten-shop-live</code>).</li>
                <li>AI Studio überträgt nun den <strong>gesamten Code automatisch</strong>.</li>
              </ol>
            </div>
            
            <p className="text-sm border-l-4 border-emerald-500 pl-4 text-zinc-500">
              Nur wenn dieser Export erfolgreich war (und der Code bei GitHub sichtbar ist), machen Sie mit Schritt 2 auf Vercel weiter!
            </p>
          </div>
        </div>

        {/* Step 2: Vercel */}
        <div className="bg-white rounded-3xl border-2 border-black p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-start">
          <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl">
            Der beste Weg
          </div>
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shrink-0">
            <svg viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white"><path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="currentColor"/></svg>
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-3">Schritt 2: Bei Vercel importieren</h2>
            <p className="text-zinc-600 mb-6">
              Vercel ist die beste Plattform für diese Art von Shops. Es verbindet sich mit Ihrem GitHub und baut den Shop automatisch.
            </p>
            
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200">
              <ul className="space-y-4 text-zinc-700 font-medium">
                <li className="flex gap-3 items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs shrink-0">1</span>
                  <span>Gehen Sie zu <a href="https://vercel.com/new" target="_blank" className="text-blue-500 hover:underline">vercel.com/new</a> und loggen Sie sich ein.</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs shrink-0">2</span>
                  <span>Klicken Sie bei GitHub auf <strong>"Import"</strong> neben Ihrem <code className="text-pink-600">piraten-shop</code> Repository.</span>
                </li>
                <li className="flex gap-3 items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs shrink-0">3</span>
                  <span>Lassen Sie alle Einstellungen so wie sie sind und klicken Sie auf <strong className="bg-blue-600 text-white px-2 py-1 rounded text-sm">Deploy</strong>.</span>
                </li>
                <li className="flex gap-3 items-start mt-2 p-3 bg-blue-50 text-blue-800 rounded-xl text-sm leading-relaxed border border-blue-100">
                  <Zap className="w-5 h-5 shrink-0 text-blue-500" />
                  <span>Das war's! Vercel baut jetzt Ihren Shop. In ca. 1 Minute ist er unter einer provisorischen Vercel-Domain online.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 3: Domain */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shrink-0">
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-3">Schritt 3: Eigene Domain aufschalten (United Domains)</h2>
            <p className="text-zinc-600 mb-6">
              Sobald der Shop auf Vercel läuft, verbinden wir ihn mit <strong className="text-black">www.3d-piraten.de</strong>.
            </p>
            
            <div className="space-y-4">
              <div className="bg-black/5 rounded-xl p-5 border border-black/10">
                <h3 className="font-bold text-sm mb-2">A. In Vercel:</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Gehen Sie in Ihrem Vercel-Projekt auf <strong>Settings → Domains</strong>.<br/>
                  Tragen Sie <code className="bg-zinc-200 px-1 rounded font-bold">3d-piraten.de</code> ein und klicken Sie auf Add.<br/>
                  Vercel zeigt Ihnen nun zwei DNS-Einträge an (meistens einen A-Record mit einer IP-Adresse und einen CNAME-Record).
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h3 className="font-bold text-sm mb-2 text-blue-900">B. Bei United Domains:</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Loggen Sie sich bei <strong>United Domains</strong> ein und gehen Sie zur DNS-Verwaltung Ihrer Domain.<br/>
                  Tragen Sie dort exakt die Werte (A-Record und/oder CNAME) ein, die Vercel Ihnen anzeigt.<br/>
                  <em>Hinweis: DNS-Änderungen können bis zu 24 Stunden dauern, oft geht es aber in 30 Minuten.</em>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

