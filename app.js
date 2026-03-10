const ADMIN_CODE = "123";
let products = JSON.parse(localStorage.getItem("os_products") || "[]");
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
      ? '<div class="no-products">🛍️<br/><br/>Noch keine Produkte vorhanden.<br/>Füge welche über die Administration hinzu.</div>'
      : '<div class="no-products">Keine Produkte gefunden.</div>';
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
          <span class="product-price">€${p.price.toFixed(2)}</span>
          <button class="add-cart-btn" onclick="addToCart(${p.id})">+ Warenkorb</button>
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
  toast(`${p.emoji} ${p.name} hinzugefügt`);
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((a, b) => a + b.qty, 0);
  document.getElementById("cart-count").textContent = count > 0 ? `(${count})` : "";
  const total = cart.reduce((a, b) => a + b.price * b.qty, 0);
  document.getElementById("cart-total-price").textContent = `€${total.toFixed(2)}`;
  const ci = document.getElementById("cart-items");
  if (cart.length === 0) {
    ci.innerHTML = '<div class="cart-empty">Dein Warenkorb ist leer.</div>';
    return;
  }
  ci.innerHTML = cart.map(x => `
    <div class="cart-item">
      <span class="cart-item-emoji">${x.emoji}</span>
      <div class="cart-item-info">
        <div class="name">${x.name}${x.qty > 1 ? ` x${x.qty}` : ""}</div>
        <div class="price">€${(x.price * x.qty).toFixed(2)}</div>
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
  cart = [];
  updateCartUI();
  toggleCart();
  openCheckoutPopup();
}

function openCheckoutPopup() {
  document.getElementById("checkout-popup").classList.add("open");
}

function closeCheckoutPopup() {
  document.getElementById("checkout-popup").classList.remove("open");
}

function updateProfileUI() {
  document.getElementById("profile-name-display").textContent = "Gast";
  document.getElementById("profile-email-display").textContent = "Login deaktiviert";
  document.getElementById("profile-avatar-big").textContent = "G";
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
    toast("⚠️ Bitte alle Felder ausfüllen.");
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
  toast(`✅ "${name}" hinzugefügt`);
}

function deleteProduct(id) {
  if (!confirm("Produkt wirklich löschen?")) return;
  products = products.filter(p => p.id !== id);
  save();
  renderAdminProducts();
  renderProducts();
  toast("🗑️ Produkt gelöscht");
}

function renderAdminProducts() {
  document.getElementById("admin-count").textContent = products.length;
  const list = document.getElementById("admin-products-list");
  if (products.length === 0) {
    list.innerHTML = '<div class="order-empty">Noch keine Produkte vorhanden.</div>';
    return;
  }
  list.innerHTML = products.map(p => `
    <div class="admin-product-item">
      <div class="info">
        <span style="font-size:1.6rem;">${p.emoji}</span>
        <div class="info-text">
          <span>${p.name}</span>
          <span>€${p.price.toFixed(2)} · ${p.cat} · ${p.desc.substring(0, 45)}${p.desc.length > 45 ? "..." : ""}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteProduct(${p.id})">Löschen</button>
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

renderProducts();
updateCartUI();
