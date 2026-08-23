// Check Authentication state
const token = localStorage.getItem('kds_token');
const role = localStorage.getItem('kds_role');
const username = localStorage.getItem('kds_username');

if (!token || !role) {
    window.location.href = '/';
} else if (role === 'Chef') {
    // Chef shouldn't view waiter panel, redirect
    window.location.href = '/kitchen';
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
    switchBtn.innerHTML = '<i class="fa-solid fa-fire-burner"></i> Kitchen View';
    switchBtn.onclick = () => { window.location.href = '/kitchen'; };
    userProfile.insertBefore(switchBtn, userProfile.firstChild);

    const analyticsBtn = document.createElement('button');
    analyticsBtn.className = 'btn-secondary';
    analyticsBtn.style.marginRight = '10px';
    analyticsBtn.innerHTML = '<i class="fa-solid fa-chart-line"></i> Analytics';
    analyticsBtn.onclick = () => { window.location.href = '/admin'; };
    userProfile.insertBefore(analyticsBtn, switchBtn);
}

// Global State
let menuItems = [];
let cart = {}; // Key: item_id, Value: { item: menu_item, quantity: int }
let selectedCategory = 'All';
let selectedOrderType = 'Dine-in';

// Fetch Menu Items from API
async function loadMenu() {
    try {
        const response = await fetch('/api/menu', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        menuItems = await response.json();
        renderCategoryFilters();
        renderMenu();
    } catch (err) {
        console.error('Failed to load menu:', err);
        document.getElementById('menu-container').innerHTML = `
            <div class="cart-empty" style="grid-column: 1 / -1; color: #ef4444;">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Failed to connect to backend API. Please refresh the page.</p>
            </div>
        `;
    }
}

// Generate unique categories list from menu
function renderCategoryFilters() {
    const categories = ['All', ...new Set(menuItems.map(item => item.category))];
    const filterContainer = document.getElementById('category-filters');
    
    filterContainer.innerHTML = categories.map(cat => `
        <button class="filter-btn ${cat === selectedCategory ? 'active' : ''}" 
                onclick="filterCategory('${cat}')">
            ${cat}
        </button>
    `).join('');
}

// Filter category on click
function filterCategory(category) {
    selectedCategory = category;
    
    // Update active filter button style
    const buttons = document.querySelectorAll('#category-filters .filter-btn');
    buttons.forEach(btn => {
        if (btn.innerText.trim() === category || (category === 'All' && btn.innerText.includes('All'))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderMenu();
}

// Render Menu Cards Grid
function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    
    const filteredItems = selectedCategory === 'All' 
        ? menuItems 
        : menuItems.filter(item => item.category === selectedCategory);
        
    if (filteredItems.length === 0) {
        menuContainer.innerHTML = `
            <div class="cart-empty" style="grid-column: 1 / -1;">
                <i class="fa-solid fa-utensils"></i>
                <p>No items found in this category.</p>
            </div>
        `;
        return;
    }
    
    menuContainer.innerHTML = filteredItems.map(item => {
        // Convert category to lower-case for CSS border styling
        const catClass = item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        return `
            <div class="menu-card ${catClass}" onclick="addToCart('${item.id}')">
                <div>
                    <div class="menu-card-category">${item.category}</div>
                    <div class="menu-card-name">${item.name}</div>
                </div>
                <div class="menu-card-details">
                    <div class="menu-card-price">₹${item.price.toFixed(2)}</div>
                    <div class="menu-card-prep">
                        <i class="fa-regular fa-clock"></i> ${item.prep_time_minutes} min
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Cart Mechanics
function addToCart(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (cart[itemId]) {
        cart[itemId].quantity += 1;
    } else {
        cart[itemId] = {
            item: item,
            quantity: 1
        };
    }
    
    renderCart();
    
    // Auto-scroll cart container to bottom to show the added item
    const container = document.getElementById('cart-items-container');
    if (container) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function updateQuantity(itemId, delta) {
    if (!cart[itemId]) return;
    
    cart[itemId].quantity += delta;
    if (cart[itemId].quantity <= 0) {
        delete cart[itemId];
    }
    
    renderCart();
}

function removeItem(itemId) {
    delete cart[itemId];
    renderCart();
}

function clearCart() {
    cart = {};
    renderCart();
}

function setOrderType(type) {
    selectedOrderType = type;
    
    const buttons = document.querySelectorAll('.order-type-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const tableInput = document.getElementById('order-table');
    if (type === 'Parcel') {
        tableInput.removeAttribute('required');
        tableInput.placeholder = 'e.g. Cust Name (Optional)';
    } else {
        tableInput.setAttribute('required', 'required');
        tableInput.placeholder = 'e.g. 5, Bar-2';
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const keys = Object.keys(cart);
    
    if (keys.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Cart is empty.<br>Tap menu items to add them here.</p>
            </div>
        `;
        document.getElementById('cart-total-price').innerText = '₹0.00';
        return;
    }
    
    let totalPrice = 0;
    
    container.innerHTML = keys.map(key => {
        const cartItem = cart[key];
        const itemTotal = cartItem.item.price * cartItem.quantity;
        totalPrice += itemTotal;
        
        return `
            <div class="cart-item">
                <button class="remove-item-btn" onclick="removeItem('${key}')" title="Remove item">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="cart-item-header">
                    <span class="cart-item-name">${cartItem.item.name}</span>
                    <span class="cart-item-price">₹${itemTotal.toFixed(2)}</span>
                </div>
                <div class="cart-item-controls">
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">
                        ₹${cartItem.item.price.toFixed(2)} each
                    </span>
                    <div class="quantity-controller">
                        <button class="quantity-btn" onclick="updateQuantity('${key}', -1)">-</button>
                        <div class="quantity-display">${cartItem.quantity}</div>
                        <button class="quantity-btn" onclick="updateQuantity('${key}', 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('cart-total-price').innerText = `₹${totalPrice.toFixed(2)}`;
}

// Order Submission
async function submitOrder(event) {
    event.preventDefault();
    
    const tableInput = document.getElementById('order-table').value.trim();
    const keys = Object.keys(cart);
    
    if (keys.length === 0) {
        alert('Your cart is empty! Add menu items before submitting.');
        return;
    }
    
    if (selectedOrderType === 'Dine-in' && !tableInput) {
        alert('Please enter a table number.');
        return;
    }
    
    // Construct flat array of item IDs matching the backend requirements
    const itemIds = [];
    keys.forEach(key => {
        const qty = cart[key].quantity;
        for (let i = 0; i < qty; i++) {
            itemIds.push(key);
        }
    });
    
    const submitBtn = document.getElementById('btn-submit-order');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                table_number: tableInput,
                order_type: selectedOrderType,
                items: itemIds
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.detail || 'Failed to submit the order.');
            return;
        }
        
        // Success
        alert('Order submitted successfully!');
        clearCart();
        document.getElementById('order-table').value = '';
        
    } catch (err) {
        console.error('Error submitting order:', err);
        alert('Could not connect to the backend server.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Send to Kitchen</span> <i class="fa-solid fa-paper-plane"></i>`;
    }
}

// Logout Utility
function logout() {
    localStorage.removeItem('kds_token');
    localStorage.removeItem('kds_role');
    localStorage.removeItem('kds_username');
    window.location.href = '/';
}

// Initialize View
window.onload = () => {
    loadMenu();
};
