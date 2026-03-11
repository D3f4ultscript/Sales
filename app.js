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
  
  // Update nav link styles
  document.querySelectorAll(".nav-item").forEach(link => {
    link.classList.remove("active");
    if (link.textContent.toLowerCase() === pageId) {
      link.classList.add("active");
    }
  });

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
      ? '<div class="no-products"><i data-lucide="shopping-bag" style="width:40px;height:40px;"></i><br/><br/>No items available yet.</div>'
      : '<div class="no-products">No matches found.</div>';
    lucide.createIcons();
    return;
  }

  container.innerHTML = filteredList.map(item => {
    const symbol = item.currency || '$';
    const priceDisplay = symbol === '€' ? `${item.amount.toFixed(2)}${symbol}` : `${symbol}${item.amount.toFixed(2)}`;
    
    return `
    <div class="product-card" onclick="openProductModal(${item.id})">
      <div class="product-img">
        <i data-lucide="${item.icon || 'package'}" style="width:64px;height:64px;color:rgba(255,255,255,0.7)"></i>
      </div>
      <div class="product-body">
        <span class="product-tag">${isItemRecent(item) ? '<span style="color:var(--accent2); font-weight:bold;">[NEW]</span>' : 'PRODUCT'}</span>
        <div class="product-name">${item.title}</div>
        <div class="product-desc">${item.details}</div>
        <div class="product-footer">
          <span class="product-price">${priceDisplay}</span>
          <button class="add-cart-btn" onclick="event.stopPropagation(); addItemToCart(${item.id})">
            <i data-lucide="plus" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    </div>`;
  }).join("");
  lucide.createIcons();
}

function openProductModal(id) {
  const item = shoppingItems.find(i => i.id === id);
  if (!item) return;

  const symbol = item.currency || '$';
  const priceDisplay = symbol === '€' ? `${item.amount.toFixed(2)}${symbol}` : `${symbol}${item.amount.toFixed(2)}`;

  const content = `
    <div class="modal-product-detail">
      <div class="detail-header">
        <div class="detail-icon">
          <i data-lucide="${item.icon || 'package'}" style="width:80px;height:80px;color:var(--accent);"></i>
        </div>
        <div class="detail-meta">
          <h2 class="gradient-text">${item.title}</h2>
          <div class="detail-price">${priceDisplay}</div>
        </div>
      </div>
      <div class="detail-body">
        <div class="detail-section">
          <h3>Description</h3>
          <p>${item.details}</p>
        </div>
        <div class="detail-section">
          <h3>Information</h3>
          <p class="muted">This is an exclusive product from the D3f4ult Shop. After purchase, you will receive full access or the physical delivery as specified in our Discord ticket.</p>
        </div>
      </div>
      <div class="detail-footer">
        <button class="btn-primary" onclick="addItemToCart(${item.id}); closeProductModal()">
          <i data-lucide="shopping-cart" style="width:18px;height:18px;vertical-align:middle;"></i> Add to Cart
        </button>
      </div>
    </div>
  `;

  document.getElementById("product-modal-content").innerHTML = content;
  document.getElementById("product-modal").classList.add("open");
  lucide.createIcons();
}

function closeProductModal() {
  document.getElementById("product-modal").classList.remove("open");
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
  
  // Calculate total grouping by currency since math with different currencies is tricky
  // For simplicity, we just show a combined string if multiple currencies exist
  const totals = userCart.reduce((acc, curr) => {
    const symbol = curr.currency || '$';
    acc[symbol] = (acc[symbol] || 0) + (curr.amount * curr.count);
    return acc;
  }, {});
  
  const totalString = Object.entries(totals)
    .map(([symbol, value]) => symbol === '€' ? `${value.toFixed(2)}${symbol}` : `${symbol}${value.toFixed(2)}`)
    .join(" + ");

  document.getElementById("cart-total-price").textContent = totalString || "$0.00";
  
  const cartList = document.getElementById("cart-items");
  if (userCart.length === 0) {
    cartList.innerHTML = '<div class="cart-empty">Your cart is currently empty.</div>';
    lucide.createIcons();
    return;
  }
  
  cartList.innerHTML = userCart.map(item => {
    const symbol = item.currency || '$';
    const subtotal = item.amount * item.count;
    const priceDisplay = symbol === '€' ? `${subtotal.toFixed(2)}${symbol}` : `${symbol}${subtotal.toFixed(2)}`;

    return `
    <div class="cart-item">
      <i data-lucide="${item.icon || 'package'}" style="width:24px;height:24px;color:var(--accent);margin-right:12px;"></i>
      <div class="cart-item-info">
        <div class="name">${item.title}${item.count > 1 ? ` x${item.count}` : ""}</div>
        <div class="price">${priceDisplay}</div>
      </div>
      <button class="cart-item-remove" onclick="removeItemFromCart(${item.id})">
        <i data-lucide="x" style="width:14px;height:14px;"></i>
      </button>
    </div>`;
  }).join("");
  lucide.createIcons();
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

function renderIconPicker() {
  const icons = [
    "package", "zap", "star", "gift", "lock", "shield", "trophy", "crown", 
    "gamepad-2", "cpu", "coffee", "heart", "hard-drive", "file-digit", "box", 
    "key", "database", "code", "terminal", "activity", "layers", "shopping-cart"
  ];
  const container = document.getElementById("icon-picker-grid");
  const hiddenInput = document.getElementById("admin-emoji");
  if (!container) return;

  container.innerHTML = icons.map(icon => `
    <div class="icon-option ${hiddenInput.value === icon ? 'selected' : ''}" onclick="selectIcon('${icon}')">
      <i data-lucide="${icon}"></i>
    </div>
  `).join("");
  lucide.createIcons();
}

function selectIcon(icon) {
  document.getElementById("admin-emoji").value = icon;
  renderIconPicker();
}

function createNewProduct() {
  const title = document.getElementById("admin-name").value.trim();
  const amount = parseFloat(document.getElementById("admin-price").value);
  const currency = document.getElementById("admin-currency").value;
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
    currency,
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
  renderIconPicker();
  document.getElementById("admin-count").textContent = shoppingItems.length;
  const listEl = document.getElementById("admin-products-list");
  
  if (shoppingItems.length === 0) {
    listEl.innerHTML = '<div class="order-empty">No products in database.</div>';
    return;
  }
  
  listEl.innerHTML = shoppingItems.map(item => `
    <div class="admin-product-item">
      <div class="info">
        <i data-lucide="${item.icon || 'package'}" style="width:32px;height:32px;color:var(--accent);"></i>
        <div class="info-text">
          <span>${item.title}</span>
          <span>${item.currency || '$'}${item.amount.toFixed(2)}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="removeProduct(${item.id})">
        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
      </button>
    </div>`).join("");
  lucide.createIcons();
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
  lucide.createIcons();
}

window.addEventListener("hashchange", initApp);
window.addEventListener("load", initApp);
