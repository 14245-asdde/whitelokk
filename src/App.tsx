import React, { useState, useEffect } from 'react';
import { Copy, Check, Shield, Package, Edit, Trash2, Plus, X, ShoppingCart, Trash, CheckCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_JpN-P2eMCSRmC62Tz8HalDYZ93R73JA",
  authDomain: "traxer-c2bdd.firebaseapp.com",
  databaseURL: "https://traxer-c2bdd-default-rtdb.firebaseio.com",
  projectId: "traxer-c2bdd",
  storageBucket: "traxer-c2bdd.firebasestorage.app",
  messagingSenderId: "331053358947",
  appId: "1:331053358947:web:78a6fd295c1110e705fd56",
  measurementId: "G-6172FEV9C9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  command: string; // Команда для выполнения (напр: lp user %player% parent add vip)
}

interface Order {
  id: string;
  nickname: string;
  items: string[];
  totalPrice: number;
  status: 'pending' | 'approved';
  createdAt: number;
  orderCode: string;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [nickname, setNickname] = useState('');
  
  const [isCopied, setIsCopied] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastOrderCode, setLastOrderCode] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState<'products' | 'orders' | 'settings'>('products');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    description: '',
    imageUrl: '',
    command: ''
  });

  const [pluginSettings, setPluginSettings] = useState({
    url: '', // Напр: http://твой-айпи:8080/execute
    token: '' // Секретный ключ из конфига плагина
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('ea_plugin_settings');
    if (savedSettings) setPluginSettings(JSON.parse(savedSettings));
  }, []);

  const saveSettings = (settings: typeof pluginSettings) => {
    setPluginSettings(settings);
    localStorage.setItem('ea_plugin_settings', JSON.stringify(settings));
  };

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });

    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });

    return () => { unsubProducts(); unsubOrders(); };
  }, []);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalCartPrice = cart.reduce((sum, item) => {
    const priceValue = typeof item.price === 'string' ? parseFloat((item.price as string).replace(/[^\d.]/g, '')) : item.price;
    return sum + (Number(priceValue) || 0);
  }, 0);

  const generateOrderCode = () => {
    const parts = [
      Math.random().toString(36).substring(2, 6).toUpperCase(),
      Math.random().toString(36).substring(2, 6).toUpperCase(),
      Math.random().toString(36).substring(2, 6).toUpperCase()
    ];
    return `EA-${parts.join('-')}`;
  };

  const createOrder = async () => {
    if (!nickname.trim()) return alert('Введите ваш никнейм!');
    if (cart.length === 0) return alert('Корзина пуста!');

    const orderCode = generateOrderCode();
    const orderData = {
      nickname,
      items: cart.map(i => i.name),
      totalPrice: totalCartPrice,
      status: 'pending',
      createdAt: Date.now(),
      orderCode: orderCode
    };

    await addDoc(collection(db, 'orders'), orderData);
    setLastOrderCode(orderCode);
    setCart([]);
    setNickname('');
    setIsCartOpen(false);
  };

  const handleCopyIP = (e: React.MouseEvent<HTMLButtonElement>) => {
    const span = e.currentTarget.querySelector('.server-ip');
    const textToCopy = span?.textContent?.trim() || 'easyanarchy.ru';
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const updateProduct = async (id: string, updatedData: Partial<Product>) => {
    const { id: _, ...data } = updatedData as any;
    await updateDoc(doc(db, 'products', id), data);
    setEditingProduct(null);
  };

  const addProduct = async () => {
    await addDoc(collection(db, 'products'), newProduct);
    setIsAddingNew(false);
    setNewProduct({ name: '', price: 0, description: '', imageUrl: '', command: '' });
  };

  const approveOrder = async (order: Order) => {
    const orderProducts = products.filter(p => order.items.includes(p.name));
    
    let success = true;
    if (pluginSettings.url) {
      for (const product of orderProducts) {
        if (product.command) {
          const command = product.command.replace('%player%', order.nickname);
          try {
            await fetch(pluginSettings.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: pluginSettings.token,
                command: command
              })
            });
          } catch (e) {
            success = false;
            console.error('Plugin Error:', e);
          }
        }
      }
    }

    await updateDoc(doc(db, 'orders', order.id), { status: 'approved' });
    if (success) {
      alert(`Заказ для ${order.nickname} одобрен и товары выданы через плагин!`);
    } else {
      alert(`Заказ одобрен в базе, но плагин не смог выдать товар. Проверьте соединение.`);
    }
  };

  const deleteOrder = async (id: string) => {
    if (confirm('Удалить этот заказ?')) {
      await deleteDoc(doc(db, 'orders', id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 font-sans selection:bg-red-600/30">
      {/* Навигация */}
      <nav className="border-b border-zinc-800 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-black text-xl">E</div>
            <span className="font-black text-2xl tracking-tighter">EASY ANARCHY</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wider text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Главная</a>
            <a href="#store" className="hover:text-white transition-colors">Магазин</a>
            <a href="https://t.me/ebatelmamok100_7" className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-2">Поддержка <ExternalLink className="w-3 h-3"/></a>
          </div>

          <div className="flex items-center gap-4">
             <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all active:scale-95 group">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-[#121212]">
                    {cart.length}
                  </span>
                )}
             </button>
             <button onClick={handleCopyIP} className="hidden sm:flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95">
                <span className="server-ip">easyanarchy.ru</span>
                {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
             </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-red-600/5 blur-[120px] rounded-full -top-1/2 left-1/2 -translate-x-1/2 w-full h-full" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight uppercase leading-none">EASY ANARCHY</h1>
          <p className="text-red-500 font-black text-xl mb-12 tracking-[0.4em] uppercase">Survival Anarchy • 1.16.5</p>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#store" className="bg-red-600 hover:bg-red-500 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-red-600/20 transition-all active:scale-95">КУПИТЬ ДОНАТ</a>
            <button onClick={handleCopyIP} className="bg-white/5 hover:bg-white/10 border border-white/10 px-12 py-5 rounded-2xl font-black text-xl transition-all active:scale-95 uppercase tracking-tighter">easyanarchy.ru</button>
          </div>
        </div>
      </section>

      <main id="store" className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-black mb-12 flex items-center gap-4 uppercase tracking-tighter">
            <Package className="text-red-600 w-10 h-10" /> Магазин товаров
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map(p => (
              <div key={p.id} className="bg-[#141414] border border-zinc-800 rounded-3xl overflow-hidden group hover:border-red-600/50 transition-all flex flex-col shadow-2xl">
                <div className="h-56 relative overflow-hidden">
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                  <div className="absolute top-5 right-5 bg-black/80 backdrop-blur-xl px-4 py-2 rounded-xl font-mono font-black text-red-500 border border-white/5 text-lg">
                    {Number(p.price).toLocaleString()} ₽
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">{p.name}</h3>
                  <p className="text-zinc-500 text-sm mb-8 flex-grow leading-relaxed">{p.description}</p>
                  <button onClick={() => addToCart(p)} className="w-full bg-zinc-800 hover:bg-red-600 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-wider text-sm">
                    <ShoppingCart className="w-5 h-5" /> В корзину
                  </button>
                </div>
              </div>
            ))}
          </div>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-zinc-900 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center font-black text-3xl mx-auto mb-10 text-zinc-700 font-mono">EA</div>
          <p className="text-zinc-600 text-sm mb-12 max-w-md mx-auto leading-relaxed">EasyAnarchy.ru — твой лучший опыт анархии на версии 1.16.5. Присоединяйся к нашему сообществу прямо сейчас.</p>
          
          <div className="pt-10 border-t border-zinc-900/50">
            <button 
              onClick={() => setIsAdminOpen(true)} 
              className="text-zinc-800 hover:text-zinc-500 transition-all font-mono text-[10px] uppercase tracking-[0.4em]"
            >
              [ Панель управления ]
            </button>
          </div>
        </div>
      </footer>

      {/* Модалка корзины */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#121212] border border-zinc-800 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                  <ShoppingCart className="text-red-600 w-8 h-8" /> Ваша корзина
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all"><X /></button>
              </div>
              
              <div className="p-10">
                <div className="space-y-4 mb-10 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl group">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-800 flex-shrink-0">
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-black text-lg uppercase tracking-tight">{item.name}</div>
                          <div className="text-red-500 font-mono font-bold">{item.price.toLocaleString()} ₽</div>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(idx)} className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                       <ShoppingCart className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                       <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">В корзине пусто</p>
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <div>
                        <label className="text-[10px] uppercase font-black text-zinc-500 block mb-3 tracking-[0.2em] ml-2">Ваш игровой никнейм</label>
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Steve" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 transition-all font-black text-lg" />
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex justify-between items-center">
                        <span className="text-zinc-500 text-xs font-black uppercase">Итого</span>
                        <span className="text-3xl font-black">{totalCartPrice.toLocaleString()} ₽</span>
                      </div>
                    </div>
                    <button onClick={createOrder} className="w-full bg-red-600 hover:bg-red-500 py-6 rounded-[2rem] font-black text-xl transition-all active:scale-95 shadow-2xl shadow-red-600/20 uppercase tracking-widest">
                      Оплатить и получить код
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Экран успеха заказа */}
      <AnimatePresence>
        {lastOrderCode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-[#121212] border border-zinc-800 p-12 rounded-[3.5rem] w-full max-w-lg text-center shadow-2xl">
                <div className="w-24 h-24 bg-green-600/10 border-4 border-green-600 rounded-full flex items-center justify-center mx-auto mb-10">
                   <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-4xl font-black mb-4 uppercase tracking-tighter">Заказ создан!</h3>
                <p className="text-zinc-500 mb-10 leading-relaxed">Скопируйте ваш уникальный код и предоставьте его администратору для получения товара.</p>
                
                <div className="bg-black/50 border border-zinc-800 p-8 rounded-[2rem] mb-10 relative group">
                   <div className="text-[10px] uppercase font-black text-zinc-600 mb-4 tracking-[0.3em]">Ваш уникальный код</div>
                   <div className="text-3xl font-mono font-black text-white tracking-widest">{lastOrderCode}</div>
                   <button 
                    onClick={() => {
                      navigator.clipboard.writeText(lastOrderCode);
                      alert('Код скопирован!');
                    }}
                    className="mt-6 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl mx-auto font-black text-xs transition-all active:scale-95"
                   >
                     <Copy className="w-4 h-4" /> СКОПИРОВАТЬ КОД
                   </button>
                </div>

                <button onClick={() => setLastOrderCode(null)} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95">
                  Закрыть окно
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Админка */}
      <AnimatePresence>
        {isAdminOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-6xl">
              {!isLoggedIn ? (
                <div className="max-w-md mx-auto bg-[#141414] border border-zinc-800 p-12 rounded-[3rem] relative shadow-2xl">
                  <button onClick={() => setIsAdminOpen(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white"><X /></button>
                  <h2 className="text-3xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase"><Shield className="text-red-600" /> Админ-центр</h2>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (username === 'admin' && password === '135135135') {
                      setIsLoggedIn(true);
                      setUsername('');
                      setPassword('');
                    } else alert('Неверно!');
                  }} className="space-y-6">
                    <input type="text" placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 font-bold" />
                    <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 font-bold" />
                    <button className="w-full bg-red-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-600/20 text-sm">Авторизация</button>
                  </form>
                </div>
              ) : (
                <div className="bg-[#121212] border border-zinc-800 rounded-[3rem] h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                  <header className="p-10 border-b border-zinc-800 flex flex-wrap justify-between items-center gap-8 bg-zinc-900/50">
                    <div>
                       <h2 className="text-3xl font-black flex items-center gap-4 tracking-tight uppercase"><Shield className="text-red-600" /> Консоль</h2>
                       <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Сервер: easyanarchy.ru</p>
                    </div>
                    <div className="flex bg-black/50 p-2 rounded-2xl border border-zinc-800">
                      <button onClick={() => setAdminTab('products')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${adminTab === 'products' ? 'bg-red-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>Товары</button>
                      <button onClick={() => setAdminTab('orders')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest relative ${adminTab === 'orders' ? 'bg-red-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        Заказы
                        {orders.filter(o => o.status === 'pending').length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full animate-pulse border-4 border-[#121212]" />}
                      </button>
                      <button onClick={() => setAdminTab('settings')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${adminTab === 'settings' ? 'bg-red-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>Настройки</button>
                    </div>
                    <div className="flex gap-4">
                      {adminTab === 'products' && (
                        <button onClick={() => setIsAddingNew(true)} className="bg-white text-black px-8 py-3 rounded-xl font-black text-xs hover:bg-zinc-200 transition-all flex items-center gap-3 uppercase tracking-widest"><Plus className="w-4 h-4" /> Добавить</button>
                      )}
                      <button onClick={() => setIsLoggedIn(false)} className="text-zinc-600 hover:text-white font-black text-[10px] uppercase tracking-widest px-4">Выйти</button>
                      <button onClick={() => setIsAdminOpen(false)} className="p-3 bg-zinc-800 rounded-2xl hover:text-red-500 transition-all"><X /></button>
                    </div>
                  </header>

                  <div className="flex-grow overflow-y-auto p-10 custom-scrollbar bg-black/20">
                    {adminTab === 'products' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {products.map(p => (
                          <div key={p.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem] flex items-center gap-6 group hover:border-zinc-700 transition-all shadow-xl">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-zinc-800 flex-shrink-0">
                               <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-black text-xl uppercase tracking-tight leading-tight mb-1">{p.name}</h4>
                              <p className="text-red-500 font-mono font-black text-lg">{Number(p.price).toLocaleString()} ₽</p>
                              {p.command && <p className="text-[9px] text-zinc-600 font-mono mt-1 truncate max-w-[150px]">{p.command}</p>}
                            </div>
                            <div className="flex flex-col gap-2">
                               <button onClick={() => setEditingProduct(p)} className="p-3 bg-zinc-800 text-zinc-500 hover:text-blue-500 rounded-xl transition-all"><Edit className="w-5 h-5" /></button>
                               <button onClick={() => { if(confirm('Удалить товар?')) deleteDoc(doc(db, 'products', p.id)) }} className="p-3 bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : adminTab === 'settings' ? (
                      <div className="max-w-2xl mx-auto bg-black/40 border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl">
                         <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter">Настройки плагина выдачи</h3>
                         <div className="space-y-6">
                            <div>
                               <label className="text-[10px] uppercase font-black text-zinc-500 block mb-3 tracking-widest ml-1">API URL Плагина</label>
                               <input type="text" value={pluginSettings.url} onChange={(e) => setPluginSettings({...pluginSettings, url: e.target.value})} placeholder="http://айпи-сервера:8080/execute" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 font-mono text-sm" />
                               <p className="text-[9px] text-zinc-600 mt-2 leading-relaxed">Укажите адрес, по которому доступен ваш Minecraft плагин.</p>
                            </div>
                            <div>
                               <label className="text-[10px] uppercase font-black text-zinc-500 block mb-3 tracking-widest ml-1">Секретный токен (API Key)</label>
                               <input type="password" value={pluginSettings.token} onChange={(e) => setPluginSettings({...pluginSettings, token: e.target.value})} placeholder="Ваш токен из конфига плагина" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 font-bold" />
                            </div>
                            <button onClick={() => {
                               saveSettings(pluginSettings);
                               alert('Настройки плагина сохранены!');
                            }} className="w-full bg-red-600 hover:bg-red-500 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-2xl shadow-red-600/20 mt-4">Сохранить настройки</button>
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-6 max-w-5xl mx-auto">
                        {orders.map(o => (
                          <div key={o.id} className={`bg-zinc-900/40 border-l-4 ${o.status === 'pending' ? 'border-l-red-600' : 'border-l-green-600'} border-y border-r border-zinc-800 p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-10 shadow-2xl`}>
                            <div className="flex-grow">
                               <div className="flex items-center gap-4 mb-5">
                                  <span className="bg-white text-black px-4 py-1.5 rounded-xl font-black text-sm uppercase tracking-tighter">{o.nickname}</span>
                                  <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.2em] ${o.status === 'pending' ? 'bg-red-600/10 text-red-500' : 'bg-green-600/10 text-green-500'}`}>
                                    {o.status === 'pending' ? 'В обработке' : 'Выдано'}
                                  </span>
                               </div>
                               <div className="space-y-2">
                                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Код заказа: <span className="text-zinc-100 font-mono text-sm ml-2">{o.orderCode}</span></p>
                                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Состав: <span className="text-red-500 ml-2">{o.items.join(' + ')}</span></p>
                               </div>
                            </div>
                            <div className="flex items-center gap-10 flex-shrink-0">
                               <div className="text-right">
                                  <p className="text-zinc-600 text-[9px] font-black uppercase mb-1 tracking-widest">К оплате</p>
                                  <p className="text-3xl font-black text-white">{Number(o.totalPrice).toLocaleString()} ₽</p>
                               </div>
                               <div className="flex gap-3">
                                  {o.status === 'pending' && (
                                    <button onClick={() => approveOrder(o)} className="p-5 bg-green-600 hover:bg-green-500 text-white rounded-2xl transition-all shadow-xl shadow-green-600/20"><CheckCircle className="w-6 h-6" /></button>
                                  )}
                                  <button onClick={() => deleteOrder(o.id)} className="p-5 bg-zinc-800 hover:bg-red-600 text-zinc-500 hover:text-white rounded-2xl transition-all"><Trash className="w-6 h-6" /></button>
                               </div>
                            </div>
                          </div>
                        ))}
                        {orders.length === 0 && <div className="text-center py-32 text-zinc-800 font-black uppercase tracking-[0.5em] text-sm">Журнал заказов пуст</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалки товаров */}
      <AnimatePresence>
        {(editingProduct || isAddingNew) && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-[#141414] border border-zinc-800 p-12 rounded-[3.5rem] w-full max-w-xl shadow-2xl">
                <h3 className="text-3xl font-black mb-10 uppercase tracking-tighter">{isAddingNew ? 'Создание товара' : 'Правка товара'}</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <input type="text" placeholder="Название" value={isAddingNew ? newProduct.name : editingProduct?.name} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, name: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, name: e.target.value} : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 font-black" />
                    <div className="relative">
                      <input type="text" placeholder="Цена" value={isAddingNew ? newProduct.price : editingProduct?.price} onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        const numVal = Number(val);
                        isAddingNew ? setNewProduct({...newProduct, price: numVal}) : setEditingProduct(editingProduct ? {...editingProduct, price: numVal} : null)
                      }} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 font-mono font-black text-red-500 pr-12 text-lg" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 font-black text-xl">₽</span>
                    </div>
                  </div>
                  <input type="text" placeholder="Ссылка на фото (Direct Link)" value={isAddingNew ? newProduct.imageUrl : editingProduct?.imageUrl} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, imageUrl: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, imageUrl: e.target.value} : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 text-sm font-mono" />
                  <textarea placeholder="Краткое описание бонусов" value={isAddingNew ? newProduct.description : editingProduct?.description} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, description: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, description: e.target.value} : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 outline-none focus:border-red-600 h-32 resize-none text-sm leading-relaxed" />
                  <div>
                    <label className="text-[10px] uppercase font-black text-zinc-500 block mb-2 tracking-widest ml-2">Команда для выдачи (%player% - ник)</label>
                    <input type="text" placeholder="lp user %player% parent set vip" value={isAddingNew ? newProduct.command : editingProduct?.command} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, command: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, command: e.target.value} : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 outline-none focus:border-red-600 font-mono text-xs" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button onClick={() => { if(isAddingNew) addProduct(); else if(editingProduct) updateProduct(editingProduct.id, editingProduct); }} className="flex-[2] bg-red-600 hover:bg-red-500 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-red-600/20">Сохранить</button>
                    <button onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="flex-1 bg-zinc-800 py-5 rounded-[2rem] font-black uppercase tracking-widest transition-all active:scale-95 text-xs text-zinc-400">Отмена</button>
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f23; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
