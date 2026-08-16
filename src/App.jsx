import React, { useState, useEffect } from 'react';
import { menuData, departments } from './data/menu';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const USERS_DB = [
  { id: 'admin', name: 'Администратор', role: 'admin', pin: '0000' },
  { id: 'w1', name: 'ГУЛБАРА(официант)', role: 'waiter', pin: '1111' },
  { id: 'w2', name: 'АЗИЗА (официант)', role: 'waiter', pin: '2222' },
  { id: 'w3', name: 'ГУЛНАРА (официант)', role: 'waiter', pin: '3333' },
  { id: 'k1', name: 'АХМАДИЛЛО (Пицца и Суши)', role: 'kitchen_sushi', pin: '4444', dept: departments.SUSHI_PIZZA },
  { id: 'k2', name: 'ХАМИД (Бар)', role: 'kitchen_barista', pin: '5555', dept: departments.BARISTA },
  { id: 'k3', name: 'НОДИРБЕК (Фастфуд)', role: 'kitchen_fastfood', pin: '6666', dept: departments.FASTFOOD },
];

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const aggregateByDish = (items) => {
  const map = new Map();
  (items || []).forEach(item => {
    const key = item.dishId + '|' + (item.comment || '');
    if (map.has(key)) {
      map.get(key).quantity += item.quantity;
    } else {
      map.set(key, { ...item });
    }
  });
  return Array.from(map.values());
};

