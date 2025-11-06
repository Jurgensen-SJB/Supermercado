// Versión simplificada y funcional del app.js
console.log('App.js cargado');

// UI helper
const ui = {
  qs(sel) { return document.querySelector(sel); },
  qsa(sel) { return [...document.querySelectorAll(sel)]; },
  money(n) { return new Intl.NumberFormat('es-ES',{style:'currency',currency:'USD'}).format(n); },
  updateCartBadge() { 
    const badge = this.qs('#cartCount');
    if (badge) badge.textContent = cart.get().reduce((a,b)=>a+b.quantity,0);
  },
  renderProducts(list) {
    const grid = this.qs('#grid');
    if (!grid) return;
    
    const isEcoMode = localStorage.getItem('super_eco_v1') === 'true';
    grid.innerHTML = list.map(p => `
      <article class="card product">
        ${isEcoMode && p.isEco ? '<div class="eco-badge">🌿 Eco</div>' : ''}
        <img src="${p.image||''}" alt="${p.name}">
        <h3>${p.name}</h3>
        <div class="muted">${p.category||''}</div>
        <div class="row" style="align-items:center;justify-content:space-between">
          <span class="price">${this.money(p.price)}</span>
          <button class="btn" data-add="${p.id}" ${p.stock<=0?'disabled':''}>Añadir</button>
        </div>
      </article>
    `).join('');
    
    // Event listener para botones de añadir
    grid.onclick = async (e) => {
      const addId = e.target.dataset.add;
      if (addId) {
        try {
          const p = await api.getProduct(addId);
          cart.add(p, 1);
          this.updateCartBadge();
          alert('Producto añadido al carrito');
        } catch (error) {
          console.error('Error añadiendo producto:', error);
        }
      }
    };
  },
  renderCart() {
    const cartPanel = this.qs('#cartPanel');
    if (!cartPanel) return;
    
    const items = cart.get();
    const cartItems = this.qs('#cartItems');
    if (!cartItems) return;
    
    if (items.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart">Carrito vacío</div>';
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
        if (item) cart.add(item, 1);
        this.renderCart();
        this.updateCartBadge();
      }
      
      if (removeId) {
        cart.remove(removeId);
        this.renderCart();
        this.updateCartBadge();
      }
    };
  },
  openCart() { this.qs('#cartPanel')?.classList.remove('hidden'); },
  closeCart() { this.qs('#cartPanel')?.classList.add('hidden'); }
};

// Cart helper
const cart = {
  key: 'super_cart_v1',
  get() { return JSON.parse(localStorage.getItem(this.key) || '[]'); },
  add(product, quantity = 1) {
    const items = this.get();
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ productId: product.id, name: product.name, price: product.price, quantity });
    }
    localStorage.setItem(this.key, JSON.stringify(items));
  },
  remove(productId) {
    const items = this.get();
    const filtered = items.filter(i => i.productId !== productId);
    localStorage.setItem(this.key, JSON.stringify(filtered));
  },
  clear() { localStorage.removeItem(this.key); }
};

// API helper
const api = {
  async listProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`/api/products${qs ? `?${qs}` : ''}`);
    return res.json();
  },
  async getProduct(id) {
    const res = await fetch(`/api/products/${id}`);
    return res.json();
  }
};

// Auth simple
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
      this.currentUser = JSON.parse(user);
      return true;
    }
    return false;
  },
  
  isAdmin() { 
    return this.currentUser && this.currentUser.isAdmin === 1;
  }
};

// Función principal
async function bootIndex() {
  console.log('Iniciando bootIndex...');
  
  // Actualizar badge del carrito
  ui.updateCartBadge();
  
  // Cargar features
  const features = ui.qs('#features');
  if (features) {
    features.innerHTML = `
      <div class="card"><strong>Entrega en 2 Horas</strong><div class="muted">Rápido y confiable</div></div>
      <div class="card"><strong>100% Orgánico</strong><div class="muted">Calidad de granja</div></div>
      <div class="card"><strong>Mejores Precios</strong><div class="muted">Ahorra hasta 40%</div></div>
    `;
  }
  
  // Cargar categorías
  const cats = ui.qs('#categories');
  if (cats) {
    const options = [
      {emoji:'🧺',name:'Todas',value:''},
      {emoji:'🍎',name:'Frutas',value:'Frutas'},
      {emoji:'🥛',name:'Lácteos',value:'Lácteos'},
      {emoji:'🍞',name:'Panadería',value:'Panadería'},
      {emoji:'🥚',name:'Huevos',value:'Huevos'},
      {emoji:'🥤',name:'Bebidas',value:'Bebidas'}
    ];
    cats.innerHTML = options.map((o,i)=>`
      <button class="cat ${i===0?'active':''}" data-cat="${o.value}">
        <div class="emoji">${o.emoji}</div>
        <div>${o.name}</div>
      </button>
    `).join('');
    
    // Event listener para categorías
    cats.onclick = (e) => {
      const el = e.target.closest('[data-cat]');
      if (!el) return;
      
      const category = el.dataset.cat;
      cats.querySelectorAll('.cat').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      
      loadProducts(category);
    };
  }
  
  // Cargar productos
  async function loadProducts(category = '') {
    try {
      console.log('Cargando productos...');
      const list = await api.listProducts({ category });
      console.log('Productos cargados:', list.length);
      ui.renderProducts(list);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  }
  
  // Event listeners
  ui.qs('#cartIcon')?.addEventListener('click', () => {
    ui.renderCart();
    ui.openCart();
  });
  
  ui.qs('#closeCart')?.addEventListener('click', () => ui.closeCart());
  
  ui.qs('#accountIcon')?.addEventListener('click', () => {
    alert('Modal de cuenta - funcionalidad básica');
  });
  
  ui.qs('#themeToggle')?.addEventListener('click', () => {
    alert('Toggle de tema - funcionalidad básica');
  });
  
  ui.qs('#ecoToggle')?.addEventListener('click', () => {
    alert('Toggle eco - funcionalidad básica');
  });
  
  // Cargar productos iniciales
  await loadProducts();
  
  console.log('bootIndex completado');
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado, iniciando aplicación...');
  
  if (document.location.pathname === '/admin.html') {
    console.log('Cargando admin...');
    // Admin tiene su propio script
  } else if (document.location.pathname === '/profile.html') {
    console.log('Cargando perfil...');
    // Perfil tiene su propio script
  } else {
    console.log('Cargando página principal...');
    bootIndex();
  }
});
