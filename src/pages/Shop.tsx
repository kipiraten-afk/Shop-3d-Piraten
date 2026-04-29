import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../lib/cart';
import { ShoppingCart } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

export default function Shop() {
  const { categoryId, subcategoryId } = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const catSnap = await getDocs(query(collection(db, 'categories')));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));

      let q = query(collection(db, 'products'), where('isVisible', '==', true));
      if (categoryId) {
        q = query(q, where('categoryId', '==', categoryId));
      }
      const snapshot = await getDocs(q);
      let loadedProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

      if (subcategoryId) {
        loadedProducts = loadedProducts.filter(p => p.subcategoryId === subcategoryId);
      }

      setProducts(loadedProducts);
      setLoading(false);
    };

    fetchData();
  }, [categoryId, subcategoryId]);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    
    let variant = null;
    if (product.variants && product.variants.length > 0) {
      variant = product.variants[0];
    }

    addToCart(product, 1, variant);
    
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const getLowestPrice = (product: any) => {
    if (!product.variants || product.variants.length === 0) return product.price;
    const lowest = Math.min(...product.variants.map((v: any) => v.price));
    return lowest;
  };

  const mainCategories = categories.filter(c => !c.parentId).sort((a,b) => a.sortOrder - b.sortOrder);
  const currentCategory = categories.find(c => c.id === categoryId);
  const subCategories = categories.filter(c => c.parentId === categoryId).sort((a,b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-4">
            {currentCategory ? currentCategory.title : 'Alle Produkte'}
          </h1>
          <p className="text-zinc-600 max-w-xl">
            {currentCategory?.description || 'Sorgfältig gefertigte Artikel aus meiner Manufaktur. Bei individuellen Anpassungswünschen, schreibe mir einfach!'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link to="/shop" className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!categoryId ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`}>Alle</Link>
          {mainCategories.map(c => (
             <Link key={c.id} to={`/kategorie/${c.id}`} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${categoryId === c.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'}`}>{c.title}</Link>
          ))}
        </div>
      </div>

      {subCategories.length > 0 && (
         <div className="flex flex-wrap gap-2 mb-12 border-b border-zinc-200 pb-8">
            <Link to={`/kategorie/${categoryId}`} className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${!subcategoryId ? 'border-zinc-900 bg-white text-zinc-900 shadow-sm' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>Alle {currentCategory?.title}</Link>
            {subCategories.map(s => (
               <Link key={s.id} to={`/kategorie/${categoryId}/${s.id}`} className={`px-4 py-2 border rounded-full text-sm font-medium transition-colors ${subcategoryId === s.id ? 'border-zinc-900 bg-white text-zinc-900 shadow-sm' : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>{s.title}</Link>
            ))}
         </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-zinc-100 aspect-square rounded-3xl mb-4"></div>
              <div className="h-6 bg-zinc-100 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-zinc-100 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 bg-zinc-50 rounded-3xl border border-zinc-100">
          <p className="text-zinc-500 text-lg">Keine Produkte in dieser Kategorie gefunden.</p>
          <Link to="/shop" className="inline-block mt-4 text-[#ff5e00] font-medium hover:underline">
            Alle Produkte ansehen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => {
            const hasVariants = product.variants && product.variants.length > 0;
            const lowestPrice = getLowestPrice(product);

            return (
              <Link to={`/produkt/${product.id}`} key={product.id} className="group flex flex-col h-full bg-white rounded-3xl border border-zinc-100 overflow-hidden hover:border-zinc-300 hover:shadow-xl transition-all duration-300">
                <div className="relative aspect-square bg-zinc-100 overflow-hidden isolate">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.seoAltText || product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 font-display">Kein Bild</div>
                  )}
                  {hasVariants && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 bg-white text-xs font-bold tracking-widest uppercase rounded-full shadow-sm z-10 text-zinc-800">
                      Varianten
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className="text-[#ff5e00] text-xs font-bold uppercase tracking-wider mb-2">
                    {categories.find(c => c.id === product.categoryId)?.title || product.categoryId}
                  </span>
                  <h3 className="font-display font-medium text-xl leading-tight mb-2 group-hover:text-[#ff5e00] transition-colors">{product.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-medium text-lg">
                      {hasVariants && <span className="text-sm text-zinc-500 font-normal mr-1">ab</span>}
                      {lowestPrice.toFixed(2)} €
                    </span>
                    <button 
                      onClick={(e) => handleAddToCart(e, product)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        addedItems[product.id] 
                          ? 'bg-green-500 text-white' 
                          : 'bg-zinc-100 hover:bg-[#ff5e00] hover:text-white text-zinc-900'
                      }`}
                      aria-label="In den Warenkorb"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
