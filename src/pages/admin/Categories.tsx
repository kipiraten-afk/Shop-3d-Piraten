import React, { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, deleteField } from 'firebase/firestore';
import { db, handleFirestoreError } from '../../lib/firebase';
import { Plus, Edit2, Trash2, UploadCloud, Trash, RefreshCw } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
      const snapshot = await getDocs(q);
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e: any) {
      console.error(e);
      let msg = e.message;
      if (e.code === 'permission-denied') {
        try {
          handleFirestoreError(e, 'list', 'categories');
        } catch(err: any) {
          msg = err.message;
        }
      }
      alert("Fehler beim Laden: " + (msg.startsWith('{') ? "Berechtigungsfehler" : msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data: any = {
        title: editForm.title,
        slug: editForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'cat-' + Date.now().toString(36),
        description: editForm.description || '',
        sortOrder: Number(editForm.sortOrder) || 0,
        parentId: editForm.parentId === '' ? null : editForm.parentId,
        image: editForm.image || null,
        updatedAt: Date.now()
      };

      if (editForm.id) {
        await updateDoc(doc(db, 'categories', editForm.id), data).catch(e => handleFirestoreError(e, 'update', `categories/${editForm.id}`));
      } else {
        await addDoc(collection(db, 'categories'), {
          ...data,
          createdAt: Date.now()
        }).catch(e => handleFirestoreError(e, 'create', 'categories'));
      }
      setIsEditing(false);
      setEditForm(null);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim Speichern der Kategorie: " + (err.message.startsWith('{') ? "Berechtigungsfehler (Details in Konsole)" : err.message));
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        alert("Bitte nur Bilder hochladen.");
        return;
    }
    
    try {
      const resized = await resizeImage(file);
      setEditForm({ ...editForm, image: resized });
    } catch (e: any) {
      alert("Fehler bei der Bildverarbeitung.");
      console.error(e);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const startCreate = (parentId: string | null = null) => {
    setEditForm({ title: '', slug: '', description: '', sortOrder: 0, parentId: parentId || '', image: null });
    setIsEditing(true);
  };

  const handleDelete = async (id: string, isMain: boolean) => {
    if(isMain) {
       const hasChildren = categories.some(c => c.parentId === id);
       if(hasChildren) {
           alert("Diese Hauptkategorie hat noch Unterkategorien. Bitte lösche diese zuerst.");
           return;
       }
    }
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', id)).catch(e => handleFirestoreError(e, 'delete', `categories/${id}`));
      setConfirmDeleteId(null);
      await fetchCategories();
    } catch(e: any) { 
      console.error(e);
      alert("Fehler beim Löschen: " + (e.message.startsWith('{') ? "Berechtigungsfehler" : e.message));
      setLoading(false);
    }
  }

  const mainCategories = categories.filter(c => !c.parentId);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-display font-medium tracking-tight">Kategorien</h1>
           <p className="text-zinc-500 mt-1">Haupt- und Unterkategorien für den Shop verwalten.</p>
        </div>
        <button onClick={() => startCreate(null)} className="bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#ff5e00] transition-colors">
          <Plus className="w-4 h-4" /> Neue Hauptkategorie
        </button>
      </div>

      {isEditing && editForm && (
        <div className="fixed inset-0 bg-black/50 flex py-6 md:py-12 justify-center z-50 overflow-y-auto px-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl max-w-xl w-full h-fit shadow-2xl my-auto">
            <h2 className="text-2xl font-display mb-6">{editForm.id ? 'Kategorie bearbeiten' : 'Neue Kategorie'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div 
                className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 text-center hover:bg-zinc-50 transition-colors cursor-pointer"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                   type="file" accept="image/*" className="hidden" ref={fileInputRef} 
                   onChange={(e) => e.target.files && handleFiles(e.target.files)} 
                />
                
                {editForm.image ? (
                   <div className="relative inline-block">
                      <img src={editForm.image} alt="Kategorie" className="h-32 object-contain rounded-lg border border-zinc-200" />
                      <button 
                         type="button" 
                         onClick={(e) => { e.stopPropagation(); setEditForm({...editForm, image: null}) }}
                         className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 shadow-md border border-zinc-200 hover:text-red-500"
                      >
                         <Trash className="w-4 h-4" />
                      </button>
                   </div>
                ) : (
                  <>
                    <div className="mx-auto w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mb-3 text-zinc-500">
                       <UploadCloud className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-sm mb-1">Passendes Bild hinterlegen</h3>
                    <p className="text-xs text-zinc-500">Drag & Drop oder hier klicken</p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Eltern-Kategorie (optional)</label>
                <select 
                  className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500 bg-white" 
                  value={editForm.parentId || ''} 
                  onChange={e => setEditForm({...editForm, parentId: e.target.value})}
                >
                  <option value="">Keine (ist Hauptkategorie)</option>
                  {mainCategories.filter(c => c.id !== editForm.id).map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-1">Wähle eine Hauptkategorie aus, um eine Unterkategorie zu erstellen.</p>
              </div>

              <div><label className="block text-sm font-medium mb-1">Titel</label><input required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value, slug: editForm.slug ? editForm.slug : e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} /></div>
              <div><label className="block text-sm font-medium mb-1">Slug (URL-Pfad)</label><input required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500" value={editForm.slug} onChange={e => setEditForm({...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} /></div>
              <div><label className="block text-sm font-medium mb-1">Beschreibung (intern)</label><input className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Sortierung (Zahl)</label><input type="number" required className="w-full border border-zinc-300 rounded-lg p-2.5 outline-none focus:border-zinc-500" value={editForm.sortOrder} onChange={e => setEditForm({...editForm, sortOrder: e.target.value})} /></div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200">
                <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving} className="px-6 py-2.5 font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50">Abbrechen</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-zinc-900 text-white font-medium rounded-xl hover:bg-[#ff5e00] transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2">
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Speichere...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Lade...</div>
      ) : (
        <div className="space-y-6">
          {mainCategories.map(mainCat => {
            const subCategories = categories.filter(c => c.parentId === mainCat.id);
            return (
              <div key={mainCat.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {mainCat.image && (
                      <div className="w-12 h-12 rounded overflow-hidden bg-white border border-zinc-200 shrink-0">
                        <img src={mainCat.image} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{mainCat.title} <span className="text-sm font-normal text-zinc-400 ml-2">({mainCat.slug})</span></h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startCreate(mainCat.id)} className="text-sm px-3 py-1.5 bg-white border border-zinc-200 rounded font-medium hover:bg-zinc-100 transition-colors mr-4">
                      + Unterkategorie
                    </button>
                    {confirmDeleteId === mainCat.id ? (
                      <div className="flex items-center gap-1 bg-white border border-red-200 rounded-lg p-1 animate-in slide-in-from-right-1">
                        <span className="text-[10px] font-bold text-red-500 uppercase px-1">Löschen?</span>
                        <button onClick={() => handleDelete(mainCat.id, true)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] hover:bg-red-600 transition-colors">Ja</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="bg-zinc-100 text-zinc-500 px-2 py-1 rounded text-[10px] hover:bg-zinc-200 transition-colors">Nein</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => { setEditForm(mainCat); setIsEditing(true); }} className="p-2 text-zinc-400 hover:text-zinc-900"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => setConfirmDeleteId(mainCat.id)} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="divide-y divide-zinc-100">
                  {subCategories.length > 0 ? subCategories.map(subCat => (
                    <div key={subCat.id} className="p-4 pl-12 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                         {subCat.image ? (
                           <div className="w-8 h-8 rounded border border-zinc-200 overflow-hidden">
                             <img src={subCat.image} className="w-full h-full object-cover" alt="" />
                           </div>
                         ) : (
                           <div className="w-8 h-8 rounded border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                             <div className="w-1.5 h-1.5 rounded-full bg-zinc-300"></div>
                           </div>
                         )}
                         <span className="font-medium">{subCat.title}</span>
                         <span className="text-xs text-zinc-400">({subCat.slug})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {confirmDeleteId === subCat.id ? (
                          <div className="flex items-center gap-1 bg-white border border-red-200 rounded-lg p-1 animate-in slide-in-from-right-1">
                            <span className="text-[10px] font-bold text-red-500 uppercase px-1">Löschen?</span>
                            <button onClick={() => handleDelete(subCat.id, false)} className="bg-red-500 text-white px-2 py-1 rounded text-[10px] hover:bg-red-600 transition-colors">Ja</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="bg-zinc-100 text-zinc-500 px-2 py-1 rounded text-[10px] hover:bg-zinc-200 transition-colors">Nein</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => { setEditForm(subCat); setIsEditing(true); }} className="p-2 text-zinc-400 hover:text-zinc-900"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => setConfirmDeleteId(subCat.id)} className="p-2 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                          </>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 pl-12 flex items-center gap-3 text-zinc-400 italic text-sm">
                      <div className="w-2 h-2 rounded-full border border-zinc-300"></div>
                      Keine Unterkategorien definiert
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {mainCategories.length === 0 && (
             <div className="text-center py-12 text-zinc-500 bg-white rounded-2xl border border-zinc-200">
                Keine Kategorien vorhanden. Lege zuerst eine Hauptkategorie an.
             </div>
          )}
        </div>
      )}
    </div>
  );
}
