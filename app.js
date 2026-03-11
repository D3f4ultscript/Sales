const ADMIN_CODE = "123";

let shoppingItems = JSON.parse(localStorage.getItem("items_data") || "[]");
let userState = JSON.parse(localStorage.getItem("user_session") || "null");
let userCart = [];
let activeFilter = "all";

function persistData() { localStorage.setItem("items_data", JSON.stringify(shoppingItems)); }

function isItemRecent(item) {
  if (!item.created_at) return false;
  const timeNow = Date.now();
  const timeDiff = timeNow - item.created_at;
  return timeDiff < 86400000; 
}

function navigateTo(pageId) {
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  document.getElementById(pageId + "-page").classList.add("active");
  window.scrollTo(0, 0);
  if (pageId === "admin") refreshAdminView();
  if (pageId === "profile") refreshProfileView();
}

function toggleNav() {
  document.getElementById("nav-links").classList.toggle("open");
}
function hideNav() {
  document.getElementById("nav-links").classList.remove("open");
}

function updateFilter(btn, category) {
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = category;
  displayProducts();
}

function displayProducts() {
  const searchTerm = document.getElementById("search-input").value.toLowerCase();
  const sortOrder = document.getElementById("sort-select").value;
  
  let filteredList = shoppingItems.filter(item => {
    let matchesCategory = false;
    if (activeFilter === "all") {
      matchesCategory = true;
    } else if (activeFilter === "new") {
      matchesCategory = isItemRecent(item);
    } else {
      matchesCategory = item.category === activeFilter;
    }
    const matchesSearch = item.title.toLowerCase().includes(searchTerm) || item.details.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  if (sortOrder === "price-asc") filteredList.sort((a, b) => a.amount - b.amount);
  else if (sortOrder === "price-desc") filteredList.sort((a, b) => b.amount - a.amount);
  else if (sortOrder === "name-asc") filteredList.sort((a, b) => a.title.localeCompare(b.title));
  else if (sortOrder === "name-desc") filteredList.sort((a, b) => b.title.localeCompare(a.title));

  const container = document.getElementById("products-grid");
  if (filteredList.length === 0) {
    container.innerHTML = shoppingItems.length === 0
      ? '<div class="no-products">🛍️<br/><br/>No items available yet.</div>'
      : '<div class="no-products">No matches found.</div>';
    return;
  }

  container.innerHTML = filteredList.map(item => `
    <div class="product-card">
      <div class="product-img">${item.icon}</div>
      <div class="product-body">
        <span class="product-tag">${item.category}${isItemRecent(item) ? ' <span style="color:var(--accent2); font-weight:bold;">[NEW]</span>' : ''}</span>
        <div class="product-name">${item.title}</div>
        <div class="product-desc">${item.details}</div>
        <div class="product-footer">
          <span class="product-price">$${item.amount.toFixed(2)}</span>
          <button class="add-cart-btn" onclick="addItemToCart(${item.id})">+ Cart</button>
        </div>
      </div>
    </div>`).join("");
}

function addItemToCart(id) {
  const item = shoppingItems.find(i => i.id === id);
  if (!item) return;
  const existing = userCart.find(i => i.id === id);
  if (existing) existing.count++;
  else userCart.push({ ...item, count: 1 });
  refreshCartView();
  showMessage(`${item.icon} ${item.title} added to cart`);
}

function removeItemFromCart(id) {
  userCart = userCart.filter(i => i.id !== id);
  refreshCartView();
}

function refreshCartView() {
  const totalItems = userCart.reduce((acc, curr) => acc + curr.count, 0);
  document.getElementById("cart-count").textContent = totalItems > 0 ? `(${totalItems})` : "";
  const totalPrice = userCart.reduce((acc, curr) => acc + curr.amount * curr.count, 0);
  document.getElementById("cart-total-price").textContent = `$${totalPrice.toFixed(2)}`;
  
  const cartList = document.getElementById("cart-items");
  if (userCart.length === 0) {
    cartList.innerHTML = '<div class="cart-empty">Your cart is currently empty.</div>';
    return;
  }
  
  cartList.innerHTML = userCart.map(item => `
    <div class="cart-item">
      <span class="cart-item-emoji">${item.icon}</span>
      <div class="cart-item-info">
        <div class="name">${item.title}${item.count > 1 ? ` x${item.count}` : ""}</div>
        <div class="price">$${(item.amount * item.count).toFixed(2)}</div>
      </div>
      <button class="cart-item-remove" onclick="removeItemFromCart(${item.id})">✕</button>
    </div>`).join("");
}

function toggleCartUI() {
  document.getElementById("cart-sidebar").classList.toggle("open");
  document.getElementById("cart-overlay").classList.toggle("open");
}

function startCheckout() {
  if (userCart.length === 0) return;
  toggleCartUI();
  showCheckoutModal();
}

// Auth functionality (placeholder/simplified)
function showCheckoutModal() {
  document.getElementById("checkout-popup").classList.add("open");
}

function hideCheckoutModal() {
  document.getElementById("checkout-popup").classList.remove("open");
}

function refreshProfileView() {
  if (!userState) {
    document.getElementById("profile-name-display").textContent = "Guest";
    document.getElementById("profile-email-display").textContent = "Login required";
    document.getElementById("profile-avatar-big").textContent = "?";
    return;
  }
  document.getElementById("profile-name-display").textContent = userState.username;
  document.getElementById("profile-email-display").textContent = `UID: ${userState.id}`;
  document.getElementById("profile-avatar-big").textContent = userState.username.charAt(0).toUpperCase();
}

function triggerAdminAuth() {
  document.getElementById("admin-code-input").value = "";
  document.getElementById("admin-code-err").style.opacity = "0";
  document.getElementById("admin-code-modal").classList.add("open");
  setTimeout(() => document.getElementById("admin-code-input").focus(), 150);
}

function validateAdminAccess() {
  const input = document.getElementById("admin-code-input").value;
  const errorLabel = document.getElementById("admin-code-err");
  if (input === ADMIN_CODE) {
    document.getElementById("admin-code-modal").classList.remove("open");
    navigateTo("admin");
  } else {
    errorLabel.style.opacity = "1";
    document.getElementById("admin-code-input").value = "";
    document.getElementById("admin-code-input").focus();
  }
}

function createNewProduct() {
  const title = document.getElementById("admin-name").value.trim();
  const amount = parseFloat(document.getElementById("admin-price").value);
  const category = document.getElementById("admin-cat").value;
  const icon = document.getElementById("admin-emoji").value || "📦";
  const details = document.getElementById("admin-desc").value.trim();

  if (!title || isNaN(amount) || amount <= 0 || !details) {
    showMessage("⚠️ Please fill all required fields correctly.");
    return;
  }

  const timestamp = Date.now();
  shoppingItems.push({ 
    id: timestamp, 
    title, 
    amount, 
    category, 
    icon, 
    details, 
    created_at: timestamp 
  });

  persistData();
  refreshAdminView();
  displayProducts();
  
  // Clear inputs
  ["admin-name", "admin-price", "admin-emoji", "admin-desc"].forEach(id => {
    document.getElementById(id).value = "";
  });
  
  showMessage(`✅ "${title}" successfully created`);
}

function removeProduct(id) {
  if (!confirm("Are you sure you want to remove this item?")) return;
  shoppingItems = shoppingItems.filter(i => i.id !== id);
  persistData();
  refreshAdminView();
  displayProducts();
  showMessage("🗑️ Item removed");
}

function refreshAdminView() {
  document.getElementById("admin-count").textContent = shoppingItems.length;
  const listEl = document.getElementById("admin-products-list");
  
  if (shoppingItems.length === 0) {
    listEl.innerHTML = '<div class="order-empty">No products in database.</div>';
    return;
  }
  
  listEl.innerHTML = shoppingItems.map(item => `
    <div class="admin-product-item">
      <div class="info">
        <span style="font-size:1.6rem;">${item.icon}</span>
        <div class="info-text">
          <span>${item.title}</span>
          <span>$${item.amount.toFixed(2)} · ${item.category}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="removeProduct(${item.id})">Delete</button>
    </div>`).join("");
}

function showMessage(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

function initApp() {
  const currentPath = window.location.hash;
  if (currentPath.includes("admin")) {
    triggerAdminAuth();
  }
  displayProducts();
  refreshCartView();
}

window.addEventListener("hashchange", initApp);
window.addEventListener("load", initApp);
