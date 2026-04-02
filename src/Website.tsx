import React, { useState, useEffect } from 'react';
import { Search, Facebook, Instagram, Phone as WhatsApp, Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

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

const translations = {
  en: {
    home: "HOME",
    collection: "COLLECTION",
    about: "ABOUT",
    contact: "CONTACT",
    admin: "ADMIN LOGIN",
    heroTitle: "Timeless Menswear. Refined Presence.",
    discover: "DISCOVER THE COLLECTION",
    newTitle: "The Spring 2026 Collection",
    newDesc: "Experience the perfect blend of traditional tailoring and contemporary design.",
    viewColl: "VIEW COLLECTION",
    philTitle: "Our Philosophy",
    philDesc: "At MEN31, we believe that true elegance is found in the details. Every stitch, every fabric choice, and every silhouette is a testament to our commitment to excellence.",
    gridTitle: "Crafted for the Modern Gentleman",
    all: "ALL",
    noProducts: "No products found in this category.",
    quickLinks: "Quick Links",
    contactInfo: "Contact Info",
    followUs: "Follow Us",
    rights: "ALL RIGHTS RESERVED.",
    address: "MAGASIN 2, RESIDENCE SALIMA 2, MAHAJ SALA LJADIDA, Av. Moulay Rachid, Sala Al Jadida 11100"
  },
  fr: {
    home: "ACCUEIL",
    collection: "COLLECTION",
    about: "À PROPOS",
    contact: "CONTACT",
    admin: "CONNEXION ADMIN",
    heroTitle: "Mode Intemporelle. Présence Raffinée.",
    discover: "DÉCOUVRIR LA COLLECTION",
    newTitle: "La Collection Printemps 2026",
    newDesc: "Découvrez le mélange parfait de couture traditionnelle et de design contemporain.",
    viewColl: "VOIR LA COLLECTION",
    philTitle: "Notre Philosophie",
    philDesc: "Chez MEN31, nous croyons que la vraie élégance se trouve dans les détails. Chaque point, chaque choix de tissu est un témoignage de notre engagement.",
    gridTitle: "Conçu pour le Gentleman Moderne",
    all: "TOUT",
    noProducts: "Aucun produit trouvé dans cette catégorie.",
    quickLinks: "Liens Rapides",
    contactInfo: "Infos Contact",
    followUs: "Suivez-nous",
    rights: "TOUS DROITS RÉSERVÉS.",
    address: "MAGASIN 2, RESIDENCE SALIMA 2, MAHAJ SALA LJADIDA, Av. Moulay Rachid, Sala Al Jadida 11100"
  },
  ar: {
    home: "الرئيسية",
    collection: "المجموعة",
    about: "من نحن",
    contact: "اتصل بنا",
    admin: "دخول المشرف",
    heroTitle: "ملابس رجالية خالدة. حضور راقٍ.",
    discover: "اكتشف المجموعة",
    newTitle: "مجموعة ربيع 2026",
    newDesc: "جرب المزيج المثالي بين الخياطة التقليدية والتصميم المعاصر.",
    viewColl: "عرض المجموعة",
    philTitle: "فلسفتنا",
    philDesc: "في MEN31، نؤمن بأن الأناقة الحقيقية تكمن في التفاصيل. كل غرزة وكل خيار للقماش هو شهادة على التزامنا بالتميز.",
    gridTitle: "صممت للرجل العصري",
    all: "الكل",
    noProducts: "لم يتم العثور على منتجات في هذه الفئة.",
    quickLinks: "روابط سريعة",
    contactInfo: "معلومات الاتصال",
    followUs: "تابعنا",
    rights: "جميع الحقوق محفوظة.",
    address: "محل 2، إقامة سليمة 2، محج سلا الجديدة، شارع مولاي رشيد، سلا الجديدة 11100"
  }
};

export default function Website() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [lang, setLang] = useState<'en' | 'fr' | 'ar'>('en');

  const t = translations[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    // Real-time settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as Settings);
      } else {
        // Default settings with provided links
        const defaultSettings: Settings = {
          logo: "",
          facebook: "https://web.facebook.com/watch/?v=1505439947901151",
          instagram: "https://www.instagram.com/c8__men.s_wear__?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
          whatsapp: "0661260954",
          googleMaps: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3307.347743516068!2d-6.745678!3d33.983456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzPCsDU5JzAwLjQiTiA2wrA0NCc0NC40Ilc!5e0!3m2!1sen!2sma!4v1620000000000!5m2!1sen!2sma",
          layout: {}
        };
        setSettings(defaultSettings);
        // Initialize Firestore with these defaults if they don't exist
        setDoc(doc(db, 'settings', 'global'), defaultSettings);
      }
    });

    // Real-time products
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    });

    // Real-time categories
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() } as Category));
      setCategories(cats);
    });

    return () => {
      unsubSettings();
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const getPos = (id: string) => {
    if (!settings?.layout?.[id]) return {};
    const { x, y } = settings.layout[id];
    return { transform: `translate(${x}px, ${y}px)` };
  };

  if (!settings) return <div className="h-screen flex items-center justify-center bg-navy text-ivory">Loading MEN31...</div>;

  return (
    <div className={`min-h-screen flex flex-col ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className="bg-navy text-ivory py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4" style={getPos('logo-header')}>
          {settings.logo ? (
            <img src={settings.logo} alt="MEN31" className="h-10 object-contain" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-2xl font-serif font-bold tracking-widest text-gold">MEN31</span>
          )}
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-widest">
          <div className="flex items-center gap-2 border-r border-gold/20 pr-4 mr-4">
            <button onClick={() => setLang('en')} className={`text-[10px] ${lang === 'en' ? 'text-gold' : 'text-platinum'}`}>EN</button>
            <button onClick={() => setLang('fr')} className={`text-[10px] ${lang === 'fr' ? 'text-gold' : 'text-platinum'}`}>FR</button>
            <button onClick={() => setLang('ar')} className={`text-[10px] ${lang === 'ar' ? 'text-gold' : 'text-platinum'}`}>AR</button>
          </div>
          <a href="#" className="hover:text-gold transition-colors">{t.home}</a>
          <a href="#collection" className="hover:text-gold transition-colors">{t.collection}</a>
          <a href="#about" className="hover:text-gold transition-colors">{t.about}</a>
          <a href="#contact" className="hover:text-gold transition-colors">{t.contact}</a>
          <a href="/admin" className="bg-gold text-navy px-4 py-1 rounded-sm text-xs font-bold hover:bg-ivory transition-colors">{t.admin}</a>
          <Search className="w-5 h-5 cursor-pointer hover:text-gold transition-colors" />
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-navy text-ivory flex flex-col items-center justify-center gap-8 text-xl font-serif">
          <a href="#" onClick={() => setIsMenuOpen(false)}>HOME</a>
          <a href="#collection" onClick={() => setIsMenuOpen(false)}>COLLECTION</a>
          <a href="#about" onClick={() => setIsMenuOpen(false)}>ABOUT</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)}>CONTACT</a>
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6"><X /></button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col md:flex-row bg-ivory overflow-hidden">
        <div className={`flex-1 flex flex-col justify-center px-6 md:px-24 py-12 z-10 ${isRtl ? 'text-right' : 'text-left'}`}>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif text-navy leading-tight mb-8"
            style={getPos('hero-text')}
          >
            {t.heroTitle}
          </motion.h1>
          <motion.button 
            onClick={() => {
              setShowProducts(true);
              setTimeout(() => {
                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-navy text-ivory px-8 py-4 w-fit tracking-widest text-sm hover:bg-gold transition-all duration-300 inline-block"
          >
            {t.discover}
          </motion.button>
        </div>
        <div className="flex-1 relative h-full">
          <img 
            src="https://images.unsplash.com/photo-1594932224010-75f2a77848f2?auto=format&fit=crop&q=80&w=1000" 
            alt="Luxury Suit" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            style={getPos('hero-image')}
          />
        </div>
      </section>

      {/* New Collection Section */}
      <section id="collection" className="py-24 px-6 md:px-24 flex flex-col md:flex-row items-center gap-12 bg-platinum/20">
        <div className={`flex-1 space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h2 className="text-4xl font-serif text-navy">{t.newTitle}</h2>
          <p className="text-charcoal/70 leading-relaxed max-w-md">
            {t.newDesc}
          </p>
          <button className={`flex items-center gap-2 text-gold font-medium tracking-widest hover:gap-4 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}>
            {t.viewColl} <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="flex-1">
          <img 
            src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=800" 
            alt="New Collection" 
            className="w-full h-[500px] object-cover shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="about" className="py-24 px-6 md:px-24 flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="flex-1">
          <img 
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800" 
            alt="Philosophy" 
            className="w-full h-[500px] object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className={`flex-1 space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h2 className="text-4xl font-serif text-navy">{t.philTitle}</h2>
          <p className="text-charcoal/70 leading-relaxed">
            {t.philDesc}
          </p>
        </div>
      </section>

      {/* Product Grid Section */}
      <AnimatePresence>
        {showProducts && (
          <motion.section 
            id="products" 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="py-24 px-6 md:px-24 bg-navy text-ivory overflow-hidden"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif mb-4">{t.gridTitle}</h2>
              <div className="w-24 h-1 bg-gold mx-auto mb-8"></div>
              
              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className={`px-6 py-2 rounded-full border border-gold/30 text-sm tracking-widest transition-all ${selectedCategory === 'All' ? 'bg-gold text-navy' : 'hover:border-gold'}`}
                >
                  {t.all}
                </button>
                {Array.isArray(categories) && categories.map(cat => (
                  <button 
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-6 py-2 rounded-full border border-gold/30 text-sm tracking-widest transition-all ${selectedCategory === cat.name ? 'bg-gold text-navy' : 'hover:border-gold'}`}
                  >
                    {cat.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                <motion.div 
                  key={product._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                >
                  <div className="relative overflow-hidden aspect-[3/4] mb-4">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <h3 className="text-xl font-serif mb-1">{product.name}</h3>
                  <p className="text-gold font-medium">${product.price}</p>
                  <p className="text-xs text-platinum/50 mt-1 uppercase tracking-widest">{product.category}</p>
                </motion.div>
              ))}
              {(!Array.isArray(filteredProducts) || filteredProducts.length === 0) && (
                <div className="col-span-full text-center py-20 text-platinum/50 font-serif italic">
                  {t.noProducts}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer id="contact" className="bg-charcoal text-platinum py-16 px-6 md:px-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className={`space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
            {settings.logo ? (
              <img src={settings.logo} alt="MEN31" className="h-10 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-2xl font-serif font-bold tracking-widest text-gold">MEN31</span>
            )}
            <p className="text-sm leading-relaxed">
              Elevating menswear through timeless design and impeccable craftsmanship since 2026.
            </p>
            <a href="/admin" className="text-xs text-platinum/50 hover:text-gold transition-colors block">{t.admin}</a>
          </div>
          
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h4 className="text-ivory font-serif text-lg mb-6">{t.quickLinks}</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-gold transition-colors">{t.home}</a></li>
              <li><a href="#collection" className="hover:text-gold transition-colors">{t.collection}</a></li>
              <li><a href="#about" className="hover:text-gold transition-colors">{t.about}</a></li>
              <li><a href="#contact" className="hover:text-gold transition-colors">{t.contact}</a></li>
            </ul>
          </div>

          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h4 className="text-ivory font-serif text-lg mb-6">{t.contactInfo}</h4>
            <ul className="space-y-4 text-sm">
              <li>{t.address}</li>
              <li>{settings.whatsapp}</li>
              <li>contact@men31.com</li>
            </ul>
          </div>

          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h4 className="text-ivory font-serif text-lg mb-6">{t.followUs}</h4>
            <div className={`flex gap-4 ${isRtl ? 'justify-end' : ''}`}>
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-navy rounded-full hover:bg-gold transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-navy rounded-full hover:bg-gold transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href={`https://wa.me/${settings.whatsapp.replace(/\s/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-navy rounded-full hover:bg-gold transition-colors"><WhatsApp className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        {settings.googleMaps && (
          <div className="w-full h-64 rounded-lg overflow-hidden mb-12 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
            <iframe 
              src={settings.googleMaps} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        )}

        <div className="border-t border-platinum/10 pt-8 text-center text-xs tracking-widest">
          © 2026 MEN31 LUXURY MENSWEAR. {t.rights}
        </div>
      </footer>
    </div>
  );
}
