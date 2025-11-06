// EcoMarket App - Versión Funcional
console.log('EcoMarket App iniciando...');

// UI Helper
const ui = {
  qs(sel) { return document.querySelector(sel); },
  qsa(sel) { return [...document.querySelectorAll(sel)]; },
  money(n) { 
    // Formato personalizado para pesos colombianos
    const formatted = new Intl.NumberFormat('es-CO', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(n)); 
    return `$${formatted} COP`;
  },
  
  updateCartBadge() {
    const badge = this.qs('#cartCount');
    if (badge) {
      const count = cart.get().reduce((a, b) => a + b.quantity, 0);
      badge.textContent = count;
    }
  },
  
  // Sistema de notificaciones push
  showNotification(message, type = 'success', duration = 3000) {
    // Crear contenedor si no existe
    let container = this.qs('#notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    notification.innerHTML = `
      <div class="notification-icon">${icon}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">×</button>
    `;
    
    container.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Cerrar al hacer clic
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      this.removeNotification(notification);
    });
    
    // Auto-cerrar después de la duración
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }
    
    return notification;
  },
  
  removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  },
  
  // Update checkout button state based on authentication
  updateCheckoutButton() {
    const checkoutBtn = this.qs('#checkoutBtn');
    const currentUser = auth.getCurrentUser();
    
    if (checkoutBtn) {
      if (currentUser) {
        // Usuario autenticado - botón normal
        checkoutBtn.textContent = 'Finalizar compra';
        checkoutBtn.className = 'btn primary';
        checkoutBtn.title = 'Completar tu pedido';
      } else {
        // Usuario no autenticado - botón con indicador
        checkoutBtn.textContent = '🔐 Iniciar sesión para comprar';
        checkoutBtn.className = 'btn primary auth-required';
        checkoutBtn.title = 'Necesitas iniciar sesión para realizar una compra';
      }
    }
  },
  
  renderProducts(list) {
    const grid = this.qs('#grid');
    if (!grid) {
      console.error('Grid no encontrado');
      return;
    }
    
    const isEcoMode = localStorage.getItem('super_eco_v1') === 'true';
    
    // Filtrar productos si el modo ecológico está activado
    const filteredList = isEcoMode ? list.filter(p => p.isEco == 1) : list;
    
    console.log('Renderizando', filteredList.length, 'productos', isEcoMode ? '(modo eco activo)' : '');
    
    if (filteredList.length === 0 && isEcoMode) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🌱</div>
          <h3>Modo Ecológico Activo</h3>
          <p>No hay productos ecológicos disponibles en este momento.</p>
          <button class="btn" onclick="toggleEcoMode()" style="margin-top: 16px;">
            Ver todos los productos
          </button>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = filteredList.map(p => {
      const hasDiscount = p.discount_percentage && p.discount_percentage > 0;
      const discountedPrice = hasDiscount ? p.price * (1 - p.discount_percentage / 100) : p.price;
      
      return `
        <article class="card product">
          ${p.isEco == 1 ? '<div class="eco-badge">🌿 Eco</div>' : ''}
          ${hasDiscount ? `<div class="discount-badge">-${p.discount_percentage}%</div>` : ''}
          <img src="${p.image || ''}" alt="${p.name}" loading="lazy">
          <h3>${p.name}</h3>
          <div class="muted">${p.category || ''}</div>
          <div class="row" style="align-items:center;justify-content:space-between">
            <div class="price-container">
              ${hasDiscount ? `<span class="original-price">${this.money(p.price)}</span>` : ''}
              <span class="price ${hasDiscount ? 'discounted' : ''}">${this.money(discountedPrice)}</span>
            </div>
            <button class="btn" data-add="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
              ${p.stock <= 0 ? 'Sin Stock' : 'Añadir'}
            </button>
          </div>
        </article>
      `;
    }).join('');
    
    // Event listener para botones de añadir (solo si no existe)
    if (!grid.hasAttribute('data-listener-added')) {
      grid.setAttribute('data-listener-added', 'true');
      grid.onclick = async (e) => {
        const addId = e.target.dataset.add;
        if (addId) {
          try {
            const product = await api.getProduct(addId);
            cart.add(product, 1);
            this.updateCartBadge();
            this.renderCart();
            this.openCart();
            console.log('Producto añadido:', product.name);
          } catch (error) {
            console.error('Error añadiendo producto:', error);
            alert('Error al añadir producto');
          }
        }
      };
    }
  },
  
  renderCart() {
    const cartPanel = this.qs('#cartPanel');
    const cartItems = this.qs('#cartItems');
    const cartTotal = this.qs('#cartTotal');
    
    if (!cartPanel || !cartItems) return;
    
    const items = cart.get();
    
    if (items.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart-container">
          <div class="empty-cart-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <h3 class="empty-cart-title">Tu carrito está vacío</h3>
          <p class="empty-cart-subtitle">¡Agrega algunos productos para comenzar!</p>
          <button class="empty-cart-btn" onclick="ui.closeCart()">Continuar Comprando</button>
        </div>
      `;
      if (cartTotal) cartTotal.textContent = this.money(0);
      return;
    }
    
    cartItems.innerHTML = items.map(item => {
      const hasDiscount = item.discount && item.discount > 0;
      return `
        <div class="cart-item">
          <div class="item-image">
            <img src="${item.image || ''}" alt="${item.name}" loading="lazy">
          </div>
          <div class="item-info">
            <h4>${item.name}</h4>
            <div class="item-price">
              ${hasDiscount ? `<span class="original-price">${this.money(item.originalPrice)}</span>` : ''}
              <span class="current-price ${hasDiscount ? 'discounted' : ''}">${this.money(item.price)}</span>
              ${hasDiscount ? `<span class="discount-info">-${item.discount}%</span>` : ''}
            </div>
          </div>
          <div class="item-controls">
            <button class="btn" data-remove="${item.productId}" title="Quitar uno">-</button>
            <span>${item.quantity}</span>
            <button class="btn" data-add="${item.productId}" title="Añadir uno">+</button>
            <button class="btn" data-delete="${item.productId}" title="Eliminar del carrito" style="margin-left: 8px; background: #ef4444; color: white;">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Event listeners para controles del carrito
    cartItems.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const addId = e.target.dataset.add;
      const removeId = e.target.dataset.remove;
      const deleteId = e.target.dataset.delete;
      
      console.log('Cart button clicked:', { addId, removeId, deleteId });
      
      if (addId) {
        const item = items.find(i => i.productId == addId);
        if (item) {
          console.log('Adding item:', item.name);
          // Crear un objeto producto compatible con cart.add()
          const product = {
            id: item.productId,
            name: item.name,
            price: item.price,
            image: item.image
          };
          cart.add(product, 1);
          this.renderCart();
          this.updateCartBadge();
        }
      }
      
      if (removeId) {
        const item = items.find(i => i.productId == removeId);
        if (item) {
          console.log('Removing item:', item.name);
          // Crear un objeto producto compatible con cart.add()
          const product = {
            id: item.productId,
            name: item.name,
            price: item.price,
            image: item.image
          };
          cart.add(product, -1); // Restar uno
          this.renderCart();
          this.updateCartBadge();
        }
      }
      
      if (deleteId) {
        console.log('Delete button clicked, productId:', deleteId);
        console.log('Current cart items:', items);
        cart.remove(deleteId);
        this.renderCart();
        this.updateCartBadge();
        console.log('Cart after removal:', cart.get());
      }
    };
    
    // Actualizar total
    const total = Math.max(0, items.reduce((sum, item) => sum + (Math.max(0, item.price || 0) * Math.max(0, item.quantity || 0)), 0));
    if (cartTotal) cartTotal.textContent = this.money(total);
  },
  
  openCart() { 
    const cartPanel = this.qs('#cartPanel');
    if (cartPanel) cartPanel.classList.remove('hidden');
  },
  
  closeCart() { 
    const cartPanel = this.qs('#cartPanel');
    if (cartPanel) cartPanel.classList.add('hidden');
  }
};

// Cart Helper
const cart = {
  key: 'super_cart_v1',
  
  get() {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return [];
      const parsed = JSON.parse(data);
      // Verificar que los datos sean válidos
      if (!Array.isArray(parsed)) {
        console.warn('Cart data is not an array, clearing...');
        localStorage.removeItem(this.key);
        return [];
      }
      return parsed.filter(item => 
        item && 
        typeof item.productId !== 'undefined' && 
        typeof item.name === 'string' && 
        typeof item.price === 'number' && 
        typeof item.quantity === 'number' &&
        item.quantity > 0
      );
    } catch (error) {
      console.error('Error parsing cart data:', error);
      // Limpiar datos corruptos
      localStorage.removeItem(this.key);
      return [];
    }
  },
  
  add(product, quantity = 1) {
    const items = this.get();
    const existing = items.find(i => i.productId === product.id);
    
    // Calcular precio con descuento
    const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
    const basePrice = Math.max(0, product.price || 0); // Asegurar precio positivo
    const finalPrice = Math.max(0, hasDiscount ? basePrice * (1 - product.discount_percentage / 100) : basePrice);
    
    if (existing) {
      existing.quantity = Math.max(0, existing.quantity + quantity); // Asegurar cantidad positiva
      existing.price = Math.max(0, existing.price || finalPrice); // Asegurar precio positivo
      // Si la cantidad llega a 0 o menos, eliminar el item
      if (existing.quantity <= 0) {
        const filtered = items.filter(i => i.productId !== product.id);
        localStorage.setItem(this.key, JSON.stringify(filtered));
        return;
      }
    } else {
      // Solo añadir si la cantidad es positiva
      if (quantity > 0) {
        items.push({
          productId: product.id,
          name: product.name,
          price: finalPrice,
          originalPrice: product.price,
          discount: product.discount_percentage || 0,
          image: product.image,
          quantity
        });
      }
    }
    
    localStorage.setItem(this.key, JSON.stringify(items));
  },
  
  remove(productId) {
    console.log('Removing product:', productId, 'type:', typeof productId);
    const items = this.get();
    console.log('Items before removal:', items.map(i => ({ id: i.productId, type: typeof i.productId })));
    const filtered = items.filter(i => {
      const match = i.productId != productId; // Usar != para comparación flexible
      console.log(`Comparing ${i.productId} (${typeof i.productId}) with ${productId} (${typeof productId}): ${match}`);
      return match;
    });
    console.log('Items after removal:', filtered);
    localStorage.setItem(this.key, JSON.stringify(filtered));
  },
  
  clear() {
    localStorage.removeItem(this.key);
  },
  
  // Validar y limpiar carrito de productos inexistentes
  async validateAndClean() {
    const items = this.get();
    if (items.length === 0) return;
    
    console.log('Validando productos en el carrito...');
    const validItems = [];
    
    for (const item of items) {
      try {
        const product = await api.getProduct(item.productId);
        if (product) {
          validItems.push(item);
          console.log(`Producto válido: ${item.name} (ID: ${item.productId})`);
        } else {
          console.warn(`Producto inexistente removido: ${item.name} (ID: ${item.productId})`);
        }
      } catch (error) {
        console.warn(`Error validando producto ${item.productId}:`, error.message);
      }
    }
    
    if (validItems.length !== items.length) {
      console.log(`Carrito limpiado: ${items.length - validItems.length} productos inexistentes removidos`);
      localStorage.setItem(this.key, JSON.stringify(validItems));
    }
  },
  
  // Función para limpiar datos corruptos
  reset() {
    console.log('Resetting cart due to corruption...');
    localStorage.removeItem(this.key);
  }
};

// API Helper
const api = {
  async listProducts(params = {}) {
    try {
      const qs = new URLSearchParams(params).toString();
      const url = `/api/products${qs ? `?${qs}` : ''}`;
      console.log('Fetching:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data.length, 'productos');
      return data;
    } catch (error) {
      console.error('Error en API listProducts:', error);
      throw error;
    }
  },
  
  async getProduct(id) {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en API getProduct:', error);
      throw error;
    }
  },
  
  async createOrder(items, userId = null, paymentMethod = 'card', deliveryMethod = 'standard', shippingCost = 10000) {
    try {
      const payload = { 
        items, 
        paymentMethod, 
        deliveryMethod, 
        shippingCost 
      };
      if (userId) {
        payload.userId = userId;
      }
      
      console.log('Enviando payload a API:', payload);
      console.log('Valores específicos:', {
        items: items,
        paymentMethod: paymentMethod,
        deliveryMethod: deliveryMethod,
        shippingCost: shippingCost,
        userId: userId
      });
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API createOrder:', error);
      throw error;
    }
  },
  
  // Eliminar pedido individual
  async deleteOrder(orderId, userId) {
    try {
      console.log('Eliminando pedido:', { orderId, userId });
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      console.log('Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      throw error;
    }
  },
  
  // Eliminar todos los pedidos de un usuario
  async deleteAllOrders(userId) {
    try {
      const response = await fetch(`/api/orders/user/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error eliminando todos los pedidos:', error);
      throw error;
    }
  },
  
  async createProduct(productData) {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API createProduct:', error);
      throw error;
    }
  },
  
  async updateProduct(id, productData) {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API updateProduct:', error);
      throw error;
    }
  },
  
  async deleteProduct(id) {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API deleteProduct:', error);
      throw error;
    }
  },
  
  // Category CRUD methods
  async listCategories() {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en API listCategories:', error);
      throw error;
    }
  },
  
  async createCategory(categoryData) {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API createCategory:', error);
      throw error;
    }
  },
  
  async getCategory(id) {
    try {
      const response = await fetch(`/api/categories/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en API getCategory:', error);
      throw error;
    }
  },
  
  async updateCategory(id, categoryData) {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API updateCategory:', error);
      throw error;
    }
  },
  
  async deleteCategory(id) {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API deleteCategory:', error);
      throw error;
    }
  }
};

// Auth Helper
const auth = {
  key: 'super_auth_v1',
  currentUser: null,
  
  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        localStorage.setItem(this.key, JSON.stringify(user));
        localStorage.setItem('currentUserId', user.id);
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      throw error;
    }
  },
  
  async register(name, email, password) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        localStorage.setItem(this.key, JSON.stringify(user));
        localStorage.setItem('currentUserId', user.id);
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.error);
      }
    } catch (error) {
      throw error;
    }
  },
  
  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.key);
    localStorage.removeItem('currentUserId');
    
    // Limpiar carrito al cerrar sesión para evitar problemas
    if (typeof cart !== 'undefined') {
      cart.clear();
      if (typeof ui !== 'undefined') {
        ui.renderCart();
        ui.updateCartBadge();
      }
    }
  },
  
  isLoggedIn() {
    const user = localStorage.getItem(this.key);
    if (user) {
      try {
        this.currentUser = JSON.parse(user);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
  
  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin === 1;
  },
  
  getCurrentUser() {
    return this.currentUser;
  }
};

// Theme Helper
const theme = {
  key: 'super_theme_v1',
  
  apply(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem(this.key, themeName);
    
    const toggle = ui.qs('#themeToggle');
    if (toggle) {
      toggle.textContent = themeName === 'dark' ? '☀️' : '🌙';
    }
  },
  
  toggle() {
    const current = localStorage.getItem(this.key) || 'light';
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.apply(newTheme);
  }
};

// Eco Mode Helper
const ecoMode = {
  key: 'super_eco_v1',
  
  apply(isEco) {
    document.documentElement.setAttribute('data-eco', isEco);
    localStorage.setItem(this.key, isEco);
    
    const toggle = ui.qs('#ecoToggle');
    if (toggle) {
      toggle.textContent = isEco ? '🌿' : '🌱';
      toggle.style.color = isEco ? '#22c55e' : 'var(--muted)';
    }
  },
  
  toggle() {
    const current = localStorage.getItem(this.key) === 'true';
    const newMode = !current;
    this.apply(newMode);
    return newMode;
  }
};

// Modal Helper
function openAccountModal() {
  const overlay = ui.qs('#overlay');
  const modal = ui.qs('#accountModal');
  
  if (!overlay || !modal) {
    console.error('Modal elements not found');
    return;
  }
  
  // Reset forms
  const loginForm = ui.qs('#loginForm');
  const registerForm = ui.qs('#registerForm');
  const loginTab = ui.qs('#loginTab');
  const registerTab = ui.qs('#registerTab');
  const modalTitle = ui.qs('#modalTitle');
  const modalSubtitle = ui.qs('#modalSubtitle');
  
  if (loginForm) loginForm.classList.remove('hidden');
  if (registerForm) registerForm.classList.add('hidden');
  if (loginTab) loginTab.classList.add('active');
  if (registerTab) registerTab.classList.remove('active');
  
  // Reset titles
  if (modalTitle) modalTitle.textContent = 'Bienvenido/a – ingresa a tu cuenta';
  if (modalSubtitle) modalSubtitle.textContent = 'Inicia sesión o crea una cuenta para continuar con tu compra';
  
  // Clear forms
  ui.qs('#amEmail') && (ui.qs('#amEmail').value = '');
  ui.qs('#amPass') && (ui.qs('#amPass').value = '');
  ui.qs('#amName') && (ui.qs('#amName').value = '');
  ui.qs('#amEmailReg') && (ui.qs('#amEmailReg').value = '');
  ui.qs('#amPassReg') && (ui.qs('#amPassReg').value = '');
  
  // Tab switching
  if (loginTab) {
    loginTab.onclick = () => {
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
      loginTab.classList.add('active');
      registerTab?.classList.remove('active');
      if (modalTitle) modalTitle.textContent = 'Bienvenido/a – ingresa a tu cuenta';
      if (modalSubtitle) modalSubtitle.textContent = 'Inicia sesión o crea una cuenta para continuar con tu compra';
    };
  }
  
  if (registerTab) {
    registerTab.onclick = () => {
      loginForm?.classList.add('hidden');
      registerForm?.classList.remove('hidden');
      loginTab?.classList.remove('active');
      registerTab.classList.add('active');
      if (modalTitle) modalTitle.textContent = 'Crear nueva cuenta';
      if (modalSubtitle) modalSubtitle.textContent = 'Únete a EcoMarket y disfruta de productos frescos';
    };
  }
  
  // Event listeners
  ui.qs('#amClose')?.addEventListener('click', closeModal);
  
  ui.qs('#amLogin')?.addEventListener('click', async () => {
    const email = ui.qs('#amEmail')?.value;
    const password = ui.qs('#amPass')?.value;
    
    if (!email || !password) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      await auth.login(email, password);
      closeModal();
      updateUserUI();
      ui.showNotification('Bienvenido, ' + auth.currentUser.name, 'success');
    } catch (error) {
      ui.showNotification(error.message, 'error');
    }
  });
  
  ui.qs('#amRegister')?.addEventListener('click', async () => {
    const name = ui.qs('#amName')?.value;
    const email = ui.qs('#amEmailReg')?.value;
    const password = ui.qs('#amPassReg')?.value;
    
    if (!name || !email || !password) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      await auth.register(name, email, password);
      closeModal();
      updateUserUI();
      ui.showNotification('¡Cuenta creada exitosamente! Bienvenido/a, ' + name, 'success');
    } catch (error) {
      ui.showNotification(error.message, 'error');
    }
  });
  
  overlay.onclick = closeModal;
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');
}

function openAboutModal() {
  const overlay = ui.qs('#overlay');
  const modal = ui.qs('#aboutModal');
  
  if (!overlay || !modal) {
    console.error('Modal elements not found');
    return;
  }
  
  // Event listeners para cerrar el modal
  ui.qs('#aboutClose')?.addEventListener('click', closeModal);
  
  // Event listener para el botón "Comenzar a Comprar"
  ui.qs('#startShopping')?.addEventListener('click', () => {
    closeModal();
    // Scroll suave a la sección de productos
    const grid = ui.qs('#grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  overlay.onclick = closeModal;
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  ui.qs('#overlay')?.classList.add('hidden');
  ui.qs('#productModal')?.classList.add('hidden');
  ui.qs('#accountModal')?.classList.add('hidden');
  ui.qs('#aboutModal')?.classList.add('hidden');
  document.body.style.overflow = '';
}

function updateUserUI() {
  const accountIcon = ui.qs('#accountIcon');
  const profileLink = ui.qs('.profile-link');
  const adminLink = ui.qs('.admin-link');
  
  if (auth.isLoggedIn()) {
    if (accountIcon) {
      accountIcon.style.display = 'none';
      accountIcon.classList.add('hidden');
    }
    if (profileLink) {
      profileLink.classList.remove('hidden');
      profileLink.style.display = '';
    }
    if (adminLink && auth.isAdmin()) {
      adminLink.classList.remove('hidden');
      adminLink.style.display = '';
    }
  } else {
    if (accountIcon) {
      accountIcon.style.display = '';
      accountIcon.style.placeItems = '';
      accountIcon.classList.remove('hidden');
    }
    if (profileLink) {
      profileLink.classList.add('hidden');
      profileLink.style.display = 'none';
    }
    if (adminLink) {
      adminLink.classList.add('hidden');
      adminLink.style.display = 'none';
    }
  }
  
  // Actualizar estado del botón de checkout
  ui.updateCheckoutButton();
}

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Variable para mantener la categoría actual (accesible globalmente)
let currentCategory = '';

// Main function
async function bootIndex() {
  console.log('Iniciando bootIndex...');
  
  try {
    // Update cart badge
    ui.updateCartBadge();
    
    // Initialize auth
    auth.isLoggedIn();
    updateUserUI();
    
    // Update checkout button state
    ui.updateCheckoutButton();
    
    // Apply saved themes
    const savedTheme = localStorage.getItem(theme.key) || 'light';
    theme.apply(savedTheme);
    
    const savedEco = localStorage.getItem(ecoMode.key) === 'true';
    ecoMode.apply(savedEco);
    
    // Actualizar estado visual del icono eco
    updateEcoIconState();
    
  // Load features
  const features = ui.qs('#features');
  if (features) {
    features.innerHTML = `
      <div class="feature-card">
        <div class="feature-icon delivery">
          <span class="icon-symbol">⏰</span>
        </div>
        <div class="feature-content">
          <h3>Entrega en 2 Horas</h3>
          <p>Rápido y confiable</p>
        </div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon organic">
          <span class="icon-symbol">🌿</span>
        </div>
        <div class="feature-content">
          <h3>100% Orgánico</h3>
          <p>Calidad de granja</p>
        </div>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon prices">
          <span class="icon-symbol">💰</span>
        </div>
        <div class="feature-content">
          <h3>Mejores Precios</h3>
          <p>Ahorra hasta 40%</p>
        </div>
      </div>
    `;
    console.log('Features cargadas');
  }
    
    

// Load products function
async function loadProducts(category = '', query = '') {
  try {
    console.log('Cargando productos - categoría:', category, 'búsqueda:', query);
    let products;
    
    if (category === 'descuentos') {
      // Cargar todos los productos y filtrar solo los que tienen descuento
      const allProducts = await api.listProducts({ q: query });
      products = allProducts.filter(p => p.discount_percentage && p.discount_percentage > 0);
    } else {
      // Pasar tanto la categoría como la búsqueda al API
      products = await api.listProducts({ category, q: query });
    }
    
    ui.renderProducts(products);
    console.log('Productos renderizados:', products.length);
  } catch (error) {
    console.error('Error cargando productos:', error);
    const grid = ui.qs('#grid');
    if (grid) {
      grid.innerHTML = '<div class="error">Error cargando productos. Intenta recargar la página.</div>';
    }
  }
}
    
    // Event listeners
    const search = ui.qs('#search');
    if (search) {
      search.addEventListener('input', debounce(() => {
        const query = search.value.trim();
        // Mantener la categoría actual mientras se busca
        loadProducts(currentCategory, query);
      }, 300));
    }
    
    ui.qs('#cartIcon')?.addEventListener('click', () => {
      ui.renderCart();
      ui.openCart();
    });
    
    ui.qs('#closeCart')?.addEventListener('click', () => ui.closeCart());
    
    ui.qs('#themeToggle')?.addEventListener('click', () => theme.toggle());
    
    ui.qs('#ecoToggle')?.addEventListener('click', () => {
      ecoMode.toggle();
      updateEcoModeIndicator();
      updateEcoIconState();
      // Mantener categoría y búsqueda actuales
      const searchInput = ui.qs('#search');
      const query = searchInput ? searchInput.value.trim() : '';
      loadProducts(currentCategory, query);
    });
    
    // Función global para toggle del modo ecológico
    window.toggleEcoMode = () => {
      ecoMode.toggle();
      updateEcoModeIndicator();
      updateEcoIconState();
      // Mantener categoría y búsqueda actuales
      const searchInput = ui.qs('#search');
      const query = searchInput ? searchInput.value.trim() : '';
      loadProducts(currentCategory, query);
    };
    
    // Función para actualizar el indicador de modo ecológico
    function updateEcoModeIndicator() {
      const categories = ui.qs('#categories');
      if (!categories) return;
      
      const isEcoMode = localStorage.getItem('super_eco_v1') === 'true';
      
      // Buscar indicador existente en el contenedor padre
      const existingIndicator = categories.parentNode.querySelector('.eco-mode-indicator');
      
      if (isEcoMode && !existingIndicator) {
        // Solo crear indicador si está activo y no existe
        const indicator = document.createElement('div');
        indicator.className = 'eco-mode-indicator';
        indicator.innerHTML = `
          <div class="eco-indicator-content">
            <span class="eco-icon">🌱</span>
            <span class="eco-text">Modo Ecológico Activo</span>
            <span class="eco-subtitle">Solo productos eco</span>
          </div>
        `;
        
        // Insertar antes de las categorías
        categories.parentNode.insertBefore(indicator, categories);
      } else if (!isEcoMode && existingIndicator) {
        // Remover indicador si se desactiva el modo eco
        existingIndicator.remove();
      }
    }
    
    // Función para actualizar el estado visual del icono eco
    function updateEcoIconState() {
      const ecoIcon = ui.qs('#ecoToggle');
      if (!ecoIcon) return;
      
      const isEcoMode = localStorage.getItem('super_eco_v1') === 'true';
      
      if (isEcoMode) {
        ecoIcon.classList.add('eco-active');
      } else {
        ecoIcon.classList.remove('eco-active');
      }
    }
    
    ui.qs('#accountIcon')?.addEventListener('click', openAccountModal);
    
    ui.qs('#checkoutBtn')?.addEventListener('click', async () => {
      const items = cart.get();
      if (!items.length) {
        alert('Carrito vacío');
        return;
      }
      
      // Verificar si el usuario está autenticado
      const currentUser = auth.getCurrentUser();
      if (!currentUser) {
        // Usuario no autenticado - mostrar mensaje y abrir modal de login
        alert('🔐 Para realizar una compra, primero debes iniciar sesión.\n\nSe abrirá el formulario de login y se limpiará tu carrito temporal.');
        
        // Limpiar carrito para evitar problemas
        cart.clear();
        ui.renderCart();
        ui.updateCartBadge();
        
        // Abrir modal de login
        openAccountModal();
        
        // Enfocar en el tab de login
        setTimeout(() => {
          const loginTab = ui.qs('#loginTab');
          if (loginTab) {
            loginTab.click();
          }
        }, 100);
        
        return;
      }
      
      // Usuario autenticado - abrir sistema de checkout multi-paso
      openCheckoutModal();
    });
    
    ui.qs('#clearCartBtn')?.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres limpiar el carrito?')) {
        cart.clear();
        ui.renderCart();
        ui.updateCartBadge();
        alert('Carrito limpiado');
      }
    });
    
    // Load categories
    const categories = ui.qs('#categories');
    if (categories) {
      const options = [
        {emoji:'🧺',name:'Todas',value:''},
        {emoji:'🍎',name:'Frutas',value:'Frutas'},
        {emoji:'🥛',name:'Lácteos',value:'Lácteos'},
        {emoji:'🍞',name:'Panadería',value:'Panadería'},
        {emoji:'🥚',name:'Huevos',value:'Huevos'},
        {emoji:'🥤',name:'Bebidas',value:'Bebidas'},
        {emoji:'🧴',name:'Aseo',value:'Aseo'},
        {emoji:'🧽',name:'Limpieza',value:'Limpieza'},
        {emoji:'🎮',name:'Juegos',value:'Juegos'},
        {emoji:'🥩',name:'Carnes',value:'Carnes'},
        {emoji:'🌾',name:'Granos',value:'Granos'},
        {emoji:'🍝',name:'Pastas',value:'Pastas'},
        {emoji:'🥬',name:'Verduras',value:'Verduras'},
        {emoji:'💊',name:'Medicamentos',value:'Medicamentos'},
        {emoji:'🏷️',name:'Descuentos',value:'descuentos'}
      ];
      
      categories.innerHTML = options.map((o, i) => `
        <button class="cat ${i === 0 ? 'active' : ''}" data-cat="${o.value}">
          <div class="emoji">${o.emoji}</div>
          <div>${o.name}</div>
        </button>
      `).join('');
      
      // Agregar indicador de modo ecológico
      updateEcoModeIndicator();
      
      console.log('Categorías cargadas');
      
      // Event listeners para categorías
      categories.querySelectorAll('.cat').forEach(btn => {
        btn.onclick = () => {
          categories.querySelectorAll('.cat').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const category = btn.dataset.cat;
          console.log('Categoría seleccionada:', category);
          // Actualizar la categoría actual
          currentCategory = category;
          // Limpiar la búsqueda cuando se cambia de categoría
          const searchInput = ui.qs('#search');
          if (searchInput) {
            searchInput.value = '';
          }
          // Cargar productos con la nueva categoría y sin búsqueda
          loadProducts(category, '');
        };
      });
    }
    
    // Validar y limpiar carrito antes de cargar productos
    await cart.validateAndClean();
    
    // Load initial products (sin categoría ni búsqueda)
    currentCategory = '';
    await loadProducts('', '');
    
    // Event listeners para botones hero
    ui.qs('#shopNow')?.addEventListener('click', () => {
      // Scroll suave a la sección de productos
      const grid = ui.qs('#grid');
      if (grid) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Opcional: mostrar un mensaje de bienvenida
        setTimeout(() => {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
          `;
          notification.textContent = '🛒 ¡Explora nuestros productos!';
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
          }, 3000);
        }, 500);
      }
    });

    ui.qs('#learnMore')?.addEventListener('click', () => {
      openAboutModal();
    });
    
    console.log('bootIndex completado exitosamente');
    
  } catch (error) {
    console.error('Error en bootIndex:', error);
  }
}

