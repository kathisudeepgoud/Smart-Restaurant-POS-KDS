import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('kds_token');
  const role = localStorage.getItem('kds_role');
  const username = localStorage.getItem('kds_username') || 'Waiter';

  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState({}); // { [itemId]: { item, quantity } }
  const [orderType, setOrderType] = useState('Dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cartContainerRef = useRef(null);

  // Authentication validation
  useEffect(() => {
    if (!token || !role) {
      navigate('/', { replace: true });
    } else if (role === 'Chef') {
      navigate('/kitchen', { replace: true });
    }
  }, [token, role, navigate]);

  // Load Menu
  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch('/api/menu', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          handleLogout();
          return;
        }

        const data = await response.json();
        setMenuItems(data);
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoadingMenu(false);
      }
    }

    if (token) {
      fetchMenu();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('kds_token');
    localStorage.removeItem('kds_role');
    localStorage.removeItem('kds_username');
    navigate('/');
  };

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  // Cart operations
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: existing ? existing.quantity + 1 : 1
        }
      };
    });

    setTimeout(() => {
      if (cartContainerRef.current) {
        cartContainerRef.current.scrollTo({
          top: cartContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: newQty
        }
      };
    });
  };

  const removeItem = (itemId) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Calculate cart total
  const cartEntries = Object.entries(cart);
  const totalAmount = cartEntries.reduce((sum, [, { item, quantity }]) => sum + (item.price * quantity), 0);

  // Submit order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (cartEntries.length === 0) {
      alert('Your cart is empty! Add menu items before submitting.');
      return;
    }

    if (orderType === 'Dine-in' && !tableNumber.trim()) {
      alert('Please enter a table number.');
      return;
    }

    // Flatten item IDs
    const itemIds = [];
    cartEntries.forEach(([id, { quantity }]) => {
      for (let i = 0; i < quantity; i++) {
        itemIds.push(id);
      }
    });

    setSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          table_number: tableNumber.trim(),
          order_type: orderType,
          items: itemIds
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || 'Failed to submit the order.');
        return;
      }

      alert('Order submitted successfully!');
      clearCart();
      setTableNumber('');
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('Could not connect to the backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Topbar Navigation */}
      <header className="app-header">
        <div className="logo" onClick={() => navigate('/waiter')}>
          <div className="logo-icon"><i className="fa-solid fa-utensils"></i></div>
          <span>Smart POS</span>
        </div>
        <div className="user-profile">
          {role?.toLowerCase() === 'admin' && (
            <>
              <button className="btn-secondary" onClick={() => navigate('/admin')}>
                <i className="fa-solid fa-chart-line"></i> Analytics
              </button>
              <button className="btn-secondary" onClick={() => navigate('/kitchen')}>
                <i className="fa-solid fa-fire-burner"></i> Kitchen View
              </button>
            </>
          )}
          <span style={{ fontWeight: 600 }}>{username}</span>
          <span className={`role-badge ${role?.toLowerCase()}`}>{role}</span>
          <button className="btn-secondary" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="dashboard-wrapper">
        {/* POS Menu Section */}
        <main className="pos-menu-section">
          {/* Category Filter Buttons */}
          <div className="pos-menu-filters">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`filter-btn ${cat === selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Grid */}
          <div className="menu-grid">
            {loadingMenu ? (
              <div className="cart-empty" style={{ gridColumn: '1 / -1', minHeight: '200px' }}>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading restaurant menu...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="cart-empty" style={{ gridColumn: '1 / -1' }}>
                <i className="fa-solid fa-utensils"></i>
                <p>No items found in this category.</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const catClass = item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return (
                  <div
                    key={item.id}
                    className={`menu-card ${catClass}`}
                    onClick={() => addToCart(item)}
                  >
                    <div>
                      <div className="menu-card-category">{item.category}</div>
                      <div className="menu-card-name">{item.name}</div>
                    </div>
                    <div className="menu-card-details">
                      <div className="menu-card-price">₹{item.price.toFixed(2)}</div>
                      <div className="menu-card-prep">
                        <i className="fa-regular fa-clock"></i> {item.prep_time_minutes} min
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* POS Cart Sidebar */}
        <aside className="pos-sidebar">
          <div className="sidebar-header">
            <h2>New Order</h2>
            <button type="button" className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>

          {/* Cart Items List */}
          <div className="cart-items-container" ref={cartContainerRef}>
            {cartEntries.length === 0 ? (
              <div className="cart-empty">
                <i className="fa-solid fa-basket-shopping"></i>
                <p>Cart is empty.<br />Tap menu items to add them here.</p>
              </div>
            ) : (
              cartEntries.map(([id, { item, quantity }]) => {
                const itemTotal = item.price * quantity;
                return (
                  <div key={id} className="cart-item">
                    <button
                      type="button"
                      className="remove-item-btn"
                      onClick={() => removeItem(id)}
                      title="Remove item"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                    <div className="cart-item-header">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">₹{itemTotal.toFixed(2)}</span>
                    </div>
                    <div className="cart-item-controls">
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        ₹{item.price.toFixed(2)} each
                      </span>
                      <div className="quantity-controller">
                        <button
                          type="button"
                          className="quantity-btn"
                          onClick={() => updateQuantity(id, -1)}
                        >
                          -
                        </button>
                        <div className="quantity-display">{quantity}</div>
                        <button
                          type="button"
                          className="quantity-btn"
                          onClick={() => updateQuantity(id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Confirmation & Controls */}
          <div className="pos-cart-footer">
            <div className="cart-totals">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>

            <form className="cart-form" onSubmit={handleSubmitOrder}>
              {/* Table / Order # */}
              <div className="table-input-group">
                <div className="form-group">
                  <label htmlFor="order-table">Table / Order #</label>
                  <input
                    type="text"
                    id="order-table"
                    className="form-control"
                    placeholder={orderType === 'Parcel' ? 'e.g. Cust Name (Optional)' : 'e.g. 5, Bar-2'}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    required={orderType === 'Dine-in'}
                  />
                </div>
              </div>

              {/* Dine-in vs Parcel Toggle */}
              <div className="form-group">
                <label>Order Service Type</label>
                <div className="order-type-toggle">
                  <button
                    type="button"
                    className={`order-type-btn ${orderType === 'Dine-in' ? 'active dine-in' : ''}`}
                    onClick={() => setOrderType('Dine-in')}
                  >
                    <i className="fa-solid fa-chair"></i> Dine-in
                  </button>
                  <button
                    type="button"
                    className={`order-type-btn ${orderType === 'Parcel' ? 'active parcel' : ''}`}
                    onClick={() => setOrderType('Parcel')}
                  >
                    <i className="fa-solid fa-box-open"></i> Parcel
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span>Submitting...</span>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  </>
                ) : (
                  <>
                    <span>Send to Kitchen</span>
                    <i className="fa-solid fa-paper-plane"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
