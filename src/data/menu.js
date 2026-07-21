export const departments = {
  SUSHI_PIZZA: 'Суши и Пицца',
  FASTFOOD: 'Фастфуд',
  BARISTA: 'Бариста'
};

export const menuData = [
  // ==========================================
  //                  ФАСТФУД
  // ==========================================
  // Шаурма
  { id: 'sh1', name: 'Куриная Шаурма', price: 200, category: 'Шаурма', dept: departments.FASTFOOD },
  { id: 'sh2', name: 'Шаурма Говядина', price: 230, category: 'Шаурма', dept: departments.FASTFOOD },
  { id: 'sh3', name: 'Шаурма Ассорти', price: 250, category: 'Шаурма', dept: departments.FASTFOOD },
  { id: 'sh4', name: 'Сырная Шаурма', price: 250, category: 'Шаурма', dept: departments.FASTFOOD },
  { id: 'sh5', name: 'Шаурма Двойная (Куриный)', price: 230, category: 'Шаурма', dept: departments.FASTFOOD },
  { id: 'sh6', name: 'Шаурма Двойная (Говядина)', price: 250, category: 'Шаурма', dept: departments.FASTFOOD },
  
  // Бургеры
  { id: 'b1_gov', name: 'Классический Бургер (Говядина)', price: 170, category: 'Бургеры', dept: departments.FASTFOOD },
  { id: 'b1_kur', name: 'Классический Бургер (Курица)', price: 190, category: 'Бургеры', dept: departments.FASTFOOD },
  { id: 'b2', name: 'Бургер Ассорти', price: 190, category: 'Бургеры', dept: departments.FASTFOOD },
  { id: 'b3', name: 'Сырный Бургер', price: 190, category: 'Бургеры', dept: departments.FASTFOOD },
  
  // Хот-доги
  { id: 'hd1', name: 'Хот Дог', price: 100, category: 'Хот-доги', dept: departments.FASTFOOD },
  { id: 'hd2', name: 'Двойной Хот Дог', price: 120, category: 'Хот-доги', dept: departments.FASTFOOD },

  // ==========================================
  //               СУШИ И ПИЦЦА
  // ==========================================
  // Классические роллы
  { id: 's1', name: 'Филадельфия с Лососем', price: 370, category: 'Роллы', dept: departments.SUSHI_PIZZA },
  { id: 's2', name: 'Филадельфия с Угрем', price: 370, category: 'Роллы', dept: departments.SUSHI_PIZZA },
  { id: 's3', name: 'Снежный Калифорния', price: 250, category: 'Роллы', dept: departments.SUSHI_PIZZA },
  { id: 's4', name: 'Канада', price: 350, category: 'Роллы', dept: departments.SUSHI_PIZZA },
  { id: 's5', name: 'Хрустящий Лосось', price: 320, category: 'Роллы', dept: departments.SUSHI_PIZZA },
  { id: 's6', name: 'Аляска', price: 250, category: 'Роллы', dept: departments.SUSHI_PIZZA },
  { id: 's7', name: 'Опаленный Лосось', price: 320, category: 'Роллы', dept: departments.SUSHI_PIZZA },
  
  // Простые роллы (Маки)
  { id: 'sm1', name: 'Просто Авокадо', price: 100, category: 'Маки роллы', dept: departments.SUSHI_PIZZA },
  { id: 'sm2', name: 'Просто Лосось', price: 100, category: 'Маки роллы', dept: departments.SUSHI_PIZZA },
  { id: 'sm3', name: 'Просто Огурец', price: 90, category: 'Маки роллы', dept: departments.SUSHI_PIZZA },
  { id: 'sm4', name: 'Просто Угорь', price: 150, category: 'Маки роллы', dept: departments.SUSHI_PIZZA },

  // Темпура роллы
  { id: 't1', name: 'Темпура с Лососем', price: 320, category: 'Темпура', dept: departments.SUSHI_PIZZA },
  { id: 't2', name: 'Темпура с Лососем терияки', price: 350, category: 'Темпура', dept: departments.SUSHI_PIZZA },
  { id: 't3', name: 'Темпура с Курицей', price: 280, category: 'Темпура', dept: departments.SUSHI_PIZZA },
  { id: 't4', name: 'Темпура с Лососем тобико', price: 350, category: 'Темпура', dept: departments.SUSHI_PIZZA },

  // Запеченные роллы
  { id: 'z1', name: 'Запеченный Лосось терияки', price: 280, category: 'Запеченные роллы', dept: departments.SUSHI_PIZZA },
  { id: 'z2', name: 'Запеченный Калифорния', price: 250, category: 'Запеченные роллы', dept: departments.SUSHI_PIZZA },
  { id: 'z3', name: 'Запеченный Угорь', price: 300, category: 'Запеченные роллы', dept: departments.SUSHI_PIZZA },
  { id: 'z4', name: 'Запеченный Лосось', price: 280, category: 'Запеченные роллы', dept: departments.SUSHI_PIZZA },
  { id: 'z5', name: 'Запеченный Курица', price: 280, category: 'Запеченные роллы', dept: departments.SUSHI_PIZZA },
  { id: 'z6', name: 'Киото Острый', price: 250, category: 'Запеченные роллы', dept: departments.SUSHI_PIZZA },

  // Пицца
  { id: 'p1', name: 'Пицца Двойная Пепперони', price: 500, category: 'Пицца', dept: departments.SUSHI_PIZZA },
  { id: 'p2', name: 'Пицца Пепперони', price: 450, category: 'Пицца', dept: departments.SUSHI_PIZZA },
  { id: 'p3', name: 'Пицца Четыре Сыра', price: 400, category: 'Пицца', dept: departments.SUSHI_PIZZA },
  { id: 'p4', name: 'Пицца с ветчиной и грибами', price: 400, category: 'Пицца', dept: departments.SUSHI_PIZZA },
  { id: 'p5', name: 'Пицца с Курицей', price: 400, category: 'Пицца', dept: departments.SUSHI_PIZZA },
  { id: 'p6', name: 'Пицца Маргарита', price: 400, category: 'Пицца', dept: departments.SUSHI_PIZZA },

  // Соусы
  { id: 'sau1', name: 'Соус Кетчуп', price: 20, category: 'Соусы', dept: departments.SUSHI_PIZZA },
  { id: 'sau2', name: 'Чесночный Соус', price: 20, category: 'Соусы', dept: departments.SUSHI_PIZZA },
  { id: 'sau3', name: 'Соус Терияки', price: 20, category: 'Соусы', dept: departments.SUSHI_PIZZA },
  { id: 'sau4', name: 'Сырный Соус', price: 20, category: 'Соусы', dept: departments.SUSHI_PIZZA },

  // ==========================================
  //                 БАРИСТА
  // ==========================================
  // Новые дополнения: Общее мороженое и Фруктовое мороженое
  { id: 'ic_gen_50', name: 'Мороженое (Малое)', price: 50, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic_gen_70', name: 'Мороженое (Среднее)', price: 70, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic_gen_100', name: 'Мороженое (Большое)', price: 100, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic_fruit', name: 'Фруктовое Мороженое', price: 100, category: 'Мороженое', dept: departments.BARISTA },

  // Шариковое мороженое из основного буклета
  { id: 'ic1', name: 'Шариковое Мороженое (Банан)', price: 50, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic2', name: 'Шариковое Мороженое (Клубника)', price: 50, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic3', name: 'Шариковое Мороженое (Сникерс)', price: 50, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic4', name: 'Шариковое Мороженое (Oreo)', price: 50, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic5', name: 'Шариковое Мороженое (Голубика)', price: 50, category: 'Мороженое', dept: departments.BARISTA },
  { id: 'ic6', name: 'Шариковое Мороженое (Манго)', price: 50, category: 'Мороженое', dept: departments.BARISTA },

  // Новые дополнения: Газ вода и Коктейль
  { id: 'gv_15', name: 'Газ Вода (0.5л)', price: 15, category: 'Напитки', dept: departments.BARISTA },
  { id: 'gv_25', name: 'Газ Вода (1л)', price: 25, category: 'Напитки', dept: departments.BARISTA },
  { id: 'co_100', name: 'Коктейль', price: 100, category: 'Напитки', dept: departments.BARISTA },

  // Мохито
  { id: 'm1_st', name: 'Мохито Клубничный (Стакан)', price: 100, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm1_1l', name: 'Мохито Клубничный (1л)', price: 200, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm2_st', name: 'Мохито Океан (Стакан)', price: 100, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm2_1l', name: 'Мохито Океан (1л)', price: 200, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm3_st', name: 'Мохито Mentol (Стакан)', price: 100, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm3_1l', name: 'Мохито Mentol (1л)', price: 200, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm4_st', name: 'Мохито Манго-Маракуйя (Стакан)', price: 100, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm4_1l', name: 'Мохито Манго-Маракуйя (1л)', price: 200, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm5_st', name: 'Мохито Малиновый (Стакан)', price: 100, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm5_1l', name: 'Мохито Малиновый (1л)', price: 200, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm6_st', name: 'Мохито Манго (Стакан)', price: 100, category: 'Мохито', dept: departments.BARISTA },
  { id: 'm6_1l', name: 'Мохито Манго (1л)', price: 200, category: 'Мохито', dept: departments.BARISTA }
];