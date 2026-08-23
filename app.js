const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const { connectDb, getCollection, toDict, toDictList } = require('./database');
const aiOptimizer = require('./ai_optimizer');

const app = express();
const PORT = process.env.PORT || 8000;
const SECRET_KEY = process.env.JWT_SECRET_KEY || "b3d7a8e8f81c9a0c20a48a9b2b5c5e8f2390a1b2c3d4e5f6";
const ACCESS_TOKEN_EXPIRE_MINUTES = 240;

// Enable CORS and parsing of request body
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));

// Serving HTML templates
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
});

app.get('/waiter', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'waiter_dashboard.html'));
});

app.get('/kitchen', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'kitchen_dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'admin_dashboard.html'));
});

// Middleware for JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }

  const token = parts[1];
  jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] }, (err, payload) => {
    if (err) {
      return res.status(401).json({ detail: "Could not validate credentials" });
    }
    // payload structure: { sub: username, role: role }
    req.user = payload;
    next();
  });
}

// -------------------------------------------------------------
// Auth APIs
// -------------------------------------------------------------
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Validations (matching Pydantic validation)
    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 50) {
      return res.status(400).json({ detail: "Username must be between 3 and 50 characters long" });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ detail: "Password must be at least 4 characters long" });
    }
    if (!role || !/^(Admin|Waiter|Chef)$/.test(role)) {
      return res.status(400).json({ detail: "Role must be one of Admin, Waiter, or Chef" });
    }

    const usersCollection = getCollection('users');
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ detail: "Username already registered" });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = {
      username,
      password_hash: passwordHash,
      role
    };

    await usersCollection.insertOne(newUser);
    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ detail: "Username and password are required" });
    }

    const usersCollection = getCollection('users');
    const user = await usersCollection.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ detail: "Incorrect username or password" });
    }

    // Generate JWT token
    const tokenPayload = {
      sub: user.username,
      role: user.role
    };
    
    // Expires in ACCESS_TOKEN_EXPIRE_MINUTES minutes
    const token = jwt.sign(tokenPayload, SECRET_KEY, {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_EXPIRE_MINUTES * 60
    });

    res.json({
      access_token: token,
      token_type: "bearer",
      role: user.role,
      username: user.username
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

// -------------------------------------------------------------
// Menu API
// -------------------------------------------------------------
app.get('/api/menu', authenticateToken, async (req, res) => {
  try {
    const menuCollection = getCollection('menu');
    const items = await menuCollection.find({}).toArray();
    res.json(toDictList(items));
  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

// -------------------------------------------------------------
// Orders API
// -------------------------------------------------------------
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const current_user = req.user;
    if (current_user.role !== 'Waiter' && current_user.role !== 'Admin') {
      return res.status(403).json({ detail: "Only Waiters and Admins are authorized to submit orders" });
    }

    const { table_number, order_type, items } = req.body;

    if (!order_type || !/^(Dine-in|Parcel)$/.test(order_type)) {
      return res.status(400).json({ detail: "Order type must be Dine-in or Parcel" });
    }

    let finalTableNumber = table_number;
    if (order_type === 'Dine-in') {
      if (!table_number || typeof table_number !== 'string' || table_number.trim().length === 0) {
        return res.status(400).json({ detail: "Table number is required for Dine-in orders" });
      }
    } else {
      // For Parcel, table number / customer name is optional. Default to 'Takeaway' if not specified.
      if (!table_number || typeof table_number !== 'string' || table_number.trim().length === 0) {
        finalTableNumber = "Takeaway";
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ detail: "Order must contain at least one item" });
    }

    // Convert item IDs and ensure they exist
    const objectIds = [];
    for (const itemId of items) {
      try {
        objectIds.push(new ObjectId(itemId));
      } catch (err) {
        return res.status(400).json({ detail: `Invalid menu item ID format: ${itemId}` });
      }
    }

    // Verify items exist in database
    const menuCollection = getCollection('menu');
    const dbItems = await menuCollection.find({ _id: { $in: objectIds } }).toArray();

    // Verify all menu items from the request exist in the menu collection
    const uniqueInputItems = new Set(items);
    if (dbItems.length !== uniqueInputItems.size) {
      return res.status(400).json({ detail: "One or more menu items do not exist" });
    }

    const ordersCollection = getCollection('orders');
    const newOrder = {
      waiter_id: current_user.sub,
      table_number: finalTableNumber,
      order_type,
      items: objectIds,
      status: "Pending",
      timestamp: new Date() // Store as ISODate
    };

    const result = await ordersCollection.insertOne(newOrder);
    res.status(201).json({
      message: "Order created successfully",
      order_id: result.insertedId.toString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

app.get('/api/orders/active', authenticateToken, async (req, res) => {
  try {
    const ordersCollection = getCollection('orders');
    // Fetch orders with status Pending or Cooking, sorted by timestamp ascending
    const activeOrders = await ordersCollection.find({
      status: { $in: ["Pending", "Cooking"] }
    }).sort({ timestamp: 1 }).toArray();

    // Fetch all menu items for caching to avoid N+1 query overhead
    const menuCollection = getCollection('menu');
    const menuItems = await menuCollection.find({}).toArray();
    const menuCache = {};
    menuItems.forEach(item => {
      menuCache[item._id.toString()] = toDict(item);
    });

    const resolvedOrders = [];
    for (const order of activeOrders) {
      const orderDict = toDict(order);
      const itemsDetails = [];

      const orderItems = order.items || [];
      for (const itemId of orderItems) {
        const itemStr = itemId.toString();
        if (menuCache[itemStr]) {
          itemsDetails.push(menuCache[itemStr]);
        } else {
          itemsDetails.push({
            id: itemStr,
            name: "Unknown Menu Item",
            price: 0.0,
            prep_time_minutes: 10
          });
        }
      }

      orderDict.items_details = itemsDetails;

      // Ensure timestamp is converted to ISO timezone string
      if (order.timestamp) {
        orderDict.timestamp = new Date(order.timestamp).toISOString();
      }

      resolvedOrders.push(orderDict);
    }

    res.json(resolvedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

app.put('/api/orders/:order_id/status', authenticateToken, async (req, res) => {
  try {
    const current_user = req.user;
    if (current_user.role !== 'Chef' && current_user.role !== 'Admin') {
      return res.status(403).json({ detail: "Only Chefs and Admins can update order statuses" });
    }

    const { order_id } = req.params;
    const { status } = req.body;

    if (!status || !/^(Pending|Cooking|Ready)$/.test(status)) {
      return res.status(400).json({ detail: "Status must be Pending, Cooking, or Ready" });
    }

    let oid;
    try {
      oid = new ObjectId(order_id);
    } catch (err) {
      return res.status(400).json({ detail: "Invalid order ID format" });
    }

    const ordersCollection = getCollection('orders');
    const order = await ordersCollection.findOne({ _id: oid });
    if (!order) {
      return res.status(404).json({ detail: "Order not found" });
    }

    await ordersCollection.updateOne(
      { _id: oid },
      { $set: { status } }
    );

    res.json({ message: `Order status updated to ${status}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

// -------------------------------------------------------------
// AI Suggestions API
// -------------------------------------------------------------
app.get('/api/ai/suggestions', authenticateToken, async (req, res) => {
  try {
    const current_user = req.user;
    if (current_user.role !== 'Chef' && current_user.role !== 'Waiter' && current_user.role !== 'Admin') {
      return res.status(403).json({ detail: "Unauthorized access to AI optimization suggestions" });
    }

    const suggestions = await aiOptimizer.getAiSuggestions();
    res.json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

// -------------------------------------------------------------
// Admin Analytics API
// -------------------------------------------------------------
app.get('/api/admin/analytics', authenticateToken, async (req, res) => {
  try {
    const current_user = req.user;
    if (!current_user.role || current_user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ detail: "Only Admins are authorized to view analytics" });
    }

    const ordersCollection = getCollection('orders');
    const menuCollection = getCollection('menu');

    // Fetch all menu items for pricing lookup
    const menuItems = await menuCollection.find({}).toArray();
    const menuCache = {};
    menuItems.forEach(item => {
      menuCache[item._id.toString()] = toDict(item);
    });

    // Fetch all orders
    const orders = await ordersCollection.find({}).toArray();

    const now = new Date();
    
    // Calendar boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Relative boundaries
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Initial metrics
    let stats = {
      today: { orders: 0, revenue: 0 },
      week: { orders: 0, revenue: 0 },
      month: { orders: 0, revenue: 0 },
      allTime: { orders: 0, revenue: 0 }
    };

    // Item sales tracking
    const itemSales = {};
    
    // Service type distribution
    const orderTypes = { "Dine-in": 0, "Parcel": 0 };
    
    // Order status breakdown
    const orderStatuses = { "Pending": 0, "Cooking": 0, "Ready": 0 };

    // Revenue per day for the last 7 days (including today)
    const dailyTrend = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyTrend[dateStr] = { label, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      if (!order.timestamp) return;
      const orderDate = new Date(order.timestamp);
      if (isNaN(orderDate.getTime())) return;
      
      // Calculate order total
      let orderTotal = 0;
      const orderItems = order.items || [];
      
      orderItems.forEach(itemId => {
        const itemStr = itemId.toString();
        const item = menuCache[itemStr];
        if (item) {
          orderTotal += item.price;
          
          // Track item sales
          if (!itemSales[itemStr]) {
            itemSales[itemStr] = { name: item.name, category: item.category, quantity: 0, revenue: 0 };
          }
          itemSales[itemStr].quantity += 1;
          itemSales[itemStr].revenue += item.price;
        }
      });

      // Track status
      if (orderStatuses[order.status] !== undefined) {
        orderStatuses[order.status] += 1;
      }

      // Track order type
      if (orderTypes[order.order_type] !== undefined) {
        orderTypes[order.order_type] += 1;
      }

      // Classify today
      if (orderDate >= startOfToday) {
        stats.today.orders += 1;
        stats.today.revenue += orderTotal;
      }

      // Classify week
      if (orderDate >= startOfWeek) {
        stats.week.orders += 1;
        stats.week.revenue += orderTotal;
      }

      // Classify month
      if (orderDate >= startOfMonth) {
        stats.month.orders += 1;
        stats.month.revenue += orderTotal;
      }

      // All time
      stats.allTime.orders += 1;
      stats.allTime.revenue += orderTotal;

      // Classify daily trend (last 7 days)
      const dateStr = orderDate.toISOString().split('T')[0];
      if (dailyTrend[dateStr]) {
        dailyTrend[dateStr].orders += 1;
        dailyTrend[dateStr].revenue += orderTotal;
      }
    });

    // Format top selling items
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Format daily trend
    const trendList = Object.keys(dailyTrend).sort().map(dateStr => ({
      date: dateStr,
      label: dailyTrend[dateStr].label,
      revenue: dailyTrend[dateStr].revenue,
      orders: dailyTrend[dateStr].orders
    }));

    res.json({
      summary: stats,
      dailyTrend: trendList,
      topItems,
      orderTypes,
      orderStatuses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ detail: "Internal Server Error" });
  }
});

// -------------------------------------------------------------
// Start Server
// -------------------------------------------------------------
async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
