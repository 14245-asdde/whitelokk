import React, { useState, useEffect } from 'react';
import { Copy, Check, Shield, Package, Edit, Trash2, Plus, X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Конфигурация Firebase пользователя
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

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUrl: string;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: '',
    description: '',
    imageUrl: ''
  });

  // Загрузка данных из Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(items);
    }, (error) => {
      console.error("Ошибка Firestore:", error);
      alert("Ошибка доступа к базе данных. Проверьте правила (Rules) в консоли Firebase.");
    });

    return () => unsub();
  }, []);

  const handleCopyIP = (e: React.MouseEvent<HTMLButtonElement>) => {
    const span = e.currentTarget.querySelector('.server-ip');
    const textToCopy = span?.textContent?.trim() || 'PLAY.EASYANARCHY.RU';
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '135135135') {
      setIsLoggedIn(true);
      setUsername('');
      setPassword('');
    } else {
      alert('Неверный логин или пароль!');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    if (db) {
      await deleteDoc(doc(db, 'products', id));
    } else {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem('ea_products', JSON.stringify(updated));
    }
  };

  const updateProduct = async (id: string, updatedData: Partial<Product>) => {
    if (db) {
      const { id: _, ...data } = updatedData as any;
      await updateDoc(doc(db, 'products', id), data);
    } else {
      const updated = products.map(p => p.id === id ? { ...p, ...updatedData } : p);
      setProducts(updated);
      localStorage.setItem('ea_products', JSON.stringify(updated));
    }
    setEditingProduct(null);
  };

  const addProduct = async () => {
    if (db) {
      await addDoc(collection(db, 'products'), newProduct);
    } else {
      const id = Date.now().toString();
      const updated = [...products, { ...newProduct, id }];
      setProducts(updated);
      localStorage.setItem('ea_products', JSON.stringify(updated));
    }
    setIsAddingNew(false);
    setNewProduct({ name: '', price: '', description: '', imageUrl: '' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <header className="relative z-10 pt-20 pb-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            EASY ANARCHY
          </h1>
          <p className="text-xl text-gray-400 mb-8 uppercase tracking-widest font-semibold">
            Survival Anarchy • 1.16.5
          </p>

          <button
            onClick={handleCopyIP}
            className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition-all active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 server-ip">PLAY.EASYANARCHY.RU</span>
            <div className="relative z-10">
              {isCopied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6" />}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white transition-opacity group-hover:opacity-90" />
          </button>

          <div className="mt-12 flex items-center justify-center gap-6 text-sm font-bold uppercase tracking-widest text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Сервер онлайн</span>
            </div>
            <span>•</span>
            <div>Игроков: 124</div>
          </div>
        </motion.div>
      </header>

      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="space-y-2">
            <h3 className="text-red-500 font-bold uppercase tracking-tighter text-xl">Честная игра</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Никаких читов, ломающих игру. Чистая анархия с минимальными ограничениями.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-red-500 font-bold uppercase tracking-tighter text-xl">Vanilla Plus</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Классический опыт 1.16.5 с доработанными плагинами для атмосферы.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-red-500 font-bold uppercase tracking-tighter text-xl">Сообщество</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Присоединяйся к сотням игроков. Создавай кланы или выживай в одиночку.</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-4 pb-32">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold flex items-center gap-2 uppercase tracking-tighter">
            <Package className="text-red-500" /> Товары и привилегии
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-zinc-700 transition-all flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{product.name}</h3>
                  <span className="text-red-500 font-mono font-bold">{product.price}</span>
                </div>
                <p className="text-gray-400 text-sm mb-6 flex-grow">{product.description}</p>
                <a href="https://t.me/ebatelmamok100_7" target="_blank" rel="noopener noreferrer" className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-semibold transition-colors text-center block">
                  Купить
                </a>
              </div>
            </div>
          ))}
          {products.length === 0 && (
             <div className="col-span-full text-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl">
               <Package className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
               <p className="text-zinc-500">Товары скоро появятся...</p>
             </div>
          )}
        </div>
      </section>

      <footer className="relative z-10 pt-20 pb-10 text-center">
        <div className="max-w-7xl mx-auto px-4 border-t border-zinc-900 pt-10">
          <p className="text-zinc-600 text-xs mb-8">© 2024 Easy Anarchy. Все права защищены. Не является официальным продуктом Minecraft.</p>
          <button onClick={() => setIsAdminOpen(true)} className="text-zinc-900 hover:text-zinc-800 transition-colors text-[10px] font-mono uppercase tracking-[0.3em] cursor-default">
            admin
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {isAdminOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl">
              {!isLoggedIn ? (
                <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative shadow-2xl">
                  <button onClick={() => setIsAdminOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X /></button>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Shield className="text-red-500" /> Вход в панель</h2>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Логин</label>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none focus:border-red-500 transition-colors" placeholder="admin" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Пароль</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none focus:border-red-500 transition-colors" placeholder="••••••••" />
                    </div>
                    <button className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                      <LogIn className="w-4 h-4" /> Войти
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-[#0f0f0f] border border-zinc-800 p-8 rounded-[2rem] max-h-[90vh] overflow-y-auto relative w-full shadow-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-zinc-800">
                    <div>
                      <h2 className="text-3xl font-black flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-red-500/10 rounded-xl"><Shield className="text-red-500 w-8 h-8" /></div>
                        ПАНЕЛЬ УПРАВЛЕНИЯ
                      </h2>
                      <p className="text-zinc-500 text-sm mt-1">Управление товарами (Firebase Cloud)</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setIsAddingNew(true)} className="bg-red-600 text-white hover:bg-red-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95">
                        <Plus className="w-5 h-5" /> Добавить товар
                      </button>
                      <button onClick={() => setIsLoggedIn(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95">Выйти</button>
                      <button onClick={() => setIsAdminOpen(false)} className="p-2.5 bg-zinc-900 text-zinc-500 hover:text-white rounded-xl border border-zinc-800 transition-colors"><X /></button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-900/50 text-zinc-400 text-xs uppercase tracking-widest font-bold">
                            <th className="px-6 py-4">Товар</th>
                            <th className="px-6 py-4">Цена</th>
                            <th className="px-6 py-4">Описание</th>
                            <th className="px-6 py-4 text-right">Действия</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {products.map(p => (
                            <tr key={p.id} className="group hover:bg-zinc-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 flex-shrink-0">
                                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <span className="font-bold text-zinc-200">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4"><span className="font-mono text-red-500 font-bold">{p.price}</span></td>
                              <td className="px-6 py-4"><p className="text-sm text-zinc-500 line-clamp-1 max-w-[200px]">{p.description}</p></td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setEditingProduct(p)} className="p-2 hover:bg-blue-500/10 text-zinc-500 hover:text-blue-500 rounded-lg transition-all"><Edit className="w-5 h-5" /></button>
                                  <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(editingProduct || isAddingNew) && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-[#121212] border border-zinc-800 p-8 rounded-[2.5rem] w-full max-w-xl shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight uppercase">{isAddingNew ? 'Новый товар' : 'Редактирование'}</h3>
                <button onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-black mb-1.5 tracking-widest">Название</label>
                    <input type="text" placeholder="Напр. VIP РАНГ" value={isAddingNew ? newProduct.name : editingProduct?.name} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, name: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, name: e.target.value} : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 outline-none focus:border-red-500 transition-all font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-black mb-1.5 tracking-widest">Цена</label>
                    <input type="text" placeholder="Напр. 500 RUB" value={isAddingNew ? newProduct.price : editingProduct?.price} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, price: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, price: e.target.value} : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 outline-none focus:border-red-500 transition-all font-mono font-bold text-red-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 font-black mb-1.5 tracking-widest">Прямая ссылка на фото (Postimages)</label>
                  <div className="flex gap-4">
                    <input type="text" placeholder="Напр: https://i.postimg.cc/..." value={isAddingNew ? newProduct.imageUrl : editingProduct?.imageUrl} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, imageUrl: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, imageUrl: e.target.value} : null)} className="flex-grow bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 outline-none focus:border-red-500 transition-all text-sm font-mono" />
                    <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {(isAddingNew ? newProduct.imageUrl : editingProduct?.imageUrl) ? (
                        <img src={isAddingNew ? newProduct.imageUrl : editingProduct?.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : ( <Package className="w-6 h-6 text-zinc-700" /> )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 font-black mb-1.5 tracking-widest">Описание</label>
                  <textarea placeholder="Что входит в этот товар?" value={isAddingNew ? newProduct.description : editingProduct?.description} onChange={(e) => isAddingNew ? setNewProduct({...newProduct, description: e.target.value}) : setEditingProduct(editingProduct ? {...editingProduct, description: e.target.value} : null)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 outline-none focus:border-red-500 transition-all h-28 text-sm resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { if (isAddingNew) addProduct(); else if (editingProduct) updateProduct(editingProduct.id, editingProduct); }} className="flex-[2] bg-red-600 text-white hover:bg-red-500 font-black py-4 rounded-xl transition-all active:scale-[0.98] uppercase tracking-tighter"> Сохранить </button>
                  <button onClick={() => { setIsAddingNew(false); setEditingProduct(null); }} className="flex-1 bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 font-bold py-4 rounded-xl transition-all active:scale-[0.98] uppercase text-xs tracking-widest"> Отмена </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
