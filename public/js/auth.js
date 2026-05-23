let activeMode = 'login'; // 'login' or 'signup'

// Open Authentication overlay drawer
function openAuthModal(mode = 'login') {
  const overlay = document.getElementById('authOverlay');
  overlay.classList.add('active');
  switchAuthTab(mode);
}

// Close Authentication overlay drawer
function closeAuthModal() {
  const overlay = document.getElementById('authOverlay');
  overlay.classList.remove('active');
  clearAlert();
}

// Switch tabs between Login and Signup forms
function switchAuthTab(mode) {
  activeMode = mode;
  const tabLogin = document.getElementById('tabLogin');
  const tabSignup = document.getElementById('tabSignup');
  const nameField = document.getElementById('nameField');
  const authBtn = document.getElementById('authBtn');
  const authName = document.getElementById('authName');

  clearAlert();

  if (mode === 'signup') {
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
    nameField.style.display = 'block';
    authName.required = true;
    authBtn.textContent = 'Create Account';
  } else {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    nameField.style.display = 'none';
    authName.required = false;
    authBtn.textContent = 'Sign In';
  }
}

// Clear feedback banners
function clearAlert() {
  const alert = document.getElementById('authAlert');
  alert.className = 'auth-alert';
  alert.textContent = '';
}

// Show alert banner
function showAlert(message, type = 'danger') {
  const alert = document.getElementById('authAlert');
  alert.className = `auth-alert ${type}`;
  alert.textContent = message;
}

// Handle Form Submissions
async function handleAuthSubmit(event) {
  event.preventDefault();
  clearAlert();

  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  const authBtn = document.getElementById('authBtn');

  // Disable button to prevent double-clicks
  const originalText = authBtn.textContent;
  authBtn.disabled = true;
  authBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

  try {
    let response;
    if (activeMode === 'signup') {
      if (!name) {
        throw new Error('Please fill in your name.');
      }
      response = await API.post('/auth/signup', { name, email, password });
      showAlert('Account created! Logging you in...', 'success');
    } else {
      response = await API.post('/auth/login', { email, password });
    }

    // Save tokens and user specs
    API.setToken(response.token);
    API.setProfile({
      _id: response._id,
      name: response.name,
      email: response.email,
      role: response.role
    });

    // Delay redirection slightly so they can read the success state
    setTimeout(() => {
      if (response.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    }, 800);

  } catch (error) {
    showAlert(error.message || 'Authentication failed. Please try again.');
    authBtn.disabled = false;
    authBtn.textContent = originalText;
  }
}
