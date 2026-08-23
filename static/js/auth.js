// Handle active authentication tabs
let currentTab = 'login';

function switchTab(tab) {
    currentTab = tab;
    
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMsg = document.getElementById('auth-error-msg');
    
    // Clear error message
    errorMsg.style.display = 'none';
    
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function showError(text) {
    const errorMsg = document.getElementById('auth-error-msg');
    const errorText = document.getElementById('error-text');
    errorText.innerText = text;
    errorMsg.style.display = 'flex';
}

async function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim();
    const passwordInput = document.getElementById('login-password').value;
    
    const errorMsg = document.getElementById('auth-error-msg');
    errorMsg.style.display = 'none';
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.detail || 'Login failed. Please try again.');
            return;
        }
        
        // Save auth data to local storage
        localStorage.setItem('kds_token', data.access_token);
        localStorage.setItem('kds_role', data.role);
        localStorage.setItem('kds_username', data.username);
        
        // Redirect based on role
        if (data.role === 'Chef') {
            window.location.href = '/kitchen';
        } else if (data.role === 'Admin') {
            window.location.href = '/admin';
        } else {
            // Waiters go to the Waiter POS dashboard
            window.location.href = '/waiter';
        }
        
    } catch (err) {
        showError('Could not connect to the authentication server.');
        console.error(err);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('register-username').value.trim();
    const passwordInput = document.getElementById('register-password').value;
    const roleInput = document.getElementById('register-role').value;
    
    const errorMsg = document.getElementById('auth-error-msg');
    errorMsg.style.display = 'none';
    
    if (passwordInput.length < 4) {
        showError('Password must be at least 4 characters long.');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput,
                role: roleInput
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.detail || 'Registration failed.');
            return;
        }
        
        // Success: switch to login tab and alert
        alert('Account created successfully! You can now log in.');
        switchTab('login');
        document.getElementById('login-username').value = usernameInput;
        document.getElementById('login-password').value = '';
        
    } catch (err) {
        showError('Could not connect to the authentication server.');
        console.error(err);
    }
}

// Redirect if already logged in
window.onload = () => {
    const token = localStorage.getItem('kds_token');
    const role = localStorage.getItem('kds_role');
    if (token && role) {
        if (role === 'Chef') {
            window.location.href = '/kitchen';
        } else if (role === 'Admin') {
            window.location.href = '/admin';
        } else {
            window.location.href = '/waiter';
        }
    }
};
