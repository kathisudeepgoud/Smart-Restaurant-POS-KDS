// Check Authentication state
const token = localStorage.getItem('kds_token');
const role = localStorage.getItem('kds_role');
const username = localStorage.getItem('kds_username');

if (!token || !role) {
    window.location.href = '/';
} else if (role.toLowerCase() !== 'admin') {
    // Only Admin is allowed here. Redirect Waiters/Chefs
    if (role.toLowerCase() === 'chef') {
        window.location.href = '/kitchen';
    } else {
        window.location.href = '/waiter';
    }
} else {
    // Set header user info
    document.getElementById('user-display-name').innerText = username;
    const roleBadge = document.getElementById('user-role-badge');
    roleBadge.innerText = role;
    roleBadge.className = `role-badge ${role.toLowerCase()}`;
}

// Fetch Analytics from API
async function loadAnalytics() {
    try {
        const response = await fetch('/api/admin/analytics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            console.error('Failed to load analytics data');
            return;
        }
        
        const data = await response.json();
        renderSummary(data.summary);
        renderDailyTrend(data.dailyTrend);
        renderTopItems(data.topItems);
        renderDistribution(data.orderTypes, data.orderStatuses);
    } catch (err) {
        console.error('Error fetching analytics:', err);
    }
}

// Render summary cards
function renderSummary(summary) {
    document.getElementById('stat-today-revenue').innerText = `₹${summary.today.revenue.toFixed(2)}`;
    document.getElementById('stat-today-orders').innerText = `${summary.today.orders} ${summary.today.orders === 1 ? 'order' : 'orders'} received`;

    document.getElementById('stat-week-revenue').innerText = `₹${summary.week.revenue.toFixed(2)}`;
    document.getElementById('stat-week-orders').innerText = `${summary.week.orders} ${summary.week.orders === 1 ? 'order' : 'orders'} (Last 7 days)`;

    document.getElementById('stat-month-revenue').innerText = `₹${summary.month.revenue.toFixed(2)}`;
    document.getElementById('stat-month-orders').innerText = `${summary.month.orders} ${summary.month.orders === 1 ? 'order' : 'orders'} (Last 30 days)`;

    document.getElementById('stat-alltime-revenue').innerText = `₹${summary.allTime.revenue.toFixed(2)}`;
    document.getElementById('stat-alltime-orders').innerText = `${summary.allTime.orders} ${summary.allTime.orders === 1 ? 'order' : 'orders'} total`;
}

// Render Daily Sales Trend List
function renderDailyTrend(trend) {
    const container = document.getElementById('daily-trend-container');
    if (trend.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                <p>No orders recorded in the last 7 days.</p>
            </div>
        `;
        return;
    }

    // Find max revenue to scale progress bars
    const maxRevenue = Math.max(...trend.map(t => t.revenue), 1);

    container.innerHTML = trend.map(t => {
        const pct = (t.revenue / maxRevenue) * 100;
        return `
            <div style="display: flex; flex-direction: column; gap: 6px; padding: 6px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                    <span style="font-weight: 600;">${t.label}</span>
                    <span style="color: var(--text-secondary); font-size: 0.8rem;">${t.orders} ${t.orders === 1 ? 'order' : 'orders'}</span>
                    <span style="font-weight: 700; color: var(--text-primary);">₹${t.revenue.toFixed(2)}</span>
                </div>
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: var(--gradient-dinein); border-radius: 3px;"></div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Top Selling Items
function renderTopItems(items) {
    const container = document.getElementById('top-items-container');
    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                <p>No item sales recorded.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = items.map((item, idx) => {
        const rank = idx + 1;
        const rankIcon = rank === 1 ? '👑' : `#${rank}`;
        const rankStyle = rank === 1 
            ? 'background: rgba(234, 179, 8, 0.15); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3);' 
            : 'background: rgba(255,255,255,0.05); color: var(--text-secondary);';

        return `
            <div class="ai-sequence-row" style="padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; ${rankStyle}">
                        ${rankIcon}
                    </span>
                    <div>
                        <span style="font-weight: 700; font-size: 0.9rem;">${item.name}</span>
                        <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">${item.category}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700; font-size: 0.9rem;">${item.quantity} sold</div>
                    <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.1); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                        ₹${item.revenue.toFixed(2)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Render Order Type & Queue Status Distribution
function renderDistribution(types, statuses) {
    // 1. Order Type Progress Bars
    const typeContainer = document.getElementById('order-type-container');
    const totalTypes = (types['Dine-in'] || 0) + (types['Parcel'] || 0);
    
    if (totalTypes === 0) {
        typeContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 10px 0;">No active distribution data.</p>`;
    } else {
        const dineInPct = ((types['Dine-in'] || 0) / totalTypes) * 100;
        const parcelPct = ((types['Parcel'] || 0) / totalTypes) * 100;

        typeContainer.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                    <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-chair" style="color: #6366f1;"></i> Dine-in</span>
                    <span style="font-weight: 700;">${types['Dine-in'] || 0} (${dineInPct.toFixed(0)}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${dineInPct}%; height: 100%; background: var(--gradient-dinein);"></div>
                </div>
            </div>
            <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                    <span style="font-weight: 600; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-box-open" style="color: #10b981;"></i> Takeaway / Parcel</span>
                    <span style="font-weight: 700;">${types['Parcel'] || 0} (${parcelPct.toFixed(0)}%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${parcelPct}%; height: 100%; background: var(--gradient-parcel);"></div>
                </div>
            </div>
        `;
    }

    // 2. Order Queue Statuses Boxes
    const statusContainer = document.getElementById('order-status-container');
    statusContainer.innerHTML = `
        <div style="flex: 1; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; text-align: center;">
            <div style="font-size: 1.25rem; font-weight: 800; color: #f97316;">${statuses['Pending'] || 0}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-top: 4px;">Pending</div>
        </div>
        <div style="flex: 1; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; text-align: center;">
            <div style="font-size: 1.25rem; font-weight: 800; color: #a855f7;">${statuses['Cooking'] || 0}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-top: 4px;">Cooking</div>
        </div>
        <div style="flex: 1; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; text-align: center;">
            <div style="font-size: 1.25rem; font-weight: 800; color: #10b981;">${statuses['Ready'] || 0}</div>
            <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-top: 4px;">Ready</div>
        </div>
    `;
}

// Logout Utility
function logout() {
    localStorage.removeItem('kds_token');
    localStorage.removeItem('kds_role');
    localStorage.removeItem('kds_username');
    window.location.href = '/';
}

// Initialize on Load
window.onload = () => {
    if (token && role && role.toLowerCase() === 'admin') {
        loadAnalytics();
        
        // Auto refresh stats every 10 seconds
        setInterval(loadAnalytics, 10000);
    }
};
