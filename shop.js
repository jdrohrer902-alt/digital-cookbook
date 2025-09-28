/* shop.js — full modern version with fixed login/signup/profile UI */

/* ---------- Constants & Helpers ---------- */
const PRODUCTS_URL = "products.json";

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const money = v => `$${v.toFixed(2)}`;

const getUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
const setUsers = u => localStorage.setItem("users", JSON.stringify(u));
const getCurrentUser = () => JSON.parse(localStorage.getItem("currentUser") || "null");
const setCurrentUser = u => localStorage.setItem("currentUser", JSON.stringify(u));

/* ---------- Cart Helpers ---------- */
function getCart() {
  const user = getCurrentUser();
  if (user) {
    const users = getUsers();
    const u = users.find(x => x.username === user.username);
    return u?.cart || [];
  } else {
    return JSON.parse(localStorage.getItem("guest_cart") || "[]");
  }
}

function saveCart(cart) {
  const user = getCurrentUser();
  if (user) {
    const users = getUsers();
    const idx = users.findIndex(x => x.username === user.username);
    if (idx >= 0) {
      users[idx].cart = cart;
      setUsers(users);
      setCurrentUser(users[idx]);
    }
  } else {
    localStorage.setItem("guest_cart", JSON.stringify(cart));
  }
}

function updateNavCartCount() {
  const count = getCart().reduce((s, i) => s + i.qty, 0);
  ["nav-cart-count", "nav-cart-count-2"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  });
}

/* ---------- Flash Messages ---------- */
function flash(msg) {
  const tpl = document.createElement("div");
  tpl.textContent = msg;
  tpl.className = "flash-msg";
  document.body.appendChild(tpl);
  setTimeout(() => {
    tpl.style.opacity = 0;
    tpl.style.transform = "translateY(-20px)";
  }, 2200);
  setTimeout(() => tpl.remove(), 3000);
}

/* ---------- Load Products ---------- */
let PRODUCTS = [];
fetch(PRODUCTS_URL)
  .then(r => r.json())
  .then(data => {
    PRODUCTS = data;
    initUI();
  })
  .catch(e => console.error("Failed loading products:", e));

/* ---------- Update Nav (Login/Signup/Profile) ---------- */
/* ---------- Update Nav (Login/Signup/Profile) ---------- */
function updateNavUI() {
  const currentUser = getCurrentUser();
  const navSignup = $("#nav-signup");
  const navLogin = $("#nav-login");
  const profileDropdown = $("#profile-dropdown");
  const profileName = $("#profile-name");
  const profileMenu = $("#profile-menu");

  if (currentUser) {
    // Hide signup/login buttons
    if (navSignup) navSignup.style.display = 'none';
    if (navLogin) navLogin.style.display = 'none';

    // Show profile dropdown if it exists
    if (profileDropdown && profileName) {
      profileDropdown.style.display = 'inline-flex';
      profileName.textContent = currentUser.username;

      // Attach dropdown toggle
      const btn = document.getElementById('profile-btn');
      if (btn && profileMenu) {
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Close menu on outside click
        document.addEventListener('click', e => {
          if (!profileDropdown.contains(e.target)) profileMenu.style.display = 'none';
        });
      }

      // Logout
      const logoutBtn = document.getElementById('profile-logout');
      logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        updateNavUI();
        alert('Logged out');
      });

      // Delete account
      const deleteBtn = document.getElementById('profile-delete-account');
      deleteBtn?.addEventListener('click', () => {
        let users = getUsers();
        users = users.filter(u => u.username !== currentUser.username);
        setUsers(users);
        localStorage.removeItem('currentUser');
        updateNavUI();
        alert('Account deleted');
      });

      // Change password
      const changePassBtn = document.getElementById('profile-change-password');
      changePassBtn?.addEventListener('click', () => {
        const newPass = prompt('Enter new password:');
        if (!newPass) return;
        let users = getUsers();
        const idx = users.findIndex(u => u.username === currentUser.username);
        if (idx >= 0) {
          users[idx].password = newPass;
          setUsers(users);
          setCurrentUser(users[idx]);
          alert('Password changed');
        }
      });
    }
  } else {
    // Logged out UI
    if (navSignup) navSignup.style.display = 'inline-flex';
    if (navLogin) navLogin.style.display = 'inline-flex';
    if (profileDropdown) profileDropdown.style.display = 'none';
  }
}


