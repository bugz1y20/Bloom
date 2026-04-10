// ─── Firebase Auth ────────────────────────────────────────────────────────────
// Uses Firebase v9 compat SDK (loaded via CDN in index.html)

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();

const loginScreen  = document.getElementById('login-screen');
const appShell     = document.getElementById('app-shell');
const loginForm    = document.getElementById('login-form');
const loginError   = document.getElementById('login-error');
const logoutBtn    = document.getElementById('logoutBtn');
const exportBtn    = document.getElementById('exportDataBtn');
const importBtn    = document.getElementById('importDataBtn');
const importFile   = document.getElementById('importFileInput');

// ─── Auth state ───────────────────────────────────────────────────────────────
auth.onAuthStateChanged(function(user) {
  var isGuest = sessionStorage.getItem('bloom-guest-mode') === '1';
  if (user || isGuest) {
    loginScreen.hidden = true;
    appShell.hidden    = false;
    appShell.classList.add('ready');
    loginScreen.classList.remove('ready');
    showScrollHint();
  } else {
    loginScreen.hidden = false;
    appShell.hidden    = true;
    loginScreen.classList.add('ready');
    appShell.classList.remove('ready');
  }
});

// ─── Scroll hint ──────────────────────────────────────────────────────────────
function showScrollHint() {
  // Only show once per session
  if (sessionStorage.getItem('scroll-hint-shown')) return;
  sessionStorage.setItem('scroll-hint-shown', '1');

  const hint = document.createElement('div');
  hint.id = 'scroll-hint';
  hint.innerHTML = '<span>↓</span> Scroll down to see your dashboard';
  document.body.appendChild(hint);

  // Hide when user scrolls or after 4 seconds
  const dismiss = function() {
    hint.classList.add('scroll-hint-hide');
    setTimeout(function() { hint.remove(); }, 400);
    window.removeEventListener('scroll', dismiss);
  };
  window.addEventListener('scroll', dismiss, { passive: true });
  setTimeout(dismiss, 4000);
}

// ─── Login ────────────────────────────────────────────────────────────────────
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  loginError.textContent = '';
  const btn      = loginForm.querySelector('button[type="submit"]');
  const email    = loginForm.querySelector('#login-email').value.trim();
  const password = loginForm.querySelector('#login-password').value;

  // Start sand animation immediately, then fire auth in parallel
  sandDissolve(btn, function() {
    // Letters have scattered — show "Scroll down"
    btn.innerHTML = '';
    const next = document.createElement('span');
    next.className = 'btn-label';
    next.textContent = 'Scroll down ↓';
    next.style.cssText = 'opacity:0;display:inline-block;transform:translateY(10px);transition:opacity 0.45s ease,transform 0.45s ease';
    btn.appendChild(next);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        next.style.opacity = '1';
        next.style.transform = 'translateY(0)';
      });
    });
  });

  auth.signInWithEmailAndPassword(email, password)
    .catch(function(err) {
      // Restore button on failure
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-label">Sign in</span>';
      loginError.textContent = friendlyAuthError(err.code);
    });
});

// ─── Sand dissolve animation ─────────────────────────────────────────────────
function sandDissolve(btn, onDone) {
  const labelEl = btn.querySelector('.btn-label') || btn;
  const text    = labelEl.textContent.trim();

  btn.disabled = true;
  labelEl.textContent = '';

  // Create one span per character
  const chars = [...text].map(function(char, i) {
    const span = document.createElement('span');
    span.className = 'sand-char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    labelEl.appendChild(span);
    return span;
  });

  // Two rAF frames to guarantee layout before transition
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      chars.forEach(function(span, i) {
        const dx  = (Math.random() - 0.5) * 90;
        const dy  = 18 + Math.random() * 50;
        const rot = (Math.random() - 0.5) * 150;
        const del = i * 38;
        span.style.transition =
          'transform 0.5s ease ' + del + 'ms, opacity 0.4s ease ' + del + 'ms';
        span.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)';
        span.style.opacity   = '0';
      });
    });
  });

  var total = chars.length * 38 + 520;
  setTimeout(onDone, total);
}

