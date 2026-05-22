import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Product, Order, OrderItem, Payment, OrderStatus, PaymentMethod, PaymentStatus, JerseyType, JerseySize } from "./src/types";

const app = express();
const PORT = Number(process.env.PORT) || 3010;
const DB_FILE = path.join(process.cwd(), "jersey_customizer_db.json");

// Express Middleware
app.use(express.json());

// Type-safe DB State
interface DBState {
  products: Product[];
  orders: Order[];
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-arg-home",
    name: "Argentina Home Jersey 2026",
    teamCountry: "Argentina 🇦🇷",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "/images/argentina_home_jersey_1779381978902.png",
    price: 420000,
    stock: 45,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-arg-away",
    name: "Argentina Away Jersey 2026",
    teamCountry: "Argentina 🇦🇷",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=500&auto=format&fit=crop&q=60",
    price: 390000,
    stock: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-bra-home",
    name: "Brazil Home Jersey 2026",
    teamCountry: "Brazil 🇧🇷",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "/images/brazil_home_jersey_1779382002096.png",
    price: 420000,
    stock: 50,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-bra-away",
    name: "Brazil Away Jersey 2026",
    teamCountry: "Brazil 🇧🇷",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=500&auto=format&fit=crop&q=60",
    price: 390000,
    stock: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-fra-home",
    name: "France Home Jersey 2026",
    teamCountry: "France 🇫🇷",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=500&auto=format&fit=crop&q=60",
    price: 450000,
    stock: 35,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-fra-away",
    name: "France Away Jersey 2026",
    teamCountry: "France 🇫🇷",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&auto=format&fit=crop&q=60",
    price: 420000,
    stock: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-ger-home",
    name: "Germany Home Jersey 2026",
    teamCountry: "Germany 🇩🇪",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1614632537190-23e4146777db?w=500&auto=format&fit=crop&q=60",
    price: 410000,
    stock: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-ger-away",
    name: "Germany Away Jersey 2026",
    teamCountry: "Germany 🇩🇪",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=500&auto=format&fit=crop&q=60",
    price: 390000,
    stock: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-jap-home",
    name: "Japan Home Jersey 2026",
    teamCountry: "Japan 🇯🇵",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=60",
    price: 430000,
    stock: 40,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-jap-away",
    name: "Japan Away Jersey 2026",
    teamCountry: "Japan 🇯🇵",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=500&auto=format&fit=crop&q=60",
    price: 400000,
    stock: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-eng-home",
    name: "England Home Jersey 2026",
    teamCountry: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=60",
    price: 410000,
    stock: 32,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-eng-away",
    name: "England Away Jersey 2026",
    teamCountry: "England 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=500&auto=format&fit=crop&q=60",
    price: 380000,
    stock: 22,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-spa-home",
    name: "Spain Home Jersey 2026",
    teamCountry: "Spain 🇪🇸",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=500&auto=format&fit=crop&q=60",
    price: 430000,
    stock: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-spa-away",
    name: "Spain Away Jersey 2026",
    teamCountry: "Spain 🇪🇸",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=500&auto=format&fit=crop&q=60",
    price: 400000,
    stock: 18,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-por-home",
    name: "Portugal Home Jersey 2026",
    teamCountry: "Portugal 🇵🇹",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&auto=format&fit=crop&q=60",
    price: 420000,
    stock: 45,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-por-away",
    name: "Portugal Away Jersey 2026",
    teamCountry: "Portugal 🇵🇹",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1553126593-7036cd0a382e?w=500&auto=format&fit=crop&q=60",
    price: 390000,
    stock: 28,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-kor-home",
    name: "South Korea Home Jersey 2026",
    teamCountry: "South Korea 🇰🇷",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=60",
    price: 430000,
    stock: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-kor-away",
    name: "South Korea Away Jersey 2026",
    teamCountry: "South Korea 🇰🇷",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=500&auto=format&fit=crop&q=60",
    price: 400000,
    stock: 20,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-vie-home",
    name: "Vietnam Home Jersey 2026",
    teamCountry: "Vietnam 🇻🇳",
    jerseyType: "home",
    glbUrl: null,
    imageUrl: "/images/vietnam_home_jersey_1779381941180.png",
    price: 350000,
    stock: 120,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "prod-vie-away",
    name: "Vietnam Away Jersey 2026",
    teamCountry: "Vietnam 🇻🇳",
    jerseyType: "away",
    glbUrl: null,
    imageUrl: "/images/vietnam_away_jersey_1779381960428.png",
    price: 350000,
    stock: 80,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Read/Write DB helper
function readDB(): DBState {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DBState = { products: DEFAULT_PRODUCTS, orders: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Database fallback load error, starting empty", error);
    return { products: DEFAULT_PRODUCTS, orders: [] };
  }
}

function writeDB(data: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Database save failed", error);
  }
}

