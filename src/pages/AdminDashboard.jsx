import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('kds_token');
  const role = localStorage.getItem('kds_role');
  const username = localStorage.getItem('kds_username') || 'Admin';

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication validation
  useEffect(() => {
    if (!token || !role) {
      navigate('/', { replace: true });
    } else if (role.toLowerCase() !== 'admin') {
      if (role.toLowerCase() === 'chef') {
        navigate('/kitchen', { replace: true });
      } else {
        navigate('/waiter', { replace: true });
      }
    }
  }, [token, role, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('kds_token');
    localStorage.removeItem('kds_role');
    localStorage.removeItem('kds_username');
    navigate('/');
  };

  // Fetch analytics data
  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics', {
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
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and 10-second polling
  useEffect(() => {
    if (!token || role?.toLowerCase() !== 'admin') return;

    loadAnalytics();
    const interval = setInterval(loadAnalytics, 10000);

    return () => clearInterval(interval);
  }, [token, role]);

  const summary = analytics?.summary || {
    today: { orders: 0, revenue: 0 },
    week: { orders: 0, revenue: 0 },
    month: { orders: 0, revenue: 0 },
    allTime: { orders: 0, revenue: 0 }
  };

  const dailyTrend = analytics?.dailyTrend || [];
  const topItems = analytics?.topItems || [];
  const orderTypes = analytics?.orderTypes || { 'Dine-in': 0, 'Parcel': 0 };
  const orderStatuses = analytics?.orderStatuses || { 'Pending': 0, 'Cooking': 0, 'Ready': 0 };

  const maxRevenue = Math.max(...dailyTrend.map(t => t.revenue), 1);
  const totalTypes = (orderTypes['Dine-in'] || 0) + (orderTypes['Parcel'] || 0);
  const dineInPct = totalTypes > 0 ? ((orderTypes['Dine-in'] || 0) / totalTypes) * 100 : 0;
  const parcelPct = totalTypes > 0 ? ((orderTypes['Parcel'] || 0) / totalTypes) * 100 : 0;

  return (
    <>
      {/* Topbar Navigation */}
      <header className="app-header">
        <div className="logo" onClick={() => navigate('/admin')}>
          <div className="logo-icon" style={{ background: 'var(--gradient-dinein)' }}>
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <span>Admin Analytics</span>
        </div>
        <div className="user-profile">
          <button className="btn-secondary" onClick={() => navigate('/waiter')}>
            <i className="fa-solid fa-utensils"></i> POS Terminal
          </button>
          <button className="btn-secondary" onClick={() => navigate('/kitchen')}>
            <i className="fa-solid fa-fire-burner"></i> Kitchen View
          </button>
          <span style={{ fontWeight: 600 }}>{username}</span>
          <span className={`role-badge ${role?.toLowerCase()}`}>{role}</span>
          <button className="btn-secondary" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="dashboard-wrapper" style={{ overflowY: 'auto', display: 'block', padding: '24px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
            Sales & Operations Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Real-time business intelligence and analytics overview.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <div
          className="analytics-metrics-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}
        >
          {/* Today's Stats */}
          <div
            className="analytics-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'var(--gradient-dinein)'
              }}
            ></div>
            <div
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}
            >
              Today's Revenue
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              ₹{summary.today.revenue.toFixed(2)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {summary.today.orders} {summary.today.orders === 1 ? 'order' : 'orders'} received
            </div>
          </div>

          {/* Weekly Stats */}
          <div
            className="analytics-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'var(--gradient-parcel)'
              }}
            ></div>
            <div
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}
            >
              Weekly Revenue
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              ₹{summary.week.revenue.toFixed(2)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {summary.week.orders} {summary.week.orders === 1 ? 'order' : 'orders'} (Last 7 days)
            </div>
          </div>

          {/* Monthly Stats */}
          <div
            className="analytics-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'var(--gradient-chef)'
              }}
            ></div>
            <div
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}
            >
              Monthly Revenue
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              ₹{summary.month.revenue.toFixed(2)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {summary.month.orders} {summary.month.orders === 1 ? 'order' : 'orders'} (Last 30 days)
            </div>
          </div>

          {/* All-Time Stats */}
          <div
            className="analytics-card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'var(--gradient-button)'
              }}
            ></div>
            <div
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}
            >
              All-Time Revenue
            </div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              ₹{summary.allTime.revenue.toFixed(2)}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {summary.allTime.orders} {summary.allTime.orders === 1 ? 'order' : 'orders'} total
            </div>
          </div>
        </div>

        {/* Analytical Grids Section */}
        <div
          className="analytics-sections-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}
        >
          {/* Daily Sales Trend (Last 7 Days) */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-calendar-days" style={{ color: 'var(--accent-purple)' }}></i>
              Daily Sales Trend (Last 7 Days)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                  <p>Loading sales trend...</p>
                </div>
              ) : dailyTrend.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  <p>No orders recorded in the last 7 days.</p>
                </div>
              ) : (
                dailyTrend.map(t => {
                  const pct = (t.revenue / maxRevenue) * 100;
                  return (
                    <div key={t.date} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 600 }}>{t.label}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {t.orders} {t.orders === 1 ? 'order' : 'orders'}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{t.revenue.toFixed(2)}</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'var(--gradient-dinein)',
                            borderRadius: '3px'
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Selling Items */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-crown" style={{ color: '#eab308' }}></i> Top Selling Menu Items
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '8px' }}></i>
                  <p>Loading items statistics...</p>
                </div>
              ) : topItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                  <p>No item sales recorded.</p>
                </div>
              ) : (
                topItems.map((item, idx) => {
                  const rank = idx + 1;
                  const rankIcon = rank === 1 ? '👑' : `#${rank}`;
                  const rankStyle =
                    rank === 1
                      ? {
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#eab308',
                          border: '1px solid rgba(234, 179, 8, 0.3)'
                        }
                      : {
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--text-secondary)'
                        };

                  return (
                    <div
                      key={item.name}
                      className="ai-sequence-row"
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            ...rankStyle
                          }}
                        >
                          {rankIcon}
                        </span>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</span>
                          <div
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.75rem',
                              textTransform: 'uppercase'
                            }}
                          >
                            {item.category}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.quantity} sold</div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#34d399',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600
                          }}
                        >
                          ₹{item.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Service & Operations */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-chart-pie" style={{ color: '#06b6d4' }}></i> Service & Operations
            </h2>

            {/* Dine-in vs Parcel Distribution */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Order Service Types
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {totalTypes === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '10px 0' }}>
                    No active distribution data.
                  </p>
                ) : (
                  <>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          marginBottom: '6px'
                        }}
                      >
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-chair" style={{ color: '#6366f1' }}></i> Dine-in
                        </span>
                        <span style={{ fontWeight: 700 }}>
                          {orderTypes['Dine-in'] || 0} ({dineInPct.toFixed(0)}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${dineInPct}%`,
                            height: '100%',
                            background: 'var(--gradient-dinein)'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          marginBottom: '6px'
                        }}
                      >
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-box-open" style={{ color: '#10b981' }}></i> Takeaway / Parcel
                        </span>
                        <span style={{ fontWeight: 700 }}>
                          {orderTypes['Parcel'] || 0} ({parcelPct.toFixed(0)}%)
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${parcelPct}%`,
                            height: '100%',
                            background: 'var(--gradient-parcel)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Order Status overview */}
            <div>
              <h3
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Active Queue Statuses
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f97316' }}>
                    {orderStatuses['Pending'] || 0}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      marginTop: '4px'
                    }}
                  >
                    Pending
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a855f7' }}>
                    {orderStatuses['Cooking'] || 0}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      marginTop: '4px'
                    }}
                  >
                    Cooking
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                    {orderStatuses['Ready'] || 0}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      marginTop: '4px'
                    }}
                  >
                    Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
