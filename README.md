# 🍽️ Smart Restaurant KDS & POS System (MERN Stack)

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-green.svg)](https://en.wikipedia.org/wiki/MEAN_(solution_stack))
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v4.19.2-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![React.js](https://img.shields.io/badge/React.js-v19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6.7-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, real-time **Kitchen Display System (KDS)**, **Point of Sale (POS) Terminal**, and **AI-Driven Kitchen Workflow Optimizer** built entirely with the **MERN Stack** (**M**ongoDB, **E**xpress.js, **R**eact.js, **N**ode.js) using **pure JavaScript / JSX (No TypeScript)** and **Vanilla CSS3 Glassmorphism**.

Designed for high-volume dining environments, this application modernizes restaurant operations by replacing physical paper tickets with intelligent digital order routing, real-time item status transitions, automated batch-cooking algorithms, and executive business intelligence analytics.

---

## 📑 Table of Contents

- [🌟 Overview & Value Proposition](#-overview--value-proposition)
- [🧩 MERN Stack Architecture Breakdown](#-mern-stack-architecture-breakdown)
- [💻 Tech Stack & Programming Languages](#-tech-stack--programming-languages)
- [🏗️ Architectural Approach & Design Patterns](#-architectural-approach--design-patterns)
- [✨ Key Features by Role](#-key-features-by-role)
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

The **Smart Restaurant KDS & POS Management System** solves these challenges through a unified MERN application:
1. **Waiters** place orders instantly using a responsive POS terminal supporting both **Dine-in** and **Parcel / Takeaway** modes.
2. **Chefs** monitor incoming tickets sorted dynamically by urgency and wait time on the Kitchen Display Screen (KDS), guided by an **AI recommendation engine** that groups duplicate items across tickets for batch cooking.
3. **Admins** analyze business health with real-time operational metrics, 7-day revenue charts, top 10 best-sellers, and kitchen queue efficiency.

---

## 🧩 MERN Stack Architecture Breakdown

This project is architected strictly around the **MERN** application stack:

```
┌────────────────────────────────────────────────────────┐
│             REACT.JS (React 19 SPA + Vite)             │
│   Login View  │ Waiter POS │ Chef KDS │ Admin Analytics │
└───────────────────────────▲────────────────────────────┘
                            │ Fetch API / JWT Bearer Tokens
┌───────────────────────────▼────────────────────────────┐
│              EXPRESS.JS + NODE.JS BACKEND              │
│      Route Handlers │ JWT Middleware │ AI Optimizer    │
└───────────────────────────▲────────────────────────────┘
                            │ Native MongoDB Driver v6.7
┌───────────────────────────▼────────────────────────────┐
│                    MONGODB DATABASE                    │
│      users Collection │ menu Collection │ orders       │
└────────────────────────────────────────────────────────┘
```

* **M - MongoDB**:
  * High-performance NoSQL document database (`smart_restaurant_kds`).
  * Manages `users`, `menu`, and `orders` collections.
  * Connects via the official native MongoDB Node.js driver (no heavy ORM overhead).
  * Automatically seeds over 50 dishes across 7 categories upon initialization.

* **E - Express.js**:
  * Lightweight RESTful web framework driving server routes and API endpoints.
  * Enforces stateless JWT authentication and role authorization (`Admin`, `Waiter`, `Chef`).
  * Hosts the compiled production bundle (`dist/`) while exposing clean JSON endpoints under `/api/...`.

* **R - React.js (Pure JavaScript / JSX, No TypeScript)**:
  * Fast Single-Page Application (SPA) driven by React 19 and React Router v7.
  * Modular component architecture across dedicated pages (`Login.jsx`, `WaiterDashboard.jsx`, `KitchenDashboard.jsx`, `AdminDashboard.jsx`).
  * Powered by Vite for sub-second development HMR and lightning-fast production bundling.
  * Implements responsive state handling, automated polling timers, and fluid micro-animations.

* **N - Node.js**:
  * High-throughput, event-driven JavaScript asynchronous runtime.
  * Handles concurrent client requests, background polling, and real-time computation of AI batch algorithms.

---

## 💻 Tech Stack & Programming Languages

### **Backend Technologies**
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Language** | **JavaScript (Node.js ES6+ / CommonJS)** | Asynchronous server runtime driving non-blocking operations. |
| **Framework** | **Express.js (v4.19.2)** | REST API routing, static file hosting, and error handling. |
| **Database** | **MongoDB Driver (v6.7.0)** | Native MongoDB client with collection pooling. |
| **Authentication** | **JSON Web Token (`jsonwebtoken` v9.0.2)** | Stateless Bearer token security with 240-minute expiration. |
| **Security** | **Bcrypt.js (v2.4.3)** | One-way cryptographic password hashing. |
| **Middleware** | **CORS (v2.8.5), dotenv (v16.4.5)** | Cross-origin resource sharing & environment configuration. |

### **Frontend Technologies**
| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | **React.js 19 (Pure JS / JSX, No TypeScript)** | Component-based reactive UI architecture. |
| **Routing** | **React Router DOM (v7)** | Client-side declarative routing (`/`, `/waiter`, `/kitchen`, `/admin`). |
| **Build Tool** | **Vite (v8)** | Next-generation frontend build tooling and HMR dev server. |
| **Styling** | **Custom Vanilla CSS3** | Dark glassmorphic design system using CSS variables, Flexbox, & Grid. |
| **Icons & Typography** | **FontAwesome 6.4.0 (CDN) & Plus Jakarta Sans** | Scalable vector icons and clean Google Fonts typography. |

---

## 🏗️ Architectural Approach & Design Patterns

### 1. **Decoupled Client-Server API Architecture**
Frontend views are decoupled into standalone React components (`src/pages/`) that communicate with the Express backend via REST endpoints (`/api/...`). Requests include standard JWT headers (`Authorization: Bearer <token>`).

### 2. **Stateless JWT Security Model**
User sessions rely on signed JWT tokens storing `username` (`sub`) and `role`. Route protection is verified on the backend via Express middleware (`authenticateToken`), while the React frontend persists session credentials in `localStorage` (`kds_token`, `kds_role`, `kds_username`) with automatic route guarding.

### 3. **Native MongoDB Driver & In-Memory Caching**
Instead of heavy ORM abstractions, the backend queries MongoDB directly. To prevent **N+1 query bottlenecks** during bulk active order processing, menu item records are cached in memory per request cycle.

### 4. **Synchronous Polling Strategy**
The Kitchen Display (`5s`) and Admin Analytics (`10s`) use synchronized `setInterval` polling with React `useEffect` lifecycle cleanups, ensuring immediate ticket updates without WebSocket reconnection overhead.

### 5. **Dark Glassmorphic Design System**
The user interface features a sleek dark mode aesthetic with HSL-based CSS variables, neon gradient accents (`--gradient-dinein`, `--gradient-parcel`, `--gradient-chef`, `--gradient-button`), custom scrollbars, subtle hover scale transformations, and status pulses.

---

## ✨ Key Features by Role

### 🔐 Authentication & Role-Based Access Control (RBAC)
- **Role Hierarchy**: Supports **`Admin`**, **`Waiter`**, and **`Chef`**.
- **User Registration**: Validation enforces minimum password lengths (≥4 chars), username uniqueness, and valid role selection.
- **Smart Redirection**:
  - `Chef` $\rightarrow$ redirected to `/kitchen` KDS view.
  - `Admin` $\rightarrow$ redirected to `/admin` Analytics view (with topbar switch buttons to POS & KDS).
  - `Waiter` $\rightarrow$ redirected to `/waiter` POS view.

---

### 🛒 Waiter POS Terminal (`/waiter`)
- **Dynamic Category Filter Bar**: Filter menu items: *All Items, Gobi, Rice items, Milkshakes, Ice creams, Spl.Ice creams, Ice cream parcel, Basanthi parcel*.
- **Interactive Menu Grid**: Visual dish cards displaying prices in Indian Rupees (₹) and preparation time estimates.
- **Cart Management**: Add items, adjust item quantities ($+ / -$), remove individual dishes, clear cart, and calculate real-time totals.
- **Order Service Types**:
  - **Dine-in**: Requires entering a specific Table Number (e.g., `Table 5`, `Bar-2`).
  - **Parcel / Takeaway**: Automatically marks order location as `"Takeaway"` if unspecified.
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
Right-side smart panel on the Kitchen Display Screen delivering actionable optimization insights:
1. **Batch Cooking Recommendations**: Identifies identical menu items across multiple table orders and prompts the chef to prepare them in a single batch.
2. **Urgency & Priority Warnings**: Flags orders exceeding threshold wait times and highlights target items.
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
├── app.js                   # Express server entry point, API controllers & React dist static server
├── database.js              # MongoDB database connector, collection getters & menu auto-seeder
├── ai_optimizer.js          # AI batch cooking & multi-factor priority scoring algorithm
├── package.json             # NPM project metadata & dependencies (React 19, Express, MongoDB, Vite)
├── vite.config.mjs          # Vite configuration with React plugin & backend API proxy
├── index.html               # Root HTML mounting React SPA root container
├── src/                     # React application source code (Pure JavaScript / JSX)
│   ├── main.jsx             # React DOM root entry point
│   ├── App.jsx              # Main routing hub (React Router DOM)
│   ├── styles.css           # Unified CSS design system & dynamic animations
│   └── pages/               # React page components
│       ├── Login.jsx            # Sign In & Registration interface
│       ├── WaiterDashboard.jsx  # Waiter POS ordering terminal
│       ├── KitchenDashboard.jsx # Chef Kitchen Display System (KDS) & AI suggestions
│       └── AdminDashboard.jsx   # Business intelligence & operational analytics
├── templates/               # Re-exports corresponding React components (.jsx)
│   ├── login.jsx
│   ├── waiter_dashboard.jsx
│   ├── kitchen_dashboard.jsx
│   └── admin_dashboard.jsx
├── dist/                    # Compiled production build generated by Vite
└── static/                  # Static assets served via Express
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
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017/` (or a MongoDB Atlas connection URI)

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
   - Start your local MongoDB server via command line (`mongod`) or MongoDB Compass.

---

### **Running the Application**

#### **Option 1: Integrated Mode (Recommended — Single Command)**
Builds the React frontend and serves both the React UI and Express APIs together from a single server:

1. Build the React frontend:
   ```bash
   npm run build
   ```
2. Start the Express server:
   ```bash
   npm start
   ```
3. Open your browser:
   👉 **http://localhost:8000**

---

#### **Option 2: Live Development Mode (with React Hot Reloading)**
Runs the backend API and the Vite React frontend in parallel with instant hot module reloading:

1. **Terminal 1** — Start the Express API server:
   ```bash
   npm run dev:backend
   ```
   *(Running on `http://localhost:8000`)*

2. **Terminal 2** — Start the Vite React development server:
   ```bash
   npm run dev:frontend
   ```
   *(Running on `http://localhost:3000` with automated proxying to port 8000)*

3. Open your browser:
   👉 **http://localhost:3000**

---

## 💡 Operational Walkthrough

1. **Account Registration**:
   - Visit `http://localhost:8000` (or `http://localhost:3000`).
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
   - Use topbar shortcuts to jump directly to the Waiter POS or Chef Kitchen display at any time.