/* ---------- Init UI ---------- */
function initUI() {
  updateNavUI();
  updateNavCartCount();

  if ($("#products-grid")) bindIndex();
  if ($("#product-container")) renderProductFromUrl();
  if ($("#cart-items-full")) renderCartPage();
  if ($("#signup-btn")) bindSignup();
  if ($("#login-btn")) bindLogin();
}

/* ---------- INDEX PAGE ---------- */
function bindIndex() {
  const search = $("#search");
  const sortSelect = $("#sort");
  const chips = $$(".chip");
  renderProducts(PRODUCTS);

  search?.addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    renderProducts(PRODUCTS.filter(p => (`${p.title} ${p.description}`).toLowerCase().includes(q)));
  });

  chips.forEach(chip => chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const cat = chip.dataset.cat;
    renderProducts(cat === "All" ? PRODUCTS : PRODUCTS.filter(p => p.category === cat));
  }));

  sortSelect?.addEventListener("change", () => {
    let arr = PRODUCTS.slice();
    if (sortSelect.value === "price-asc") arr.sort((a, b) => a.price - b.price);
    if (sortSelect.value === "price-desc") arr.sort((a, b) => b.price - a.price);
    if (sortSelect.value === "rating-desc") arr.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    renderProducts(arr);
  });

  $("#explore-btn")?.addEventListener("click", () => {
    document.querySelector(".controls")?.scrollIntoView({ behavior: "smooth" });
  });
}

function renderProducts(list) {
  const grid = $("#products-grid");
  if (!grid) return;
  grid.innerHTML = "";
  list.forEach(p => {
    const el = document.createElement("article");
    el.className = "card";
    el.dataset.id = p.id;
    el.innerHTML = `
      <img loading="lazy" src="${p.image}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="meta">
        <div class="price">${money(p.price)}</div>
        <div class="rating">⭐ ${p.rating ?? 4.5}</div>
      </div>
      <div class="actions">
        <button class="btn primary" data-action="add" data-id="${p.id}">Add to cart</button>
        <button class="btn ghost" data-action="pdf" data-id="${p.id}">Open PDF</button>
      </div>
    `;

    el.addEventListener("click", ev => {
      const btn = ev.target.closest("button");
      if (btn) return;
      location.href = `product.html?id=${p.id}`;
    });

    el.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", ev => {
        ev.stopPropagation();
        const action = btn.dataset.action;
        const id = Number(btn.dataset.id);
        if (action === "add") {
          addToCart(id, 1);
          flash(`${p.title} added to cart`);
        }
        if (action === "pdf") window.open(p.pdf, "_blank");
      });
    });

    grid.appendChild(el);
  });
}

/* ---------- PRODUCT PAGE ---------- */
function renderProductFromUrl() {
  const container = $("#product-container");
  const url = new URL(location.href);
  const id = Number(url.searchParams.get("id"));
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return container.innerHTML = "<h2>Product not found</h2>";

  container.innerHTML = `
    <div class="product-detail">
      <div><img src="${product.image}" alt="${product.title}"></div>
      <div class="product-info">
        <h2>${product.title}</h2>
        <p class="muted">${product.description}</p>
        <div style="margin-top:12px"><strong>${money(product.price)}</strong></div>
        <div class="qty">
          <label for="qty">Quantity</label>
          <input id="qty" type="number" min="1" value="1" style="width:86px;margin-left:8px">
        </div>
        <div style="margin-top:14px;display:flex;gap:10px">
          <button id="add-prod" class="btn primary">Add to cart</button>
          <button id="open-pdf" class="btn ghost">Open PDF</button>
        </div>
        <div style="margin-top:18px;color:var(--muted)">
          Category: ${product.category} • Rating: ${product.rating}
        </div>
      </div>
    </div>
  `;

  $("#add-prod").addEventListener("click", () => {
    const qty = Math.max(1, Number($("#qty").value || 1));
    addToCart(product.id, qty);
    flash(`${product.title} added (${qty})`);
  });

  $("#open-pdf").addEventListener("click", () => window.open(product.pdf, "_blank"));

  renderRecommended(id);
}

