import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../lib/cart';
import { ShoppingCart, ArrowLeft, Package, Clock } from 'lucide-react';

export default function ProductDetail() {
  const { productId } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [categoryName, setCategoryName] = useState('...');
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data: any = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          
          if (data.categoryId) {
             const catSnap = await getDoc(doc(db, 'categories', data.categoryId));
             if(catSnap.exists()) setCategoryName(catSnap.data().title);
             else setCategoryName(data.categoryId);
          }

          if (data.variants && data.variants.length > 0) {
            setSelectedVariantId(data.variants[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;
    
    let variant = null;
    if (product.variants && product.variants.length > 0) {
      variant = product.variants.find((v: any) => v.id === selectedVariantId);
    }

    addToCart(product, 1, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-zinc-500">Lade Produkt...</div>;
  }

  if (!product || !product.isVisible) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-display font-medium mb-4">Produkt nicht gefunden</h1>
        <Link to="/shop" className="text-[#ff5e00] hover:underline">Zurück zum Shop</Link>
      </div>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const currentVariant = hasVariants ? product.variants.find((v: any) => v.id === selectedVariantId) : null;
  const displayPrice = currentVariant ? currentVariant.price : product.price;
  const displayImage = currentVariant?.image || product.images?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
      <Link to="/shop" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Images */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square bg-zinc-100 rounded-3xl overflow-hidden border border-zinc-200 relative shadow-sm">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt={product.seoAltTexts?.[0] || product.seoAltText || product.title} 
                title={product.imageNames?.[0] || product.title}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400 font-display">Kein Bild verfügbar</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {product.images.slice(1).map((img: string, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-zinc-200 shadow-sm bg-zinc-50">
                  <img 
                    src={img} 
                    alt={product.seoAltTexts?.[i + 1] || (product.seoAltText ? `${product.seoAltText} - Ansicht ${i + 2}` : '')} 
                    title={product.imageNames?.[i + 1] || `${product.title} - ${i + 2}`}
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#ff5e00] bg-[#ff5e00]/10 px-3 py-1 rounded-full">{categoryName}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4 leading-tight">{product.title}</h1>
          <p className="text-3xl font-medium mb-8">{displayPrice.toFixed(2)} €</p>
          
          <div className="prose prose-zinc mb-10 text-zinc-600 whitespace-pre-wrap leading-relaxed">
            {product.description}
          </div>

          <div className="mt-auto border-t border-zinc-200 pt-8">
            {hasVariants && (
              <div className="mb-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
                <h3 className="font-medium mb-4 text-sm uppercase tracking-wider text-zinc-800">Variante wählen</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-4 py-3 border rounded-xl text-sm font-medium transition-all text-left shadow-sm ${
                        selectedVariantId === v.id
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : 'border-zinc-300 hover:border-zinc-900 bg-white text-zinc-900'
                      }`}
                    >
                      {v.group && <div className={`text-xs mb-0.5 truncate uppercase tracking-widest ${selectedVariantId === v.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{v.group}</div>}
                      <div className="block truncate">{v.name}</div>
                      <div className={`mt-1 text-xs ${selectedVariantId === v.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {v.price.toFixed(2)} €
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button 
                onClick={handleAddToCart}
                className="w-full sm:flex-1 bg-[#ff5e00] text-white py-4 px-8 rounded-2xl font-medium hover:bg-[#e05300] transition-transform active:scale-95 flex items-center justify-center gap-3 text-lg shadow-lg shadow-[#ff5e00]/20"
              >
                <ShoppingCart className="w-5 h-5" />
                {added ? 'Hinzugefügt!' : 'In den Warenkorb'}
              </button>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-500 text-sm whitespace-nowrap px-2">
                <Clock className="w-5 h-5" />
                3-5 Tage Fertigung
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-start gap-4 bg-zinc-50/50 p-4 rounded-2xl">
              <Package className="w-6 h-6 text-zinc-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-zinc-900 mb-1">Handgefertigt auf Bestellung</p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Jedes Teil wird nach deiner Bestellung speziell für dich in meiner Manufaktur gefertigt. Dies garantiert individuelle Qualität frisch aus der Fräse, dem Drucker oder dem Laser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
