// Check Authentication state
const token = localStorage.getItem('kds_token');
const role = localStorage.getItem('kds_role');
const username = localStorage.getItem('kds_username');

if (!token || !role) {
    window.location.href = '/';
} else if (role === 'Waiter') {
    // Waiter shouldn't view kitchen panel, redirect
    window.location.href = '/waiter';
}

// Set header user info
document.getElementById('user-display-name').innerText = username;
const roleBadge = document.getElementById('user-role-badge');
roleBadge.innerText = role;
roleBadge.className = `role-badge ${role.toLowerCase()}`;

if (role && role.toLowerCase() === 'admin') {
    const userProfile = document.querySelector('.user-profile');
    
    const switchBtn = document.createElement('button');
    switchBtn.className = 'btn-secondary';
    switchBtn.style.marginRight = '10px';
    switchBtn.innerHTML = '<i class="fa-solid fa-utensils"></i> POS Terminal';
    switchBtn.onclick = () => { window.location.href = '/waiter'; };
    userProfile.insertBefore(switchBtn, userProfile.firstChild);

    const analyticsBtn = document.createElement('button');
    analyticsBtn.className = 'btn-secondary';
    analyticsBtn.style.marginRight = '10px';
    analyticsBtn.innerHTML = '<i class="fa-solid fa-chart-line"></i> Analytics';
    analyticsBtn.onclick = () => { window.location.href = '/admin'; };
    userProfile.insertBefore(analyticsBtn, switchBtn);
}

// Global list of active orders
let activeOrders = [];

// Fetch Active Orders from API
async function loadActiveOrders() {
    try {
        const response = await fetch('/api/orders/active', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        activeOrders = await response.json();
        renderOrders();
    } catch (err) {
        console.error('Failed to load active orders:', err);
    }
}

// Render order tickets on the left panel
function renderOrders() {
    const grid = document.getElementById('orders-grid');
    const summaryChipsContainer = document.getElementById('order-summary-chips');
    
    if (activeOrders.length === 0) {
        grid.innerHTML = `
            <div class="cart-empty" style="grid-column: 1 / -1; height: 300px;">
                <i class="fa-solid fa-clipboard-check" style="color: var(--text-muted); font-size: 2.5rem; opacity: 0.3;"></i>
                <p>No active orders currently pending or cooking.<br>Waiters can submit orders from their terminals.</p>
            </div>
        `;
        if (summaryChipsContainer) {
            summaryChipsContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.9rem;">No active items</span>';
        }
        return;
    }
    
    const globalItemCounts = {};
    
    grid.innerHTML = activeOrders.map(order => {
        // Group similar items and count their quantities
        const itemCounts = {};
        order.items_details.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
            globalItemCounts[item.name] = (globalItemCounts[item.name] || 0) + 1;
        });
        
        // Generate list html
        const itemsHtml = Object.keys(itemCounts).map(name => `
            <li class="kitchen-item-row">
                <span>
                    <span class="kitchen-item-qty">${itemCounts[name]}x</span>
                    <span class="kitchen-item-name">${name}</span>
                </span>
            </li>
        `).join('');
        
        // Calculate wait time
        const createdTime = new Date(order.timestamp);
        const elapsedMinutes = Math.max(0, Math.floor((new Date() - createdTime) / 60000));
        
        // Define styling classes
        const serviceClass = order.order_type.toLowerCase(); // 'dine-in' or 'parcel'
        const statusClass = order.status.toLowerCase(); // 'pending' or 'cooking'
        
        // Choose correct button action and content based on state
        let actionButton = '';
        if (order.status === 'Pending') {
            actionButton = `
                <button class="btn-kitchen btn-start" onclick="updateOrderStatus('${order.id}', 'Cooking')">
                    <i class="fa-solid fa-fire"></i> Start Cooking
                </button>
            `;
        } else if (order.status === 'Cooking') {
            actionButton = `
                <button class="btn-kitchen btn-ready" onclick="updateOrderStatus('${order.id}', 'Ready')">
                    <i class="fa-solid fa-check"></i> Mark Ready
                </button>
            `;
        }
        
        // Highly visible styling for elapsed time warnings
        let waitTimeStyle = '';
        let warningIcon = '';
        if (elapsedMinutes >= 12 && order.status === 'Pending') {
            waitTimeStyle = 'color: #ef4444; font-weight: 700; text-shadow: 0 0 10px rgba(239,68,68,0.2);';
            warningIcon = '<i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px;"></i>';
        }
        
        return `
            <div class="kitchen-card ${serviceClass} ${statusClass}">
                <div class="kitchen-card-header">
                    <div>
                        <span class="kitchen-table-tag">T-${order.table_number}</span>
                    </div>
                    <span class="order-type-tag ${serviceClass}">${order.order_type}</span>
                </div>
                
                <ul class="kitchen-items-list">
                    ${itemsHtml}
                </ul>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span class="kitchen-card-timer" style="${waitTimeStyle}">
                        ${warningIcon}<i class="fa-regular fa-clock"></i> Wait: ${elapsedMinutes}m
                    </span>
                    <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: ${order.status === 'Cooking' ? '#c084fc' : 'var(--text-muted)'}">
                        ${order.status}
                    </span>
                </div>
                
                <div class="kitchen-card-footer">
                    ${actionButton}
                </div>
            </div>
        `;
    }).join('');

    // Render Summary Chips
    if (summaryChipsContainer) {
        const sortedItems = Object.keys(globalItemCounts).sort((a, b) => globalItemCounts[b] - globalItemCounts[a]);
        
        if (sortedItems.length === 0) {
            summaryChipsContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.9rem;">No active items</span>';
        } else {
            summaryChipsContainer.innerHTML = sortedItems.map(name => `
                <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)); padding: 6px 14px; border-radius: 20px; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.4));">
                    <span>${name}</span>
                    <span style="background: var(--gradient-button, linear-gradient(135deg, #4f46e5, #7c3aed)); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem; font-weight: 800;">x${globalItemCounts[name]}</span>
                </div>
            `).join('');
        }
    }
}

