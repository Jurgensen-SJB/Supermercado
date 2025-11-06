const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, migrate } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Ensure schema
migrate();

// Ruta principal - redirigir a index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Helpers
function getProductById(productId) {
  return db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(productId);
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

// Products API
app.get('/api/products', (req, res) => {
  const { q, category } = req.query;
  let sql = 'SELECT * FROM products';
  const params = [];
  const where = [];
  if (q) {
    where.push('(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)');
    params.push(`%${String(q).toLowerCase()}%`, `%${String(q).toLowerCase()}%`);
  }
  if (category) {
    where.push('LOWER(category) = ?');
    params.push(String(category).toLowerCase());
  }
  if (where.length > 0) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const products = db.prepare(sql).all(...params);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const { name, description, price, image, stock, category, isEco, discount } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'name y price son obligatorios' });
  const insert = db.prepare(`
    INSERT INTO products (name, description, price, image, stock, category, isEco, discount_percentage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = insert.run(name, description || '', Number(price), image || '', Number(stock || 0), category || null, Number(isEco || 0), Number(discount || 0));
  res.status(201).json(getProductById(info.lastInsertRowid));
});

app.put('/api/products/:id', (req, res) => {
  const { name, description, price, image, stock, category, isEco, discount } = req.body;
  const existing = getProductById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  const update = db.prepare(`
    UPDATE products SET name = ?, description = ?, price = ?, image = ?, stock = ?, category = ?, isEco = ?, discount_percentage = ?
    WHERE id = ?
  `);
  update.run(
    name ?? existing.name,
    description ?? existing.description,
    price != null ? Number(price) : existing.price,
    image ?? existing.image,
    stock != null ? Number(stock) : existing.stock,
    category ?? existing.category,
    isEco != null ? Number(isEco) : existing.isEco,
    discount != null ? Number(discount) : existing.discount_percentage,
    req.params.id
  );
  res.json(getProductById(req.params.id));
});

app.delete('/api/products/:id', (req, res) => {
  const del = db.prepare('DELETE FROM products WHERE id = ?');
  const info = del.run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Producto no encontrado' });
  res.status(204).end();
});

// Orders API
app.get('/api/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const itemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
  const withItems = orders.map(o => ({ ...o, items: itemsStmt.all(o.id) }));
  res.json(withItems);
});

app.post('/api/orders', (req, res) => {
  console.log('REQ.BODY COMPLETO:', req.body);
  
  const { items, userId, paymentMethod, deliveryMethod, shippingCost } = req.body;
  
  console.log('Datos recibidos en /api/orders:', {
    items: items?.length,
    userId,
    paymentMethod,
    deliveryMethod,
    shippingCost
  });
  
  console.log('Validaciones detalladas:', {
    'items es array': Array.isArray(items),
    'items length': items?.length,
    'paymentMethod existe': !!paymentMethod,
    'paymentMethod valor': paymentMethod,
    'deliveryMethod existe': !!deliveryMethod,
    'deliveryMethod valor': deliveryMethod,
    'shippingCost existe': shippingCost !== undefined && shippingCost !== null,
    'shippingCost valor': shippingCost,
    'shippingCost tipo': typeof shippingCost
  });
  
  if (!Array.isArray(items) || items.length === 0) {
    console.log('ERROR: items no es válido');
    return res.status(400).json({ error: 'items es requerido' });
  }
  
  if (!paymentMethod || !deliveryMethod || shippingCost === undefined || shippingCost === null || isNaN(shippingCost)) {
    console.log('ERROR: Faltan datos requeridos');
    return res.status(400).json({ 
      error: 'paymentMethod, deliveryMethod y shippingCost son requeridos',
      details: {
        paymentMethod: paymentMethod,
        deliveryMethod: deliveryMethod,
        shippingCost: shippingCost
      }
    });
  }

  const getForUpdate = db.prepare('SELECT * FROM products WHERE id = ?');
  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  const insertOrder = db.prepare('INSERT INTO orders (total, user_id, status, payment_method, delivery_method, shipping_cost) VALUES (?, ?, ?, ?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');

  try {
    const transaction = db.transaction(() => {
      // Calcular subtotal para validación
      let subtotal = 0;
      for (const it of items) {
        const p = getForUpdate.get(it.productId);
        if (!p) throw new Error(`Producto ${it.productId} no existe`);
        const qty = Number(it.quantity || 0);
        if (qty <= 0) throw new Error('Cantidad inválida');
        if (p.stock < qty) throw new Error(`Stock insuficiente para ${p.name}`);
        
        // Usar precio del carrito (ya con descuento aplicado) si está disponible
        const itemPrice = it.price ? Number(it.price) : p.price;
        subtotal += itemPrice * qty;
      }
      
      // Calcular total con impuestos y envío
      const tax = subtotal * 0.08; // 8% de impuesto
      const total = subtotal + tax + shippingCost;
      console.log('Insertando orden con datos:', {
        subtotal,
        tax,
        shippingCost,
        total,
        userId,
        paymentMethod,
        deliveryMethod
      });
      
      const orderInfo = insertOrder.run(total, userId, 'completed', paymentMethod, deliveryMethod, shippingCost);
      const orderId = orderInfo.lastInsertRowid;
      for (const it of items) {
        const p = getForUpdate.get(it.productId);
        const qty = Number(it.quantity);
        // Usar precio del carrito (con descuento) para guardar en order_items
        const itemPrice = it.price ? Number(it.price) : p.price;
        insertItem.run(orderId, p.id, qty, itemPrice);
        updateStock.run(qty, p.id);
      }
      return { orderId, total };
    });

    const result = transaction();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.orderId);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(result.orderId);
    res.status(201).json({ ...order, items: orderItems });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Users API
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  
  try {
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    const insert = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const info = insert.run(name, email, password);
    const user = getUserById(info.lastInsertRowid);
    delete user.password; // No enviar contraseña
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }
  
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }
  
  delete user.password; // No enviar contraseña
  res.json(user);
});

// Categories API
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

app.get('/api/categories/:id', (req, res) => {
  const category = getCategoryById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }
  res.json(category);
});

app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre de la categoría es obligatorio' });
  }
  
  try {
    const insert = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const info = insert.run(name, description || '');
    res.status(201).json(getCategoryById(info.lastInsertRowid));
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'La categoría ya existe' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

app.put('/api/categories/:id', (req, res) => {
  const { name, description } = req.body;
  const existing = getCategoryById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }
  
  try {
    const update = db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?');
    update.run(name ?? existing.name, description ?? existing.description, req.params.id);
    res.json(getCategoryById(req.params.id));
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'El nombre de la categoría ya existe' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const existing = getCategoryById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Categoría no encontrada' });
  }
  
  try {
    const deleteCategory = db.prepare('DELETE FROM categories WHERE id = ?');
    deleteCategory.run(req.params.id);
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Orders API
app.get('/api/orders/:userId', (req, res) => {
  const { userId } = req.params;
  const orders = db.prepare(`
    SELECT o.*, 
           GROUP_CONCAT(
             p.name || ' x' || oi.quantity || ' ($' || oi.price || ')', 
             ', '
           ) as items_summary
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ? AND o.deleted = 0
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(userId);
  
  console.log('Pedidos devueltos para usuario', userId, ':', orders.map(o => ({
    id: o.id,
    payment_method: o.payment_method,
    delivery_method: o.delivery_method,
    shipping_cost: o.shipping_cost
  })));
  
  res.json(orders);
});