// ===== SISTEMA DE CHECKOUT MULTI-PASO =====

// Variables globales para el checkout
let checkoutData = {
  currentStep: 1,
  address: {},
  delivery: 'standard',
  payment: 'card',
  cardData: {}
};

// Abrir modal de checkout
function openCheckoutModal() {
  const modal = ui.qs('#checkoutModal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Inicializar checkout
    initializeCheckout();
    updateCheckoutSummary();
  }
}

// Cerrar modal de checkout
function closeCheckoutModal() {
  const modal = ui.qs('#checkoutModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    
    // Resetear datos
    checkoutData = {
      currentStep: 1,
      address: {},
      delivery: 'standard',
      payment: 'card',
      cardData: {}
    };
  }
}

// Inicializar checkout
function initializeCheckout() {
  console.log('Inicializando checkout...');
  checkoutData.currentStep = 1;
  
  // Establecer valores por defecto
  checkoutData.payment = 'card';
  checkoutData.delivery = 'standard';
  
  console.log('Valores por defecto establecidos:', {
    payment: checkoutData.payment,
    delivery: checkoutData.delivery
  });
  
  showCheckoutStep(1);
  setupCheckoutEventListeners();
  setupFieldErrorListeners();
  
  // Forzar visibilidad de botones
  setTimeout(() => {
    forceButtonVisibility();
  }, 100);
  
  console.log('Checkout inicializado');
}

