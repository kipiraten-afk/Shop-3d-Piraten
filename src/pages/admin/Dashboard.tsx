import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({ openOrders: 0, revenue: 0, products: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'products'))
        ]);
        
        let open = 0;
        let rev = 0;
        
        ordersSnap.docs.forEach(d => {
          const data = d.data();
          if (data.status === 'pending' || data.status === 'paid') open++;
          rev += (data.total || 0);
        });

        setStats({
          openOrders: open,
          revenue: rev,
          products: productsSnap.size
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-display font-medium tracking-tight mb-8">Übersicht</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200">
          <p className="text-zinc-500 font-medium text-sm uppercase tracking-wider mb-2">Offene Bestellungen</p>
          <p className="text-4xl font-display">{stats.openOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200">
          <p className="text-zinc-500 font-medium text-sm uppercase tracking-wider mb-2">Umsatz Gesamt</p>
          <p className="text-4xl font-display">{stats.revenue.toFixed(2)} €</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200">
          <p className="text-zinc-500 font-medium text-sm uppercase tracking-wider mb-2">Aktive Produkte</p>
          <p className="text-4xl font-display">{stats.products}</p>
        </div>
      </div>
    </div>
  );
}
