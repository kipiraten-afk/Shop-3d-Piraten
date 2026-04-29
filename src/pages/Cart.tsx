import React, { useState } from 'react';
import { useCart } from '../lib/cart';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Cart() {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1 = Cart, 2 = Checkout, 3 = Success
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    paymentMode: 'ueberweisung'
  });
  
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        items,
        total,
        status: 'pending',
        paymentMethod: form.paymentMode,
        customerName: form.name,
        customerEmail: form.email,
        shippingAddress: form.address,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      clearCart();
      setStep(3);
    } catch (err: any) {
      console.error("Fehler bei der Bestellung:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-display font-medium mb-4">Vielen Dank für deine Bestellung!</h1>
        <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
          Deine Bestellung ist sicher bei mir eingegangen. {form.paymentMode === 'ueberweisung' 
            ? 'Du erhältst in Kürze eine E-Mail mit der Bankverbindung für die Vorabüberweisung.' 
            : 'Du wirst nun gleich zu PayPal weitergeleitet (Demo-Modus: in echt würdest du nun zahlen).'}
        </p>
        <Link to="/" className="inline-flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-full font-medium hover:bg-[#ff5e00] transition-colors">
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  if (items.length === 0 && step === 1) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-display font-medium tracking-tight mb-4">Dein Warenkorb</h1>
        <p className="text-zinc-500 mb-8">Dein Warenkorb ist aktuell noch leer.</p>
        <Link to="/shop" className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium inline-block hover:bg-[#ff5e00] transition-colors">
          Zunächst stöbern
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2">
        {step === 1 ? (
          <>
            <h1 className="text-3xl font-display font-medium tracking-tight mb-8">Dein Warenkorb</h1>
            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
              <ul className="divide-y divide-zinc-100">
                {items.map(item => (
                  <li key={item.id} className="p-6 flex flex-col sm:flex-row gap-6 items-center">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded-2xl bg-zinc-100" />
                    ) : (
                      <div className="w-24 h-24 bg-zinc-100 rounded-2xl"></div>
                    )}
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="font-display font-medium text-lg">{item.title}</h3>
                      <p className="text-zinc-500">{item.price.toFixed(2)} €</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-zinc-200 rounded-full px-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-zinc-500 hover:text-zinc-900">-</button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-zinc-500 hover:text-zinc-900">+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-zinc-400 hover:text-red-500">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-display font-medium tracking-tight mb-8 flex items-center gap-4">
              <button onClick={() => setStep(1)} className="text-sm font-sans font-medium text-zinc-500 hover:text-zinc-900">Zurück</button> 
              Kasse
            </h1>
            <div className="bg-white rounded-3xl border border-zinc-200 p-8">
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg border-b border-zinc-100 pb-2">Kontaktdaten & Lieferung</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700">Dein Name</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 outline-none transition-colors" placeholder="Max Mustermann" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700">E-Mail Adresse</label>
                    <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 outline-none transition-colors" placeholder="max@beispiel.de" />
                    <p className="text-xs text-zinc-500 mt-1">Hierhin wird die Auftragsbestätigung gesendet.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700">Vollständige Lieferadresse</label>
                    <textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:border-zinc-900 outline-none transition-colors" placeholder="Musterstraße 1&#10;12345 Musterstadt" />
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <h3 className="font-medium text-lg border-b border-zinc-100 pb-2">Zahlungsart</h3>
                  <div className="space-y-3">
                    <label className={`block flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${form.paymentMode === 'ueberweisung' ? 'border-[#ff5e00] bg-[#ff5e00]/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                      <input type="radio" name="payment" value="ueberweisung" checked={form.paymentMode === 'ueberweisung'} onChange={(e) => setForm({...form, paymentMode: e.target.value})} className="w-5 h-5 accent-[#ff5e00]" />
                      <div>
                        <p className="font-medium">Vorabüberweisung</p>
                        <p className="text-sm text-zinc-500">Ich sende und fertige sobald das Geld auf meiner kleinen Bank angekommen ist.</p>
                      </div>
                    </label>
                    <label className={`block flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${form.paymentMode === 'paypal' ? 'border-[#ff5e00] bg-[#ff5e00]/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                      <input type="radio" name="payment" value="paypal" checked={form.paymentMode === 'paypal'} onChange={(e) => setForm({...form, paymentMode: e.target.value})} className="w-5 h-5 accent-[#ff5e00]" />
                      <div>
                        <p className="font-medium">PayPal</p>
                        <p className="text-sm text-zinc-500">Schnell und einfach über dein PayPal-Konto.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-zinc-900 text-white rounded-3xl p-8 sticky top-24">
          <h2 className="text-2xl font-display font-medium mb-6">Zusammenfassung</h2>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-zinc-400">
              <span>Zwischensumme</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Versand</span>
              <span>Kostenlos</span>
            </div>
            <div className="border-t border-zinc-800 pt-4 flex justify-between font-medium text-xl">
              <span>Gesamtsumme</span>
              <span className="text-[#ff5e00]">{total.toFixed(2)} €</span>
            </div>
          </div>
          
          {step === 1 ? (
             <button onClick={() => setStep(2)} className="w-full bg-white text-zinc-900 py-4 rounded-xl font-medium hover:bg-[#ff5e00] hover:text-white transition-colors flex items-center justify-center gap-2">
               Zur Kasse <ArrowRight className="w-5 h-5" />
             </button>
          ) : (
            <button form="checkout-form" type="submit" disabled={loading} className="w-full bg-[#ff5e00] text-white py-4 rounded-xl font-medium hover:bg-[#e05300] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Verarbeite...' : 'Jetzt zahlungspflichtig bestellen'}
            </button>
          )}
          
          <p className="text-zinc-500 text-xs text-center mt-6">
            Mit deiner Bestellung erklärst du dich mit unseren AGB und der Widerrufsbelehrung einverstanden. Als Ein-Mann-Manufaktur lege ich großen Wert auf höchste Qualität.
          </p>
        </div>
      </div>
    </div>
  );
}
