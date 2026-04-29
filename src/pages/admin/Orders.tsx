import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Package, CreditCard, Banknote } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e: any) {
      alert("Fehler: " + e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium uppercase">Ausstehend</span>;
      case 'paid': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium uppercase">Bezahlt</span>;
      case 'shipped': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium uppercase">Versendet</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium uppercase">Storniert</span>;
      default: return null;
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-display font-medium tracking-tight mb-8">Bestellungen</h1>

      {loading ? (
        <div>Lade Bestellungen...</div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-zinc-200 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 pb-4 mb-4 gap-4">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Eingegangen am: {new Date(order.createdAt).toLocaleString('de-DE')} • Bestellnummer: <span className="font-mono text-zinc-800">{order.id}</span></p>
                  <h3 className="font-medium text-lg">{order.customerName} (<a href={`mailto:${order.customerEmail}`} className="text-[#ff5e00] hover:underline">{order.customerEmail}</a>)</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-zinc-500 flex items-center gap-1">
                      {order.paymentMethod === 'paypal' ? <CreditCard className="w-4 h-4"/> : <Banknote className="w-4 h-4" />}
                      {order.paymentMethod === 'paypal' ? 'PayPal' : 'Überweisung'}
                    </span>
                    <span className="font-bold text-xl">{order.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-zinc-400" /> Artikel</h4>
                  <ul className="space-y-3">
                    {order.items.map((item: any, i: number) => (
                      <li key={i} className="flex justify-between items-center bg-zinc-50 p-3 rounded-lg text-sm border border-zinc-100">
                        <span className="font-medium">{item.quantity}x {item.title}</span>
                        <span className="text-zinc-600">{(item.price * item.quantity).toFixed(2)} €</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-zinc-700">Lieferadresse</h4>
                  <div className="bg-zinc-50 p-4 rounded-lg text-sm whitespace-pre-wrap border border-zinc-100 text-zinc-600">
                    {order.shippingAddress}
                  </div>
                  
                  <h4 className="font-medium mb-3 mt-6 text-zinc-700">Status der Bestellung</h4>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(order.status)}
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="text-sm border border-zinc-300 rounded-lg p-2 max-w-xs"
                    >
                      <option value="pending">Wartet auf Zahlung</option>
                      <option value="paid">Bezahlt / In Produktion</option>
                      <option value="shipped">Versendet / Abgeschlossen</option>
                      <option value="cancelled">Storniert</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-zinc-200 text-center">
          <p className="text-zinc-500">Du hast noch keine Bestellungen erhalten.</p>
        </div>
      )}
    </div>
  );
}