// Configurar event listeners para limpiar errores al escribir
function setupFieldErrorListeners() {
  const fieldIds = ['firstName', 'lastName', 'address', 'city', 'postalCode', 'phone', 'cardNumber', 'expiryDate', 'cvv', 'cardName'];
  
  fieldIds.forEach(fieldId => {
    const field = ui.qs(`#${fieldId}`);
    if (field) {
      // Agregar listener para limpiar error al escribir
      field.addEventListener('input', () => {
        if (field.value.trim()) {
          removeFieldError(fieldId);
        }
      });
      
      // Limpiar error al perder el foco si tiene valor
      field.addEventListener('blur', () => {
        if (field.value.trim()) {
          removeFieldError(fieldId);
        }
      });
    }
  });
  
  // Validación especial para campos numéricos
  setupNumericFields();
}

// Configurar validación para campos que solo deben aceptar números
function setupNumericFields() {
  // Campo de código postal
  const postalCode = ui.qs('#postalCode');
  if (postalCode && !postalCode.hasAttribute('data-numeric-listener')) {
    postalCode.addEventListener('input', (e) => {
      // Solo permitir números
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    postalCode.setAttribute('data-numeric-listener', 'true');
  }
  
  // Campo de teléfono
  const phone = ui.qs('#phone');
  if (phone && !phone.hasAttribute('data-numeric-listener')) {
    phone.addEventListener('input', (e) => {
      // Permitir números, espacios, guiones, paréntesis y el signo +
      let value = e.target.value;
      // Si el usuario intenta escribir letras, solo mantener números y caracteres permitidos
      value = value.replace(/[^\d\s\-\+\(\)]/g, '');
      e.target.value = value;
    });
    phone.setAttribute('data-numeric-listener', 'true');
    
    // También validar en keypress para prevenir que se escriban letras
    phone.addEventListener('keypress', (e) => {
      const char = String.fromCharCode(e.which);
      // Permitir números y caracteres especiales de formato de teléfono
      if (!/[0-9\s\-\+\(\)]/.test(char) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    });
  }
}

// Forzar visibilidad de botones
function forceButtonVisibility() {
  console.log('Forzando visibilidad de botones...');
  
  // Botones de dirección
  const addressButtons = ui.qsa('.address-buttons');
  addressButtons.forEach(actions => {
    actions.style.display = 'flex';
    actions.style.visibility = 'visible';
    actions.style.opacity = '1';
    console.log('Address buttons forzado:', actions);
  });
  
  const addressBtnElements = ui.qsa('.address-buttons .btn');
  addressBtnElements.forEach(btn => {
    btn.style.display = 'inline-block';
    btn.style.visibility = 'visible';
    btn.style.opacity = '1';
    console.log('Botón de dirección forzado:', btn);
  });
  
  // Botones de step-actions (para otros pasos)
  const stepActions = ui.qsa('.step-actions');
  stepActions.forEach(actions => {
    actions.style.display = 'flex';
    actions.style.visibility = 'visible';
    actions.style.opacity = '1';
    console.log('Step actions forzado:', actions);
  });
  
  const buttons = ui.qsa('.step-actions .btn');
  buttons.forEach(btn => {
    btn.style.display = 'inline-block';
    btn.style.visibility = 'visible';
    btn.style.opacity = '1';
    console.log('Botón forzado:', btn);
  });
}

// Mostrar paso específico del checkout
function showCheckoutStep(step) {
  console.log(`Mostrando paso ${step}`);
  
  // Limpiar todos los mensajes de error al cambiar de paso
  clearAllFieldErrors();
  
  // Ocultar todos los pasos
  ui.qsa('.checkout-step').forEach(s => s.classList.add('hidden'));
  
  // Mostrar paso actual
  const currentStepElement = ui.qs(`#step${step}`);
  if (currentStepElement) {
    currentStepElement.classList.remove('hidden');
    console.log(`Paso ${step} mostrado`);
    
    // Debug específico para paso 1
    if (step === 1) {
      const addressButtons = ui.qs('.address-buttons');
      const continueBtn = ui.qs('#continueToDeliveryBtn');
      console.log('Address buttons encontrado:', addressButtons);
      console.log('Botón continuar encontrado:', continueBtn);
      
      if (addressButtons) {
        console.log('Address buttons visible:', addressButtons.style.display);
        console.log('Address buttons opacity:', addressButtons.style.opacity);
      }
    }
    
    // Reconfigurar event listeners cuando se muestra un paso
    setTimeout(() => {
      setupStepEventListeners(step);
      setupFieldErrorListeners();
    }, 100);
  } else {
    console.error(`Paso ${step} no encontrado`);
  }
  
  // Actualizar indicadores de pasos
  ui.qsa('.step').forEach((s, index) => {
    const stepNumber = index + 1;
    s.classList.remove('active', 'completed');
    
    if (stepNumber === step) {
      s.classList.add('active');
    } else if (stepNumber < step) {
      s.classList.add('completed');
    }
  });
  
  checkoutData.currentStep = step;
}

// Configurar event listeners específicos para cada paso
function setupStepEventListeners(step) {
  console.log(`Configurando event listeners para paso ${step}`);
  
  if (step === 2) {
    // Event listeners para opciones de entrega
    ui.qsa('.delivery-option').forEach(option => {
      if (!option.hasAttribute('data-delivery-listener')) {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Click en opción de entrega:', option.dataset.delivery);
          
          ui.qsa('.delivery-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          checkoutData.delivery = option.dataset.delivery;
          
          console.log('Método de entrega seleccionado:', checkoutData.delivery);
          console.log('checkoutData actualizado:', checkoutData);
        });
        option.setAttribute('data-delivery-listener', 'true');
      }
    });
  }
  
  if (step === 3) {
    // Event listeners para opciones de pago
    ui.qsa('.payment-option').forEach(option => {
      if (!option.hasAttribute('data-payment-listener')) {
        option.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('Click en opción de pago:', option.dataset.payment);
          
          ui.qsa('.payment-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          checkoutData.payment = option.dataset.payment;
          
          console.log('Método de pago seleccionado:', checkoutData.payment);
          console.log('checkoutData actualizado:', checkoutData);
          
          // Mostrar/ocultar formulario de tarjeta
          const cardForm = ui.qs('#cardForm');
          if (cardForm) {
            cardForm.style.display = checkoutData.payment === 'card' ? 'block' : 'none';
          }
        });
        option.setAttribute('data-payment-listener', 'true');
      }
    });
  }
}

// Configurar event listeners del checkout
function setupCheckoutEventListeners() {
  console.log('Configurando event listeners del checkout...');
  
  // Limpiar event listeners existentes para evitar duplicados
  const existingListeners = document.querySelectorAll('[data-checkout-listener]');
  existingListeners.forEach(el => el.removeAttribute('data-checkout-listener'));
  
  // Botón volver del header
  const backBtn = ui.qs('#checkoutBackBtn');
  if (backBtn && !backBtn.hasAttribute('data-checkout-listener')) {
    backBtn.addEventListener('click', () => {
      if (checkoutData.currentStep === 1) {
        closeCheckoutModal();
      } else {
        showCheckoutStep(checkoutData.currentStep - 1);
      }
    });
    backBtn.setAttribute('data-checkout-listener', 'true');
  }
  
  // Paso 1: Dirección
  const backToCartBtn = ui.qs('#backToCartBtn');
  if (backToCartBtn && !backToCartBtn.hasAttribute('data-checkout-listener')) {
    backToCartBtn.addEventListener('click', closeCheckoutModal);
    backToCartBtn.setAttribute('data-checkout-listener', 'true');
  }
  
  const continueBtn = ui.qs('#continueToDeliveryBtn');
  console.log('Botón continuar encontrado:', continueBtn);
  if (continueBtn && !continueBtn.hasAttribute('data-checkout-listener')) {
    console.log('Agregando event listener al botón continuar');
    continueBtn.addEventListener('click', () => {
      console.log('Botón Continuar clickeado');
      if (validateAddressForm()) {
        console.log('Formulario válido, avanzando al paso 2');
        showCheckoutStep(2);
      } else {
        console.log('Formulario inválido');
      }
    });
    continueBtn.setAttribute('data-checkout-listener', 'true');
  } else if (continueBtn) {
    console.log('Botón continuar ya tiene event listener');
  } else {
    console.log('Botón continuar no encontrado');
  }
  
  // Paso 2: Entrega
  const backToAddressBtn = ui.qs('#backToAddressBtn');
  if (backToAddressBtn && !backToAddressBtn.hasAttribute('data-checkout-listener')) {
    backToAddressBtn.addEventListener('click', () => showCheckoutStep(1));
    backToAddressBtn.setAttribute('data-checkout-listener', 'true');
  }
  
  const continueToPaymentBtn = ui.qs('#continueToPaymentBtn');
  if (continueToPaymentBtn && !continueToPaymentBtn.hasAttribute('data-checkout-listener')) {
    continueToPaymentBtn.addEventListener('click', () => {
      console.log('Avanzando al paso 3');
      showCheckoutStep(3);
    });
    continueToPaymentBtn.setAttribute('data-checkout-listener', 'true');
  }
  
  // Opciones de entrega
  ui.qsa('.delivery-option').forEach(option => {
    if (!option.hasAttribute('data-checkout-listener')) {
      option.addEventListener('click', () => {
        ui.qsa('.delivery-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        checkoutData.delivery = option.dataset.delivery;
        updateCheckoutSummary();
      });
      option.setAttribute('data-checkout-listener', 'true');
    }
  });
  
  // Paso 3: Pago
  const backToDeliveryBtn = ui.qs('#backToDeliveryBtn');
  if (backToDeliveryBtn && !backToDeliveryBtn.hasAttribute('data-checkout-listener')) {
    backToDeliveryBtn.addEventListener('click', () => showCheckoutStep(2));
    backToDeliveryBtn.setAttribute('data-checkout-listener', 'true');
  }
  
  const completeOrderBtn = ui.qs('#completeOrderBtn');
  if (completeOrderBtn && !completeOrderBtn.hasAttribute('data-checkout-listener')) {
    completeOrderBtn.addEventListener('click', completeOrder);
    completeOrderBtn.setAttribute('data-checkout-listener', 'true');
  }
  
  // Los event listeners de pago y entrega se configuran en setupStepEventListeners
  
  // Formatear número de tarjeta
  const cardNumber = ui.qs('#cardNumber');
  if (cardNumber && !cardNumber.hasAttribute('data-checkout-listener')) {
    cardNumber.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
      let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formattedValue;
    });
    cardNumber.setAttribute('data-checkout-listener', 'true');
  }
  
  // Formatear fecha de vencimiento
  const expiryDate = ui.qs('#expiryDate');
  if (expiryDate && !expiryDate.hasAttribute('data-checkout-listener')) {
    expiryDate.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });
    expiryDate.setAttribute('data-checkout-listener', 'true');
  }
  
  // Solo números para CVV
  const cvv = ui.qs('#cvv');
  if (cvv && !cvv.hasAttribute('data-checkout-listener')) {
    cvv.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    cvv.setAttribute('data-checkout-listener', 'true');
  }
}

