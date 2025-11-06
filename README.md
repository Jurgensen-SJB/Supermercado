# 🌱 EcoMarket - Delivery Express

Sistema de supermercado ecológico con delivery express desarrollado para proyecto universitario.

## 📁 Estructura del Proyecto

```
supermercado/
├── 📁 assets/           # Recursos estáticos (imágenes, iconos)
│   └── 📁 img/         # Imágenes del proyecto
├── 📁 css/             # Archivos de estilos CSS
│   └── styles.css      # Estilos principales del sistema
├── 📁 js/              # Archivos JavaScript
│   ├── app.js          # Lógica principal de la aplicación
│   ├── app-fixed.js    # Versión corregida del app.js
│   └── app-simple.js   # Versión simplificada del app.js
├── 📁 views/           # Archivos HTML (vistas)
│   ├── index.html      # Página principal
│   ├── admin.html      # Panel de administración
│   ├── profile.html    # Perfil de usuario
│   ├── design-system.html # Sistema de diseño
│   └── ...             # Otras páginas HTML
├── 📁 node_modules/    # Dependencias de Node.js
├── 📄 server.js        # Servidor Express
├── 📄 db.js            # Configuración de base de datos
├── 📄 package.json     # Configuración del proyecto
├── 📄 database-schema.dbml # Esquema de base de datos
└── 📄 README.md        # Este archivo
```

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm

### Pasos de instalación

1. **Clonar o descargar el proyecto**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd supermercado
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor**
   ```bash
   npm start
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🌐 Despliegue en Vercel

### Opción 1: Despliegue desde GitHub (Recomendado)

1. **Sube tu proyecto a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/supermercado.git
   git push -u origin main
   ```

2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente la configuración

### Opción 2: Despliegue con Vercel CLI

1. **Instala Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Despliega:**
   ```bash
   vercel
   ```

3. **Para producción:**
   ```bash
   vercel --prod
   ```

### Archivos de Configuración para Vercel

El proyecto incluye:
- `vercel.json` - Configuración de despliegue
- `.vercelignore` - Archivos a excluir del despliegue
- Configuración automática para Node.js

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Base de Datos**: SQLite (desarrollo) / MySQL (producción)
- **Estilos**: CSS Variables, Flexbox, Grid
- **Iconos**: Emojis nativos

## 📋 Funcionalidades Principales

### Para Usuarios
- 🌱 **Modo Ecológico**: Interfaz verde para productos eco-friendly
- 🛒 **Carrito de Compras**: Agregar, modificar y eliminar productos
- 📦 **Proceso de Compra**: Checkout en 3 pasos (Dirección, Entrega, Pago)
- 👤 **Perfil de Usuario**: Historial de pedidos y estadísticas
- 🔍 **Búsqueda**: Filtrado por categorías y texto

### Para Administradores
- 📊 **Panel de Control**: Estadísticas de ventas y productos
- 🛍️ **Gestión de Productos**: CRUD completo de productos
- 📈 **Monitoreo de Stock**: Control de inventario
- 📋 **Gestión de Pedidos**: Administración de órdenes

## 🎨 Sistema de Diseño

El proyecto incluye un sistema de diseño completo (`design-system.html`) que define:

- **Paleta de Colores**: Colores primarios, secundarios y modo eco
- **Tipografía**: Fuentes y jerarquías tipográficas
- **Componentes**: Botones, formularios, tarjetas, modales
- **Layout**: Grid system y componentes de navegación
- **Logotipos**: Variaciones del logo EcoMarket

## 🗄️ Base de Datos

### Tablas Principales
- **products**: Catálogo de productos
- **users**: Usuarios del sistema
- **orders**: Pedidos realizados
- **order_items**: Items de cada pedido
- **categories**: Categorías de productos

### Características
- Soft delete para pedidos
- Índices optimizados para consultas
- Relaciones bien definidas entre tablas

## 🔧 Configuración del Servidor

El servidor Express está configurado para servir archivos estáticos desde múltiples directorios:

- `/css` → Archivos CSS
- `/js` → Archivos JavaScript  
- `/views` → Archivos HTML
- `/assets` → Recursos estáticos (imágenes)

## 📱 Responsive Design

El sistema está diseñado para ser completamente responsive:
- Mobile-first approach
- Breakpoints para tablet y desktop
- Componentes adaptativos

## 🌍 Modo Ecológico

Característica única del sistema que cambia la interfaz a colores verdes cuando se activa, promoviendo productos eco-friendly y prácticas sostenibles.

## 📊 API Endpoints

### Productos
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Usuarios
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Crear pedido
- `GET /api/orders/:userId` - Pedidos por usuario

## 🎯 Objetivos del Proyecto

Este proyecto fue desarrollado como parte de un trabajo universitario para demostrar:
- Arquitectura web moderna
- Buenas prácticas de desarrollo
- Diseño centrado en el usuario
- Responsabilidad ambiental en tecnología

## 📝 Notas de Desarrollo

- El proyecto está optimizado para desarrollo local
- La base de datos se inicializa automáticamente
- Los datos de prueba se cargan con el comando `npm run seed`
- El sistema incluye validaciones tanto en frontend como backend

## 🤝 Contribuciones

Este es un proyecto académico, pero las sugerencias y mejoras son bienvenidas.

## 📄 Licencia

Proyecto desarrollado para fines educativos universitarios.

---

**EcoMarket** - Tu supermercado ecológico de confianza 🌱