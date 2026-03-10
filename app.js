const ADMIN_CODE = "123";
// Discord Configuration
const DISCORD_CLIENT_ID = "YOUR_CLIENT_ID"; // Replace with your App Client ID
const DISCORD_REDIRECT_URI = window.location.origin + window.location.pathname;

let products = JSON.parse(localStorage.getItem("os_products") || "[]");
let currentUser = JSON.parse(localStorage.getItem("os_discord_user") || "null");
let cart = [];
let currentFilter = "all";

function save() { localStorage.setItem("os_products", JSON.stringify(products)); }

function showPage(p) {
  document.querySelectorAll(".page").forEach(x => x.classList.remove("active"));
  document.getElementById(p + "-page").classList.add("active");
  window.scrollTo(0, 0);
  if (p === "admin") renderAdminProducts();
  if (p === "profile") updateProfileUI();
}

function toggleMobileMenu() {
  document.getElementById("nav-links").classList.toggle("open");
}
function closeMobileMenu() {
  document.getElementById("nav-links").classList.remove("open");
}

function setFilter(el, cat) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  currentFilter = cat;
  renderProducts();
}

function renderProducts() {
  const q = document.getElementById("search-input").value.toLowerCase();
  const sort = document.getElementById("sort-select").value;
  let list = products.filter(p => {
    const matchCat = currentFilter === "all" || p.cat === currentFilter;
    const matchQ = p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
  const grid = document.getElementById("products-grid");
  if (list.length === 0) {
    grid.innerHTML = products.length === 0
      ? '<div class="no-products">🛍️<br/><br/>No products available.<br/>Add some via administration.</div>'
      : '<div class="no-products">No products found.</div>';
    return;
  }
  grid.innerHTML = list.map(p => `
    <div class="product-card">
      <div class="product-img">${p.emoji}</div>
      <div class="product-body">
        <span class="product-tag">${p.cat}</span>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.desc}</div>
        <div class="product-footer">
          <span class="product-price">$${p.price.toFixed(2)}</span>
          <button class="add-cart-btn" onclick="addToCart(${p.id})">+ Cart</button>
        </div>
      </div>
    </div>`).join("");
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const ex = cart.find(x => x.id === id);
  if (ex) ex.qty++;
  else cart.push({ ...p, qty: 1 });
  updateCartUI();
  toast(`${p.emoji} ${p.name} added`);
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((a, b) => a + b.qty, 0);
  document.getElementById("cart-count").textContent = count > 0 ? `(${count})` : "";
  const total = cart.reduce((a, b) => a + b.price * b.qty, 0);
  document.getElementById("cart-total-price").textContent = `$${total.toFixed(2)}`;
  const ci = document.getElementById("cart-items");
  if (cart.length === 0) {
    ci.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    return;
  }
  ci.innerHTML = cart.map(x => `
    <div class="cart-item">
      <span class="cart-item-emoji">${x.emoji}</span>
      <div class="cart-item-info">
        <div class="name">${x.name}${x.qty > 1 ? ` x${x.qty}` : ""}</div>
        <div class="price">$${(x.price * x.qty).toFixed(2)}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${x.id})">✕</button>
    </div>`).join("");
}

function toggleCart() {
  document.getElementById("cart-sidebar").classList.toggle("open");
  document.getElementById("cart-overlay").classList.toggle("open");
}

function checkout() {
  if (cart.length === 0) return;
  // Cart is NOT cleared anymore
  toggleCart();
  openCheckoutPopup();
}

function loginWithDiscord() {
  if (DISCORD_CLIENT_ID === "YOUR_CLIENT_ID") {
    toast("Please set DISCORD_CLIENT_ID in app.js");
    return;
  }
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=token&scope=identify`;
  window.location.href = url;
}

async function handleDiscordAuth() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = fragment.get("access_token");

  if (accessToken) {
    try {
      const response = await fetch('https://discord.com/api/users/@me', {
        headers: { authorization: `Bearer ${accessToken}` }
      });
      const user = await response.json();
      if (user.id) {
        currentUser = user;
        localStorage.setItem("os_discord_user", JSON.stringify(user));
        history.replaceState(null, null, " ");
        updateAuthUI();
        toast(`Welcome, ${user.username}!`);
      }
    } catch (e) {
      console.error(e);
      toast("Discord Login failed.");
    }
  }
}

function updateAuthUI() {
  const btn = document.getElementById("discord-user-name");
  if (currentUser) {
    btn.textContent = currentUser.username;
    // Optional: Add avatar from https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png
  }
}

function openCheckoutPopup() {
  document.getElementById("checkout-popup").classList.add("open");
}

function closeCheckoutPopup() {
  document.getElementById("checkout-popup").classList.remove("open");
}

function updateProfileUI() {
  if (!currentUser) {
    document.getElementById("profile-name-display").textContent = "Guest";
    document.getElementById("profile-email-display").textContent = "Not connected to Discord";
    document.getElementById("profile-avatar-big").textContent = "?";
    return;
  }
  document.getElementById("profile-name-display").textContent = currentUser.username;
  document.getElementById("profile-email-display").textContent = `ID: ${currentUser.id}`;
  document.getElementById("profile-avatar-big").textContent = currentUser.username[0].toUpperCase();
}

function openAdminCodeModal() {
  document.getElementById("admin-code-input").value = "";
  document.getElementById("admin-code-err").style.opacity = "0";
  document.getElementById("admin-code-modal").classList.add("open");
  setTimeout(() => document.getElementById("admin-code-input").focus(), 100);
}

function verifyAdminCode() {
  const val = document.getElementById("admin-code-input").value;
  const err = document.getElementById("admin-code-err");
  if (val === ADMIN_CODE) {
    document.getElementById("admin-code-modal").classList.remove("open");
    showPage("admin");
  } else {
    err.style.opacity = "1";
    document.getElementById("admin-code-input").value = "";
    document.getElementById("admin-code-input").focus();
  }
}

function addProduct() {
  const name = document.getElementById("admin-name").value.trim();
  const price = parseFloat(document.getElementById("admin-price").value);
  const cat = document.getElementById("admin-cat").value;
  const emoji = document.getElementById("admin-emoji").value || "📦";
  const desc = document.getElementById("admin-desc").value.trim();
  if (!name || isNaN(price) || price < 0 || !desc) {
    toast("⚠️ Please fill all fields.");
    return;
  }
  products.push({ id: Date.now(), name, price, cat, emoji, desc });
  save();
  renderAdminProducts();
  renderProducts();
  document.getElementById("admin-name").value = "";
  document.getElementById("admin-price").value = "";
  document.getElementById("admin-emoji").value = "";
  document.getElementById("admin-desc").value = "";
  toast(`✅ "${name}" added`);
}

function deleteProduct(id) {
  if (!confirm("Really delete product?")) return;
  products = products.filter(p => p.id !== id);
  save();
  renderAdminProducts();
  renderProducts();
  toast("🗑️ Product deleted");
}

function renderAdminProducts() {
  document.getElementById("admin-count").textContent = products.length;
  const list = document.getElementById("admin-products-list");
  if (products.length === 0) {
    list.innerHTML = '<div class="order-empty">No products found.</div>';
    return;
  }
  list.innerHTML = products.map(p => `
    <div class="admin-product-item">
      <div class="info">
        <span style="font-size:1.6rem;">${p.emoji}</span>
        <div class="info-text">
          <span>${p.name}</span>
          <span>$${p.price.toFixed(2)} · ${p.cat} · ${p.desc.substring(0, 45)}${p.desc.length > 45 ? "..." : ""}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
    </div>`).join("");
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// Admin Routing via URL hash
function handleRouting() {
  const hash = window.location.hash;
  if (hash === "#/admin" || hash === "#admin") {
    openAdminCodeModal();
  }
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", handleRouting);

handleDiscordAuth();
updateAuthUI();
renderProducts();
updateCartUI();