// Funciones helper para mensajes de error
function showFieldError(fieldId, message) {
  const field = ui.qs(`#${fieldId}`);
  if (!field) return;
  
  // Remover mensaje de error existente
  removeFieldError(fieldId);
  
  // Agregar estilo de error al campo
  field.style.borderColor = '#ef4444';
  field.classList.add('error-field');
  
  // Crear elemento de mensaje de error
  const errorMsg = document.createElement('div');
  errorMsg.className = 'field-error';
  errorMsg.id = `${fieldId}-error`;
  errorMsg.textContent = message;
  errorMsg.style.color = '#ef4444';
  errorMsg.style.fontSize = '11px';
  errorMsg.style.marginTop = '1px';
  errorMsg.style.marginBottom = '0';
  errorMsg.style.paddingTop = '0';
  errorMsg.style.paddingBottom = '0';
  errorMsg.style.lineHeight = '1.2';
  errorMsg.style.minHeight = '0';
  
  // Insertar después del campo
  field.parentNode.insertBefore(errorMsg, field.nextSibling);
}

function removeFieldError(fieldId) {
  const field = ui.qs(`#${fieldId}`);
  if (!field) return;
  
  // Remover estilo de error
  field.style.borderColor = '';
  field.classList.remove('error-field');
  
  // Remover mensaje de error existente
  const existingError = ui.qs(`#${fieldId}-error`);
  if (existingError) {
    existingError.remove();
  }
}

