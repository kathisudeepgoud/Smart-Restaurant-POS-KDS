import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('kds_token');
  const role = localStorage.getItem('kds_role');
  const username = localStorage.getItem('kds_username') || 'Chef';

  const [activeOrders, setActiveOrders] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState({
    batch_suggestions: [],
    priority_warnings: [],
    recommended_sequence: []
  });
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Authentication validation
  useEffect(() => {
    if (!token || !role) {
      navigate('/', { replace: true });
    } else if (role === 'Waiter') {
      navigate('/waiter', { replace: true });
    }
  }, [token, role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('kds_token');
    localStorage.removeItem('kds_role');
    localStorage.removeItem('kds_username');
    navigate('/');
  };

  // Fetch active orders
  const loadActiveOrders = async () => {
    try {
      const response = await fetch('/api/orders/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setActiveOrders(data);
      }
    } catch (err) {
      console.error('Failed to load active orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch AI suggestions
  const loadAISuggestions = async () => {
    try {
      const response = await fetch('/api/ai/suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data);
      }
    } catch (err) {
      console.error('Failed to load AI suggestions:', err);
    }
  };

  // Initial load and 5-second interval polling
  useEffect(() => {
    if (!token) return;

    loadActiveOrders();
    loadAISuggestions();

    const orderInterval = setInterval(loadActiveOrders, 5000);
    const aiInterval = setInterval(loadAISuggestions, 5000);

    return () => {
      clearInterval(orderInterval);
      clearInterval(aiInterval);
    };
  }, [token]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || 'Failed to update order status');
        return;
      }

      loadActiveOrders();
      loadAISuggestions();
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Could not update status. Check server connection.');
    }
  };

  // Calculate aggregated item summary chips
  const globalItemCounts = {};
  activeOrders.forEach(order => {
    (order.items_details || []).forEach(item => {
      globalItemCounts[item.name] = (globalItemCounts[item.name] || 0) + 1;
    });
  });

  const sortedSummaryItems = Object.keys(globalItemCounts).sort(
    (a, b) => globalItemCounts[b] - globalItemCounts[a]
  );

  return (
    <>
      {/* Topbar Navigation */}
      <header className="app-header">
        <div className="logo" onClick={() => navigate('/kitchen')}>
          <div className="logo-icon" style={{ background: 'var(--gradient-chef)' }}>
            <i className="fa-solid fa-fire-burner"></i>
          </div>
          <span>Smart KDS</span>
        </div>
        <div className="user-profile">
          {role?.toLowerCase() === 'admin' && (
            <>
              <button className="btn-secondary" onClick={() => navigate('/admin')}>
                <i className="fa-solid fa-chart-line"></i> Analytics
              </button>
              <button className="btn-secondary" onClick={() => navigate('/waiter')}>
                <i className="fa-solid fa-utensils"></i> POS Terminal
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
        {/* Kitchen Live Orders (Left Side) */}
        <section className="kitchen-left">
          {/* Order Summary Panel */}
          <div className="kitchen-summary-panel" style={{ marginBottom: '24px' }}>
            <h2 className="section-title">
              <i className="fa-solid fa-chart-pie" style={{ color: '#3b82f6' }}></i> Total Order Summary
            </h2>
            <div className="summary-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {sortedSummaryItems.length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active items</span>
              ) : (
                sortedSummaryItems.map(name => (
                  <div
                    key={name}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.4))'
                    }}
                  >
                    <span>{name}</span>
                    <span
                      style={{
                        background: 'var(--gradient-button, linear-gradient(135deg, #4f46e5, #7c3aed))',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 800
                      }}
                    >
                      x{globalItemCounts[name]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <h2 className="section-title">
            <span className="pulse"></span> Live Active Orders
          </h2>

          <div className="kitchen-order-grid">
            {loadingOrders ? (
              <div className="cart-empty" style={{ gridColumn: '1 / -1', height: '300px' }}>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading active orders...</p>
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="cart-empty" style={{ gridColumn: '1 / -1', height: '300px' }}>
                <i
                  className="fa-solid fa-clipboard-check"
                  style={{ color: 'var(--text-muted)', fontSize: '2.5rem', opacity: 0.3 }}
                ></i>
                <p>
                  No active orders currently pending or cooking.<br />
                  Waiters can submit orders from their terminals.
                </p>
              </div>
            ) : (
              activeOrders.map(order => {
                // Group item counts
                const itemCounts = {};
                (order.items_details || []).forEach(item => {
                  itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
                });

                const createdTime = new Date(order.timestamp);
                const elapsedMinutes = Math.max(0, Math.floor((new Date() - createdTime) / 60000));
                const serviceClass = (order.order_type || 'dine-in').toLowerCase();
                const statusClass = (order.status || 'pending').toLowerCase();
                const isUrgent = elapsedMinutes >= 12 && order.status === 'Pending';

                return (
                  <div key={order.id} className={`kitchen-card ${serviceClass} ${statusClass}`}>
                    <div className="kitchen-card-header">
                      <div>
                        <span className="kitchen-table-tag">T-{order.table_number}</span>
                      </div>
                      <span className={`order-type-tag ${serviceClass}`}>{order.order_type}</span>
                    </div>

                    <ul className="kitchen-items-list">
                      {Object.keys(itemCounts).map(name => (
                        <li key={name} className="kitchen-item-row">
                          <span>
                            <span className="kitchen-item-qty">{itemCounts[name]}x</span>
                            <span className="kitchen-item-name">{name}</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span
                        className="kitchen-card-timer"
                        style={
                          isUrgent
                            ? { color: '#ef4444', fontWeight: 700, textShadow: '0 0 10px rgba(239,68,68,0.2)' }
                            : {}
                        }
                      >
                        {isUrgent && (
                          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i>
                        )}
                        <i className="fa-regular fa-clock"></i> Wait: {elapsedMinutes}m
                      </span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: order.status === 'Cooking' ? '#c084fc' : 'var(--text-muted)'
                        }}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="kitchen-card-footer">
                      {order.status === 'Pending' && (
                        <button
                          type="button"
                          className="btn-kitchen btn-start"
                          onClick={() => updateOrderStatus(order.id, 'Cooking')}
                        >
                          <i className="fa-solid fa-fire"></i> Start Cooking
                        </button>
                      )}
                      {order.status === 'Cooking' && (
                        <button
                          type="button"
                          className="btn-kitchen btn-ready"
                          onClick={() => updateOrderStatus(order.id, 'Ready')}
                        >
                          <i className="fa-solid fa-check"></i> Mark Ready
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* AI Chef Suggestions Panel (Right Side) */}
        <section className="kitchen-right">
          <h2 className="section-title ai-title">
            <span className="glow"></span> AI Chef Suggestions
          </h2>
          <div className="ai-panel">
            {/* Recommended Sequence */}
            <div className="ai-section">
              <div className="ai-section-title" style={{ color: '#c084fc' }}>
                <i className="fa-solid fa-list-ol"></i> Recommended Cooking Sequence
              </div>
              <div className="ai-sequence-list">
                {!aiSuggestions.recommended_sequence || aiSuggestions.recommended_sequence.length === 0 ? (
                  <div className="cart-empty" style={{ minHeight: '100px' }}>
                    <p style={{ fontSize: '0.85rem' }}>All caught up! No cooking order required.</p>
                  </div>
                ) : (
                  aiSuggestions.recommended_sequence.map(seq => (
                    <div key={seq.rank} className="ai-sequence-row">
                      <div className="ai-sequence-left">
                        <span className="ai-rank">{seq.rank}</span>
                        <div>
                          <span className="ai-sequence-label">{seq.label}</span>
                          <div className="ai-sequence-desc">{seq.items_summary}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>Wait: {seq.wait_time}</div>
                        <span className="ai-sequence-score">Score: {seq.score}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Urgency & Alerts */}
            <div className="ai-section">
              <div className="ai-section-title">
                <i className="fa-solid fa-circle-exclamation"></i> Urgency & Priority Warnings
              </div>
              <ul className="ai-warnings-list">
                {!aiSuggestions.priority_warnings || aiSuggestions.priority_warnings.length === 0 ? (
                  <li className="ai-suggestion-item" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'transparent' }}>
                    No urgency warnings. Keep going!
                  </li>
                ) : (
                  aiSuggestions.priority_warnings.map((warning, idx) => {
                    const isUrgent = warning.includes('URGENT');
                    return (
                      <li key={idx} className={isUrgent ? 'ai-warning-item' : 'ai-suggestion-item'}>
                        {warning}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Batch Cooking Optimizer */}
            <div className="ai-section">
              <div className="ai-section-title" style={{ color: '#ec4899' }}>
                <i className="fa-solid fa-layer-group"></i> Batch Cooking Recommendations
              </div>
              <ul className="ai-suggestions-list">
                {!aiSuggestions.batch_suggestions || aiSuggestions.batch_suggestions.length === 0 ? (
                  <li className="ai-suggestion-item" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'transparent' }}>
                    No batch recommendations.
                  </li>
                ) : (
                  aiSuggestions.batch_suggestions.map((suggestion, idx) => {
                    const isNoBatch = suggestion.includes('No identical items');
                    return (
                      <li
                        key={idx}
                        className="ai-suggestion-item"
                        style={isNoBatch ? { background: 'transparent', borderColor: 'rgba(255,255,255,0.05)' } : {}}
                      >
                        {suggestion}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
