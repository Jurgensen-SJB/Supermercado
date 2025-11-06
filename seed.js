const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crear conexión a la base de datos
const dbPath = path.join(__dirname, 'supermercado.db');
const db = new sqlite3.Database(dbPath);

// Datos de productos extraídos de la base de datos actual
const products = [
  // ASEO
  {
    name: 'Cepillo de Dientes Bambú',
    description: 'Cepillo ecológico de bambú biodegradable',
    price: 6.99,
    image: 'https://www.socident.com/wp-content/uploads/2019/09/cepillos-bambu.jpg',
    stock: 38,
    category: 'Aseo',
    isEco: 1
  },
  {
    name: 'Jabón de Glicerina',
    description: 'Jabón artesanal con glicerina natural',
    price: 4.5,
    image: 'https://perfumerialemaitre.com/cdn/shop/articles/Jabon_de_Glicerina_mojado_1_1024x1024.jpg?v=1706127448',
    stock: 74,
    category: 'Aseo',
    isEco: 1
  },
  {
    name: 'Kit de Aseo Johnson\'s',
    description: 'Kit para los pequeños de la casa',
    price: 40.0,
    image: 'https://kyminfantiles.com/wp-content/uploads/2020/03/KIT-ASEO-JOHNSON%C2%B4S-PEQUEN%CC%83O.jpg',
    stock: 22,
    category: 'Aseo',
    isEco: 0
  },
  {
    name: 'Shampoo Natural',
    description: 'Shampoo orgánico para todo tipo de cabello',
    price: 8.99,
    image: 'https://i.pinimg.com/564x/de/81/5e/de815e83cdbbc7d97250c9ccf808a360.jpg',
    stock: 45,
    category: 'Aseo',
    isEco: 1
  },

  // BEBIDAS
  {
    name: 'Agua mineral (6 botellas)',
    description: 'Agua mineral natural, 1.5L por botella.',
    price: 3.2,
    image: 'https://copservir.vtexassets.com/arquivos/ids/1573965/AGUA-MANANTIAL-MINERAL-SIN-GA_F.png?v=638789118108200000',
    stock: 98,
    category: 'Bebidas',
    isEco: 0
  },
  {
    name: 'Café molido 500g',
    description: 'Tueste medio, aroma intenso.',
    price: 5.9,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-48MofW8c8qSRpAcqB04KkMfbo4LTFd5EbQ&s',
    stock: 40,
    category: 'Bebidas',
    isEco: 1
  },
  {
    name: 'Jugo de naranja (1L)',
    description: 'Jugo de naranja 100% natural, sin conservantes.',
    price: 2.8,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800',
    stock: 73,
    category: 'Bebidas',
    isEco: 1
  },
  {
    name: 'Té verde (100 bolsitas)',
    description: 'Té verde premium, antioxidantes naturales.',
    price: 4.5,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800',
    stock: 63,
    category: 'Bebidas',
    isEco: 1
  },

  // CARNES
  {
    name: 'Carne Molida Res',
    description: 'Carne molida de res premium',
    price: 12.5,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGbWJ-lEC_DTc6ui0MuzjZYYJ0fE066IPp1g&s',
    stock: 25,
    category: 'Carnes',
    isEco: 0
  },
  {
    name: 'Pechuga de Pollo',
    description: 'Pechuga de pollo fresca sin hormonas',
    price: 9.99,
    image: 'https://mejorconsalud.as.com/wp-content/uploads/2018/04/dos-pechugas-de-pollo.jpg?auto=webp&quality=7500&width=1920&crop=16:9,smart,safe&format=webp&optimize=medium&dpr=2&fit=cover&fm=webp&q=75&w=1920&h=1080',
    stock: 29,
    category: 'Carnes',
    isEco: 1
  },
  {
    name: 'Salmón Fresco',
    description: 'Filete de salmón fresco del océano',
    price: 16.99,
    image: 'https://olimpica.vtexassets.com/arquivos/ids/1601205/24033152.jpg?v=638695348220470000',
    stock: 18,
    category: 'Carnes',
    isEco: 1
  },

  // FRUTAS
  {
    name: 'Bananas (1 kg)',
    description: 'Banana dulce y madura, perfecta para batidos.',
    price: 1.89,
    image: 'https://www.cuisinelangelique.com/infotheque/wp-content/uploads/2023/03/banane-1a-1200x838.jpg',
    stock: 139,
    category: 'Frutas',
    isEco: 1
  },
  {
    name: 'Fresas frescas (500g)',
    description: 'Fresas rojas y dulces, perfectas para postres.',
    price: 4.5,
    image: 'https://content.cuerpomente.com/medio/2024/07/25/fresas_2442aa65_2004978876_240725184333_900x900.jpg',
    stock: 59,
    category: 'Frutas',
    isEco: 1
  },
  {
    name: 'Manzanas Gala (1 kg)',
    description: 'Manzana fresca y crujiente, ideal para snacks.',
    price: 2.49,
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800',
    stock: 98,
    category: 'Frutas',
    isEco: 1
  },
  {
    name: 'Naranjas Valencia (1 kg)',
    description: 'Naranjas jugosas y dulces, ricas en vitamina C.',
    price: 2.99,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9KLHf02DfT27O3k9pSSOjVHWCqkT-S2BXvA&s',
    stock: 76,
    category: 'Frutas',
    isEco: 1
  },
  {
    name: 'Uvas verdes (1 kg)',
    description: 'Uvas crujientes y dulces, snack saludable.',
    price: 3.99,
    image: 'https://cloudfront-us-east-1.images.arcpublishing.com/semana/VUOXAYQQZFBK7EE7UQSZ32HCSM.jpg',
    stock: 43,
    category: 'Frutas',
    isEco: 1
  },

  // GRANOS
  {
    name: 'Arroz Integral',
    description: 'Arroz integral orgánico 1kg',
    price: 4.99,
    image: 'https://exitocol.vtexassets.com/arquivos/ids/29471313/Arroz-Integral-1000-gr-490441_a.jpg?v=638894968395600000',
    stock: 79,
    category: 'Granos',
    isEco: 1
  },
  {
    name: 'Lentejas Rojas',
    description: 'Lentejas rojas secas 1kg',
    price: 3.5,
    image: 'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/arw/arw47626/y/9.jpg',
    stock: 60,
    category: 'Granos',
    isEco: 0
  },
  {
    name: 'Quinoa Orgánica',
    description: 'Quinoa orgánica 500g',
    price: 8.99,
    image: 'https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/now/now06311/l/13.jpg',
    stock: 44,
    category: 'Granos',
    isEco: 1
  },

  // HUEVOS
  {
    name: 'Huevos camperos (12u)',
    description: 'Huevos de gallinas camperas, tamaño L.',
    price: 3.4,
    image: 'https://www.gastronosfera.com/sites/default/files/styles/wide/public/trending/2025/1_28.png.webp',
    stock: 66,
    category: 'Huevos',
    isEco: 1
  },
  {
    name: 'Huevos orgánicos (6u)',
    description: 'Huevos orgánicos de gallinas libres.',
    price: 2.8,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800',
    stock: 41,
    category: 'Huevos',
    isEco: 1
  },

  // JUEGOS
  {
    name: 'Juego de Mesa Familiar',
    description: 'Juego de estrategia para 2-6 jugadores',
    price: 24.99,
    image: 'https://http2.mlstatic.com/D_NQ_NP_691437-MCO86241451145_062025-O.webp',
    stock: 11,
    category: 'Juegos',
    isEco: 0
  },
  {
    name: 'Pelota de Fútbol',
    description: 'Pelota oficial de fútbol',
    price: 18.5,
    image: 'https://m.media-amazon.com/images/I/815QFCZwWHL._UF894,1000_QL80_.jpg',
    stock: 10,
    category: 'Juegos',
    isEco: 0
  },
  {
    name: 'Rompecabezas 1000 piezas',
    description: 'Rompecabezas educativo para toda la familia',
    price: 15.99,
    image: 'https://www.ingeniodestrezamental.com/cdn/shop/files/rompecabezasnoche-estrellada-starry-night-vincent-van-gogh-1000-piezas-1000-fichas-linea-e-colombia-medellin-1-portada.jpg?v=1750656193',
    stock: 24,
    category: 'Juegos',
    isEco: 0
  },

  // LIMPIEZA
  {
    name: 'Detergente Ecológico',
    description: 'Detergente biodegradable para ropa',
    price: 12.99,
    image: 'https://media.falabella.com/sodimacCO/521201/public',
    stock: 29,
    category: 'Limpieza',
    isEco: 1
  },
  {
    name: 'Limpiador Multiusos',
    description: 'Limpiador natural para toda la casa',
    price: 7.5,
    image: 'https://exitocol.vtexassets.com/arquivos/ids/29434505/Limpiador-Multiusos-Lavanda-DERSA-4000-ml-3514520_a.jpg?v=638894100756400000',
    stock: 57,
    category: 'Limpieza',
    isEco: 0
  },
  {
    name: 'Papel Higiénico Reciclado',
    description: 'Papel higiénico 100% reciclado',
    price: 3.99,
    image: 'https://lineaeco.com.co/wp-content/uploads/2023/12/papel-higicienico.webp',
    stock: 98,
    category: 'Limpieza',
    isEco: 1
  },

  // LÁCTEOS
  {
    name: 'Leche Entera 1L',
    description: 'Leche entera UHT de alta calidad.',
    price: 1.2,
    image: 'https://exitocol.vtexassets.com/arquivos/ids/30780579/Leche-Uht-Entera-COLANTA-1000-ml-3202767_a.jpg?v=638931939964200000',
    stock: 77,
    category: 'Lácteos',
    isEco: 0
  },
  {
    name: 'Leche de Almendra',
    description: 'Leche de Almendra',
    price: 12.0,
    image: 'https://www.paulinacocina.net/wp-content/uploads/2021/11/leche-de-almendras.jpg',
    stock: 19,
    category: 'Lácteos',
    isEco: 1
  },
  {
    name: 'Mantequilla (250g)',
    description: 'Mantequilla fresca de vaca, ideal para cocinar.',
    price: 2.2,
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800',
    stock: 54,
    category: 'Lácteos',
    isEco: 0
  },
  {
    name: 'Queso Cheddar (200g)',
    description: 'Queso cheddar madurado, perfecto para sandwiches.',
    price: 3.5,
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800',
    stock: 65,
    category: 'Lácteos',
    isEco: 0
  },
  {
    name: 'Yogurt Griego (500g)',
    description: 'Yogurt griego natural, rico en proteínas.',
    price: 2.8,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Turkish_strained_yogurt.jpg/1200px-Turkish_strained_yogurt.jpg',
    stock: 90,
    category: 'Lácteos',
    isEco: 1
  },

  // MEDICAMENTOS
  {
    name: 'Curitas Adhesivas',
    description: 'Caja de 100 curitas adhesivas estériles',
    price: 2.99,
    image: 'https://http2.mlstatic.com/D_NQ_NP_708876-MLA49922184839_052022-O.webp',
    stock: 77,
    category: 'Medicamentos',
    isEco: 0
  },
  {
    name: 'Ibuprofeno 400mg',
    description: 'Antiinflamatorio, caja de 24 tabletas',
    price: 5.5,
    image: 'https://product-images.farmatodo.com/wjOuwXOqtUfm8hFDCQkUxjs7MUIUHk1Ps1m3DfIZuE5Wk32QoH9GDx6BkWk2aCxvEQJRqAT_bAKVX6vFuSkPpeUNRfeZtPLyPUWHuEQNL6vMW_qe',
    stock: 72,
    category: 'Medicamentos',
    isEco: 0
  },
  {
    name: 'Paracetamol 500mg',
    description: 'Analgésico y antipirético, caja de 20 tabletas',
    price: 3.99,
    image: 'https://www.laboratoriochile.cl/wp-content/webp-express/webp-images/doc-root/wp-content/uploads/2015/11/Paracetamol_500MG_16C_BE_HD.jpg.webp',
    stock: 94,
    category: 'Medicamentos',
    isEco: 0
  },
  {
    name: 'Termometro Digital',
    description: 'Termómetro digital infrarrojo sin contacto',
    price: 25.99,
    image: 'https://lh3.googleusercontent.com/VOKypMbAHQnuckgFWPRzn1uglrsNTZPyJLXW8dn_hYqHGNn5kE1D_lMKJFUFZxXPvYLtw4r7r-EIfY7k9yCtzK3yDVzMdJgVGGc1NQEKffARQy-I=s360',
    stock: 19,
    category: 'Medicamentos',
    isEco: 0
  },
  {
    name: 'Vitamina C',
    description: 'Suplemento de vitamina C 1000mg, 60 cápsulas',
    price: 12.99,
    image: 'https://olimpica.vtexassets.com/arquivos/ids/1471890/7702057737931-Tripack-Vita-C-eferv-Naranja.jpg?v=638584706137600000',
    stock: 42,
    category: 'Medicamentos',
    isEco: 1
  },

  // PANADERÍA
  {
    name: 'Bagels de sésamo (4 unidades)',
    description: 'Bagels artesanales con semillas de sésamo.',
    price: 3.8,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800',
    stock: 35,
    category: 'Panadería',
    isEco: 1
  },
  {
    name: 'Croissants (6 unidades)',
    description: 'Croissants horneados frescos, perfectos para desayuno.',
    price: 4.2,
    image: 'https://img.freepik.com/foto-gratis/croissants-tabla-cortar-madera_1150-28480.jpg?semt=ais_hybrid&w=740&q=80',
    stock: 40,
    category: 'Panadería',
    isEco: 0
  },
  {
    name: 'Pan de molde integral',
    description: 'Pan integral suave, 20 rebanadas.',
    price: 2.1,
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=800',
    stock: 59,
    category: 'Panadería',
    isEco: 1
  },

  // PASTAS
  {
    name: 'Espagueti Integral',
    description: 'Pasta integral de trigo 500g',
    price: 2.99,
    image: 'https://alimentosdoria.com/wp-content/uploads/2023/04/banner-spaghetti-integral-613-X-550PX.png',
    stock: 69,
    category: 'Pastas',
    isEco: 1
  },
  {
    name: 'Fusilli Tricolor',
    description: 'Pasta fusilli con tomate, espinaca y zanahoria',
    price: 4.5,
    image: 'https://laparisienne.com.co/cdn/shop/files/FUSILLITRICOLORE.jpg?v=1729282875',
    stock: 49,
    category: 'Pastas',
    isEco: 0
  },
  {
    name: 'Raviolis de Espinaca',
    description: 'Raviolis frescos con espinaca',
    price: 6.99,
    image: 'https://carulla.vtexassets.com/arquivos/ids/23136663/Ravioli-De-Espinaca-Y-Queso-Caja-X-450g-733302_a.jpg?v=638925110583900000',
    stock: 33,
    category: 'Pastas',
    isEco: 1
  },

  // VERDURAS
  {
    name: 'Brócoli Fresco',
    description: 'Brócoli fresco de la huerta',
    price: 4.5,
    image: 'https://previews.123rf.com/images/zhekos/zhekos1711/zhekos171100036/90930527-one-fresh-ripe-raw-fresh-broccoli-with-leafs-closeup-on-white-background.jpg',
    stock: 30,
    category: 'Verduras',
    isEco: 1
  },
  {
    name: 'Lechuga Romana',
    description: 'Lechuga romana fresca',
    price: 2.5,
    image: 'https://provisiondelcampo.com/wp-content/uploads/2024/03/B0032.lechuga-romana.jpg',
    stock: 55,
    category: 'Verduras',
    isEco: 1
  },
  {
    name: 'Tomates Cherry',
    description: 'Tomates cherry orgánicos 500g',
    price: 5.99,
    image: 'https://www.infobae.com/resizer/v2/ZAVPRWEOAJDANN4D62IBYWGWBA.jpeg?auth=f9851cde38b4293eabd89f992cb7d58bb900669ba9f02a29e993cfb280e834a7&smart=true&width=1200&height=1200&quality=85',
    stock: 39,
    category: 'Verduras',
    isEco: 1
  },
  {
    name: 'Zanahorias Orgánicas',
    description: 'Zanahorias orgánicas 1kg',
    price: 3.99,
    image: 'https://sembramos.com.co/wp-content/uploads/2018/05/zanahoriasorganicas.jpg',
    stock: 65,
    category: 'Verduras',
    isEco: 1
  }
];

// Función para poblar la base de datos
function seedDatabase() {
  console.log('🌱 Iniciando proceso de seeding...');
  
  // Limpiar tabla de productos
  db.run('DELETE FROM products', (err) => {
    if (err) {
      console.error('Error al limpiar productos:', err);
      return;
    }
    
    console.log('✅ Tabla de productos limpiada');
    
    // Insertar productos
    const stmt = db.prepare(`
      INSERT INTO products (name, description, price, image, stock, category, isEco)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    let inserted = 0;
    products.forEach((product) => {
      stmt.run([
        product.name,
        product.description,
        product.price,
        product.image,
        product.stock,
        product.category,
        product.isEco
      ], (err) => {
        if (err) {
          console.error('Error al insertar producto:', err);
        } else {
          inserted++;
          console.log(`✅ Producto insertado: ${product.name}`);
        }
        
        if (inserted === products.length) {
          stmt.finalize();
          console.log(`🎉 Seeding completado! ${products.length} productos insertados.`);
          db.close();
        }
      });
    });
  });
}

// Ejecutar seeding
seedDatabase();