function clearAllFieldErrors() {
  const fieldIds = ['firstName', 'lastName', 'address', 'city', 'postalCode', 'phone', 'cardNumber', 'expiryDate', 'cvv', 'cardName'];
  fieldIds.forEach(fieldId => removeFieldError(fieldId));
}

// Validar formulario de dirección
function validateAddressForm() {
  clearAllFieldErrors();
  
  // Si es pickup, solo validar nombre y teléfono
  if (checkoutData.delivery === 'pickup') {
    const requiredFields = [
      { id: 'firstName', label: 'Nombre' },
      { id: 'lastName', label: 'Apellido' },
      { id: 'phone', label: 'Teléfono' }
    ];
    let isValid = true;
    
    requiredFields.forEach(({ id, label }) => {
      const field = ui.qs(`#${id}`);
      if (field && !field.value.trim()) {
        showFieldError(id, `Por favor completa el campo ${label}`);
        isValid = false;
      } else {
        removeFieldError(id);
      }
    });
    
    if (isValid) {
      // Guardar datos mínimos para pickup
      checkoutData.address = {
        firstName: ui.qs('#firstName').value,
        lastName: ui.qs('#lastName').value,
        phone: ui.qs('#phone').value,
        address: 'Recoger en tienda',
        city: 'Recoger en tienda',
        postalCode: 'N/A'
      };
    } else {
      // Hacer scroll al primer campo con error
      const firstErrorField = requiredFields.find(({ id }) => {
        const field = ui.qs(`#${id}`);
        return field && !field.value.trim();
      });
      if (firstErrorField) {
        const field = ui.qs(`#${firstErrorField.id}`);
        if (field) {
          field.focus();
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
    
    return isValid;
  }
  
  // Para entregas normales, validar todos los campos
  const requiredFields = [
    { id: 'firstName', label: 'Nombre' },
    { id: 'lastName', label: 'Apellido' },
    { id: 'address', label: 'Dirección' },
    { id: 'city', label: 'Ciudad' },
    { id: 'postalCode', label: 'Código Postal' },
    { id: 'phone', label: 'Teléfono' }
  ];
  let isValid = true;
  
  requiredFields.forEach(({ id, label }) => {
    const field = ui.qs(`#${id}`);
    if (field && !field.value.trim()) {
      showFieldError(id, `Por favor completa el campo ${label}`);
      isValid = false;
    } else {
      removeFieldError(id);
    }
  });
  
  if (isValid) {
    // Guardar datos de dirección
    checkoutData.address = {
      firstName: ui.qs('#firstName').value,
      lastName: ui.qs('#lastName').value,
      address: ui.qs('#address').value,
      city: ui.qs('#city').value,
      postalCode: ui.qs('#postalCode').value,
      phone: ui.qs('#phone').value
    };
  } else {
    // Hacer scroll al primer campo con error
    const firstErrorField = requiredFields.find(({ id }) => {
      const field = ui.qs(`#${id}`);
      return field && !field.value.trim();
    });
    if (firstErrorField) {
      const field = ui.qs(`#${firstErrorField.id}`);
      if (field) {
        field.focus();
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  
  return isValid;
}

// Actualizar resumen del pedido
function updateCheckoutSummary() {
  let items = cart.get();
  
  // LIMPIAR Y VALIDAR ITEMS: Asegurar que todos los precios y cantidades sean positivos
  items = items.map(item => ({
    ...item,
    price: Math.max(0, Number(item.price) || 0),
    quantity: Math.max(0, Number(item.quantity) || 0)
  })).filter(item => item.price > 0 && item.quantity > 0); // Eliminar items inválidos
  
  // Guardar items corregidos de vuelta al carrito
  if (items.length !== cart.get().length || items.some((item, idx) => {
    const original = cart.get()[idx];
    return original && (item.price !== original.price || item.quantity !== original.quantity);
  })) {
    localStorage.setItem('super_cart_v1', JSON.stringify(items));
  }
  
  const summaryItems = ui.qs('#checkoutSummaryItems');
  
  console.log('=== ACTUALIZANDO RESUMEN DEL CHECKOUT ===');
  console.log('Items en carrito (validados):', items);
  console.log('Elemento summaryItems encontrado:', !!summaryItems);
  console.log('Elemento summaryItems:', summaryItems);
  
  if (summaryItems) {
    if (items.length === 0) {
      console.log('Carrito vacío, mostrando mensaje');
      summaryItems.innerHTML = '<div class="empty-summary">No hay productos en el carrito</div>';
    } else {
      console.log('Renderizando', items.length, 'productos');
      summaryItems.innerHTML = items.map(item => {
        const imageSrc = item.image && item.image.trim() !== '' ? item.image : '/assets/img/placeholder.png';
        console.log('Item en resumen:', { 
          name: item.name, 
          image: imageSrc, 
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        });
        
        return `
          <div class="summary-item">
            <img src="${imageSrc}" alt="${item.name}" onerror="this.src='/assets/img/placeholder.png'">
            <div class="summary-item-info">
              <div class="summary-item-name">${item.name}</div>
              <div class="summary-item-details">Cantidad: ${item.quantity}</div>
            </div>
            <div class="summary-item-price">${ui.money(Math.max(0, item.price * item.quantity))}</div>
          </div>
        `;
      }).join('');
      
      console.log('HTML generado:', summaryItems.innerHTML);
    }
  } else {
    console.error('No se encontró el elemento #checkoutSummaryItems');
  }
  
  // Calcular totales - asegurar que precios y cantidades sean positivos
  const subtotal = Math.max(0, items.reduce((sum, item) => {
    const price = Math.max(0, item.price || 0);
    const quantity = Math.max(0, item.quantity || 0);
    return sum + (price * quantity);
  }, 0));
  const tax = Math.max(0, subtotal * 0.08); // 8% de impuesto
  const shipping = Math.max(0, getShippingCost());
  const total = Math.max(0, subtotal + tax + shipping);
  
  // Actualizar totales en el resumen - FORZAR valores positivos
  const safeSubtotal = Math.abs(Math.max(0, subtotal));
  const safeTax = Math.abs(Math.max(0, tax));
  const safeShipping = Math.abs(Math.max(0, shipping));
  const safeTotal = Math.abs(Math.max(0, total));
  
  ui.qs('#checkoutSubtotal') && (ui.qs('#checkoutSubtotal').textContent = ui.money(safeSubtotal));
  ui.qs('#checkoutTax') && (ui.qs('#checkoutTax').textContent = ui.money(safeTax));
  ui.qs('#checkoutShipping') && (ui.qs('#checkoutShipping').textContent = ui.money(safeShipping));
  ui.qs('#checkoutTotal') && (ui.qs('#checkoutTotal').textContent = ui.money(safeTotal));
}

// Obtener costo de envío
function getShippingCost() {
  console.log('getShippingCost - checkoutData.delivery:', checkoutData.delivery);
  
  if (!checkoutData.delivery) {
    console.warn('checkoutData.delivery no está definido, usando standard');
    return 10000;
  }
  
  switch (checkoutData.delivery) {
    case 'express': return 18000;
    case 'standard': return 10000;
    case 'pickup': return 0;
    default: 
      console.warn('Método de entrega desconocido:', checkoutData.delivery);
      return 10000;
  }
}

// Completar pedido
async function completeOrder() {
  console.log('Iniciando proceso de completar pedido...');
  
  // Validar dirección primero
  if (!validateAddressForm()) {
    console.log('Dirección inválida, regresando al paso 1');
    showCheckoutStep(1);
    return;
  }
  
  // Validar datos de pago si es tarjeta
  if (checkoutData.payment === 'card') {
    console.log('Validando datos de tarjeta...');
    const cardFields = [
      { id: 'cardNumber', label: 'Número de Tarjeta' },
      { id: 'expiryDate', label: 'Fecha de Vencimiento' },
      { id: 'cvv', label: 'CVV' },
      { id: 'cardName', label: 'Nombre en la Tarjeta' }
    ];
    let isValid = true;
    
    cardFields.forEach(({ id, label }) => {
      const field = ui.qs(`#${id}`);
      if (field && !field.value.trim()) {
        showFieldError(id, `Por favor completa el campo ${label}`);
        isValid = false;
      } else {
        removeFieldError(id);
      }
    });
    
    if (!isValid) {
      // Hacer scroll al primer campo con error
      const firstErrorField = cardFields.find(({ id }) => {
        const field = ui.qs(`#${id}`);
        return field && !field.value.trim();
      });
      if (firstErrorField) {
        const field = ui.qs(`#${firstErrorField.id}`);
        if (field) field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Guardar datos de tarjeta
    checkoutData.cardData = {
      number: ui.qs('#cardNumber').value,
      expiry: ui.qs('#expiryDate').value,
      cvv: ui.qs('#cvv').value,
      name: ui.qs('#cardName').value
    };
    console.log('Datos de tarjeta guardados');
  }
  
  try {
    console.log('Obteniendo items del carrito...');
    let items = cart.get();
    console.log('Items del carrito:', items);
    
    if (!items || items.length === 0) {
      alert('No hay productos en el carrito');
      return;
    }
    
    console.log('checkoutData actual antes de procesar:', checkoutData);
    
    // VALIDAR Y LIMPIAR ITEMS: Asegurar que todos los precios y cantidades sean positivos
    items = items.map(item => ({
      ...item,
      price: Math.max(0, Number(item.price) || 0),
      quantity: Math.max(0, Number(item.quantity) || 0)
    })).filter(item => item.price > 0 && item.quantity > 0);
    
    // Calcular totales - asegurar que precios y cantidades sean positivos
    const subtotal = Math.max(0, items.reduce((sum, item) => {
      const price = Math.max(0, item.price || 0);
      const quantity = Math.max(0, item.quantity || 0);
      return sum + (price * quantity);
    }, 0));
    const tax = Math.abs(Math.max(0, subtotal * 0.08));
    const shipping = Math.abs(Math.max(0, getShippingCost()));
    const total = Math.abs(Math.max(0, subtotal + tax + shipping));
    
    console.log('Cálculos:', { subtotal, tax, shipping, total });
    
    const payload = items.map(i => ({ 
      productId: i.productId, 
      quantity: i.quantity,
      price: i.price
    }));
    
    console.log('Payload para API:', payload);
    
    const currentUser = auth.getCurrentUser();
    console.log('Usuario actual:', currentUser);
    
    if (!currentUser) {
      alert('Error: Usuario no autenticado');
      return;
    }
    
    console.log('Enviando pedido a la API...');
    console.log('Datos del checkout ANTES de enviar:', {
      payment: checkoutData.payment,
      delivery: checkoutData.delivery,
      shipping: shipping,
      checkoutData: checkoutData
    });
    
    console.log('Datos del checkout antes de enviar:', {
      payment: checkoutData.payment,
      delivery: checkoutData.delivery,
      shipping: shipping,
      payload: payload,
      currentUser: currentUser
    });
    
    // Validar que todos los datos requeridos estén presentes
    if (!checkoutData.payment) {
      console.error('Error: paymentMethod no está definido');
      alert('Error: Método de pago no seleccionado');
      return;
    }
    
    if (!checkoutData.delivery) {
      console.error('Error: deliveryMethod no está definido');
      alert('Error: Método de entrega no seleccionado');
      return;
    }
    
    if (shipping === undefined || shipping === null) {
      console.error('Error: shippingCost no está definido');
      alert('Error: Costo de envío no calculado');
      return;
    }
    
    const order = await api.createOrder(payload, currentUser.id, checkoutData.payment, checkoutData.delivery, shipping);
    console.log('Pedido creado:', order);
    
    // Mostrar notificación push de compra exitosa
    ui.showNotification('Compra exitosa', 'success');
    
    // Limpiar carrito y cerrar modal
    cart.clear();
    ui.renderCart();
    ui.updateCartBadge();
    closeCheckoutModal();
    
    // Recargar productos si estamos en la página principal
    if (typeof loadProducts === 'function') {
      const searchInput = ui.qs('#search');
      const query = searchInput ? searchInput.value.trim() : '';
      loadProducts(currentCategory, query);
    }
    
  } catch (error) {
    console.error('Error completando pedido:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      checkoutData: checkoutData
    });
    alert(`Error al procesar el pedido: ${error.message}\n\nIntenta nuevamente.`);
  }
}

// Obtener nombre del método de entrega
function getDeliveryMethodName() {
  switch (checkoutData.delivery) {
    case 'express': return 'Entrega Express (1-2 horas)';
    case 'standard': return 'Entrega Estándar (Mismo día)';
    case 'pickup': return 'Recoger en Tienda';
    default: return 'Entrega Estándar';
  }
}

// Obtener nombre del método de pago
function getPaymentMethodName() {
  switch (checkoutData.payment) {
    case 'card': return 'Tarjeta de Crédito';
    case 'cash': return 'Contra Entrega';
    default: return 'Tarjeta de Crédito';
  }
}

// Admin function
async function bootAdmin() {
  console.log('Iniciando bootAdmin...');
  
  if (!auth.isLoggedIn() || !auth.isAdmin()) {
    alert('Acceso restringido. Solo administradores.');
    window.location.href = '/';
    return;
  }
  
  try {
    // Cargar categorías
    await loadCategories();
    
    // Cargar productos
    await loadAdminProducts();
    
    // Event listeners para búsqueda
    const searchInput = ui.qs('#adminSearch');
    const categoryFilter = ui.qs('#adminCategoryFilter');
    const searchBtn = ui.qs('#adminSearchBtn');
    const clearBtn = ui.qs('#adminClearBtn');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput?.value || '';
        const category = categoryFilter?.value || '';
        loadAdminProducts(query, category);
      });
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        loadAdminProducts();
      });
    }
    
    // Event listeners para categorías
    const addCategoryBtn = ui.qs('#addCategory');
    const resetCategoryBtn = ui.qs('#resetCategory');
    
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', async () => {
        const name = ui.qs('#categoryName')?.value;
        const description = ui.qs('#categoryDescription')?.value;
        const editingId = addCategoryBtn.dataset.editingId;
        
        if (!name) {
          alert('El nombre de la categoría es requerido');
          return;
        }
        
        try {
          if (editingId) {
            // Actualizar categoría existente
            await api.updateCategory(editingId, { name, description });
            alert('Categoría actualizada exitosamente');
          } else {
            // Crear nueva categoría
            await api.createCategory({ name, description });
            alert('Categoría creada exitosamente');
          }
          
          await loadCategories();
          ui.qs('#categoryName').value = '';
          ui.qs('#categoryDescription').value = '';
          
          // Resetear el botón
          addCategoryBtn.textContent = 'Añadir Categoría';
          delete addCategoryBtn.dataset.editingId;
        } catch (error) {
          console.error('Error procesando categoría:', error);
          alert('Error al procesar categoría: ' + error.message);
        }
      });
    }
    
    if (resetCategoryBtn) {
      resetCategoryBtn.addEventListener('click', () => {
        ui.qs('#categoryName').value = '';
        ui.qs('#categoryDescription').value = '';
        
        // Resetear el botón de añadir
        const addBtn = ui.qs('#addCategory');
        if (addBtn) {
          addBtn.textContent = 'Añadir Categoría';
          delete addBtn.dataset.editingId;
        }
      });
    }
    
    // Event listener para formulario de productos
    const productForm = ui.qs('#productForm');
    console.log('Formulario encontrado:', productForm);
    if (productForm) {
      console.log('Registrando event listener para el formulario');
      productForm.addEventListener('submit', async (e) => {
        console.log('Evento submit interceptado!');
        e.preventDefault();
        
        const formData = new FormData(productForm);
        const productData = {
          name: formData.get('name'),
          description: formData.get('description'),
          price: parseFloat(formData.get('price')),
          stock: parseInt(formData.get('stock')),
          category: formData.get('category'),
          image: formData.get('image'),
          isEco: formData.get('isEco') === '1' || formData.get('isEco') === 'on',
          discount: parseFloat(formData.get('discount')) || 0
        };
        
        console.log('Datos del formulario:', productData);
        console.log('Valores individuales:', {
          name: formData.get('name'),
          description: formData.get('description'),
          price: formData.get('price'),
          stock: formData.get('stock'),
          category: formData.get('category'),
          image: formData.get('image'),
          isEco: formData.get('isEco'),
          discount: formData.get('discount')
        });
        
        const productId = ui.qs('#productId')?.value;
        console.log('Product ID:', productId);
        
        try {
          if (productId) {
            await api.updateProduct(productId, productData);
            alert('Producto actualizado exitosamente');
          } else {
            await api.createProduct(productData);
            alert('Producto creado exitosamente');
          }
          
          productForm.reset();
          ui.qs('#productId').value = '';
          await loadAdminProducts();
        } catch (error) {
          console.error('Error guardando producto:', error);
          alert('Error al guardar producto: ' + error.message);
        }
      });
    }
    
    // Event listener para logout
    const logoutBtn = ui.qs('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        auth.logout();
        window.location.href = '/';
      });
    }
    
    console.log('Admin panel cargado exitosamente');
    
  } catch (error) {
    console.error('Error en bootAdmin:', error);
  }
}