const getDeptStatus = (items, dept) => {
  const deptItems = (items || []).filter(i => i.dept === dept);
  if (deptItems.length === 0) return null;
  if (deptItems.some(i => i.status === 'pending')) return 'pending';
  if (deptItems.some(i => i.status === 'done')) return 'ready';
  return 'picked_up';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(USERS_DB[0].id);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [waiterScreen, setWaiterScreen] = useState('tables');
  
  const [activeDept, setActiveDept] = useState(departments.FASTFOOD);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [cart, setCart] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null); 
  const [activeOrderId, setActiveOrderId] = useState(null); 
  
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableFilterType, setTableFilterType] = useState('ALL');

  const [viewingBillOrder, setViewingBillOrder] = useState(null);

  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isConfirmSendModalOpen, setIsConfirmSendModalOpen] = useState(false);

  const [editingCommentItemId, setEditingCommentItemId] = useState(null);
  const [tempCommentText, setTempCommentText] = useState('');

  const [expenses, setExpenses] = useState([]);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseComment, setExpenseComment] = useState('');

  const [orders, setOrders] = useState([]);
  const [longPressTimer, setLongPressTimer] = useState(null);

  const [kitchenViewMode, setKitchenViewMode] = useState('own');
  const KITCHEN_PARTNER_DEPT = {
    kitchen_sushi: departments.FASTFOOD,
    kitchen_fastfood: departments.SUSHI_PIZZA,
  };

  const tables = Array.from({ length: 23 }, (_, i) => `Стол ${i + 1}`).concat('С собой');

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ordersList.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(ordersList);
    });

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const expList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      expList.sort((a, b) => b.createdAt - a.createdAt);
      setExpenses(expList);
    });

    return () => {
      unsubOrders();
      unsubExpenses();
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = USERS_DB.find(u => u.id === selectedUserId);
    if (user && user.pin === pinInput) {
      setCurrentUser(user);
      setWaiterScreen('tables'); 
      setLoginError('');
    } else {
      setLoginError('Неверный PIN-код!');
    }
    setPinInput('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setKitchenViewMode('own');
    setCart([]);
    setSelectedTable(null);
    setActiveOrderId(null);
    setIsCartModalOpen(false);
    setIsConfirmSendModalOpen(false);
    setViewingBillOrder(null);
  };

  const completeLineItem = async (order, lineId) => {
    try {
      const updatedItems = order.items.map(i =>
        i.lineId === lineId ? { ...i, status: 'done', doneAt: Date.now() } : i
      );
      await updateDoc(doc(db, 'orders', order.id), { items: updatedItems });
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  const handleWaiterPickUp = async (order, deptName) => {
    try {
      const updatedItems = order.items.map(i =>
        (i.dept === deptName && i.status === 'done') ? { ...i, status: 'picked_up' } : i
      );
      await updateDoc(doc(db, 'orders', order.id), { items: updatedItems });
    } catch (error) {
      console.error(error);
    }
  };

  const handleTableClick = (tableName, activeOrder) => {
    if (activeOrder) {
      setViewingBillOrder(activeOrder);
    } else {
      setSelectedTable(tableName);
      setCart([]);
      setActiveOrderId(null);
      setWaiterScreen('order');
      setIsCartModalOpen(false);
    }
  };

  const handleEditOrderFromBill = (order) => {
    setSelectedTable(order.table);
    const agg = aggregateByDish(order.items || []);
    setCart(agg.map(a => ({
      id: a.dishId,
      name: a.name,
      price: a.price,
      dept: a.dept,
      category: a.category,
      quantity: a.quantity,
      comment: a.comment || ''
    })));
    setActiveOrderId(order.id);
    setViewingBillOrder(null);
    setWaiterScreen('order');
  };

  const handleItemPressStart = (item) => {
    const timer = setTimeout(() => {
      const confirmDelete = window.confirm(`❓ Удалить "${item.name}" из чека?`);
      if (confirmDelete) {
        setCart(prev => prev.filter(i => i.id !== item.id));
      }
    }, 900);
    setLongPressTimer(timer);
  };

  const handleItemPressEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, comment: '' }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const openCommentModal = (item, e) => {
    if (e) e.stopPropagation();
    setEditingCommentItemId(item.id);
    setTempCommentText(item.comment || '');
  };

  const saveComment = () => {
    setCart(prev => prev.map(item => item.id === editingCommentItemId ? { ...item, comment: tempCommentText } : item));
    setEditingCommentItemId(null);
    setTempCommentText('');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const executeSendOrderToKitchen = async () => {
    if (!selectedTable || cart.length === 0) return;

    setIsConfirmSendModalOpen(false);
    setIsCartModalOpen(false);

    const orderIdToUpdate = activeOrderId;

    if (orderIdToUpdate) {
      const existingOrder = orders.find(o => o.id === orderIdToUpdate);
      const existingItems = existingOrder?.items || [];
      const maxBatch = existingItems.reduce((m, i) => Math.max(m, i.batchNumber || 1), 1);
      const newBatchNumber = maxBatch + 1;

      const oldAgg = {};
      existingItems.forEach(i => {
        const key = i.dishId + '|' + (i.comment || '');
        oldAgg[key] = (oldAgg[key] || 0) + i.quantity;
      });

      let workingItems = existingItems.map(i => ({ ...i }));
      const newLines = [];

      cart.forEach(cartItem => {
        const key = cartItem.id + '|' + (cartItem.comment || '');
        const oldQty = oldAgg[key] || 0;
        const delta = cartItem.quantity - oldQty;

        if (delta > 0) {
          newLines.push({
            lineId: uid(),
            dishId: cartItem.id,
            name: cartItem.name,
            price: cartItem.price,
            dept: cartItem.dept,
            category: cartItem.category,
            quantity: delta,
            comment: cartItem.comment || '',
            batchNumber: newBatchNumber,
            status: 'pending'
          });
        } else if (delta < 0) {
          let toRemove = -delta;
          const candidates = workingItems
            .filter(it => it.dishId === cartItem.id && (it.comment || '') === (cartItem.comment || ''))
            .sort((a, b) => {
              const rank = s => (s === 'pending' ? 0 : s === 'done' ? 1 : 2);
              if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
              return (b.batchNumber || 1) - (a.batchNumber || 1);
            });
          for (const line of candidates) {
            if (toRemove <= 0) break;
            const take = Math.min(line.quantity, toRemove);
            line.quantity -= take;
            toRemove -= take;
          }
          workingItems = workingItems.filter(l => l.quantity > 0);
        }
      });

      const cartKeys = new Set(cart.map(ci => ci.id + '|' + (ci.comment || '')));
      Object.keys(oldAgg).forEach(key => {
        if (!cartKeys.has(key)) {
          workingItems = workingItems.filter(l => (l.dishId + '|' + (l.comment || '')) !== key);
        }
      });

      const finalItems = [...workingItems, ...newLines];
      const total = finalItems.reduce((s, i) => s + i.price * i.quantity, 0);

      setCart([]);
      setSelectedTable(null);
      setActiveOrderId(null);
      setWaiterScreen('tables');

      try {
        await updateDoc(doc(db, 'orders', orderIdToUpdate), {
          items: finalItems,
          total,
          lastEditedAt: Date.now(),
          lastEditedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (error) {
        console.error("Ошибка Firebase:", error);
        alert("⚠️ Ошибка сети при отправке заказа! Проверьте интернет.");
      }
    } else {
      const finalItems = cart.map(ci => ({
        lineId: uid(),
        dishId: ci.id,
        name: ci.name,
        price: ci.price,
        dept: ci.dept,
        category: ci.category,
        quantity: ci.quantity,
        comment: ci.comment || '',
        batchNumber: 1,
        status: 'pending'
      }));
      const total = finalItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const newOrder = {
        table: selectedTable,
        waiter: currentUser.name,
        items: finalItems,
        total,
        status: 'open',
        createdAt: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setCart([]);
      setSelectedTable(null);
      setActiveOrderId(null);
      setWaiterScreen('tables');

      try {
        await addDoc(collection(db, 'orders'), newOrder);
      } catch (error) {
        console.error("Ошибка Firebase:", error);
        alert("⚠️ Ошибка сети при отправке заказа! Проверьте интернет.");
      }
    }
  };

  const closeOrderDirectly = async (orderToClose) => {
    if (!orderToClose) return;
    if (window.confirm(`💰 Рассчитать гостей и очистить ${orderToClose.table}?\nИтого к оплате: ${orderToClose.total} сом`)) {
      
      setViewingBillOrder(null);
      setCart([]);
      setActiveOrderId(null);
      setSelectedTable(null);
      setIsCartModalOpen(false);
      setWaiterScreen('tables');

      try {
        await updateDoc(doc(db, 'orders', orderToClose.id), { 
          status: 'closed',
          closedAt: Date.now(),
          closedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (error) {
        console.error("Ошибка закрытия чека в базе:", error);
        alert("⚠️ Ошибка сети! Чек закрыт локально, но произошел сбой синхронизации с базой.");
      }
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount || !expenseComment) {
      alert("⚠️ Введите сумму и комментарий к расходу!");
      return;
    }
    try {
      await addDoc(collection(db, 'expenses'), {
        amount: Number(expenseAmount),
        comment: expenseComment,
        adminName: currentUser.name,
        createdAt: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setExpenseAmount('');
      setExpenseComment('');
    } catch (error) {
      console.error("Ошибка добавления расхода:", error);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("❓ Удалить эту запись о расходе?")) {
      try {
        await deleteDoc(doc(db, 'expenses', id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleResetShift = async () => {
    const closedOrders = orders.filter(o => o.status === 'closed');
    if (window.confirm("🚨 ВНИМАНИЕ! Вы уверены, что хотите закрыть смену? Все рассчитанные заказы и расходы за сегодняшний день будут удалены из списка для начала новой смены!")) {
      try {
        for (const o of closedOrders) {
          await deleteDoc(doc(db, 'orders', o.id));
        }
        for (const exp of expenses) {
          await deleteDoc(doc(db, 'expenses', exp.id));
        }
        alert("✅ Смена успешно закрыта! Касса обнулена к новому рабочему дню.");
        setWaiterScreen('tables');
      } catch (error) {
        console.error("Ошибка при закрытии смены:", error);
        alert("❌ Произошла ошибка при очистке данных.");
      }
    }
  };

  const filteredMenu = menuData.filter(item => item.dept === activeDept && (selectedCategory === 'Все' || item.category === selectedCategory));
  const categories = ['Все', ...new Set(menuData.filter(item => item.dept === activeDept).map(item => item.category))];

  const getNotificationCountForWaiter = () => {
    return orders.filter(order => {
      if (order.status !== 'open') return false;
      if (currentUser.role === 'waiter' && order.waiter !== currentUser?.name) return false;
      return order.items?.some(i => i.status === 'done');
    }).length;
  };

  const filteredTables = tables.filter(tName => {
    const activeOrder = orders.find(o => o.table === tName && o.status === 'open');
    
    if (tableSearchQuery.trim() !== '' && !tName.toLowerCase().includes(tableSearchQuery.toLowerCase().trim())) {
      return false;
    }
    
    if (tableFilterType === 'OCCUPIED' && !activeOrder) return false;
    if (tableFilterType === 'FREE' && activeOrder) return false;
    if (tableFilterType === 'READY') {
      if (!activeOrder) return false;
      const hasAlert = activeOrder.items?.some(i => i.status === 'done');
      if (!hasAlert) return false;
    }
    return true;
  });

  let activeKitchenDept = null;
  const hasKitchenPartner = currentUser?.role && KITCHEN_PARTNER_DEPT[currentUser.role];
  if (currentUser?.role.startsWith('kitchen_')) {
    activeKitchenDept = (kitchenViewMode === 'other' && hasKitchenPartner)
      ? KITCHEN_PARTNER_DEPT[currentUser.role]
      : currentUser.dept;
  } else if (currentUser?.role === 'admin' && waiterScreen.startsWith('admin_dept_')) {
    if (waiterScreen === 'admin_dept_sushi') activeKitchenDept = departments.SUSHI_PIZZA;
    if (waiterScreen === 'admin_dept_barista') activeKitchenDept = departments.BARISTA;
    if (waiterScreen === 'admin_dept_fastfood') activeKitchenDept = departments.FASTFOOD;
  }

  const totalRevenue = orders.filter(o => o.status === 'closed').reduce((sum, o) => sum + (o.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netCash = totalRevenue - totalExpenses;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center px-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm">
          <h2 className="text-2xl font-black text-center text-gray-950 mb-6 tracking-wide">HALIL POS</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase mb-2">Выберите сотрудника</label>
              <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-bold text-sm">
                {USERS_DB.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-gray-400 uppercase mb-2">PIN-код</label>
              <input type="password" maxLength={4} placeholder="••••" value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-center text-2xl font-black tracking-widest" required />
            </div>
            {loginError && <div className="text-center text-xs font-bold text-red-600 bg-red-50 py-2 rounded-lg">{loginError}</div>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black text-base shadow-lg active:scale-95 transition-transform">Войти 🔑</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800 font-sans overflow-hidden">
      
      <header className="bg-gray-900 text-white px-4 py-3 flex flex-wrap justify-between items-center shadow-md z-10 shrink-0 gap-2">
        <div>
          <h1 className="text-sm font-black tracking-wide">HALIL ICE POS</h1>
          <span className="text-[11px] text-orange-400 font-bold">{currentUser.name} ({currentUser.role === 'admin' ? 'АДМИН' : currentUser.role})</span>
        </div>
        
        {(currentUser.role === 'waiter' || currentUser.role === 'admin') && (
          <div className="flex flex-wrap items-center gap-1 bg-gray-800 p-1 rounded-xl border border-gray-700">
            <button 
              onClick={() => { setWaiterScreen('tables'); setViewingBillOrder(null); }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${waiterScreen === 'tables' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            >
              🗺️ Столы
            </button>
            <button 
              onClick={() => { setWaiterScreen('monitor'); setViewingBillOrder(null); }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1 relative ${waiterScreen === 'monitor' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}
            >
              🔔 Заказы
              {getNotificationCountForWaiter() > 0 && (
                <span className="bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-bounce">
                  {getNotificationCountForWaiter()}
                </span>
              )}
            </button>

            {currentUser.role === 'admin' && (
              <>
                <span className="text-gray-600 px-1">|</span>
                <button onClick={() => { setWaiterScreen('expenses'); setViewingBillOrder(null); }} className={`px-2.5 py-1.5 rounded-lg font-bold text-xs ${waiterScreen === 'expenses' ? 'bg-red-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>💸 Расходы</button>
                <button onClick={() => { setWaiterScreen('report'); setViewingBillOrder(null); }} className={`px-2.5 py-1.5 rounded-lg font-bold text-xs ${waiterScreen === 'report' ? 'bg-emerald-600 text-white shadow' : 'text-gray-300 hover:text-white'}`}>📊 Отчет</button>
                <span className="text-gray-600 px-1">|</span>
                <button onClick={() => { setWaiterScreen('admin_dept_sushi'); setViewingBillOrder(null); }} className={`px-2 py-1.5 rounded-lg font-bold text-xs ${waiterScreen === 'admin_dept_sushi' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>🍣 Суши</button>
                <button onClick={() => { setWaiterScreen('admin_dept_barista'); setViewingBillOrder(null); }} className={`px-2 py-1.5 rounded-lg font-bold text-xs ${waiterScreen === 'admin_dept_barista' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>☕ Бар</button>
                <button onClick={() => { setWaiterScreen('admin_dept_fastfood'); setViewingBillOrder(null); }} className={`px-2 py-1.5 rounded-lg font-bold text-xs ${waiterScreen === 'admin_dept_fastfood' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>🍔 Фастфуд</button>
              </>
            )}
          </div>
        )}

        <button onClick={handleLogout} className="bg-gray-800 hover:bg-red-700 p-2 rounded-xl text-xs text-gray-300 ml-auto transition-colors">🚪 Выйти</button>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        
        {(currentUser.role === 'waiter' || currentUser.role === 'admin') && !activeKitchenDept && (
          <>
            {waiterScreen === 'tables' && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="🔍 Поиск стола (напр: 23, 5, собой)..."
                      value={tableSearchQuery}
                      onChange={(e) => setTableSearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {tableSearchQuery && (
                      <button 
                        onClick={() => setTableSearchQuery('')}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 w-full sm:w-auto justify-start sm:justify-end">
                    <button
                      onClick={() => setTableFilterType('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${tableFilterType === 'ALL' ? 'bg-gray-900 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      Все ({tables.length})
                    </button>
                    <button
                      onClick={() => setTableFilterType('OCCUPIED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${tableFilterType === 'OCCUPIED' ? 'bg-red-600 text-white shadow' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      🔴 Занятые (К оплате) ({orders.filter(o => o.status === 'open').length})
                    </button>
                    <button
                      onClick={() => setTableFilterType('FREE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${tableFilterType === 'FREE' ? 'bg-green-600 text-white shadow' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                      🟢 Свободные
                    </button>
                    <button
                      onClick={() => setTableFilterType('READY')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${tableFilterType === 'READY' ? 'bg-amber-500 text-white shadow' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                      🔔 Готовые
                    </button>
                  </div>
                </div>

                {filteredTables.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border max-w-md mx-auto mt-6 text-gray-400 font-bold">
                    📭 Столы по вашему запросу не найдены
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {filteredTables.map(tName => {
                      const activeOrder = orders.find(o => o.table === tName && o.status === 'open');
                      
                      let btnStyle = "bg-white text-gray-800 border-gray-200 active:bg-gray-100 shadow-sm";
                      let statusText = "🟢 Свободен";
                      let isLocked = false;

                      const hasAlert = activeOrder && (activeOrder.waiter === currentUser.name || currentUser.role === 'admin') && activeOrder.items?.some(i => i.status === 'done');

                      if (activeOrder) {
                        if (activeOrder.waiter === currentUser.name || currentUser.role === 'admin') {
                          btnStyle = hasAlert 
                            ? "bg-amber-500 text-white border-amber-600 shadow animate-pulse font-black" 
                            : "bg-blue-600 text-white border-blue-700 shadow-md";
                          statusText = hasAlert ? "🔔 ГОТОВО!" : `🔴 ${activeOrder.waiter} (${activeOrder.total} с)`;
                        } else {
                          btnStyle = "bg-red-50 text-red-700 border-red-200 opacity-50 cursor-not-allowed";
                          statusText = `🔒 ${activeOrder.waiter}`;
                          isLocked = true;
                        }
                      }

                      return (
                        <button
                          key={tName}
                          disabled={isLocked}
                          onClick={() => handleTableClick(tName, activeOrder)}
                          className={`p-4 rounded-2xl border text-center transition-transform active:scale-95 flex flex-col items-center justify-center h-24 ${btnStyle}`}
                        >
                          <span className="font-black text-base sm:text-lg tracking-wide">{tName}</span>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-90 mt-1">{statusText}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {waiterScreen === 'order' && (
              <div className="flex-1 flex flex-col overflow-hidden w-full bg-gray-100">
                <div className="bg-white px-4 py-3 border-b border-gray-200 flex justify-between items-center shrink-0">
                  <button 
                    onClick={() => setWaiterScreen('tables')} 
                    className="bg-gray-800 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95"
                  >
                    ⬅️ К столам
                  </button>
                  <div className="text-center">
                    <span className="text-base font-black text-blue-600 block">{selectedTable}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{activeOrderId ? "Редактирование чека" : "Новый заказ"}</span>
                  </div>
                  
                  {activeOrderId && currentUser.role === 'admin' ? (
                    <button 
                      onClick={() => {
                        const ord = orders.find(o => o.id === activeOrderId);
                        if (ord) closeOrderDirectly(ord);
                      }} 
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow active:scale-95 animate-pulse"
                    >
                      💵 Расчет и очистка
                    </button>
                  ) : <div className="w-16"></div>}
                </div>

                <div className="p-2 bg-white border-b border-gray-200 flex space-x-2 overflow-x-auto shrink-0">
                  {Object.values(departments).map(dept => (
                    <button
                      key={dept}
                      onClick={() => { setActiveDept(dept); setSelectedCategory('Все'); }}
                      className={`whitespace-nowrap py-2 px-4 rounded-xl font-black text-xs transition-all ${
                        activeDept === dept ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                <div className="px-3 py-2 flex space-x-1.5 overflow-x-auto shrink-0 bg-gray-50 border-b border-gray-200">
                  {categories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => setSelectedCategory(cat)} 
                      className={`py-1 px-3 rounded-full text-xs font-bold whitespace-nowrap border ${
                        selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-24">
                  {filteredMenu.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => addToCart(item)} 
                      className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 active:scale-95 transition-transform flex flex-col justify-between cursor-pointer"
                    >
                      <div className="font-extrabold text-gray-900 text-xs sm:text-sm mb-2">{item.name}</div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-bold">{item.category}</span>
                        <span className="font-black text-blue-600 text-xs sm:text-sm">{item.price} c</span>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length > 0 && (
                  <div className="fixed bottom-3 left-3 right-3 z-30">
                    <button
                      onClick={() => setIsCartModalOpen(true)}
                      className="w-full bg-blue-600 active:bg-blue-700 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center font-black animate-pulse"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-white text-blue-600 text-xs w-6 h-6 rounded-full flex items-center justify-center font-black">
                          {cartItemCount}
                        </span>
                        <span className="text-sm">🛒 Просмотреть Чек</span>
                      </div>
                      <span className="text-base text-yellow-300">{cartTotal} сом 🔼</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {waiterScreen === 'monitor' && (
              <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-lg font-black text-gray-950 mb-4">
                  🔔 Готовые заказы: <span className="text-blue-600">{currentUser.role === 'admin' ? 'Все официанты' : currentUser.name}</span>
                </h2>

                {orders.filter(o => o.status === 'open' && (currentUser.role === 'admin' || o.waiter === currentUser.name)).length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border max-w-md mx-auto mt-6 shadow-sm">
                    <span className="text-4xl block mb-2">⏳</span>
                    <h3 className="text-base font-bold text-gray-700">Нет активных заказов</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders
                      .filter(order => order.status === 'open' && (currentUser.role === 'admin' || order.waiter === currentUser.name))
                      .map(order => {
                        const involvedDepts = [...new Set((order.items || []).map(i => i.dept))];
                        const aggregatedItems = aggregateByDish(order.items || []);

                        return (
                          <div key={order.id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden flex flex-col justify-between">
                            <div className="p-3 bg-gray-900 text-white flex justify-between items-center">
                              <div>
                                <span className="block font-black text-lg">{order.table}</span>
                                <span className="text-[10px] text-gray-400">Официант: {order.waiter} | {order.time}</span>
                              </div>
                              
                              <button 
                                onClick={() => setViewingBillOrder(order)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1"
                              >
                                🧾 Блюда ({order.total}с)
                              </button>
                            </div>

                            <div className="p-3 space-y-2 bg-gray-50/50">
                              <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-xs mb-2">
                                <div className="font-extrabold text-gray-400 uppercase text-[9px] mb-1">🍽️ Заказ гостя:</div>
                                <div className="max-h-24 overflow-y-auto space-y-1 divide-y divide-gray-100">
                                  {aggregatedItems.map((item, idx) => (
                                    <div key={idx} className="pt-1 flex justify-between font-bold text-gray-800 text-xs">
                                      <span>{item.quantity}х {item.name}</span>
                                      <span className="text-gray-500">{item.price * item.quantity} с</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {involvedDepts.map(deptName => {
                                const status = getDeptStatus(order.items, deptName);

                                if (status === 'pending') {
                                  return (
                                    <div key={deptName} className="flex items-center justify-between bg-white p-2.5 rounded-xl border text-xs">
                                      <span className="font-bold text-gray-700">⚙️ {deptName}</span>
                                      <span className="bg-amber-50 text-amber-600 font-extrabold px-2 py-0.5 rounded border border-amber-200">⏳ Готовится</span>
                                    </div>
                                  );
                                } else if (status === 'ready') {
                                  return (
                                    <div key={deptName} className="flex flex-col gap-1.5 bg-emerald-50 p-2.5 rounded-xl border-2 border-emerald-400">
                                      <div className="flex items-center justify-between">
                                        <span className="font-black text-xs text-emerald-950">🔥 {deptName}</span>
                                        <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded">🔔 ГОТОВО!</span>
                                      </div>
                                      <button
                                        onClick={() => handleWaiterPickUp(order, deptName)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 rounded-lg shadow"
                                      >
                                        ✅ Забрал с раздачи
                                      </button>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={deptName} className="flex items-center justify-between bg-gray-100 p-2.5 rounded-xl opacity-60 text-xs">
                                      <span className="font-medium text-gray-500 line-through">🍽️ {deptName}</span>
                                      <span className="text-[10px] text-gray-400 font-bold">🕊️ Отдано</span>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {waiterScreen === 'expenses' && currentUser.role === 'admin' && (
              <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
                <h2 className="text-xl font-black text-gray-950 mb-4">💸 Учет расходов из кассы</h2>
                <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-2xl shadow-md border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-40">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Сумма (сом)</label>
                    <input type="number" placeholder="0" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-black text-base text-gray-900"/>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">На что потрачено (комментарий)</label>
                    <input type="text" placeholder="Например: Покупка молока, овощей, салфеток..." value={expenseComment} onChange={(e) => setExpenseComment(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 font-bold text-sm text-gray-900"/>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl text-sm shadow active:scale-95">+ Добавить расход</button>
                  </div>
                </form>
                <h3 className="font-black text-sm text-gray-500 uppercase tracking-wider mb-3">История расходов за сегодня:</h3>
                {expenses.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border text-gray-400 font-bold">Расходов пока не было</div>
                ) : (
                  <div className="space-y-2">
                    {expenses.map(exp => (
                      <div key={exp.id} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{exp.comment}</div>
                          <div className="text-[10px] text-gray-400 font-medium">Добавил: {exp.adminName} | Время: {exp.time}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-red-600 text-base">-{exp.amount} сом</span>
                          <button onClick={() => handleDeleteExpense(exp.id)} className="text-gray-400 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-2 rounded-lg text-xs" title="Удалить">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {waiterScreen === 'report' && currentUser.role === 'admin' && (
              <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full space-y-6 pb-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h2 className="text-xl font-black text-gray-950">📊 Кассовый отчет за день</h2>
                  <button onClick={handleResetShift} className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow active:scale-95 flex items-center gap-1">🚨 Закрыть смену и обнулить кассу</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                    <span className="text-xs font-black uppercase tracking-wider opacity-80">📈 Общая выручка (Продажи)</span>
                    <span className="text-2xl sm:text-3xl font-black mt-2">{totalRevenue} сом</span>
                    <span className="text-[10px] opacity-75 mt-2">Чеков закрыто: {orders.filter(o => o.status === 'closed').length} шт</span>
                  </div>
                  <div className="bg-red-600 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                    <span className="text-xs font-black uppercase tracking-wider opacity-80">📉 Общие расходы из кассы</span>
                    <span className="text-2xl sm:text-3xl font-black mt-2">-{totalExpenses} сом</span>
                    <span className="text-[10px] opacity-75 mt-2">Записей расходов: {expenses.length} шт</span>
                  </div>
                  <div className="bg-gray-900 text-yellow-400 p-5 rounded-2xl shadow-lg border-2 border-yellow-400/30 flex flex-col justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-300">💰 Остаток в кассе (К сдаче)</span>
                    <span className="text-2xl sm:text-3xl font-black mt-2">{netCash} сом</span>
                    <span className="text-[10px] text-gray-400 mt-2">Сверка с наличными и картой</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <h3 className="font-black text-sm text-gray-800 mb-3 border-b pb-2">📦 Продажи по блюдам за смену:</h3>
                  {(() => {
                    const salesMap = new Map();
                    orders.filter(o => o.status === 'closed').forEach(order => {
                      aggregateByDish(order.items || []).forEach(item => {
                        const key = item.dishId || item.name;
                        if (!salesMap.has(key)) {
                          salesMap.set(key, { name: item.name, category: item.category, quantity: 0, revenue: 0 });
                        }
                        const entry = salesMap.get(key);
                        entry.quantity += item.quantity;
                        entry.revenue += item.price * item.quantity;
                      });
                    });
                    const salesList = Array.from(salesMap.values()).sort((a, b) => b.quantity - a.quantity);
                    return salesList.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 font-bold text-sm">Пока ничего не продано в этой смене</div>
                    ) : (
                      <div className="divide-y max-h-80 overflow-y-auto">
                        {salesList.map((item, idx) => (
                          <div key={idx} className="py-2 flex justify-between items-center text-sm">
                            <div>
                              <span className="font-bold text-gray-900">{item.name}</span>
                              <span className="text-[10px] text-gray-400 ml-2">{item.category}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-blue-600">{item.quantity} шт</span>
                              <span className="font-bold text-emerald-600 text-xs w-16 text-right">{item.revenue} сом</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <h3 className="font-black text-sm text-gray-800 mb-3 border-b pb-2">✅ Закрытые чеки за сегодня:</h3>
                  {orders.filter(o => o.status === 'closed').length === 0 ? (
                    <div className="text-center py-6 text-gray-400 font-bold text-sm">Сегодня еще нет закрытых чеков</div>
                  ) : (
                    <div className="divide-y max-h-80 overflow-y-auto">
                      {orders.filter(o => o.status === 'closed').map(order => (
                        <div key={order.id} className="py-2.5 text-sm">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-black text-gray-900">{order.table}</span>
                              <span className="text-xs text-gray-400 ml-2">({order.waiter})</span>
                              <div className="text-[10px] text-gray-400">Закрыт в: {order.closedTime || order.time}</div>
                            </div>
                            <span className="font-black text-emerald-600">+{order.total} сом</span>
                          </div>
                          <div className="mt-1.5 pl-1 space-y-0.5">
                            {aggregateByDish(order.items || []).map((item, idx) => (
                              <div key={idx} className="text-[11px] text-gray-500 flex justify-between">
                                <span>{item.quantity}× {item.name}</span>
                                <span>{item.price * item.quantity} с</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeKitchenDept && (() => {
          const deptOrders = orders.filter(order => 
            order.status === 'open' &&
            (order.items || []).some(item => item.dept === activeKitchenDept && item.status === 'pending')
          );

          return (
            <div className="flex-1 p-4 overflow-y-auto">
              <h2 className="text-xl font-black text-gray-950 mb-4">
                👨‍🍳 Монитор: <span className="text-blue-600">{activeKitchenDept}</span>
              </h2>

              {hasKitchenPartner && (
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 mb-4 w-fit">
                  <button
                    onClick={() => setKitchenViewMode('own')}
                    className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${kitchenViewMode === 'own' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
                  >
                    {currentUser.dept === departments.SUSHI_PIZZA ? '🍣 Суши (мой цех)' : '🍔 Фастфуд (мой цех)'}
                  </button>
                  <button
                    onClick={() => setKitchenViewMode('other')}
                    className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${kitchenViewMode === 'other' ? 'bg-blue-600 text-white shadow' : 'text-gray-500'}`}
                  >
                    {KITCHEN_PARTNER_DEPT[currentUser.role] === departments.SUSHI_PIZZA ? '🍣 Суши' : '🍔 Фастфуд'}
                  </button>
                </div>
              )}
              {deptOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border max-w-md mx-auto mt-6">
                  <span className="text-4xl block mb-2">✅</span>
                  <h3 className="text-lg font-bold text-gray-800">Все заказы готовы!</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {deptOrders.map(order => {
                    const pendingItems = order.items.filter(item => item.dept === activeKitchenDept && item.status === 'pending');
                    return (
                      <div key={order.id} className="bg-white rounded-2xl shadow-md border-2 border-blue-100 overflow-hidden flex flex-col justify-between">
                        <div className="p-3 bg-blue-50/40 flex justify-between items-start border-b">
                          <div>
                            <span className="block font-black text-xl text-gray-950">{order.table}</span>
                            <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded mt-0.5 inline-block">💁‍♂️ {order.waiter}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{order.time}</span>
                        </div>
                        <div className="p-3 flex-1 divide-y">
                          {pendingItems.map(item => (
                            <div key={item.lineId} className={`py-2 flex flex-col gap-1.5 ${item.batchNumber > 1 ? 'bg-orange-50 -mx-3 px-3 rounded-lg' : ''}`}>
                              <div className="flex justify-between items-center font-bold text-xs sm:text-sm gap-2">
                                <span className="flex-1">
                                  <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md mr-1.5 text-[10px]">{item.quantity} шт</span>
                                  {item.name}
                                  {item.batchNumber > 1 ? (
                                    <span className="ml-1.5 text-[9px] bg-orange-500 text-white font-black px-1.5 py-0.5 rounded">➕ ДОЗАКАЗ #{item.batchNumber - 1}</span>
                                  ) : (
                                    <span className="ml-1.5 text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded">🆕 НОВОЕ</span>
                                  )}
                                </span>
                                <button
                                  onClick={() => completeLineItem(order, item.lineId)}
                                  className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow"
                                >
                                  ✅ Готово
                                </button>
                              </div>
                              {item.comment && (
                                <div className="text-xs font-black text-amber-900 bg-amber-100 p-2 rounded-lg border border-amber-300">
                                  ⚠️ <span className="underline">Заметка:</span> {item.comment}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {viewingBillOrder && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <div>
                <span className="text-xs text-orange-400 font-extrabold uppercase block">🧾 Счет к оплате</span>
                <h3 className="font-black text-xl">{viewingBillOrder.table}</h3>
                <span className="text-[10px] text-gray-400">Официант: {viewingBillOrder.waiter} | Время: {viewingBillOrder.time}</span>
              </div>
              <button onClick={() => setViewingBillOrder(null)} className="bg-gray-800 text-white w-9 h-9 rounded-full font-bold text-base hover:bg-gray-700">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 pb-2">
                <span>Наименование</span>
                <span>Кол-во × Цена</span>
                <span>Сумма</span>
              </div>
              {aggregateByDish(viewingBillOrder.items || []).map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-sm">
                  <div className="flex-1 pr-2">
                    <span className="font-extrabold text-gray-900 block">{item.name}</span>
                    {item.comment && <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block">✏️ {item.comment}</span>}
                  </div>
                  <div className="text-gray-500 font-bold text-xs w-20 text-center">
                    {item.quantity} шт × {item.price}с
                  </div>
                  <div className="font-black text-gray-900 w-16 text-right">
                    {item.quantity * item.price} с
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
                <span className="font-extrabold text-gray-700 text-base">ИТОГО К ОПЛАТЕ:</span>
                <span className="text-2xl font-black text-emerald-600">{viewingBillOrder.total} сом</span>
              </div>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => closeOrderDirectly(viewingBillOrder)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-4 rounded-2xl font-black text-base shadow-xl transition-all flex justify-center items-center gap-2 animate-pulse"
                >
                  💵 Рассчитать гостя ({viewingBillOrder.total} с) и очистить стол
                </button>
              )}

              <button
                onClick={() => handleEditOrderFromBill(viewingBillOrder)}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-bold text-xs shadow transition-all"
              >
                ✏️ Изменить или добавить блюда в заказ
              </button>
            </div>

          </div>
        </div>
      )}

      {isCartModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Чек: {selectedTable}</h3>
                <p className="text-[10px] text-orange-400 font-medium">💡 Зажмите строку на 1 сек для удаления</p>
              </div>
              <button onClick={() => setIsCartModalOpen(false)} className="bg-gray-800 text-white w-8 h-8 rounded-full font-bold text-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(item => (
                <div
                  key={item.id}
                  onMouseDown={() => handleItemPressStart(item)}
                  onMouseUp={handleItemPressEnd}
                  onMouseLeave={handleItemPressEnd}
                  onTouchStart={() => handleItemPressStart(item)}
                  onTouchEnd={handleItemPressEnd}
                  className="border-b border-gray-100 pb-2.5 select-none active:bg-red-50 p-1.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-sm text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.price} с × {item.quantity} шт</div>
                    </div>
                    <div className="flex items-center space-x-2" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-gray-100 active:bg-gray-200 rounded-full flex items-center justify-center font-black text-sm">-</button>
                      <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-gray-100 active:bg-gray-200 rounded-full flex items-center justify-center font-black text-sm">+</button>
                    </div>
                    <div className="font-black text-sm text-gray-900 ml-3 w-16 text-right">{item.price * item.quantity} с</div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {item.comment ? (
                      <button onClick={(e) => openCommentModal(item, e)} className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1">✏️ Заметка: {item.comment}</button>
                    ) : (
                      <button onClick={(e) => openCommentModal(item, e)} className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1">💬 + Добавить заметку</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-bold text-sm">Итого к оплате:</span>
                <span className="text-2xl font-black text-gray-900">{cartTotal} сом</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsCartModalOpen(false)} className="flex-1 bg-gray-200 active:bg-gray-300 text-gray-800 py-3.5 rounded-xl font-bold text-sm">Закрыть</button>
                <button onClick={executeSendOrderToKitchen} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-black text-sm shadow-lg">Отправить на кухню 🍳</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingCommentItemId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900">Заметка для кухни:</h3>
            <input type="text" placeholder="Например: без лука, с собой..." value={tempCommentText} onChange={(e) => setTempCommentText(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm font-bold"/>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setEditingCommentItemId(null)} className="bg-gray-200 px-4 py-2 rounded-xl text-xs font-bold">Отмена</button>
              <button onClick={saveComment} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black">Сохранить</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}