/* ---------- RECOMMENDED ---------- */
function renderRecommended(currentId) {
  const productContainer = $("#product-container");
  if (!productContainer) return;

  const container = document.createElement("div");
  container.className = "recommended";
  container.innerHTML = `
    <h3>You might also like</h3>
    <div class="recommended-grid"></div>
  `;

  const grid = container.querySelector(".recommended-grid");
  if (!grid) return;

  const recommended = PRODUCTS.filter(p => p.id !== currentId).slice(0, 3);

  recommended.forEach(p => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <img src="${p.image}" alt="${p.title}">
      <h3>${p.title}</h3>
      <div class="meta">
        <div class="price">${money(p.price)}</div>
        <div class="rating">⭐ ${p.rating ?? 4.5}</div>
      </div>
    `;

    el.addEventListener("click", () => location.href = `product.html?id=${p.id}`);
    grid.appendChild(el);
  });

  productContainer.appendChild(container);
}

/* ---------- CART ---------- */
function addToCart(productId, qty = 1) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) item.qty += qty;
  else cart.push({ id: productId, qty });
  saveCart(cart);
  updateNavCartCount();
}

function setQty(productId, qty) {
  let cart = getCart();
  const it = cart.find(i => i.id === productId);
  if (it) it.qty = Math.max(1, qty);
  saveCart(cart);
  renderCartPage();
  updateNavCartCount();
}

function removeCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
  renderCartPage();
  updateNavCartCount();
}

function clearCart() {
  saveCart([]);
  renderCartPage();
  updateNavCartCount();
}

function renderCartPage() {
  const host = $("#cart-items-full");
  if (!host) return;
  const cart = getCart();
  host.innerHTML = "";

  const cartSummaryEl = $("#cart-summary-text");

  if (cart.length === 0) {
    host.innerHTML = `<p>Your cart is empty. <a href="index.html">Continue shopping</a></p>`;
    if (cartSummaryEl) cartSummaryEl.textContent = "Total: $0.00";
    return;
  }

  let total = 0;

  cart.forEach(ci => {
    const p = PRODUCTS.find(x => x.id === ci.id);
    if (!p) return;
    total += p.price * ci.qty;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${p.image}" alt="${p.title}">
      <div class="info">
        <strong>${p.title}</strong>
        <div class="muted">${money(p.price)} each</div>
      </div>
      <div>
        <input class="qty-input" data-id="${p.id}" type="number" min="1" value="${ci.qty}">
        <div style="margin-top:8px">
          <button class="btn ghost remove" data-id="${p.id}">Remove</button>
        </div>
      </div>
    `;

    row.addEventListener("click", ev => {
      if (ev.target.closest("input") || ev.target.closest("button")) return;
      location.href = `product.html?id=${p.id}`;
    });

    row.querySelector(".qty-input").addEventListener("change", ev => {
      const newQty = Math.max(1, Number(ev.target.value));
      setQty(p.id, newQty);
    });

    row.querySelector(".remove").addEventListener("click", () => {
      removeCart(p.id);
    });

    host.appendChild(row);
  });

  if (cartSummaryEl) cartSummaryEl.textContent = `Total: ${money(total)}`;
}

/* ---------- AUTH ---------- */
function bindSignup() {
  $("#signup-btn")?.addEventListener("click", () => {
    const username = $("#signup-username").value.trim();
    const password = $("#signup-password").value.trim();
    if (!username || !password) return alert("Enter username and password");

    const users = getUsers();
    if (users.some(u => u.username === username)) return alert("Username taken");

    users.push({ username, password, cart: [] });
    setUsers(users);
    setCurrentUser({ username, cart: [] });
    alert("Account created and logged in");
    location.href = "index.html";
  });
}

function bindLogin() {
  $("#login-btn")?.addEventListener("click", () => {
    const username = $("#login-username").value.trim();
    const password = $("#login-password").value.trim();
    const user = getUsers().find(u => u.username === username && u.password === password);
    if (!user) return alert("Invalid credentials");
    setCurrentUser(user);
    alert("Logged in");
    location.href = "index.html";
  });
}

/* ---------- Listen for changes in other tabs ---------- */
window.addEventListener("storage", e => {
  if (e.key === "store_cart" || e.key === "currentUser") updateNavCartCount();
});