// ─── Guest mode ──────────────────────────────────────────────────────────────
var guestBtn = document.getElementById('guestBtn');

guestBtn.addEventListener('click', function() {
  function futureDate(days) {
    var d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  var today = new Date().toISOString().slice(0, 10);

  var demoState = {
    incomeTarget: { amount: 8500, currency: "ZMW" },
    savingsTarget: { amount: 2000, currency: "ZMW" },
    transactions: [
      { id: crypto.randomUUID(), title: "Salary", amount: 8500, currency: "ZMW", type: "income", category: "Income", date: today },
      { id: crypto.randomUUID(), title: "Grocery shopping", amount: 450, currency: "ZMW", type: "expense", category: "Food", date: today },
      { id: crypto.randomUUID(), title: "Uber to work", amount: 85, currency: "ZMW", type: "expense", category: "Transport", date: today },
      { id: crypto.randomUUID(), title: "Netflix subscription", amount: 15, currency: "USD", type: "expense", category: "Lifestyle", date: today },
      { id: crypto.randomUUID(), title: "Electricity bill", amount: 380, currency: "ZMW", type: "expense", category: "Utilities", date: today },
      { id: crypto.randomUUID(), title: "Rent payment", amount: 3500, currency: "ZMW", type: "expense", category: "Housing", date: today }
    ],
    plans: [
      { id: crypto.randomUUID(), name: "Internet bill", amount: 350, currency: "ZMW", dueDate: futureDate(5), priority: "high" },
      { id: crypto.randomUUID(), name: "Birthday gift", amount: 200, currency: "ZMW", dueDate: futureDate(10), priority: "medium" }
    ],
    journal: [
      { id: crypto.randomUUID(), date: today, content: "Welcome to Bloom Budget! This is a demo account. Feel free to explore \u2014 add transactions, plans, and journal entries. Your changes stay in this browser only." }
    ],
    preferences: { displayCurrency: "ZMW" }
  };

  localStorage.setItem('bloom-budget-state-v2', JSON.stringify(demoState));
  sessionStorage.setItem('bloom-guest-mode', '1');

  loginScreen.hidden = true;
  appShell.hidden = false;
  location.reload();
});

// ─── Logout ───────────────────────────────────────────────────────────────────
logoutBtn.addEventListener('click', function() {
  sessionStorage.removeItem('bloom-guest-mode');
  auth.signOut();
});

// ─── Export data ─────────────────────────────────────────────────────────────
exportBtn.addEventListener('click', function() {
  const data = localStorage.getItem('bloom-budget-state-v2');
  if (!data) {
    alert('No budget data found to export.');
    return;
  }
  const blob = new Blob([data], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'bloom-budget-data.json';
  a.click();
  URL.revokeObjectURL(url);
});

// ─── Import data ─────────────────────────────────────────────────────────────
importBtn.addEventListener('click', function() {
  importFile.click();
});

importFile.addEventListener('change', function() {
  const file = importFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      // Basic validation — must have the shape we expect
      if (typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) {
        throw new Error('Unrecognised format');
      }
      localStorage.setItem('bloom-budget-state-v2', JSON.stringify(parsed));
      alert('Data imported! The page will now reload.');
      location.reload();
    } catch {
      alert('Could not import: the file does not look like valid Bloom Budget data.');
    }
  };
  reader.readAsText(file);
  // Reset so the same file can be re-selected if needed
  importFile.value = '';
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function friendlyAuthError(code) {
  switch (code) {
    case 'auth/invalid-email':          return 'That email address is not valid.';
    case 'auth/user-not-found':         return 'No account found for that email.';
    case 'auth/wrong-password':         return 'Incorrect password.';
    case 'auth/invalid-credential':     return 'Incorrect email or password.';
    case 'auth/too-many-requests':      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default:                            return 'Sign-in failed. Please try again.';
  }
}
