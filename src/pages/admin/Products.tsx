import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, deleteField } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Plus, Edit2, Trash2, Copy, Trash, UploadCloud, Star, GripVertical, CheckSquare, Square, Settings2, Wand2, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [isBulkSEOUpdating, setIsBulkSEOUpdating] = useState(false);
  const [bulkSEOProgress, setBulkSEOProgress] = useState({ current: 0, total: 0 });
  const [seoResults, setSeoResults] = useState<any[]>([]);
  const [showSeoResults, setShowSeoResults] = useState(false);
  
  // Image Processing
  const [processingImages, setProcessingImages] = useState<any[]>([]);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('');
  const [filterVariant, setFilterVariant] = useState<string>('');

  // Bulk Edit States
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkEditMode, setBulkEditMode] = useState<'category' | 'price' | null>(null);
  
  // Bulk Action Values
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkSubcategory, setBulkSubcategory] = useState('');
  const [bulkPriceTarget, setBulkPriceTarget] = useState<'all' | 'base_only' | 'variants_match'>('all');
  const [bulkPriceTargetFilter, setBulkPriceTargetFilter] = useState('');
  const [bulkPriceAction, setBulkPriceAction] = useState<'fixed' | 'add' | 'percent'>('fixed');
  const [bulkPriceValue, setBulkPriceValue] = useState<number>(0);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, any>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catQuery = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
      const catSnap = await getDocs(catQuery);
      const loadedCategories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(loadedCategories);

      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e: any) {
      console.error("fetchData error:", e);
      let msg = e.message;
      if (e.code === 'permission-denied') {
         try {
           handleFirestoreError(e, 'list', 'products');
         } catch (err: any) {
           msg = err.message;
         }
      }
      alert("Fehler beim Laden der Daten: " + (msg.startsWith('{') ? "Berechtigungsfehler" : msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 600;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => reject(new Error('Konnte Bild nicht laden'));
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const newPending: any[] = [];
    for(let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            try {
               const base64 = await resizeImage(file);
               newPending.push({
                 original: base64,
                 current: base64,
                 name: file.name
               });
            } catch(e) {
               console.error(e);
            }
        }
    }
    setProcessingImages(newPending);
    setIsProcessingModalOpen(true);
  };

  const handleAiEdit = async (index: number, mode: 'remove-bg' | 'enhance' | 'product-shot' | 'square') => {
    if (mode === 'square') {
      try {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(
            img,
            (img.width - size) / 2, (img.height - size) / 2, size, size,
            0, 0, size, size
          );
          const updated = [...processingImages];
          updated[index].current = canvas.toDataURL('image/jpeg', 0.8);
          setProcessingImages(updated);
        };
        img.src = processingImages[index].current;
      } catch (e) {
        console.error(e);
      }
      return;
    }

    setIsAiProcessing(index);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const currentImg = processingImages[index].current;
      const match = currentImg.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!match) throw new Error("Kein gültiges Bildformat");

      const prompt = mode === 'remove-bg' 
        ? "Remove the background of this product image. Place the product on a clean, professional solid white background. No shadows, just the clear product."
        : mode === 'enhance'
        ? "Enhance this product image. Make it look professional, vibrant, and high-end. Adjust lighting and colors as if it was shot in a professional studio."
        : "Turn this into a high-quality lifestyle product shot. Professional lighting, attractive background that fits a high-end webshop.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          { inlineData: { mimeType: match[1], data: match[2] } },
          { text: prompt }
        ]
      });

      // Find image in response parts
      let newBase64 = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            newBase64 = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (newBase64) {
        const updated = [...processingImages];
        updated[index].current = newBase64;
        setProcessingImages(updated);
      }
    } catch (e: any) {
      console.error(e);
      alert("KI-Bearbeitung fehlgeschlagen: " + e.message);
    } finally {
      setIsAiProcessing(null);
    }
  };

  const finalizeImages = () => {
    const final = processingImages.map(img => img.current);
    const names = processingImages.map(img => img.name.split('.')[0] + '-ki.jpg');
    
    setEditForm({ 
      ...editForm, 
      images: [...(editForm.images || []), ...final],
      imageNames: [...(editForm.imageNames || []), ...names]
    });
    
    setIsProcessingModalOpen(false);
    setProcessingImages([]);
  };

  const setAsTitleImage = (index: number) => {
    const newImages = [...(editForm.images || [])];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    setEditForm({ ...editForm, images: newImages });
  };

  const removeImage = (index: number) => {
    const newImages = [...(editForm.images || [])];
    newImages.splice(index, 1);
    setEditForm({ ...editForm, images: newImages });
  };

  const generateSEO = async () => {
    if (!editForm.title || !editForm.description) {
      alert("Bitte fülle zuerst Titel und Beschreibung aus, damit die KI einen Kontext hat.");
      return;
    }
    
    setIsGeneratingSEO(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analysiere das Produktbild und erstelle SEO-relevante Informationen.
      
Produkttitel: ${editForm.title}
Beschreibung: ${editForm.description}

Aufgabe:
Erstelle für jedes der ${(editForm.images || []).length} Bilder einen individuellen Alt-Text und einen SEO-Dateinamen (ohne Endung).

Antworte EXAKT in diesem JSON Format:
{
  "images": [
    { "altText": "SEO Alt Text", "fileName": "dateiname-ohne-endung" }
  ]
}`;

      const imageParts = (editForm.images || []).map((img: string) => {
         const match = img.match(/^data:(image\/[a-z]+);base64,(.+)$/);
         if (match) return { inlineData: { mimeType: match[1], data: match[2] } };
         return null;
      }).filter(Boolean);

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          { parts: [...imageParts.map(p => p as any), { text: prompt }] }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawText = response.text?.trim() || '{}';
      const jsonResult = JSON.parse(rawText);
      const aiConfigs = jsonResult.images || [];

      const newAltTexts = (editForm.images || []).map((_: any, i: number) => aiConfigs[i]?.altText || aiConfigs[0]?.altText || '');
      const newFileNames = (editForm.images || []).map((_: any, i: number) => (aiConfigs[i]?.fileName || aiConfigs[0]?.fileName || 'image') + (i > 0 ? `-${i+1}` : '') + '.jpg');

      setEditForm({ 
        ...editForm, 
        seoAltText: newAltTexts[0] || '',
        seoAltTexts: newAltTexts,
        imageNames: newFileNames
      });
    } catch (e: any) {
      console.error(e);
      alert("Fehler bei der KI-Generierung. Bitte versuche es später noch einmal.");
    } finally {
      setIsGeneratingSEO(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const sanitizedVariants = (editForm.variants || []).map((v: any) => {
        const variant: any = {
          id: v.id || Date.now().toString() + Math.random().toString(36).substring(2),
          name: v.name,
          price: Number(v.price)
        };
        if (v.image) variant.image = v.image;
        if (v.group) variant.group = v.group;
        return variant;
      });

      const productData: any = {
        title: editForm.title,
        description: editForm.description,
        price: Number(editForm.price),
        categoryId: editForm.categoryId,
        images: editForm.images || [],
        isVisible: editForm.isVisible,
        seoAltText: editForm.seoAltText || '',
        seoAltTexts: editForm.seoAltTexts || [],
        imageNames: editForm.imageNames || [],
        variants: sanitizedVariants,
        updatedAt: Date.now()
      };

      if (editForm.id) {
        // Explicitly handle removal of subcategory during update
        if (!editForm.subcategoryId) {
           productData.subcategoryId = deleteField();
        } else {
           productData.subcategoryId = editForm.subcategoryId;
        }
        const ref = doc(db, 'products', editForm.id);
        await updateDoc(ref, productData).catch(e => handleFirestoreError(e, 'update', `products/${editForm.id}`));
      } else {
        // For new products, only add subcategoryId if it exists
        if (editForm.subcategoryId) {
          productData.subcategoryId = editForm.subcategoryId;
        }
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: Date.now(),
        }).catch(e => handleFirestoreError(e, 'create', 'products'));
      }
      setIsEditing(false);
      setEditForm(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim Speichern: " + (err.message.startsWith('{') ? "Berechtigungsfehler (Details in Konsole)" : err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const startCreate = () => {
    const firstCat = categories.find(c => !c.parentId);
    setEditForm({ 
      title: '', 
      description: '', 
      price: 0, 
      categoryId: firstCat ? firstCat.id : '', 
      subcategoryId: '',
      images: [], 
      isVisible: true,
      seoAltText: '',
      seoAltTexts: [],
      imageNames: [],
      variants: [] 
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', id)).catch(e => handleFirestoreError(e, 'delete', `products/${id}`));
      setConfirmDeleteId(null);
      await fetchData();
    } catch(e: any) { 
      console.error(e);
      alert("Fehler beim Löschen: " + (e.message.startsWith('{') ? "Berechtigungsfehler" : e.message));
      setLoading(false);
    }
  }

  const handleDuplicate = async (p: any) => {
    try {
      const productData: any = {
        title: `${p.title} (Kopie)`,
        description: p.description,
        price: p.price,
        categoryId: p.categoryId,
        images: p.images || [],
        isVisible: p.isVisible,
        variants: p.variants || [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (p.subcategoryId) {
        productData.subcategoryId = p.subcategoryId;
      }
      await addDoc(collection(db, 'products'), productData);
      fetchData();
    } catch(e: any) { 
      console.error(e.message); 
      alert("Fehler beim Duplizieren: " + e.message);
    }
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    const newVariants = [...(editForm.variants || [])];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setEditForm({ ...editForm, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    const newVariants = [...(editForm.variants || [])];
    newVariants.splice(index, 1);
    setEditForm({ ...editForm, variants: newVariants });
  };

  const addVariant = () => {
    const newVariants = [...(editForm.variants || []), { id: Date.now().toString(), name: '', price: editForm.price }];
    setEditForm({ ...editForm, variants: newVariants });
  };

  const handleVariantImageChange = async (index: number, file: File) => {
    if (file.type.startsWith('image/')) {
        try {
           const base64 = await resizeImage(file);
           handleVariantChange(index, 'image', base64);
        } catch(e) {
           console.error(e);
        }
    }
  };

  const mainCategories = categories.filter(c => !c.parentId);
  const getCategoryTitle = (id: string) => categories.find(c => c.id === id)?.title || id;

  const filteredProducts = products.filter(p => {
    if (filterCategory && p.categoryId !== filterCategory) return false;
    if (filterSubcategory && p.subcategoryId !== filterSubcategory) return false;
    if (filterVariant) {
      const term = filterVariant.toLowerCase();
      const hasVariantMatch = (p.variants || []).some((v: any) => 
        (v.name || '').toLowerCase().includes(term) ||
        (v.group || '').toLowerCase().includes(term)
      );
      if (!hasVariantMatch) return false;
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      await Promise.all(
        selectedProductIds.map(id => 
          deleteDoc(doc(db, 'products', id)).catch(e => handleFirestoreError(e, 'delete', `products/${id}`))
        )
      );
      setSelectedProductIds([]);
      await fetchData();
    } catch(e: any) { 
      console.error(e);
      alert("Bulk-Löschen fehlgeschlagen: " + (e.message.startsWith('{') ? "Berechtigungsfehler" : e.message));
      setLoading(false);
    }
  };

  const handleBulkCategorySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      for (const id of selectedProductIds) {
        const updateData: any = {
          categoryId: bulkCategory,
          updatedAt: Date.now()
        };
        if (bulkSubcategory) {
          updateData.subcategoryId = bulkSubcategory;
        }
        await updateDoc(doc(db, 'products', id), updateData);
      }
      setBulkEditMode(null);
      setSelectedProductIds([]);
      fetchData();
    } catch (e: any) { 
      console.error(e); 
      alert("Fehler bei Bulk-Edit: " + e.message);
    }
  };

  const openPriceManager = () => {
    const drafts: any = {};
    selectedProductIds.forEach(id => {
      const p = products.find(prod => prod.id === id);
      if (p) {
        drafts[id] = {
          price: p.price,
          variants: (p.variants || []).reduce((acc: any, v: any) => ({ ...acc, [v.id]: v.price }), {})
        };
      }
    });
    setPriceDrafts(drafts);
    setBulkEditMode('price');
  };

  const updateDraftPrice = (productId: string, variantId: string | null, value: string) => {
    setPriceDrafts(prev => {
      const nd = { ...prev };
      if (!nd[productId]) return nd;
      if (variantId) {
        nd[productId] = { ...nd[productId], variants: { ...nd[productId].variants, [variantId]: value } };
      } else {
        nd[productId] = { ...nd[productId], price: value };
      }
      return nd;
    });
  };

  const applyMathToDrafts = () => {
    setPriceDrafts(prev => {
      const nd = { ...prev };
      selectedProductIds.forEach(id => {
        const p = products.find(prod => prod.id === id);
        if (!p || !nd[id]) return;
        
        // Apply to base
        if (bulkPriceTarget === 'all' || bulkPriceTarget === 'base_only') {
          let baseV = Number(nd[id].price);
          if (bulkPriceAction === 'fixed') baseV = bulkPriceValue;
          if (bulkPriceAction === 'add') baseV = Math.max(0, baseV + bulkPriceValue);
          if (bulkPriceAction === 'percent') baseV = Math.max(0, baseV * (1 + bulkPriceValue / 100));
          nd[id] = { ...nd[id], price: baseV !== null && !isNaN(baseV) ? Number(baseV.toFixed(2)) : nd[id].price };
        }

        // Apply to variants
        if (bulkPriceTarget === 'all' || bulkPriceTarget === 'variants_match') {
          let newVars = { ...nd[id].variants };
          (p.variants || []).forEach((v: any) => {
            let apply = false;
            if (bulkPriceTarget === 'all') apply = true;
            if (bulkPriceTarget === 'variants_match') {
                const term = bulkPriceTargetFilter.toLowerCase();
                if (term && ((v.name && v.name.toLowerCase().includes(term)) || (v.group && v.group.toLowerCase().includes(term)))) {
                    apply = true;
                }
            }
            if (apply) {
              let varV = Number(newVars[v.id] ?? v.price);
              if (bulkPriceAction === 'fixed') varV = bulkPriceValue;
              if (bulkPriceAction === 'add') varV = Math.max(0, varV + bulkPriceValue);
              if (bulkPriceAction === 'percent') varV = Math.max(0, varV * (1 + bulkPriceValue / 100));
              newVars[v.id] = varV !== null && !isNaN(varV) ? Number(varV.toFixed(2)) : newVars[v.id];
            }
          });
          nd[id] = { ...nd[id], variants: newVars };
        }
      });
      return nd;
    });
  };

  const handleBulkPriceSave = async () => {
    setLoading(true);
    try {
      for (const id of selectedProductIds) {
        const product = products.find(p => p.id === id);
        if (!product) continue;
        const draft = priceDrafts[id];
        if (!draft) continue;

        const newVariants = (product.variants || []).map((v: any) => ({
          ...v,
          price: draft.variants[v.id] !== undefined ? Number(draft.variants[v.id]) : v.price
        }));

        await updateDoc(doc(db, 'products', id), {
           price: Number(draft.price),
           variants: newVariants,
           updatedAt: Date.now()
        });
      }
      setBulkEditMode(null);
      setSelectedProductIds([]);
      fetchData();
    } catch (e: any) { 
        console.error(e); 
        alert("Fehler beim Bulk-Preis-Speichern: " + e.message);
    }
    setLoading(false);
  };

  const handleBulkSEOUpdate = async () => {
    if (!window.confirm("Möchtest du wirklich die SEO-Texte für ALLE Produkte mit KI optimieren? Dies kann eine kurze Zeit dauern.")) return;
    
    setIsBulkSEOUpdating(true);
    setBulkSEOProgress({ current: 0, total: products.length });
    setSeoResults([]);
    
    const results: any[] = [];
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const mainCatMap = categories.reduce((acc, c) => ({ ...acc, [c.id]: c.title }), {});
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setBulkSEOProgress({ current: i + 1, total: products.length });
        
        if (!product.title) continue;

        const catTitle = mainCatMap[product.categoryId] || '';
        const subCatTitle = product.subcategoryId ? mainCatMap[product.subcategoryId] || '' : '';
        const imageCount = (product.images || []).length;

        if (imageCount === 0) {
          results.push({
            id: product.id,
            title: product.title,
            image: null,
            result: 'Keine Bilder vorhanden',
            status: 'error'
          });
          continue;
        }

        const prompt = `Analysiere das Produkt und seine ${imageCount} Bilder. Erstelle für JEDES Bild einen SEO-optimierten Alt-Text und einen Dateinamen.
        
Produkttitel: ${product.title}
Kategorie: ${catTitle} ${subCatTitle ? `> ${subCatTitle}` : ''}
Zielgruppe: Kunden, die nach ${product.title} suchen.

Aufgabe:
Erstelle für jedes Bild einen individuellen, beschreibenden Alt-Text (Fokus auf Details/Perspektive) und einen Dateinamen (Kleinbuchstaben, Bindestriche, ohne Endung).

Antworte EXAKT in diesem JSON Format:
{
  "images": [
    { "altText": "SEO Alt Text", "fileName": "dateiname-ohne-endung" }
  ]
}`;

        try {
          // Prepare image parts for Gemini
          const imageParts = (product.images || []).map((img: string) => {
             // Extract base64 data and mime type
             const match = img.match(/^data:(image\/[a-z]+);base64,(.+)$/);
             if (match) {
               return {
                 inlineData: {
                   mimeType: match[1],
                   data: match[2]
                 }
               };
             }
             return null;
          }).filter(Boolean);

          const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: [
              { parts: [...imageParts.map(p => p as any), { text: prompt }] }
            ],
            config: {
              responseMimeType: "application/json"
            }
          });
          
          const rawText = response.text?.trim() || '{}';
          const jsonResult = JSON.parse(rawText);
          const aiImageConfigs = jsonResult.images || [];

          // Standardize image naming and alt texts
          const finalAltTexts: string[] = [];
          const finalImageNames: string[] = [];

          for (let j = 0; j < imageCount; j++) {
            const config = aiImageConfigs[j] || aiImageConfigs[0] || {};
            const alt = config.altText || `${product.title}ansicht ${j + 1}`;
            const name = config.fileName || `${product.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${j + 1}`;
            
            finalAltTexts.push(alt);
            finalImageNames.push(name.endsWith('.jpg') ? name : `${name}.jpg`);
          }

          if (finalAltTexts.length > 0) {
            await updateDoc(doc(db, 'products', product.id), {
              seoAltText: finalAltTexts[0], // Keep legacy single field for compat
              seoAltTexts: finalAltTexts,
              imageNames: finalImageNames,
              updatedAt: Date.now()
            });

            results.push({
               id: product.id,
               title: product.title,
               image: product.images?.[0],
               imageDetails: finalImageNames.map((name, idx) => ({
                  name,
                  alt: finalAltTexts[idx],
                  preview: product.images?.[idx]
               })),
               status: 'success'
            });
          }
        } catch (err: any) {
          console.error(`Fehler bei Produkt ${product.id}:`, err);
          results.push({
            id: product.id,
            title: product.title,
            image: product.images?.[0],
            result: err.message || 'Fehler bei Generierung',
            fileName: '-',
            status: 'error'
          });
        }
      }
      
      setSeoResults(results);
      setShowSeoResults(true);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Fehler bei der Bulk-SEO-Optimierung: " + err.message);
    } finally {
      setIsBulkSEOUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight">Produkte</h1>
          <p className="text-zinc-500 mt-1">Produkte verwalten und in Gruppen organisieren.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={startCreate} className="bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-[#ff5e00] transition-colors shadow-lg">
            <Plus className="w-4 h-4" /> Neues Produkt
          </button>
          <button
            onClick={handleBulkSEOUpdate}
            disabled={isBulkSEOUpdating || loading}
            className="px-4 py-2 bg-white text-zinc-900 border border-zinc-200 rounded-xl shadow-sm hover:border-zinc-900 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
          >
            {isBulkSEOUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {isBulkSEOUpdating ? `KI-Optimierung (${bulkSEOProgress.current}/${bulkSEOProgress.total})` : 'Alle SEO-Texte optimieren'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 pt-4 border-t border-zinc-200">
        <div className="flex-1 max-w-sm">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Nach Hauptkategorie filtern</label>
          <select 
             className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
             value={filterCategory}
             onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory(''); }}
          >
            <option value="">Alle Kategorien</option>
            {mainCategories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        {filterCategory && (
          <div className="flex-1 max-w-sm">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Nach Unterkategorie filtern</label>
            <select 
               className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
               value={filterSubcategory}
               onChange={e => setFilterSubcategory(e.target.value)}
            >
              <option value="">Alle Unterkategorien</option>
              {categories.filter(c => c.parentId === filterCategory).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}
        <div className="flex-1 max-w-sm">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">Nach Variante filtern</label>
          <input 
             type="text" 
             placeholder="z.B. Name oder Gruppe"
             className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-500"
             value={filterVariant}
             onChange={e => setFilterVariant(e.target.value)}
          />
        </div>
      </div>

      {selectedProductIds.length > 0 && (
        <div className="bg-emerald-900 text-white rounded-2xl p-4 mb-6 flex justify-between items-center shadow-xl animate-in fade-in slide-in-from-bottom-4 relative z-10">
           <div className="font-medium flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-sm">
               {selectedProductIds.length}
             </div>
             Produkte ausgewählt
           </div>
           <div className="flex gap-2">
             <button onClick={() => setBulkEditMode('category')} className="bg-emerald-800 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
               Kategorie zuweisen
             </button>
             <button onClick={openPriceManager} className="bg-emerald-800 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
               Preise anpassen
             </button>
             <button onClick={() => setShowBulkDeleteConfirm(true)} className="bg-red-500 border border-red-400 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm">
               Löschen
             </button>
           </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-display mb-2">Produkte löschen?</h2>
            <p className="text-zinc-500 text-sm mb-8">Bist du sicher, dass du {selectedProductIds.length} Produkte unwiderruflich löschen möchtest?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowBulkDeleteConfirm(false)} 
                className="flex-1 py-3 font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={() => { setShowBulkDeleteConfirm(false); handleBulkDelete(); }} 
                className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg"
              >
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Category Modal */}
      {bulkEditMode === 'category' && (
         <div className="fixed inset-0 bg-black/50 flex py-12 justify-center z-50">
           <div className="bg-white p-8 rounded-2xl max-w-lg w-full h-fit shadow-2xl">
             <h2 className="text-xl font-display mb-2">Gruppe für {selectedProductIds.length} Produkte ändern</h2>
             <p className="text-zinc-500 text-sm mb-6">Ordne den gewählten Produkten eine neue Kategorie zu.</p>
             <form onSubmit={handleBulkCategorySave} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium mb-1">Hauptkategorie</label>
                  <select required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500 bg-white" value={bulkCategory} onChange={e => { setBulkCategory(e.target.value); setBulkSubcategory(''); }}>
                    <option value="">Bitte wählen...</option>
                    {mainCategories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
               </div>
               {bulkCategory && (
                 <div>
                    <label className="block text-sm font-medium mb-1">Unterkategorie (optional)</label>
                    <select className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500 bg-white" value={bulkSubcategory} onChange={e => setBulkSubcategory(e.target.value)}>
                      <option value="">Keine Unterkategorie</option>
                      {categories.filter(c => c.parentId === bulkCategory).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                 </div>
               )}
               <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200">
                  <button type="button" onClick={() => setBulkEditMode(null)} className="px-6 py-2.5 font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors">Abbrechen</button>
                  <button type="submit" disabled={!bulkCategory} className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-[#ff5e00] transition-colors shadow-lg disabled:opacity-50">Zuweisung Speichern</button>
               </div>
             </form>
           </div>
         </div>
      )}

      {/* Bulk Price Manager Modal */}
      {bulkEditMode === 'price' && (
         <div className="fixed inset-0 bg-black/50 flex py-12 justify-center z-50 overflow-hidden">
           <div className="bg-white rounded-2xl max-w-5xl w-full h-full flex flex-col shadow-2xl mx-4">
             <div className="p-6 border-b border-zinc-200">
                <h2 className="text-xl font-display mb-1">Erweiterter Preis-Manager</h2>
                <div className="text-sm text-zinc-500">Passe Preise über die Schnell-Aktion an oder editiere jedes Produkt und seine Varianten individuell in der Liste.</div>
             </div>
             
             <div className="flex flex-col lg:flex-row gap-6 p-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
                {/* Left: Mass Actions */}
                <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                   <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
                      <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-500">Schnell-Anpassung</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-zinc-600">Zielgruppe</label>
                          <select 
                              className="w-full border border-zinc-300 rounded p-2 text-sm bg-white"
                              value={bulkPriceTarget} 
                              onChange={e => setBulkPriceTarget(e.target.value as any)}
                          >
                            <option value="all">Grundpreis + Alle Varianten</option>
                            <option value="base_only">NUR Grundpreise</option>
                            <option value="variants_match">NUR gezielte Varianten</option>
                          </select>
                        </div>
                        {bulkPriceTarget === 'variants_match' && (
                            <div>
                                <label className="block text-xs font-semibold mb-1 text-zinc-600">Name oder Gruppe enthält:</label>
                                <input 
                                  type="text" placeholder="z.B. 100 Beispiele" 
                                  className="w-full border border-zinc-300 rounded p-2 text-sm"
                                  value={bulkPriceTargetFilter} onChange={e => setBulkPriceTargetFilter(e.target.value)}
                                />
                            </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-zinc-600">Aktion</label>
                          <select 
                              className="w-full border border-zinc-300 rounded p-2 text-sm bg-white"
                              value={bulkPriceAction} 
                              onChange={e => setBulkPriceAction(e.target.value as any)}
                          >
                            <option value="fixed">Festbetrag setzen (€)</option>
                            <option value="add">Addieren/Subtrahieren (€)</option>
                            <option value="percent">Prozentual (%)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-zinc-600">Wert</label>
                          <input type="number" step="0.01" className="w-full border border-zinc-300 rounded p-2 font-mono text-sm" value={bulkPriceValue} onChange={e => setBulkPriceValue(Number(e.target.value))} />
                        </div>
                        <button onClick={applyMathToDrafts} className="w-full bg-zinc-200 hover:bg-zinc-300 transition-colors py-2 rounded font-medium text-sm text-zinc-800">
                           Auf Tabelle anwenden
                        </button>
                        <p className="text-xs text-zinc-400 leading-relaxed mt-2">
                           Diese Aktion füllt die rechte Tabelle aus. Du kannst danach alle Preise nochmal einzeln überprüfen, bevor du sie speicherst.
                        </p>
                      </div>
                   </div>
                </div>

                {/* Right: The List */}
                <div className="flex-1 overflow-y-auto lg:border border-zinc-200 lg:rounded-xl lg:bg-zinc-50/50 lg:p-4">
                   <div className="hidden lg:flex gap-2 mb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      <div className="flex-1">Produkt / Variante</div>
                      <div className="w-32 text-right">Preis (€)</div>
                   </div>
                   
                   {selectedProductIds.map(id => {
                      const p = products.find(prod => prod.id === id);
                      if (!p || !priceDrafts[id]) return null;
                      return (
                         <div key={id} className="bg-white border border-zinc-200 rounded-xl mb-4 overflow-hidden shadow-sm">
                            <div className="p-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                               <div className="font-medium truncate">{p.title}</div>
                               <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-400 uppercase tracking-widest hidden sm:inline-block">Grundpreis</span>
                                  <input 
                                    type="number" step="0.01"
                                    value={priceDrafts[id].price}
                                    onChange={e => updateDraftPrice(id, null, e.target.value)}
                                    className="w-24 px-2 py-1.5 border border-zinc-300 rounded font-mono text-right outline-none focus:border-zinc-500 transition-colors"
                                  />
                               </div>
                            </div>
                            {(p.variants || []).length > 0 && (
                               <div className="bg-white divide-y divide-zinc-50 border-t border-zinc-100">
                                  {(p.variants || []).map((v: any) => (
                                     <div key={v.id} className="flex items-center justify-between py-2.5 px-4 lg:pl-8">
                                        <div className="text-sm text-zinc-600 flex items-center gap-2 truncate">
                                           <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 flex-shrink-0"></div>
                                           {v.group && <span className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{v.group}</span>}
                                           <span className="truncate">{v.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                           <span className="text-xs text-zinc-400 hidden sm:inline-block">Variante</span>
                                           <input 
                                             type="number" step="0.01"
                                             value={priceDrafts[id].variants[v.id] ?? ''}
                                             onChange={e => updateDraftPrice(id, v.id, e.target.value)}
                                             className="w-24 px-2 py-1.5 border border-zinc-200 rounded font-mono text-sm text-right outline-none focus:border-zinc-500 transition-colors"
                                           />
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            )}
                         </div>
                      )
                   })}
                </div>
             </div>

             <div className="p-6 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl flex justify-between items-center overflow-hidden">
                 <div className="text-sm text-zinc-500 hidden sm:block">Alle Preise werden sofort live gespeichert.</div>
                 <div className="flex gap-3 w-full sm:w-auto">
                    <button type="button" onClick={() => setBulkEditMode(null)} className="flex-1 sm:flex-none px-6 py-2.5 font-medium text-zinc-600 hover:bg-zinc-200 bg-zinc-100 rounded-xl transition-colors">Abbrechen</button>
                    <button onClick={handleBulkPriceSave} disabled={loading} className="flex-1 sm:flex-none px-8 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-[#ff5e00] transition-colors shadow-lg disabled:opacity-50">
                       {loading ? 'Speichere...' : 'Speichern'}
                    </button>
                 </div>
             </div>
           </div>
         </div>
      )}

      {/* Image Processing Modal */}
      {isProcessingModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
               <div>
                  <h2 className="text-xl font-display font-medium">Bilder aufpeppen (KI-Zwischenstation)</h2>
                  <p className="text-sm text-zinc-500">Optimiere deine Fotos mit KI, bevor sie in den Shop geladen werden.</p>
               </div>
               <button onClick={() => setIsProcessingModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-zinc-100">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {processingImages.map((img, idx) => (
                   <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-200">
                      <div className="aspect-square bg-zinc-100 rounded-xl overflow-hidden mb-4 relative group">
                        <img src={img.current} className="w-full h-full object-contain" alt="" />
                        {isAiProcessing === idx && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                             <div className="flex flex-col items-center gap-3 text-white">
                                <RefreshCw className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-medium">KI arbeitet...</span>
                             </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => handleAiEdit(idx, 'remove-bg')}
                          disabled={isAiProcessing !== null}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                          <Trash className="w-3.5 h-3.5" /> Hintergrund weg
                        </button>
                        <button 
                          onClick={() => handleAiEdit(idx, 'enhance')}
                          disabled={isAiProcessing !== null}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          <Star className="w-3.5 h-3.5" /> Textur/Licht +
                        </button>
                        <button 
                          onClick={() => handleAiEdit(idx, 'product-shot')}
                          disabled={isAiProcessing !== null}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          <Wand2 className="w-3.5 h-3.5" /> Profi-Shot
                        </button>
                        <button 
                          onClick={() => handleAiEdit(idx, 'square')}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-50 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Quadratisch
                        </button>
                        <button 
                          onClick={() => {
                             const updated = [...processingImages];
                             updated[idx].current = updated[idx].original;
                             setProcessingImages(updated);
                          }}
                          disabled={isAiProcessing !== null}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 text-zinc-400 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="p-6 border-t border-zinc-200 flex gap-4 bg-white">
               <button 
                 onClick={() => setIsProcessingModalOpen(false)}
                 className="flex-1 py-3 px-6 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 transition-colors"
               >
                 Abbrechen
               </button>
               <button 
                 onClick={finalizeImages}
                 className="flex-[2] py-3 px-6 bg-zinc-900 text-white rounded-xl font-medium hover:bg-[#ff5e00] transition-colors shadow-lg"
               >
                 Bilder übernehmen ({processingImages.length})
               </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Results Modal */}
      {showSeoResults && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-200 flex justify-between items-center bg-zinc-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-display font-medium">KI SEO Ergebnisse</h2>
                <p className="text-sm text-zinc-500">Folgende Texte wurden für deine Produkte generiert.</p>
              </div>
              <button 
                onClick={() => setShowSeoResults(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors text-zinc-400 hover:text-zinc-900 shadow-sm border border-zinc-200"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
               <div className="space-y-4">
                 {seoResults.length === 0 && (
                   <div className="text-center py-12 text-zinc-400">Keine Ergebnisse generiert.</div>
                 )}
                 {seoResults.map((res: any, idx: number) => (
                   <div key={idx} className={`flex gap-4 p-4 rounded-xl border ${res.status === 'error' ? 'border-red-100 bg-red-50/30' : 'border-zinc-100 bg-zinc-50/50'}`}>
                      <div className="w-16 h-16 rounded-lg bg-white border border-zinc-200 overflow-hidden shrink-0 shadow-sm">
                        {res.image ? (
                          <img src={res.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-300">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-1">
                            <h3 className="font-semibold text-sm truncate pr-4">{res.title}</h3>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${res.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                               {res.status === 'success' ? 'Optimiert' : 'Fehler'}
                            </span>
                         </div>
                         <div className="space-y-3 mt-2">
                           {res.status === 'error' ? (
                             <p className="text-sm text-red-600 italic">{res.result}</p>
                           ) : (
                             (res.imageDetails || []).map((img: any, idx: number) => (
                               <div key={idx} className="flex gap-3 items-center bg-white p-2 rounded-lg border border-zinc-200">
                                  <div className="w-10 h-10 rounded border border-zinc-100 overflow-hidden shrink-0">
                                     <img src={img.preview} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase">File</span>
                                        <span className="text-[10px] font-mono text-indigo-600 truncate">{img.name}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Alt</span>
                                        <p className="text-[10px] text-zinc-500 truncate">{img.alt}</p>
                                     </div>
                                  </div>
                               </div>
                             ))
                           )}
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="p-6 border-t border-zinc-200 bg-zinc-50 rounded-b-2xl">
               <button 
                 onClick={() => setShowSeoResults(false)}
                 className="w-full bg-zinc-900 text-white font-medium py-3 rounded-xl hover:bg-black transition-colors"
               >
                 Verstanden
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Edit Modal */}
      {isEditing && editForm && (
        <div className="fixed inset-0 bg-black/50 flex py-12 justify-center z-50">
          <div className="bg-white p-8 rounded-2xl max-w-2xl w-full h-full overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-display mb-6">{editForm.id ? 'Produkt bearbeiten' : 'Neues Produkt'}</h2>
            <form onSubmit={handleSave} className="space-y-6">
              
              <div 
                className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 text-center hover:bg-zinc-50 transition-colors"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                   type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} 
                   onChange={(e) => e.target.files && handleFiles(e.target.files)} 
                />
                <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                   <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-lg mb-1">Bilder hochladen</h3>
                <p className="text-zinc-500 text-sm">Drag & Drop Bilder hierher oder klicken zum Auswählen</p>
                <p className="text-xs text-zinc-400 mt-2">(Bilder werden automatisch komprimiert)</p>
              </div>

              {(editForm.images && editForm.images.length > 0) && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Hochgeladene Bilder</h4>
                  <div className="flex flex-col gap-3">
                    {editForm.images.map((img: string, i: number) => (
                       <div key={i} className={`flex items-center gap-4 bg-zinc-50 p-3 rounded-xl border ${i === 0 ? 'border-[#ff5e00] bg-[#ff5e00]/5' : 'border-zinc-200'}`}>
                          <div className="w-16 h-16 rounded overflow-hidden bg-white shrink-0">
                            <img src={img} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex flex-col flex-1">
                            {i === 0 && <span className="text-xs font-bold text-[#ff5e00] uppercase tracking-wider mb-1 flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> Titelbild</span>}
                            <span className="text-xs font-semibold text-zinc-400 uppercase">Bild {i + 1}</span>
                            <input 
                              placeholder="SEO-Dateiname"
                              className="text-sm font-mono text-indigo-600 bg-transparent border-0 p-0 outline-none focus:ring-0 w-full"
                              value={editForm.imageNames?.[i] || ''}
                              onChange={e => {
                                const newNames = [...(editForm.imageNames || [])];
                                newNames[i] = e.target.value;
                                setEditForm({ ...editForm, imageNames: newNames });
                              }}
                            />
                            <input 
                              placeholder="Alt-Text"
                              className="text-xs text-zinc-500 bg-transparent border-0 p-0 outline-none focus:ring-0 w-full mt-1"
                              value={editForm.seoAltTexts?.[i] || ''}
                              onChange={e => {
                                const newTexts = [...(editForm.seoAltTexts || [])];
                                newTexts[i] = e.target.value;
                                const firstAlt = i === 0 ? e.target.value : editForm.seoAltText;
                                setEditForm({ ...editForm, seoAltTexts: newTexts, seoAltText: firstAlt });
                              }}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            {i !== 0 && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setAsTitleImage(i); }} className="text-xs font-medium px-3 py-1.5 bg-white border border-zinc-200 rounded hover:bg-zinc-100 transition-colors">
                                Als Titelbild
                              </button>
                            )}
                            <button type="button" onClick={() => removeImage(i)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Titel</label><input required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Standard Preis (€)</label><input type="number" step="0.01" required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategorie</label>
                  <select required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500 bg-white" value={editForm.categoryId} onChange={e => setEditForm({...editForm, categoryId: e.target.value, subcategoryId: ''})}>
                    {mainCategories.length === 0 && <option value="">Keine Kategorien vorhanden</option>}
                    {mainCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unterkategorie (optional)</label>
                  <select className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500 bg-white" value={editForm.subcategoryId || ''} onChange={e => setEditForm({...editForm, subcategoryId: e.target.value})}>
                    <option value="">Keine</option>
                    {categories.filter(c => c.parentId === editForm.categoryId).map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div><label className="block text-sm font-medium mb-1">Beschreibung</label><textarea required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500" rows={5} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
              
              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-medium">SEO Bild-Beschreibung (Alt-Text)</label>
                    <p className="text-xs text-zinc-500 mt-0.5">Wird für Google-Suche und Barrierefreiheit verwendet.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={generateSEO}
                    disabled={isGeneratingSEO}
                    className="flex items-center gap-2 text-xs font-medium px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingSEO ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {isGeneratingSEO ? 'Generiere...' : 'KI Generieren'}
                  </button>
                </div>
                <textarea 
                  className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 bg-white" 
                  rows={2} 
                  placeholder="z.B. Ein handgemachtes Puzzle für Kinder mit 100 Teilen..."
                  value={editForm.seoAltText || ''} 
                  onChange={e => setEditForm({...editForm, seoAltText: e.target.value})} 
                />
              </div>

              {/* Variants Section */}
              <div className="border border-zinc-200 rounded-xl p-6 bg-zinc-50/50">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-medium text-lg">Varianten</h4>
                    <p className="text-sm text-zinc-500">Verschiedene Größen, Spezifikationen oder Farben</p>
                  </div>
                  <button type="button" onClick={addVariant} className="text-sm bg-white border border-zinc-200 hover:bg-zinc-50 px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm">Variante Hinzufügen</button>
                </div>
                
                {(editForm.variants || []).length > 0 && (
                   <div className="space-y-3">
                     <div className="flex gap-2 mb-1 px-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        <div className="w-5"></div>
                        <div className="w-28 pl-1">Gruppe (Opt.)</div>
                        <div className="flex-1">Name (z.B. M)</div>
                        <div className="w-10"></div>
                        <div className="w-24 text-right pr-2">Preis (€)</div>
                        <div className="w-10"></div>
                     </div>
                     {(editForm.variants || []).map((v: any, i: number) => (
                       <div key={v.id || i} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-zinc-200 shadow-sm">
                          <GripVertical className="w-5 h-5 text-zinc-300 cursor-grab active:cursor-grabbing shrink-0"/>
                          <input className="w-28 border border-zinc-200 rounded p-1 text-sm bg-zinc-50 outline-none focus:border-zinc-500" placeholder="z.B. Farbe" value={v.group || ''} onChange={e => handleVariantChange(i, 'group', e.target.value)} />
                          <input required className="flex-1 border-0 outline-none p-1 text-sm pl-2" placeholder="z.B. Blau" value={v.name} onChange={e => handleVariantChange(i, 'name', e.target.value)} />
                          <label className="w-10 h-10 border border-zinc-200 rounded overflow-hidden flex items-center justify-center cursor-pointer bg-zinc-50 hover:bg-zinc-100 flex-shrink-0" title="Varianten-Bild hochladen">
                            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && handleVariantImageChange(i, e.target.files[0])} />
                            {v.image ? <img src={v.image} className="w-full h-full object-cover" alt="" /> : <UploadCloud className="w-4 h-4 text-zinc-400" />}
                          </label>
                          <input type="number" step="0.01" required className="w-24 border-l border-zinc-200 pl-3 outline-none text-sm text-right" value={v.price} onChange={e => handleVariantChange(i, 'price', e.target.value)} />
                          <button type="button" onClick={() => removeVariant(i)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-50 rounded-md ml-1"><Trash className="w-4 h-4"/></button>
                       </div>
                     ))}
                   </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="px-6 py-2.5 font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50">Verwerfen</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-[#ff5e00] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2">
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Speichere...' : 'Produkt Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Lade...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="p-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="p-1 text-zinc-400 hover:text-zinc-900">
                     {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                       <CheckSquare className="w-5 h-5" />
                     ) : (
                       <Square className="w-5 h-5" />
                     )}
                  </button>
                </th>
                <th className="p-4 font-medium text-zinc-500">Bild</th>
                <th className="p-4 font-medium text-zinc-500">Titel</th>
                <th className="p-4 font-medium text-zinc-500">Kategorie</th>
                <th className="p-4 font-medium text-zinc-500">Preis / Var.</th>
                <th className="p-4 font-medium text-zinc-500 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map(p => (
                <tr key={p.id} className={`hover:bg-zinc-50 transition-colors ${selectedProductIds.includes(p.id) ? 'bg-orange-50/50' : ''}`}>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleSelect(p.id)} className={`p-1 ${selectedProductIds.includes(p.id) ? 'text-zinc-900' : 'text-zinc-300 hover:text-zinc-900'}`}>
                       {selectedProductIds.includes(p.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="p-4">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-12 h-12 rounded object-cover shadow-sm bg-white" alt="" /> : <div className="w-12 h-12 bg-zinc-100 rounded"></div>}
                  </td>
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4 text-sm text-zinc-500">
                    {getCategoryTitle(p.categoryId)}
                    {p.subcategoryId && (
                      <span className="block mt-0.5 text-zinc-400 text-xs">↳ {getCategoryTitle(p.subcategoryId)}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    {p.price.toFixed(2)} €
                    {(p.variants && p.variants.length > 0) && (
                      <span className="block mt-1 text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full w-fit">{p.variants.length} Varianten</span>
                    )}
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {confirmDeleteId === p.id ? (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[10px] font-bold text-red-500 uppercase">Sicher?</span>
                        <button onClick={() => handleDelete(p.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-colors">Ja</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="bg-zinc-200 text-zinc-600 px-2 py-1 rounded text-xs hover:bg-zinc-300 transition-colors">Nein</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleDuplicate(p)} title="Duplizieren" className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"><Copy className="w-4 h-4"/></button>
                        <button onClick={() => { setEditForm({ ...p, imageUrl: p.images?.[0] }); setIsEditing(true); }} title="Bearbeiten" className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => setConfirmDeleteId(p.id)} title="Löschen" className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">Keine Produkte in dieser Ansicht gefunden.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