app.get('/api/orders/:userId/stats', (req, res) => {
  const { userId } = req.params;
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_spent,
      COALESCE(AVG(total), 0) as avg_order_value,
      MAX(created_at) as last_order_date
    FROM orders 
    WHERE user_id = ? AND deleted = 0 AND status = 'completed'
  `).get(userId);
  
  const monthlyStats = db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as orders_count,
      SUM(total) as total_spent
    FROM orders 
    WHERE user_id = ? AND deleted = 0 AND status = 'completed'
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 6
  `).all(userId);
  
  res.json({ ...stats, monthlyStats });
});

app.get('/api/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  delete user.password; // No enviar contraseña
  res.json(user);
});

// Eliminar pedido individual (soft delete)
app.delete('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { userId } = req.body;
  
  console.log('DELETE /api/orders/:orderId - Datos recibidos:', {
    orderId,
    userId,
    body: req.body
  });
  
  try {
    // Verificar que el pedido pertenece al usuario
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ? AND deleted = 0').get(orderId, userId);
    console.log('Pedido encontrado:', order);
    
    if (!order) {
      console.log('Pedido no encontrado o ya eliminado');
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Marcar como eliminado (soft delete)
    const result = db.prepare('UPDATE orders SET deleted = 1 WHERE id = ?').run(orderId);
    console.log('Resultado de eliminación:', result);
    
    res.json({ success: true, message: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar todos los pedidos de un usuario (soft delete)
app.delete('/api/orders/user/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    // Marcar todos los pedidos del usuario como eliminados
    const result = db.prepare('UPDATE orders SET deleted = 1 WHERE user_id = ? AND deleted = 0').run(userId);
    
    res.json({ 
      success: true, 
      message: `${result.changes} pedidos eliminados correctamente` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/admin/stats', (req, res) => {
  try {
    // Estadísticas generales (incluyendo compras del admin)
    const totalStats = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalSales,
        COALESCE(AVG(total), 0) as avgOrderValue,
        COUNT(DISTINCT user_id) as activeCustomers
      FROM orders 
      WHERE status = 'completed'
    `).get();
    
    // Ventas mensuales (últimos 6 meses, incluyendo compras del admin)
    const monthlySales = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as ordersCount,
        COALESCE(SUM(total), 0) as totalSales
      FROM orders 
      WHERE status = 'completed'
        AND created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).all();
    
    // Productos más vendidos (datos reales)
    const topProducts = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.price,
        COALESCE(SUM(oi.quantity), 0) as totalSold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as totalRevenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'completed'
      GROUP BY p.id, p.name, p.category, p.price
      HAVING totalSold > 0
      ORDER BY totalSold DESC
      LIMIT 10
    `).all();
    
    res.json({
      totalOrders: totalStats.totalOrders || 0,
      totalSales: totalStats.totalSales || 0,
      avgOrderValue: totalStats.avgOrderValue || 0,
      activeCustomers: totalStats.activeCustomers || 0,
      monthlySales: monthlySales || [],
      topProducts: topProducts || []
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de admin:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Solo iniciar el servidor si no estamos en Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

// Exportar para Vercel
module.exports = app;