// Ensure database file loaded / seeded on start up
readDB();

// API SECTION

// --- Products Endpoints ---
app.get("/api/products", (req, res) => {
  const db = readDB();
  const search = (req.query.search as string || "").toLowerCase();
  const type = req.query.type as string;

  let result = db.products;

  // Filter out inactive on public unless admin view
  const isAdminView = req.query.isAdmin === "true";
  if (!isAdminView) {
    result = result.filter(p => p.isActive);
  }

  if (search) {
    result = result.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.teamCountry.toLowerCase().includes(search)
    );
  }

  if (type && type !== "all") {
    result = result.filter(p => p.jerseyType === type);
  }

  res.json(result);
});

app.post("/api/products", (req, res) => {
  const db = readDB();
  const body = req.body;

  if (!body.name || !body.teamCountry || !body.price) {
    return res.status(400).json({ error: "Thừa thiếu thông tin sản phẩm. Tên, Quốc gia và Giá là bắt buộc." });
  }

  const newProduct: Product = {
    id: "prod-" + Math.random().toString(36).substr(2, 9),
    name: body.name,
    teamCountry: body.teamCountry,
    jerseyType: body.jerseyType || "home",
    glbUrl: body.glbUrl || null,
    imageUrl: body.imageUrl || "https://placehold.co/400x500/111/FFD700?text=" + encodeURIComponent(body.name),
    price: Number(body.price),
    stock: Number(body.stock) || 0,
    isActive: body.isActive !== undefined ? body.isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

app.put("/api/products/:id", (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const idx = db.products.findIndex(p => p.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
  }

  const updated = {
    ...db.products[idx],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  db.products[idx] = updated;
  writeDB(db);
  res.json(updated);
});

app.delete("/api/products/:id", (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const idx = db.products.findIndex(p => p.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Không tìm thấy sản phẩm." });
  }

  // Soft delete / Toggle active status
  db.products[idx].isActive = false;
  db.products[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  res.json({ success: true, message: "Sản phẩm đã được dừng hoạt động." });
});


// --- Orders Endpoints ---

// Create Order (customer)
app.post("/api/orders", (req, res) => {
  const db = readDB();
  const { customerName, phone, address, notes, paymentMethod, items } = req.body;

  if (!customerName || !phone || !address || !items || !items.length) {
    return res.status(400).json({ error: "Thông tin đơn hàng không hợp lệ. Vui lòng nhập đầy đủ thông tin gửi hàng." });
  }

  // Generate real ORD-XXXXXXXX format code
  const codeSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  const orderCode = `ORD-${codeSuffix}`;

  const orderId = "ord-" + Math.random().toString(36).substr(2, 9);
  
  // Calculate total items quantity in order to apply bulk/team discount (>= 20 items gets 15% off)
  const totalQty = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0);
  const isTeamDiscount = totalQty >= 20;
  
  let totalAmount = 0;
  const resolvedItems: OrderItem[] = [];

  for (const item of items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) {
      return res.status(400).json({ error: `Không tìm thấy mẫu áo phối hợp (ID: ${item.productId})` });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Sản phẩm ${product.name} chỉ còn ${product.stock} trong kho.` });
    }

    // Deduct stock
    product.stock -= item.quantity;
    product.updatedAt = new Date().toISOString();

    const originalPrice = product.price;
    const unitPrice = isTeamDiscount ? Math.round(originalPrice * 0.85) : originalPrice;
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;

    resolvedItems.push({
      id: "item-" + Math.random().toString(36).substr(2, 9),
      orderId,
      productId: item.productId,
      product,
      nickname: (item.nickname || "").toUpperCase(),
      jerseyNumber: Number(item.jerseyNumber) || 10,
      size: item.size || "M",
      colorHex: item.colorHex || "#ffffff",
      quantity: item.quantity || 1,
      unitPrice
    });
  }

  const payment: Payment = {
    id: "pay-" + Math.random().toString(36).substr(2, 9),
    orderId,
    method: paymentMethod || "cod",
    status: (paymentMethod === "cod" || paymentMethod === "bank_transfer") ? "pending" : "pending",
    amount: totalAmount,
    createdAt: new Date().toISOString()
  };

  const newOrder: Order = {
    id: orderId,
    orderCode,
    customerName,
    phone,
    address,
    notes,
    status: "pending",
    totalAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: resolvedItems,
    payment
  };

  db.orders.unshift(newOrder); // Add to top represent latest
  writeDB(db);

  res.status(201).json(newOrder);
});

// Fetch Single Order for Tracking (No auth required)
app.get("/api/orders/track", (req, res) => {
  const db = readDB();
  const query = (req.query.query as string || "").trim();

  if (!query) {
    return res.status(400).json({ error: "Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu." });
  }

  // Find by exact code or exact phone
  const searchNormalized = query.toUpperCase();
  const results = db.orders.filter(o => 
    o.orderCode.toUpperCase() === searchNormalized || 
    o.phone.replace(/[\s\-\(\)]/g, "") === query.replace(/[\s\-\(\)]/g, "")
  );

  res.json(results);
});

// Admin list order with filters
app.get("/api/orders", (req, res) => {
  const db = readDB();
  const { search, status, paymentMethod } = req.query;

  let results = db.orders;

  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(o => 
      o.orderCode.toLowerCase().includes(q) || 
      o.customerName.toLowerCase().includes(q) || 
      o.phone.includes(q) || 
      (o.items && o.items.some(item => item.nickname && item.nickname.toLowerCase().includes(q)))
    );
  }

  if (status && status !== "all") {
    results = results.filter(o => o.status === status);
  }

  if (paymentMethod && paymentMethod !== "all") {
    results = results.filter(o => o.payment?.method === paymentMethod);
  }

  res.json(results);
});

// Single Order Status Update (Admin)
app.put("/api/orders/:id/status", (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const { status, paymentStatus } = req.body;

  const idx = db.orders.findIndex(o => o.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Không tìm thấy đơn đặt hàng." });
  }

  if (status) {
    db.orders[idx].status = status as OrderStatus;
  }
  if (paymentStatus && db.orders[idx].payment) {
    db.orders[idx].payment!.status = paymentStatus as PaymentStatus;
    if (paymentStatus === "paid") {
      db.orders[idx].payment!.paidAt = new Date().toISOString();
    }
  }

  db.orders[idx].updatedAt = new Date().toISOString();
  writeDB(db);

  res.json(db.orders[idx]);
});

// Bulk Status Updates
app.put("/api/orders/bulk-status", (req, res) => {
  const db = readDB();
  const { orderIds, status } = req.body;

  if (!orderIds || !Array.isArray(orderIds) || !status) {
    return res.status(400).json({ error: "Dữ liệu cập nhật số lượng lớn không hợp lệ." });
  }

  let count = 0;
  db.orders = db.orders.map(o => {
    if (orderIds.includes(o.id)) {
      count++;
      return {
        ...o,
        status: status as OrderStatus,
        updatedAt: new Date().toISOString()
      };
    }
    return o;
  });

  writeDB(db);
  res.json({ success: true, updatedCount: count });
});


// --- Dashboard Stats Endpoints ---
app.get("/api/stats", (req, res) => {
  const db = readDB();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const totalOrders = db.orders.length;
  const revenue = db.orders
    .filter(o => o.payment?.status === "paid" || o.status === "completed" || o.status === "shipping")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const pendingOrders = db.orders.filter(o => o.status === "pending").length;

  const completedToday = db.orders.filter(o => {
    const isCompleted = o.status === "completed";
    const orderDate = o.updatedAt.split("T")[0];
    return isCompleted && orderDate === todayStr;
  }).length;

  // Orders by Status
  const statuses: OrderStatus[] = ["pending", "processing", "printing", "shipping", "completed", "cancelled"];
  const ordersByStatus = statuses.map(status => {
    return {
      status,
      count: db.orders.filter(o => o.status === status).length
    };
  });

  // Top Teams Ordered
  const teamCountMap: { [key: string]: number } = {};
  db.orders.forEach(o => {
    if (o.items) {
      o.items.forEach(item => {
        if (item.product) {
          const team = item.product.teamCountry;
          teamCountMap[team] = (teamCountMap[team] || 0) + item.quantity;
        }
      });
    }
  });

  const topTeams = Object.keys(teamCountMap)
    .map(team => ({ team, count: teamCountMap[team] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Hardcode some default fallback teams if DB has no orders yet
  if (topTeams.length === 0) {
    topTeams.push(
      { team: "Argentina 🇦🇷", count: 8 },
      { team: "Brazil 🇧🇷", count: 6 },
      { team: "Vietnam 🇻🇳", count: 5 },
      { team: "Japan 🇯🇵", count: 3 },
      { team: "France 🇫🇷", count: 2 }
    );
  }

  // Trend Last 7 Days (dynamic matching 2026 dates)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split("T")[0];
    
    const matchedOrders = db.orders.filter(o => o.createdAt.split("T")[0] === dayStr);
    const count = matchedOrders.length;
    const amount = matchedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return {
      date: d.toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" }),
      count,
      amount
    };
  });

  res.json({
    totalOrders,
    revenue,
    pendingOrders,
    completedToday,
    ordersByStatus,
    topTeams,
    ordersLast7Days: last7Days
  });
});


// --- Customer list (derived from orders) ---
app.get("/api/customers", (req, res) => {
  const db = readDB();
  const search = (req.query.search as string || "").toLowerCase();

  // Aggregate by Phone Number
  const customerMap: { [phone: string]: {
    phone: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
    firstOrderDate: string;
    lastOrderDate: string;
  }} = {};

  db.orders.forEach(o => {
    const cleanPhone = o.phone.trim();
    if (!customerMap[cleanPhone]) {
      customerMap[cleanPhone] = {
        phone: cleanPhone,
        name: o.customerName,
        totalOrders: 0,
        totalSpent: 0,
        firstOrderDate: o.createdAt,
        lastOrderDate: o.createdAt
      };
    }

    const current = customerMap[cleanPhone];
    current.totalOrders += 1;
    current.totalSpent += Number(o.totalAmount);

    if (new Date(o.createdAt) < new Date(current.firstOrderDate)) {
      current.firstOrderDate = o.createdAt;
    }
    if (new Date(o.createdAt) > new Date(current.lastOrderDate)) {
      current.lastOrderDate = o.createdAt;
    }
  });

  let result = Object.values(customerMap);

  if (search) {
    result = result.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.phone.includes(search)
    );
  }

  res.json(result);
});


// --- Virtual Payments Simulate IPN Webhooks ---
app.post("/api/payments/simulate", (req, res) => {
  const db = readDB();
  const { orderId, paymentStatus } = req.body;

  const idx = db.orders.findIndex(o => o.id === orderId);
  if (idx === -1) {
    return res.status(404).json({ error: "Không tìm thấy đơn đặt hàng." });
  }

  if (db.orders[idx].payment) {
    db.orders[idx].payment!.status = paymentStatus as PaymentStatus;
    if (paymentStatus === "paid") {
      db.orders[idx].payment!.paidAt = new Date().toISOString();
      db.orders[idx].payment!.transactionId = "TXN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      // Auto move pending -> processing on paid
      if (db.orders[idx].status === "pending") {
        db.orders[idx].status = "processing";
      }
    }
  }

  db.orders[idx].updatedAt = new Date().toISOString();
  writeDB(db);

  res.json({ success: true, order: db.orders[idx] });
});


// Setup development / production asset handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