// Función para cargar categorías en el admin
async function loadCategories() {
  try {
    const categories = await api.listCategories();
    const categoriesList = ui.qs('#categoriesList');
    const categorySelect = ui.qs('#category');
    
    if (categoriesList) {
      categoriesList.innerHTML = categories.map(cat => `
        <div class="table-row">
          <span>${cat.name}</span>
          <span>${cat.description || '-'}</span>
          <div class="table-actions">
            <button class="btn" onclick="editCategory(${cat.id})">✏️</button>
            <button class="btn" onclick="deleteCategory(${cat.id})" style="background: #ef4444; color: white;">🗑️</button>
          </div>
        </div>
      `).join('');
    }
    
    if (categorySelect) {
      const currentValue = categorySelect.value;
      categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>' +
        categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
      categorySelect.value = currentValue;
    }
    
    // Actualizar también el filtro de categorías
    const categoryFilter = ui.qs('#adminCategoryFilter');
    if (categoryFilter) {
      const currentFilterValue = categoryFilter.value;
      categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' +
        categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
      categoryFilter.value = currentFilterValue;
    }
    
  } catch (error) {
    console.error('Error cargando categorías:', error);
  }
}

// Función para determinar la clase CSS del stock según el nivel
function getStockClass(stock) {
  const stockNumber = parseInt(stock);
  if (stockNumber === 0) {
    return 'stock-empty'; // Sin stock
  } else if (stockNumber <= 5) {
    return 'stock-low'; // Stock bajo
  } else if (stockNumber <= 15) {
    return 'stock-medium'; // Stock medio
  } else {
    return 'stock-high'; // Stock alto
  }
}