// Update Order status via API
async function updateOrderStatus(orderId, newStatus) {
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
        
        // Reload dashboard state
        loadActiveOrders();
        loadAISuggestions();
        
    } catch (err) {
        console.error('Error updating order:', err);
        alert('Could not update status. Check server connection.');
    }
}

// Fetch AI Optimization Suggestions from API
async function loadAISuggestions() {
    try {
        const response = await fetch('/api/ai/suggestions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            return;
        }
        
        const suggestions = await response.json();
        renderAISuggestions(suggestions);
        
    } catch (err) {
        console.error('Failed to load AI suggestions:', err);
    }
}

// Render AI recommendations on the right panel
function renderAISuggestions(data) {
    // 1. Render priority warnings
    const warningsContainer = document.getElementById('ai-warnings');
    if (!data.priority_warnings || data.priority_warnings.length === 0) {
        warningsContainer.innerHTML = `
            <li class="ai-suggestion-item" style="border-color: rgba(255,255,255,0.05); background: transparent;">
                No urgency warnings. Keep going!
            </li>
        `;
    } else {
        warningsContainer.innerHTML = data.priority_warnings.map(warning => {
            const isUrgent = warning.includes('URGENT');
            return `
                <li class="${isUrgent ? 'ai-warning-item' : 'ai-suggestion-item'}">
                    ${warning}
                </li>
            `;
        }).join('');
    }
    
    // 2. Render batch cooking recommendations
    const batchingContainer = document.getElementById('ai-batching');
    if (!data.batch_suggestions || data.batch_suggestions.length === 0) {
        batchingContainer.innerHTML = `
            <li class="ai-suggestion-item" style="border-color: rgba(255,255,255,0.05); background: transparent;">
                No batch recommendations.
            </li>
        `;
    } else {
        batchingContainer.innerHTML = data.batch_suggestions.map(suggestion => {
            const isNoBatch = suggestion.includes('No identical items');
            return `
                <li class="ai-suggestion-item" style="${isNoBatch ? 'background: transparent; border-color: rgba(255,255,255,0.05);' : ''}">
                    ${suggestion}
                </li>
            `;
        }).join('');
    }
    
    // 3. Render recommended sequence flow
    const sequenceContainer = document.getElementById('ai-sequence');
    if (!data.recommended_sequence || data.recommended_sequence.length === 0) {
        sequenceContainer.innerHTML = `
            <div class="cart-empty" style="min-height: 100px;">
                <p style="font-size: 0.85rem;">All caught up! No cooking order required.</p>
            </div>
        `;
    } else {
        sequenceContainer.innerHTML = data.recommended_sequence.map(seq => `
            <div class="ai-sequence-row">
                <div class="ai-sequence-left">
                    <span class="ai-rank">${seq.rank}</span>
                    <div>
                        <span class="ai-sequence-label">${seq.label}</span>
                        <div class="ai-sequence-desc">${seq.items_summary}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 700;">Wait: ${seq.wait_time}</div>
                    <span class="ai-sequence-score">Score: ${seq.score}</span>
                </div>
            </div>
        `).join('');
    }
}

// Logout Utility
function logout() {
    localStorage.removeItem('kds_token');
    localStorage.removeItem('kds_role');
    localStorage.removeItem('kds_username');
    window.location.href = '/';
}

// Initial Loading & 5-Second Interval Polling
window.onload = () => {
    loadActiveOrders();
    loadAISuggestions();
    
    // Set auto-refresh loops
    setInterval(loadActiveOrders, 5000);
    setInterval(loadAISuggestions, 5000);
};
