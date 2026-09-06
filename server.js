const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = (process.env.PORT && process.env.PORT !== '0') ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// JSON file helpers
function readJson(filename) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error reading ${filename}:`, e.message);
  }
  return null;
}

function writeJson(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

async function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'dist/freebuff-pos/browser')));

// CORS for dev
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ==================== USERS ====================

app.get('/api/users', (req, res) => {
  const users = readJson('users.json') || [];
  res.json(users);
});

app.get('/api/users/active', (req, res) => {
  const users = readJson('users.json') || [];
  res.json(users.filter(u => u.active));
});

app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readJson('users.json') || [];
  const hashed = await hashPassword(password);
  const user = users.find(u => u.username === username && u.password === hashed && u.active);

  if (!user) {
    return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post('/api/users', async (req, res) => {
  const users = readJson('users.json') || [];

  if (users.some(u => u.username === req.body.username)) {
    return res.status(400).json({ message: 'اسم المستخدم موجود بالفعل' });
  }

  const hashed = await hashPassword(req.body.password || '123456');
  const newUser = {
    ...req.body,
    id: generateId(),
    password: hashed,
    createdAt: new Date().toISOString(),
    active: true
  };

  users.push(newUser);
  writeJson('users.json', users);

  const { password: _, ...result } = newUser;
  res.json(result);
});

app.put('/api/users/:id', async (req, res) => {
  const users = readJson('users.json') || [];
  const index = users.findIndex(u => u.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }

  if (req.body.password) {
    req.body.password = await hashPassword(req.body.password);
  } else {
    delete req.body.password;
  }

  users[index] = { ...users[index], ...req.body };
  writeJson('users.json', users);

  const { password: _, ...result } = users[index];
  res.json(result);
});

app.delete('/api/users/:id', (req, res) => {
  const users = readJson('users.json') || [];
  const index = users.findIndex(u => u.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }

  users[index].active = false;
  writeJson('users.json', users);
  res.json({ success: true });
});

// Seed default users if none exist
app.post('/api/users/seed', async (req, res) => {
  const users = readJson('users.json') || [];
  if (users.length > 0) {
    return res.json({ seeded: false });
  }

  const adminHash = await hashPassword('123456');
  const cashierHash = await hashPassword('123456');

  const seedUsers = [
    {
      id: generateId(),
      username: 'admin',
      password: adminHash,
      displayName: 'المدير',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: generateId(),
      username: 'cashier',
      password: cashierHash,
      displayName: 'بائع',
      role: 'cashier',
      active: true,
      createdAt: new Date().toISOString()
    }
  ];

  writeJson('users.json', seedUsers);
  res.json({ seeded: true });
});

// ==================== PRODUCTS ====================

app.get('/api/products', (req, res) => {
  const products = readJson('products.json') || [];
  res.json(products);
});

app.get('/api/products/active', (req, res) => {
  const products = readJson('products.json') || [];
  res.json(products.filter(p => p.active));
});

app.get('/api/products/:id', (req, res) => {
  const products = readJson('products.json') || [];
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
  res.json(product);
});

app.post('/api/products', (req, res) => {
  const products = readJson('products.json') || [];
  const newProduct = {
    ...req.body,
    id: generateId(),
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  writeJson('products.json', products);
  res.json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const products = readJson('products.json') || [];
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'المنتج غير موجود' });
  }

  products[index] = { ...products[index], ...req.body };
  writeJson('products.json', products);
  res.json(products[index]);
});

app.delete('/api/products/:id', (req, res) => {
  let products = readJson('products.json') || [];
  products = products.filter(p => p.id !== req.params.id);
  writeJson('products.json', products);
  res.json({ success: true });
});

app.patch('/api/products/:id/toggle', (req, res) => {
  const products = readJson('products.json') || [];
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'المنتج غير موجود' });
  }

  products[index].active = !products[index].active;
  writeJson('products.json', products);
  res.json(products[index]);
});

// Seed default products
app.post('/api/products/seed', (req, res) => {
  const products = readJson('products.json') || [];
  if (products.length > 0) {
    return res.json({ seeded: false });
  }

  const defaults = [
    { name: 'حليب طازج', price: 6.50, description: 'حليب طازج كامل الدسم', sku: 'P001', barcode: '6281000000001', imageUrl: '', active: true },
    { name: 'جبنة بيضاء', price: 15.00, description: 'جبنة بيضاء طازجة 400 جرام', sku: 'P008', barcode: '6281000000008', imageUrl: '', active: true },
    { name: 'خبز أبيض', price: 1.00, description: 'ربطة خبز أبيض طازج', sku: 'P002', barcode: '6281000000002', imageUrl: '', active: true },
    { name: 'زيت زيتون', price: 25.00, description: 'زيت زيتون بكر ممتاز 500 مل', sku: 'P003', barcode: '6281000000003', imageUrl: '', active: true },
    { name: 'أرز بسمتي', price: 18.00, description: 'أرز بسمتي هندي 1 كجم', sku: 'P004', barcode: '6281000000004', imageUrl: '', active: true },
    { name: 'سكر أبيض', price: 5.00, description: 'سكر أبيض ناعم 1 كجم', sku: 'P005', barcode: '6281000000005', imageUrl: '', active: true },
    { name: 'معلبات طماطم', price: 3.50, description: 'علبة طماطم مقشرة 400 جرام', sku: 'P006', barcode: '6281000000006', imageUrl: '', active: true },
    { name: 'مكسرات مشكلة', price: 35.00, description: 'مكسرات مشكلة محمصة 250 جرام', sku: 'P007', barcode: '6281000000007', imageUrl: '', active: true }
  ];

  const seeded = defaults.map(d => ({
    ...d,
    id: generateId(),
    createdAt: new Date().toISOString()
  }));

  writeJson('products.json', seeded);
  res.json({ seeded: true });
});

// ==================== INVOICES ====================

app.get('/api/invoices', (req, res) => {
  const invoices = readJson('invoices.json') || [];
  res.json(invoices);
});

app.get('/api/invoices/counter', (req, res) => {
  const counter = readJson('invoice_counter.json') || { next: 1 };
  res.json(counter);
});

app.get('/api/invoices/:id', (req, res) => {
  const invoices = readJson('invoices.json') || [];
  const invoice = invoices.find(inv => inv.id === req.params.id);
  if (!invoice) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
  res.json(invoice);
});

app.post('/api/invoices', (req, res) => {
  const invoices = readJson('invoices.json') || [];
  const counter = readJson('invoice_counter.json') || { next: 1 };

  const invoice = {
    ...req.body,
    id: req.body.id || generateId(),
    invoiceNumber: counter.next,
    createdAt: req.body.createdAt || new Date().toISOString()
  };

  invoices.unshift(invoice);
  counter.next++;

  writeJson('invoices.json', invoices);
  writeJson('invoice_counter.json', counter);
  res.json(invoice);
});

// ==================== SETTINGS ====================

app.get('/api/settings', (req, res) => {
  const settings = readJson('settings.json');
  const defaults = {
    shopName: 'مسالخ الماسية المضيئة للحوم',
    address: 'الرياض - المملكة العربية السعودية',
    phone: '0500468430',
    taxId: '311940157300003',
    taxRate: 15,
    receiptWidth: '80mm',
    logoUrl: '',
    branches: [
      { id: 'branch-1', name: 'فرع الرياض الرئيسي', address: 'الرياض - المملكة العربية السعودية', isActive: true },
      { id: 'branch-2', name: 'فرع الإجراء', address: 'الإجراء - المملكة العربية السعودية', isActive: true }
    ]
  };
  res.json(settings || defaults);
});

app.put('/api/settings', (req, res) => {
  const current = readJson('settings.json') || {};
  const updated = { ...current, ...req.body };
  writeJson('settings.json', updated);
  res.json(updated);
});

// SPA fallback
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/freebuff-pos/browser/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏪 Freebuff POS Server running on http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ${DATA_DIR}\n`);
});