// Función para actualizar el resumen de stock
function updateStockSummary(products) {
  const emptyStock = products.filter(p => parseInt(p.stock) === 0).length;
  const lowStock = products.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= 5).length;
  const mediumStock = products.filter(p => parseInt(p.stock) > 5 && parseInt(p.stock) <= 15).length;
  const highStock = products.filter(p => parseInt(p.stock) > 15).length;
  
  // Actualizar los números en el DOM
  const emptyElement = ui.qs('#emptyStock');
  const lowElement = ui.qs('#lowStock');
  const mediumElement = ui.qs('#mediumStock');
  const highElement = ui.qs('#highStock');
  
  if (emptyElement) emptyElement.textContent = emptyStock;
  if (lowElement) lowElement.textContent = lowStock;
  if (mediumElement) mediumElement.textContent = mediumStock;
  if (highElement) highElement.textContent = highStock;
  
  console.log('Resumen de stock actualizado:', {
    empty: emptyStock,
    low: lowStock,
    medium: mediumStock,
    high: highStock,
    total: products.length
  });
}

// Función para cargar productos en el admin
async function loadAdminProducts(query = '', category = '') {
  try {
    let products;
    
    if (category === 'descuentos') {
      // Cargar todos los productos y filtrar solo los que tienen descuento
      const allProducts = await api.listProducts({ q: query });
      products = allProducts.filter(p => p.discount_percentage && p.discount_percentage > 0);
    } else {
      products = await api.listProducts({ q: query, category });
    }
    
    const adminList = ui.qs('#adminList');
    
    if (adminList) {
      adminList.innerHTML = products.map(product => `
        <div class="table-item">
          <div class="product-image">
            <img src="${product.image || '/assets/img/placeholder.png'}" alt="${product.name}" loading="lazy" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
          </div>
          <span style="font-weight: 600;">${product.name}</span>
          <span style="font-weight: 600; color: var(--primary);">$${product.price}</span>
          <span class="stock-indicator ${getStockClass(product.stock)}">${product.stock}</span>
          <span>${product.category || '-'}</span>
          <span style="text-align: center;">${product.isEco ? '🌿 Sí' : '❌ No'}</span>
          <div class="table-actions">
            <button class="btn" onclick="editProduct(${product.id})" title="Editar">✏️</button>
            <button class="btn" onclick="deleteProduct(${product.id})" style="background: #ef4444; color: white;" title="Eliminar">🗑️</button>
          </div>
        </div>
      `).join('');
      
      // Actualizar resumen de stock
      updateStockSummary(products);
    }
  } catch (error) {
    console.error('Error cargando productos:', error);
  }
}

