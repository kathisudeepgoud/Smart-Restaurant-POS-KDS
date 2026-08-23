# 🍽️ Smart Restaurant KDS & POS Management System

An enterprise-grade, real-time **Kitchen Display System (KDS)**, **Point of Sale (POS) Terminal**, and **AI-Driven Kitchen Workflow Optimizer** built with **Node.js**, **Express**, **MongoDB**, and **Vanilla HTML5/CSS3/JavaScript**.

Designed for fast-paced dining establishments, this solution replaces legacy paper tickets with intelligent digital order routing, automated batch-cooking algorithms, real-time order lifecycle tracking, and comprehensive admin business intelligence analytics.

---

## 📑 Table of Contents

- [Overview & Value Proposition](#-overview--value-proposition)
- [Tech Stack & Programming Languages](#-tech-stack--programming-languages)
- [Architectural Approach & Design Patterns](#-architectural-approach--design-patterns)
- [Key Features by Role](#-key-features-by-role)
  - [🔐 Authentication & Role-Based Access Control (RBAC)](#-authentication--role-based-access-control-rbac)
  - [🛒 Waiter POS Terminal (`/waiter`)](#-waiter-pos-terminal-waiter)
  - [👨‍🍳 Chef Kitchen Display System (`/kitchen`)](#-chef-kitchen-display-system-kitchen)
  - [🧠 AI Kitchen Workflow Optimizer](#-ai-kitchen-workflow-optimizer)
  - [📊 Admin Analytics Dashboard (`/admin`)](#-admin-analytics-dashboard-admin)
- [🧠 AI Optimization Algorithm Deep-Dive](#-ai-optimization-algorithm-deep-dive)
- [🌐 RESTful API Reference](#-restful-api-reference)
- [🗄️ Database Schemas & Auto-Seeding](#-database-schemas--auto-seeding)
- [📂 Directory & File Structure](#-directory--file-structure)
- [⚙️ Environment Variables](#️-environment-variables)
- [🚀 Installation & Setup Guide](#-installation--setup-guide)
- [💡 Operational Walkthrough](#-operational-walkthrough)

---

## 🌟 Overview & Value Proposition

In traditional restaurant kitchens, order delays, item preparation bottlenecks, and miscommunication between front-of-house waiters and back-of-house chefs result in lower customer satisfaction and lost revenue.

The **Smart Restaurant KDS & POS Management System** solves these challenges by connecting the entire restaurant ecosystem:
1. **Waiters** place orders via an intuitive POS interface supporting both **Dine-in** and **Parcel/Takeaway** orders.
2. **Chefs** receive live kitchen tickets sorted automatically by wait time, status, and urgency, backed by an **AI recommendation engine** that groups duplicate items across tickets for batch cooking.
3. **Admins** gain real-time visibility into revenue metrics, daily sales trends, item popularity, and kitchen queue efficiency.

---

## 💻 Tech Stack & Programming Languages

### **Backend Technologies**
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Language** | **JavaScript (ES6+ / Node.js v18+)** | Asynchronous server runtime driving non-blocking operations. |
| **Framework** | **Express.js (v4.19.2)** | Lightweight Web & REST API framework. |
| **Database** | **MongoDB Driver (v6.7.0)** | Native MongoDB client connecting to document databases. |
| **Authentication** | **JSON Web Token (`jsonwebtoken` v9.0.2)** | Stateless Bearer token security with 240-minute expiration. |
| **Security** | **Bcrypt.js (v2.4.3)** | One-way salt password hashing (`bcrypt.hashSync`). |
| **Middleware** | **CORS (v2.8.5), dotenv (v16.4.5)** | Cross-origin resource sharing & environment configuration. |

### **Frontend Technologies**
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Structure** | **HTML5** | Semantic HTML structure for responsive dashboards. |
| **Logic** | **Vanilla JavaScript (ES6 Modules/Fetch API)** | Client-side reactive DOM manipulation & REST API integration. |
| **Styling** | **Custom Vanilla CSS3** | Dark glassmorphic design system using CSS variables, Flexbox, & Grid. |
| **Icons & Typography** | **FontAwesome 6.4.0 (CDN)** | Scalable vector icons for intuitive user UI feedback. |

---

## 🏗️ Architectural Approach & Design Patterns

### 1. **RESTful API & Single-Page Dashboard Architecture**
The application decouples backend API endpoints (`/api/...`) from view rendering routes (`/`, `/waiter`, `/kitchen`, `/admin`). The client uses native `fetch()` calls with JWT header authorization to request data dynamically and update DOM containers without full page reloads.

### 2. **Stateless JWT Security Model**
User sessions rely on signed JWT tokens storing the `username` (`sub`) and `role`. Route protection is enforced via middleware (`authenticateToken`), while the client stores tokens in `localStorage` (`kds_token`, `kds_role`, `kds_username`) for persistent access across tabs.

### 3. **Native MongoDB Driver & In-Memory Lookup Caching**
Instead of relying on heavy ORMs/ODMs (like Mongoose or Sequelize), the backend uses native MongoDB collection queries. To avoid standard **N+1 query performance degradation** during bulk order processing, menu item data is loaded in bulk and cached in memory per request loop.

### 4. **Real-Time Synchronous Polling Strategy**
Client dashboards (`/kitchen` and `/admin`) utilize automated 5-second and 10-second polling timers (`setInterval`) to fetch active order statuses and AI suggestions without requiring complicated WebSocket fallback configurations.

### 5. **Design System & Glassmorphism Aesthetics**
The user interface features a sleek dark mode aesthetic with HSL-based CSS variables, neon gradient highlights (`--gradient-dinein`, `--gradient-parcel`, `--gradient-chef`, `--gradient-button`), custom scrollbars, subtle hover scale transformations, and status pulses.

---

## ✨ Key Features by Role

### 🔐 Authentication & Role-Based Access Control (RBAC)
- **Role Hierarchy**: Supports **`Admin`**, **`Waiter`**, and **`Chef`**.
- **User Registration**: Validation ensures minimum password lengths (≥4 chars), username uniqueness, and valid role selection.
- **Role Redirection**: Automatic client-side redirection upon login:
  - `Chef` $\rightarrow$ redirected to `/kitchen` KDS view.
  - `Admin` $\rightarrow$ redirected to `/admin` Analytics view (with fast topbar switch links to POS & KDS).
  - `Waiter` $\rightarrow$ redirected to `/waiter` POS view.

---

### 🛒 Waiter POS Terminal (`/waiter`)
- **Dynamic Category Filter Bar**: Filter menu items by categories: *All Items, Gobi, Rice items, Milkshakes, Ice creams, Spl.Ice creams, Ice cream parcel, Basanthi parcel*.
- **Interactive Menu Grid**: Visual dish cards displaying prices in Indian Rupees (₹) and preparation time estimates.
- **Cart Management**: Add items, adjust item quantities ($+ / -$), clear cart, and calculate totals in real-time.
- **Order Service Types**:
  - **Dine-in**: Requires entering a specific Table Number (e.g., `Table 5`, `Bar-2`).
  - **Parcel / Takeaway**: Automatically sets location to `"Takeaway"` if unspecified.
- **Instant Dispatch**: Sends order payloads directly to MongoDB and triggers live updates on the Kitchen Display Screen.

---

### 👨‍🍳 Chef Kitchen Display System (`/kitchen`)
- **Live Active Orders Feed**: Displays tickets with status `Pending` or `Cooking` sorted chronologically.
- **Order Card Metadata**: Displays Table Number tag, Order Type badge (`Dine-in` vs `Parcel`), item breakdown with quantities, order state, and elapsed wait timer.
- **Visual Urgency Escalation**: Orders waiting $\ge 12$ minutes highlight in bold red text with a warning alert icon (`⚠️`).
- **Interactive State Transitions**:
  - `Pending` $\rightarrow$ Click **"Start Cooking"** updates status to `Cooking`.
  - `Cooking` $\rightarrow$ Click **"Mark Ready"** updates status to `Ready` (removes ticket from active display).
- **Aggregated Live Summary Chips**: A top-level summary banner displaying aggregated quantities of identical items across *all* active tickets (e.g., `Gobi Chilli x4`, `Fried Rice x2`).

---

### 🧠 AI Kitchen Workflow Optimizer
Right-side smart panel on the Kitchen Display Screen delivering actionable optimization insight:
1. **Batch Cooking Recommendations**: Identifies identical menu items across multiple table orders and prompts the chef to prepare them in a single batch.
2. **Urgency & Priority Warnings**: Flag orders exceeding threshold wait times and highlight target items.
3. **Recommended Cooking Sequence**: Ranked list of order tickets based on calculated urgency scores.

---

### 📊 Admin Analytics Dashboard (`/admin`)
- **Sales Metrics Executive Summary Cards**:
  - **Today's Revenue & Orders** (Calculated from 12:00 AM calendar boundary).
  - **Weekly Revenue & Orders** (Rolling last 7 days).
  - **Monthly Revenue & Orders** (Rolling last 30 days).
  - **All-Time Revenue & Total Orders**.
- **Daily Sales Trend (Last 7 Days)**: Day-by-day revenue breakdown and order counts.
- **Top 10 Selling Menu Items**: Ranking based on total units sold and total revenue earned.
- **Service Distribution Analytics**: Visual percentage bars comparing **Dine-in** vs **Parcel** order volume.
- **Active Queue Status Metrics**: Live counter for `Pending`, `Cooking`, and `Ready` orders.

---

## 🧠 AI Optimization Algorithm Deep-Dive

The AI optimizer (`ai_optimizer.js`) evaluates pending kitchen orders dynamically using a multi-factor mathematical priority model:

### **1. Priority Score Formula**
$$\text{Priority Score} = (\text{Wait Time} \times 1.5) + \text{Dine-in Bonus} + \text{Urgency Boost} + \text{Prep Time Weight}$$

Where:
- $\text{Wait Time}$: Elapsed time in minutes since order creation ($(\text{Now} - \text{Timestamp}) / 60000$).
- $\text{Wait Time} \times 1.5$: Base scaling factor favoring longer wait times.
- $\text{Dine-in Bonus} = +5.0$: Priority boost for seated customers over takeaway orders.
- $\text{Urgency Boost} = +20.0$: Applied if $\text{Wait Time} > 12.0\text{ minutes}$.
- $\text{Prep Time Weight} = (15 - \text{Max Prep Time}) \times 0.2$: Gives minor priority to quick-prep dishes to clear kitchen queue bottlenecks.

### **2. Batch Cooking Aggregation Algorithm**
1. Iterates through all `Pending` orders.
2. Maps each unique menu item `itemId` to an array of associated order references (`Order ID`, `Table/Parcel Label`).
3. If an `itemId` appears across **2 or more separate orders**, a batch instruction is generated:
   $$\text{"Batch cook } N\text{x } \text{ItemName for Table X, Table Y (Reduces prep bottleneck)"}$$

---

## 🌐 RESTful API Reference

### 🔑 Authentication APIs
| Method | Endpoint | Access | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Public | `{ username, password, role }` | Registers a new user (`Admin`, `Waiter`, `Chef`). |
| `POST` | `/api/login` | Public | `{ username, password }` | Authenticates user & returns JWT `access_token`. |

### 📖 Menu APIs
| Method | Endpoint | Access | Headers | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/menu` | Authenticated | `Authorization: Bearer <token>` | Fetches full array of menu items. |

### 🛒 Orders APIs
| Method | Endpoint | Access | Headers / Params | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/orders` | Waiter, Admin | `Authorization: Bearer <token>` | Submits a new order (`table_number`, `order_type`, `items`). |
| `GET` | `/api/orders/active` | Authenticated | `Authorization: Bearer <token>` | Fetches active orders (`Pending` & `Cooking` status) with menu item details. |
| `PUT` | `/api/orders/:order_id/status` | Chef, Admin | `Authorization: Bearer <token>` | Updates order status (`Pending`, `Cooking`, `Ready`). |

### 🧠 AI Suggestions API
| Method | Endpoint | Access | Headers | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/ai/suggestions` | Chef, Waiter, Admin | `Authorization: Bearer <token>` | Calculates batch cooking, priority warnings, & cooking sequence. |

### 📊 Admin Analytics API
| Method | Endpoint | Access | Headers | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/analytics` | Admin | `Authorization: Bearer <token>` | Returns executive summary stats, sales trends, top items, & operational distributions. |

---

## 🗄️ Database Schemas & Auto-Seeding

The database engine (`database.js`) connects to MongoDB database `smart_restaurant_kds`.

### 1. `users` Collection
```json
{
  "_id": ObjectId("..."),
  "username": "chef_john",
  "password_hash": "$2a$10$...",
  "role": "Chef" // "Admin" | "Waiter" | "Chef"
}
```

### 2. `menu` Collection
```json
{
  "_id": ObjectId("..."),
  "name": "Gobi Manchurian",
  "category": "Gobi", // "Gobi" | "Rice items" | "Milkshakes" | "Ice creams" | "Spl.Ice creams" | "Ice cream parcel" | "Basanthi parcel"
  "prep_time_minutes": 12,
  "price": 140
}
```
*Note: If the `menu` collection is empty on startup, `seedMenuIfEmpty()` automatically inserts over 50 pre-configured menu items across 7 distinct categories.*

### 3. `orders` Collection
```json
{
  "_id": ObjectId("..."),
  "waiter_id": "waiter_sam",
  "table_number": "5",
  "order_type": "Dine-in", // "Dine-in" | "Parcel"
  "items": [ ObjectId("..."), ObjectId("...") ],
  "status": "Pending", // "Pending" | "Cooking" | "Ready"
  "timestamp": ISODate("2026-08-22T08:30:00Z")
}
```

---

## 📂 Directory & File Structure

```
Restaurant Management/
├── app.js                   # Express server entry point, route middleware, and API controllers
├── database.js              # MongoDB database connector, collection getters & menu auto-seeder
├── ai_optimizer.js          # AI batch cooking & multi-factor priority scoring algorithm
├── package.json             # NPM project metadata & dependency manifest
├── package-lock.json        # Locked dependency tree
├── .env                     # (Optional) Environment configuration file
├── templates/               # HTML5 frontend page templates
│   ├── login.html           # Unified login & account creation interface
│   ├── waiter_dashboard.html# Waiter POS ordering terminal
│   ├── kitchen_dashboard.html# Chef Kitchen Display System (KDS) & AI suggestions
│   └── admin_dashboard.html # Executive business intelligence & operational analytics
└── static/                  # Static assets served via Express
    ├── css/
    │   └── styles.css       # Complete unified CSS design system & dynamic animations
    └── js/
        ├── auth.js          # Client JWT authentication, token storage & route guards
        ├── waiter.js        # POS menu filter, cart state manager & order submitter
        ├── kitchen.js       # Live order ticket renderer, status toggle & 5s auto-poller
        └── admin.js         # Analytics metrics renderer, trend charts & 10s auto-poller
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory to configure custom parameters (defaults apply if omitted):

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/
JWT_SECRET_KEY=b3d7a8e8f81c9a0c20a48a9b2b5c5e8f2390a1b2c3d4e5f6
```

---

## 🚀 Installation & Setup Guide

### **Prerequisites**
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017/` (or MongoDB Atlas connection URI)

### **Step-by-Step Setup**

1. **Clone or Navigate to the Workspace**:
   ```bash
   cd "Restaurant Management"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Ensure MongoDB is Running**:
   - Start your local MongoDB server via command line or MongoDB Compass.

4. **Start the Application**:
   - **Development mode**:
     ```bash
     npm run dev
     ```
   - **Production mode**:
     ```bash
     npm start
     ```

5. **Access the Application**:
   - Open your browser and navigate to `http://localhost:8000`.

---

## 💡 Operational Walkthrough

1. **Account Registration**:
   - Visit `http://localhost:8000`.
   - Click the **"Register"** tab.
   - Create 3 user accounts for testing:
     - Username: `admin1` | Password: `password` | Role: `Admin`
     - Username: `waiter1` | Password: `password` | Role: `Waiter`
     - Username: `chef1` | Password: `password` | Role: `Chef`

2. **Waiters (POS Ordering)**:
   - Log in as `waiter1`.
   - Browse categories (e.g., *Rice items*, *Gobi*, *Milkshakes*).
   - Add items to cart, set Table Number to `Table 4`, select `Dine-in`, and click **"Send to Kitchen"**.

3. **Chefs (Kitchen Display & AI Optimization)**:
   - Log in as `chef1` (or use topbar switches as Admin).
   - View live ticket cards on the left panel.
   - Observe **Total Order Summary Chips** at the top summarizing all item quantities needed.
   - Review **AI Chef Suggestions** on the right panel for batch cooking tips and recommended prep order.
   - Click **"Start Cooking"** $\rightarrow$ ticket changes state to `Cooking`.
   - Click **"Mark Ready"** $\rightarrow$ ticket completes and clears from active feed.

4. **Admins (Analytics)**:
   - Log in as `admin1`.
   - View real-time sales numbers, 7-day revenue charts, top 10 best-selling items, and service breakdown statistics.
