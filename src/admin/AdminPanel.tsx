import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Save, LogOut, Layout, Package, Settings as SettingsIcon, 
  Move, Facebook, Instagram, Phone as WhatsApp, MapPin, Upload, Edit2, LogIn, X, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Draggable from 'react-draggable';
import api from '../lib/api';
import { db } from '../firebase';
import { 
  collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, getDoc
} from 'firebase/firestore';

// --- Types ---
interface LayoutItem {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface Settings {
  logo: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  googleMaps: string;
  layout: Record<string, LayoutItem>;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface Category {
  _id: string;
  name: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'settings' | 'editor'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({
    logo: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    googleMaps: '',
    layout: {}
  });

  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '' });
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const productCreateInputRef = useRef<HTMLInputElement>(null);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    alert(`Error: ${errInfo.error}`);
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
      
      // Seed default categories if empty
      if (cats.length === 0) {
        const defaultCats = ['Tshirts', 'pants', 'costumes', 'jackets', 'boots'];
        defaultCats.forEach(async (name) => {
          await addDoc(collection(db, 'categories'), { name });
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'categories'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as Settings);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSettings();
    };
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Using the requested credentials
    if (username === 'sam' && password === 'sam2006') {
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const handleLogout = () => setIsLoggedIn(false);

  const handleAddCategory = async () => {
    if (!newCategory) return;
    try {
      await addDoc(collection(db, 'categories'), { name: newCategory });
      setNewCategory('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'categories');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = newProduct.image;
      if (productCreateInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append('file', productCreateInputRef.current.files[0]);
        const res = await api.post('/upload', formData);
        imageUrl = res.data.url;
      }

      if (!imageUrl) {
        alert("Please upload an image for the product.");
        return;
      }

      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category,
        image: imageUrl
      });
      setNewProduct({ name: '', price: '', category: '', image: '' });
      if (productCreateInputRef.current) productCreateInputRef.current.value = '';
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleUpdateProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !targetProductId) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const res = await api.post('/upload', formData);
      
      await updateDoc(doc(db, 'products', targetProductId), {
        image: res.data.url
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${targetProductId}`);
    } finally {
      setIsSaving(false);
      setTargetProductId(null);
    }
  };

  const handleUpdateLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const res = await api.post('/upload', formData);
      
      await setDoc(doc(db, 'settings', 'global'), {
        ...settings,
        logo: res.data.url
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings, { merge: true });
      alert("Settings saved to Firebase!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/global');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrag = (id: string, data: { x: number, y: number }) => {
    setSettings(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        [id]: { x: data.x, y: data.y }
      }
    }));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-charcoal p-12 rounded-lg border border-gold/20 w-full max-w-md"
        >
          <h1 className="text-4xl font-serif text-gold mb-8 text-center tracking-widest">MEN31 ADMIN</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-platinum text-xs tracking-widest mb-2 uppercase">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-navy border border-gold/20 p-3 text-ivory focus:border-gold outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-platinum text-xs tracking-widest mb-2 uppercase">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-navy border border-gold/20 p-3 text-ivory focus:border-gold outline-none transition-colors"
                required
              />
            </div>
            <button className="w-full bg-gold text-navy font-bold py-4 rounded-sm hover:bg-ivory transition-colors tracking-widest">
              ENTER SYSTEM
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-navy text-ivory">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal border-r border-gold/10 flex flex-col">
        <div className="p-8 border-b border-gold/10">
          <h2 className="text-2xl font-serif text-gold tracking-widest">MEN31</h2>
          <p className="text-[10px] text-platinum tracking-[0.2em] mt-1">ADMIN PANEL</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all ${activeTab === 'products' ? 'bg-gold text-navy font-bold' : 'text-platinum hover:bg-navy'}`}
          >
            <Package className="w-5 h-5" />
            Products
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all ${activeTab === 'categories' ? 'bg-gold text-navy font-bold' : 'text-platinum hover:bg-navy'}`}
          >
            <Layout className="w-5 h-5" />
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('editor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all ${activeTab === 'editor' ? 'bg-gold text-navy font-bold' : 'text-platinum hover:bg-navy'}`}
          >
            <Move className="w-5 h-5" />
            Live Editor
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all ${activeTab === 'settings' ? 'bg-gold text-navy font-bold' : 'text-platinum hover:bg-navy'}`}
          >
            <SettingsIcon className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gold/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-platinum hover:text-gold transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'products' && (
            <motion.div 
              key="products"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-serif">Product Management</h1>
              </div>

              <div className="bg-charcoal p-8 rounded-lg border border-gold/10">
                <h2 className="text-xl font-serif text-gold mb-6">Add New Product</h2>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs text-platinum tracking-widest">PRODUCT NAME</label>
                      <input 
                        type="text" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full bg-navy border border-gold/10 p-3 outline-none focus:border-gold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-platinum tracking-widest">PRICE ($)</label>
                      <input 
                        type="number" 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        className="w-full bg-navy border border-gold/10 p-3 outline-none focus:border-gold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-platinum tracking-widest">CATEGORY</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full bg-navy border border-gold/10 p-3 outline-none focus:border-gold"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <button className="w-full bg-gold text-navy font-bold px-8 py-4 rounded-sm hover:bg-ivory transition-all flex items-center justify-center gap-2 tracking-widest">
                      <Plus className="w-5 h-5" />
                      SAVE PRODUCT
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs text-platinum tracking-widest">PRODUCT IMAGE (LARGE SIZE)</label>
                    <div 
                      onClick={() => productCreateInputRef.current?.click()}
                      className="w-full h-[500px] border-2 border-dashed border-gold/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-all overflow-hidden bg-navy/50 group"
                    >
                      {newProduct.image ? (
                        <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-gold/20 mb-4 group-hover:text-gold/50 transition-colors" />
                          <p className="text-sm text-platinum/50 font-medium">Click to upload product photo</p>
                          <p className="text-[10px] text-platinum/30 mt-2 uppercase tracking-widest">Same size as philosophy section</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={productCreateInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await api.post('/upload', formData);
                          setNewProduct(prev => ({ ...prev, image: res.data.url }));
                        }
                      }}
                    />
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product._id} className="bg-charcoal rounded-lg border border-gold/10 overflow-hidden group relative">
                    <div className="aspect-[3/4] relative overflow-hidden cursor-pointer" onClick={() => {
                      setTargetProductId(product._id);
                      fileInputRef.current?.click();
                    }}>
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-gold w-8 h-8" />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-serif">{product.name}</h3>
                        <button 
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-platinum hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-gold font-bold">${product.price}</p>
                      <p className="text-[10px] text-platinum tracking-widest uppercase mt-2">{product.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl space-y-8"
            >
              <h1 className="text-4xl font-serif">Categories</h1>
              
              <div className="bg-charcoal p-8 rounded-lg border border-gold/10">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="New Category Name"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="flex-1 bg-navy border border-gold/10 p-3 outline-none focus:border-gold"
                  />
                  <button 
                    onClick={handleAddCategory}
                    className="bg-gold text-navy font-bold px-6 py-3 rounded-sm hover:bg-ivory transition-all"
                  >
                    ADD
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {categories.map(cat => (
                  <div key={cat._id} className="bg-charcoal p-4 rounded border border-gold/10 flex items-center justify-between">
                    <span className="text-lg font-serif">{cat.name}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="text-platinum hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'editor' && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-serif">Live Page Editor</h1>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-gold text-navy font-bold px-8 py-3 rounded-sm hover:bg-ivory transition-all flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'SAVING...' : 'SAVE LAYOUT'}
                </button>
              </div>

              <div className="bg-navy border-2 border-dashed border-gold/20 min-h-[800px] relative overflow-hidden rounded-xl">
                {/* Logo Draggable */}
                <Draggable 
                  position={settings.layout['logo-header'] || { x: 0, y: 0 }}
                  onStop={(e, data) => handleDrag('logo-header', data)}
                >
                  <div className="absolute cursor-move z-10 group">
                    <div className="relative p-4 border border-transparent hover:border-gold/50 transition-colors">
                      {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="h-20 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-4xl font-serif font-bold tracking-widest text-gold">MEN31</span>
                      )}
                      <div 
                        className="absolute -top-2 -right-2 bg-gold text-navy p-1 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Edit2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Draggable>

                {/* Hero Text Draggable */}
                <Draggable 
                  position={settings.layout['hero-text'] || { x: 100, y: 300 }}
                  onStop={(e, data) => handleDrag('hero-text', data)}
                >
                  <div className="absolute cursor-move max-w-xl p-6 border border-transparent hover:border-gold/50 transition-colors">
                    <h2 className="text-6xl font-serif leading-tight mb-6">Timeless Menswear.<br/>Refined Presence.</h2>
                    <div className="w-20 h-1 bg-gold"></div>
                  </div>
                </Draggable>

                {/* Hero Image Draggable */}
                <Draggable 
                  position={settings.layout['hero-image'] || { x: 700, y: 100 }}
                  onStop={(e, data) => handleDrag('hero-image', data)}
                >
                  <div className="absolute cursor-move border border-transparent hover:border-gold/50 transition-colors">
                    <img 
                      src="https://images.unsplash.com/photo-1594932224010-75f2a77848f2?auto=format&fit=crop&q=80&w=800" 
                      alt="Hero" 
                      className="w-[400px] aspect-[4/5] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </Draggable>

                <div className="absolute bottom-4 right-4 text-[10px] text-platinum/30 tracking-widest uppercase">
                  Drag elements to reposition them on the live site
                </div>

                {/* Footer Logo Draggable */}
                <Draggable 
                  position={settings.layout['logo-footer'] || { x: 50, y: 700 }}
                  onStop={(e, data) => handleDrag('logo-footer', data)}
                >
                  <div className="absolute cursor-move z-10 group">
                    <div className="relative p-4 border border-transparent hover:border-gold/50 transition-colors bg-charcoal/50">
                      {settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="h-12 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-2xl font-serif font-bold tracking-widest text-gold">MEN31</span>
                      )}
                      <div 
                        className="absolute -top-2 -right-2 bg-gold text-navy p-1 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Edit2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Draggable>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-serif">Global Settings</h1>
                <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="bg-gold text-navy font-bold px-8 py-3 rounded-sm hover:bg-ivory transition-all flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'SAVING...' : 'SAVE SETTINGS'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-charcoal p-8 rounded-lg border border-gold/10 space-y-6">
                  <h2 className="text-xl font-serif text-gold flex items-center gap-2">
                    <Facebook className="w-5 h-5" /> Social Media
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-platinum tracking-widest mb-2 block uppercase">Facebook URL</label>
                      <input 
                        type="text" 
                        value={settings.facebook}
                        onChange={e => setSettings({...settings, facebook: e.target.value})}
                        className="w-full bg-navy border border-gold/10 p-3 outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-platinum tracking-widest mb-2 block uppercase">Instagram URL</label>
                      <input 
                        type="text" 
                        value={settings.instagram}
                        onChange={e => setSettings({...settings, instagram: e.target.value})}
                        className="w-full bg-navy border border-gold/10 p-3 outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-platinum tracking-widest mb-2 block uppercase">WhatsApp Number</label>
                      <input 
                        type="text" 
                        value={settings.whatsapp}
                        onChange={e => setSettings({...settings, whatsapp: e.target.value})}
                        className="w-full bg-navy border border-gold/10 p-3 outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-charcoal p-8 rounded-lg border border-gold/10 space-y-6">
                  <h2 className="text-xl font-serif text-gold flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Location
                  </h2>
                  <div>
                    <label className="text-xs text-platinum tracking-widest mb-2 block uppercase">Google Maps Embed URL</label>
                    <textarea 
                      value={settings.googleMaps}
                      onChange={e => setSettings({...settings, googleMaps: e.target.value})}
                      className="w-full bg-navy border border-gold/10 p-3 outline-none focus:border-gold h-32 resize-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleUpdateProductImage}
      />
      <input 
        type="file" 
        ref={logoInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleUpdateLogo}
      />
    </div>
  );
}