// Funciones globales para editar/eliminar
window.editProduct = async function(id) {
  try {
    const product = await api.getProduct(id);
    console.log('Producto cargado para edición:', product);
    
    ui.qs('#productId').value = product.id;
    ui.qs('#name').value = product.name;
    ui.qs('#description').value = product.description || '';
    ui.qs('#price').value = product.price;
    ui.qs('#stock').value = product.stock;
    ui.qs('#category').value = product.category || '';
    ui.qs('#image').value = product.image || '';
    ui.qs('#isEco').value = product.isEco ? '1' : '0';
    ui.qs('#isEcoCheckbox').checked = product.isEco == 1;
    ui.qs('#discount').value = product.discount_percentage || 0;
    
    console.log('Formulario poblado con:', {
      id: ui.qs('#productId').value,
      name: ui.qs('#name').value,
      stock: ui.qs('#stock').value,
      discount: ui.qs('#discount').value
    });
    
    // Scroll to form
    ui.qs('#productForm').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error cargando producto:', error);
    alert('Error al cargar producto');
  }
};

window.deleteProduct = async function(id) {
  if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
    try {
      await api.deleteProduct(id);
      alert('Producto eliminado exitosamente');
      await loadAdminProducts();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar producto');
    }
  }
};

window.editCategory = async function(id) {
  try {
    const category = await api.getCategory(id);
    
    ui.qs('#categoryName').value = category.name;
    ui.qs('#categoryDescription').value = category.description || '';
    
    // Cambiar el botón para indicar que estamos editando
    const addBtn = ui.qs('#addCategory');
    if (addBtn) {
      addBtn.textContent = 'Actualizar Categoría';
      addBtn.dataset.editingId = id;
    }
    
    // Scroll to form
    ui.qs('#categoryName').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error cargando categoría:', error);
    alert('Error al cargar categoría');
  }
};

window.deleteCategory = async function(id) {
  if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
    try {
      await api.deleteCategory(id);
      alert('Categoría eliminada exitosamente');
      await loadCategories();
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert('Error al eliminar categoría');
    }
  }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado, iniciando aplicación...');
  
  const path = document.location.pathname;
  console.log('Ruta actual:', path);
  
  if (path === '/admin.html' || path === '/views/admin.html') {
    console.log('Cargando admin...');
    bootAdmin();
  } else if (path === '/profile.html' || path === '/views/profile.html') {
    console.log('Cargando perfil...');
    // Profile has its own script
  } else {
    console.log('Cargando página principal...');
    bootIndex();
  }
});

console.log('EcoMarket App cargado');
