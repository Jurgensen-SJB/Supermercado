// SuperMercado App - Versión Funcional
console.log('SuperMercado App iniciando...');

// UI Helper
const ui = {
  qs(sel) { return document.querySelector(sel); },
  qsa(sel) { return [...document.querySelectorAll(sel)]; },
  money(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(n); },
  
  updateCartBadge() {
    const badge = this.qs('#cartCount');
    if (badge) {
      const count = cart.get().reduce((a, b) => a + b.quantity, 0);
      badge.textContent = count;
    }
  },
  
  renderProducts(list) {
    const grid = this.qs('#grid');
    if (!grid) {
      console.error('Grid no encontrado');
      return;
    }
    
    console.log('Renderizando', list.length, 'productos');
    
    const isEcoMode = localStorage.getItem('super_eco_v1') === 'true';
    
    grid.innerHTML = list.map(p => `
      <article class="card product">
        ${isEcoMode && p.isEco ? '<div class="eco-badge">🌿 Eco</div>' : ''}
        <img src="${p.image || ''}" alt="${p.name}" loading="lazy">
        <h3>${p.name}</h3>
        <div class="muted">${p.category || ''}</div>
        <div class="row" style="align-items:center;justify-content:space-between">
          <span class="price">${this.money(p.price)}</span>
          <button class="btn" data-add="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
            ${p.stock <= 0 ? 'Sin Stock' : 'Añadir'}
          </button>
        </div>
      </article>
    `).join('');
    
    // Event listener para botones de añadir
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
  },
  
  renderCart() {
    const cartPanel = this.qs('#cartPanel');
    const cartItems = this.qs('#cartItems');
    const cartTotal = this.qs('#cartTotal');
    
    if (!cartPanel || !cartItems) return;
    
    const items = cart.get();
    
    if (items.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart">Carrito vacío</div>';
      if (cartTotal) cartTotal.textContent = this.money(0);
      return;
    }
    
    cartItems.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="item-info">
          <h4>${item.name}</h4>
          <p>${this.money(item.price)}</p>
        </div>
        <div class="item-controls">
          <button class="btn" data-remove="${item.productId}">-</button>
          <span>${item.quantity}</span>
          <button class="btn" data-add="${item.productId}">+</button>
        </div>
      </div>
    `).join('');
    
    // Event listeners para controles del carrito
    cartItems.onclick = (e) => {
      const addId = e.target.dataset.add;
      const removeId = e.target.dataset.remove;
      
      if (addId) {
        const item = items.find(i => i.productId == addId);
        if (item) {
          cart.add(item, 1);
          this.renderCart();
          this.updateCartBadge();
        }
      }
      
      if (removeId) {
        cart.remove(removeId);
        this.renderCart();
        this.updateCartBadge();
      }
    };
    
    // Actualizar total
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      return JSON.parse(localStorage.getItem(this.key) || '[]');
    } catch {
      return [];
    }
  },
  
  add(product, quantity = 1) {
    const items = this.get();
    const existing = items.find(i => i.productId === product.id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity
      });
    }
    
    localStorage.setItem(this.key, JSON.stringify(items));
  },
  
  remove(productId) {
    const items = this.get();
    const filtered = items.filter(i => i.productId !== productId);
    localStorage.setItem(this.key, JSON.stringify(filtered));
  },
  
  clear() {
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
  
  async createOrder(items) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en API createOrder:', error);
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
  
  if (loginForm) loginForm.classList.remove('hidden');
  if (registerForm) registerForm.classList.add('hidden');
  if (loginTab) loginTab.classList.add('active');
  if (registerTab) registerTab.classList.remove('active');
  
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
      alert('Bienvenido, ' + auth.currentUser.name);
    } catch (error) {
      alert(error.message);
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
      alert('¡Cuenta creada exitosamente! Bienvenido/a, ' + name);
    } catch (error) {
      alert(error.message);
    }
  });
  
  overlay.onclick = closeModal;
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');
}

function closeModal() {
  ui.qs('#overlay')?.classList.add('hidden');
  ui.qs('#productModal')?.classList.add('hidden');
  ui.qs('#accountModal')?.classList.add('hidden');
}

function updateUserUI() {
  const accountIcon = ui.qs('#accountIcon');
  const profileLink = ui.qs('.profile-link');
  const adminLink = ui.qs('.admin-link');
  
  if (auth.isLoggedIn()) {
    if (accountIcon) accountIcon.style.display = 'none';
    if (profileLink) profileLink.classList.remove('hidden');
    if (adminLink && auth.isAdmin()) {
      adminLink.classList.remove('hidden');
    }
  } else {
    if (accountIcon) accountIcon.style.display = 'block';
    if (profileLink) profileLink.classList.add('hidden');
    if (adminLink) adminLink.classList.add('hidden');
  }
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

// Main function
async function bootIndex() {
  console.log('Iniciando bootIndex...');
  
  try {
    // Update cart badge
    ui.updateCartBadge();
    
    // Initialize auth
    auth.isLoggedIn();
    updateUserUI();
    
    // Apply saved themes
    const savedTheme = localStorage.getItem(theme.key) || 'light';
    theme.apply(savedTheme);
    
    const savedEco = localStorage.getItem(ecoMode.key) === 'true';
    ecoMode.apply(savedEco);
    
    // Load features
    const features = ui.qs('#features');
    if (features) {
      features.innerHTML = `
        <div class="card"><strong>Entrega en 2 Horas</strong><div class="muted">Rápido y confiable</div></div>
        <div class="card"><strong>100% Orgánico</strong><div class="muted">Calidad de granja</div></div>
        <div class="card"><strong>Mejores Precios</strong><div class="muted">Ahorra hasta 40%</div></div>
      `;
      console.log('Features cargadas');
    }
    
    // Load categories
    const categories = ui.qs('#categories');
    if (categories) {
      const options = [
        {emoji:'🧺',name:'Todas',value:''},
        {emoji:'🍎',name:'Frutas',value:'Frutas'},
        {emoji:'🥛',name:'Lácteos',value:'Lácteos'},
        {emoji:'🍞',name:'Panadería',value:'Panadería'},
        {emoji:'🥚',name:'Huevos',value:'Huevos'},
        {emoji:'🥤',name:'Bebidas',value:'Bebidas'}
      ];
      
      categories.innerHTML = options.map((o, i) => `
        <button class="cat ${i === 0 ? 'active' : ''}" data-cat="${o.value}">
          <div class="emoji">${o.emoji}</div>
          <div>${o.name}</div>
        </button>
      `).join('');
      
      console.log('Categorías cargadas');
      
      // Category click handler
      categories.onclick = (e) => {
        const el = e.target.closest('[data-cat]');
        if (!el) return;
        
        const category = el.dataset.cat;
        categories.querySelectorAll('.cat').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        
        loadProducts(category);
      };
    }
    
    // Load products function
    async function loadProducts(category = '') {
      try {
        console.log('Cargando productos para categoría:', category);
        const products = await api.listProducts({ category });
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
        const query = search.value;
        loadProducts(query ? '' : ''); // For now, just reload all
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
      loadProducts(); // Reload to show eco badges
    });
    
    ui.qs('#accountIcon')?.addEventListener('click', openAccountModal);
    
    ui.qs('#checkoutBtn')?.addEventListener('click', async () => {
      const items = cart.get();
      if (!items.length) {
        alert('Carrito vacío');
        return;
      }
      
      try {
        const payload = items.map(i => ({ productId: i.productId, quantity: i.quantity }));
        const order = await api.createOrder(payload);
        alert('Pedido creado #' + order.id + ' por ' + ui.money(order.total));
        cart.clear();
        ui.renderCart();
        ui.updateCartBadge();
        loadProducts();
      } catch (error) {
        console.error('Error creando pedido:', error);
        alert('Error al crear pedido');
      }
    });
    
    // Load initial products
    await loadProducts();
    
    console.log('bootIndex completado exitosamente');
    
  } catch (error) {
    console.error('Error en bootIndex:', error);
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
  
  // Admin functionality would go here
  console.log('Admin panel cargado');
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado, iniciando aplicación...');
  
  const path = document.location.pathname;
  console.log('Ruta actual:', path);
  
  if (path === '/admin.html') {
    console.log('Cargando admin...');
    bootAdmin();
  } else if (path === '/profile.html') {
    console.log('Cargando perfil...');
    // Profile has its own script
  } else {
    console.log('Cargando página principal...');
    bootIndex();
  }
});

console.log('SuperMercado App cargado');
