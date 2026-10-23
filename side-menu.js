
"use strict";

const STORAGE = {
    users: "myStoreUsers",
    activeUser: "activeStoreUser",
    products: "myStoreProducts",
    orders: "myStoreAllOrders",
    carts: "myStoreCarts",
    wishlists: "myStoreWishlists"
};

const DEFAULT_PRODUCTS = [
    { id: "P001", name: "Wireless Headphones", price: 1499, category: "Accessories", stock: 25, icon: "🎧" },
    { id: "P002", name: "Smartphone", price: 12999, category: "Electronics", stock: 15, icon: "📱" },
    { id: "P003", name: "Mechanical Keyboard", price: 2499, category: "Accessories", stock: 20, icon: "⌨️" },
    { id: "P004", name: "Wireless Mouse", price: 799, category: "Accessories", stock: 35, icon: "🖱️" },
    { id: "P005", name: "Laptop", price: 35999, category: "Electronics", stock: 8, icon: "💻" },
    { id: "P006", name: "Gaming Controller", price: 1999, category: "Gaming", stock: 12, icon: "🎮" },
    { id: "P007", name: "Notebook Set", price: 199, category: "School Supplies", stock: 50, icon: "📚" },
    { id: "P008", name: "Water Bottle", price: 299, category: "Accessories", stock: 30, icon: "🧴" }
];

const CATEGORY_ICONS = {
    Electronics: "fa-laptop",
    Accessories: "fa-headphones",
    Gaming: "fa-gamepad",
    "School Supplies": "fa-book",
    Clothing: "fa-shirt",
    "Home & Living": "fa-house"
};

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        console.error("Unable to read local storage:", key, error);
        return fallback;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix) {
    return prefix + Date.now().toString(36).toUpperCase() +
        Math.random().toString(36).slice(2, 6).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function money(value) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(Number(value) || 0);
}

function dateText(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function fullName(user) {
    return user?.name || user?.fullName || user?.username || "My Store User";
}

let activeUser = readStorage(STORAGE.activeUser, null);

if (!activeUser || !activeUser.role) {
    window.location.replace("index.html");
    throw new Error("No active account. Redirecting to login.");
}

activeUser.role = String(activeUser.role).toLowerCase();

if (!["customer", "user", "seller"].includes(activeUser.role)) {
    localStorage.removeItem(STORAGE.activeUser);
    window.location.replace("index.html");
    throw new Error("Invalid account role.");
}

const isSeller = activeUser.role === "seller";

let products = readStorage(STORAGE.products, null);
let allOrders = readStorage(STORAGE.orders, []);
let carts = readStorage(STORAGE.carts, {});
let wishlists = readStorage(STORAGE.wishlists, {});
let toastTimer = null;

if (!Array.isArray(products)) {
    products = DEFAULT_PRODUCTS.map(product => ({ ...product }));
    writeStorage(STORAGE.products, products);
}

if (!Array.isArray(allOrders)) allOrders = [];
if (!carts || typeof carts !== "object") carts = {};
if (!wishlists || typeof wishlists !== "object") wishlists = {};

const userKey = String(activeUser.id || activeUser.email || activeUser.username || "guest");
const currentCart = () => Array.isArray(carts[userKey]) ? carts[userKey] : [];
const currentWishlist = () => Array.isArray(wishlists[userKey]) ? wishlists[userKey] : [];

function saveProducts() {
    writeStorage(STORAGE.products, products);
}

function saveOrders() {
    writeStorage(STORAGE.orders, allOrders);
}

function saveCart() {
    writeStorage(STORAGE.carts, carts);
}

function saveWishlist() {
    writeStorage(STORAGE.wishlists, wishlists);
}

function saveActiveUser() {
    writeStorage(STORAGE.activeUser, activeUser);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function getAllUsers() {
    const users = readStorage(STORAGE.users, []);
    return Array.isArray(users) ? users : [];
}

function getCustomerName(order) {
    return order.customerName || order.customer || "Customer";
}

function getOrderItems(order) {
    if (Array.isArray(order.items)) return order.items;

    return [{
        name: order.productName || order.product || "Product",
        quantity: Number(order.quantity) || 1,
        price: Number(order.price) || Number(order.total) || 0
    }];
}

function orderTotal(order) {
    if (Number.isFinite(Number(order.total)) && order.total !== "") {
        return Number(order.total);
    }

    return getOrderItems(order).reduce((sum, item) => {
        return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
    }, 0);
}

function orderStatus(order) {
    return order.status || "Pending";
}

function normalizedStatus(status) {
    const value = String(status || "Pending").toLowerCase();

    if (value === "paid" || value === "completed" || value === "delivered") {
        return "completed";
    }
    if (value === "cancelled" || value === "canceled") return "cancelled";
    return "pending";
}

function statusBadge(status) {
    const normalized = normalizedStatus(status);
    return `<span class="status-badge ${normalized}">${escapeHTML(status || "Pending")}</span>`;
}

function getCustomerOrders() {
    return allOrders.filter(order =>
        String(order.customerKey || "") === userKey ||
        String(order.userId || "") === String(activeUser.id || "") ||
        String(order.customerEmail || "").toLowerCase() === String(activeUser.email || "").toLowerCase()
    );
}

function getCartDetails() {
    return currentCart().map(cartItem => {
        const product = products.find(item => String(item.id) === String(cartItem.productId));
        if (!product) return null;

        const quantity = Math.max(1, Number(cartItem.quantity) || 1);
        return {
            product,
            quantity,
            subtotal: Number(product.price) * quantity
        };
    }).filter(Boolean);
}

function getCartCount() {
    return currentCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function getCartTotal() {
    return getCartDetails().reduce((sum, item) => sum + item.subtotal, 0);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setHTML(id, value) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = value;
}

function updateUserInterface() {
    const name = fullName(activeUser);
    const email = activeUser.email || activeUser.username || "";
    const initial = name.trim().charAt(0).toUpperCase() || "U";

    setText("sidebarName", name);
    setText("sidebarEmail", email);
    setText("sidebarAvatar", initial);
    setText("topAvatar", initial);
    setText("profileAvatar", initial);
    setText("profileDisplayName", name);
    setText("profileDisplayRole", isSeller ? "Seller Account" : "Customer Account");
    setText("roleLabel", isSeller ? "Seller Portal" : "Customer Portal");
    setText("settingsRole", isSeller ? "Seller" : "Customer");
    setText("footerYear", new Date().getFullYear());

    const date = new Date();
    setText("currentDate", date.toLocaleDateString("en-PH", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
    }));

    document.querySelectorAll(".seller-only").forEach(element => {
        element.classList.toggle("hidden", !isSeller);
    });

    document.querySelectorAll(".customer-only").forEach(element => {
        element.classList.toggle("hidden", isSeller);
    });

    if (isSeller) {
        setText("welcomeTitle", `Welcome back, ${name}!`);
        setText("welcomeDescription", "Manage your products, monitor customer orders, and track your store performance.");
        setText("featuredHeading", "Your Store Products");
        setText("statOneLabel", "Total Products");
        setText("statTwoLabel", "Total Orders");
        setText("statThreeLabel", "Pending Orders");
        setText("statFourLabel", "Total Sales");
    } else {
        setText("welcomeTitle", `Welcome to My Store, ${name}!`);
        setText("welcomeDescription", "Discover products you'll love, manage your cart, and keep track of your orders.");
    }
}

const pageTitles = {
    home: ["Home", "Your My Store overview"],
    products: ["Products", "Explore available products"],
    categories: ["Categories", "Browse products by category"],
    cart: ["My Cart", "Review items before checkout"],
    wishlist: ["Wishlist", "Your saved products"],
    customerOrders: ["My Orders", "Your order history"],
    manageProducts: ["Manage Products", "Manage your store inventory"],
    sellerOrders: ["Customer Orders", "Review and update customer orders"],
    reports: ["Sales Reports", "Monitor your store performance"],
    profile: ["My Profile", "Manage your account information"],
    settings: ["Settings", "Manage your preferences"]
};

function navigateTo(page) {
    const section = document.getElementById(`page-${page}`);
    if (!section) return;

    if (isSeller && ["products", "categories", "cart", "wishlist", "customerOrders"].includes(page)) {
        page = "home";
    }

    if (!isSeller && ["manageProducts", "sellerOrders", "reports"].includes(page)) {
        page = "home";
    }

    document.querySelectorAll(".page-section").forEach(item => item.classList.remove("active"));
    document.querySelectorAll(".nav-link[data-page]").forEach(item => {
        item.classList.toggle("active", item.dataset.page === page);
    });

    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add("active");

    const title = pageTitles[page] || ["My Store", ""];
    setText("pageTitle", title[0]);
    setText("pageSubtitle", title[1]);

    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderProductCard(product) {
    const isSaved = currentWishlist().includes(String(product.id));
    const outOfStock = Number(product.stock) <= 0;

    return `
        <article class="product-card">
            <div class="product-art">
                <span class="stock-label">${outOfStock ? "Out of stock" : `${Number(product.stock)} in stock`}</span>
                <span aria-hidden="true">${escapeHTML(product.icon || "📦")}</span>
                ${!isSeller ? `
                    <button class="wishlist-button ${isSaved ? "selected" : ""}"
                        data-action="wishlist" data-id="${escapeHTML(product.id)}"
                        aria-label="${isSaved ? "Remove from" : "Add to"} wishlist">
                        <i class="fa-${isSaved ? "solid" : "regular"} fa-heart"></i>
                    </button>` : ""}
            </div>
            <div class="product-info">
                <span class="product-category">${escapeHTML(product.category)}</span>
                <h3>${escapeHTML(product.name)}</h3>
                <p class="product-description">${outOfStock ? "Currently unavailable" : "Quality product available at My Store."}</p>
                <div class="product-bottom">
                    <div>
                        <div class="product-price">${money(product.price)}</div>
                        <div class="product-stock">${outOfStock ? "No stock available" : "Ready to order"}</div>
                    </div>
                    ${isSeller
                        ? `<button class="btn btn-outline btn-small" data-action="edit" data-id="${escapeHTML(product.id)}">Edit</button>`
                        : `<button class="btn btn-primary btn-small" data-action="add-cart" data-id="${escapeHTML(product.id)}" ${outOfStock ? "disabled" : ""}><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>`
                    }
                </div>
            </div>
        </article>`;
}

function renderFeaturedProducts() {
    const list = products.slice(0, 3);
    setHTML("featuredProducts", list.map(renderProductCard).join(""));
}

function populateCategoryFilters() {
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));

    const filter = document.getElementById("productCategoryFilter");
    if (filter) {
        const currentValue = filter.value || "all";
        filter.innerHTML = `<option value="all">All Categories</option>` +
            categories.map(category =>
                `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`
            ).join("");

        filter.value = categories.includes(currentValue) ? currentValue : "all";
    }

    const dataList = document.getElementById("categoryOptions");
    if (dataList) {
        dataList.innerHTML = categories.map(category =>
            `<option value="${escapeHTML(category)}"></option>`
        ).join("");
    }
}

function renderAllProducts() {
    const search = (document.getElementById("productSearch")?.value || "").trim().toLowerCase();
    const category = document.getElementById("productCategoryFilter")?.value || "all";
    const sort = document.getElementById("productSort")?.value || "default";

    let filtered = products.filter(product => {
        const matchesSearch = `${product.name} ${product.category}`.toLowerCase().includes(search);
        const matchesCategory = category === "all" || product.category === category;
        return matchesSearch && matchesCategory;
    });

    if (sort === "low") filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "high") filtered.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));

    setHTML("allProducts", filtered.map(renderProductCard).join(""));
    document.getElementById("noProducts")?.classList.toggle("hidden", filtered.length > 0);
}

function renderCategories() {
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))];

    setHTML("categoryGrid", categories.map(category => {
        const count = products.filter(product => product.category === category).length;
        const icon = CATEGORY_ICONS[category] || "fa-box";

        return `
            <button class="category-card" data-action="category" data-category="${escapeHTML(category)}">
                <i class="fa-solid ${icon}"></i>
                <h3>${escapeHTML(category)}</h3>
                <p>${count} product${count === 1 ? "" : "s"}</p>
            </button>`;
    }).join(""));
}

function renderCart() {
    const details = getCartDetails();

    setText("cartCount", getCartCount());
    setText("cartTotal", money(getCartTotal()));

    setHTML("cartTable", details.map(item => `
        <tr>
            <td>
                <div class="table-product">
                    <div class="table-product-icon">${escapeHTML(item.product.icon || "📦")}</div>
                    <div><strong>${escapeHTML(item.product.name)}</strong><span>${escapeHTML(item.product.category)}</span></div>
                </div>
            </td>
            <td>${money(item.product.price)}</td>
            <td>
                <div class="quantity-control">
                    <button data-action="decrease" data-id="${escapeHTML(item.product.id)}" aria-label="Decrease quantity">−</button>
                    <span>${item.quantity}</span>
                    <button data-action="increase" data-id="${escapeHTML(item.product.id)}" aria-label="Increase quantity"
                        ${item.quantity >= Number(item.product.stock) ? "disabled" : ""}>+</button>
                </div>
            </td>
            <td><strong>${money(item.subtotal)}</strong></td>
            <td><button class="btn btn-danger btn-small" data-action="remove-cart" data-id="${escapeHTML(item.product.id)}">Remove</button></td>
        </tr>
    `).join(""));

    const empty = details.length === 0;
    document.getElementById("emptyCart")?.classList.toggle("hidden", !empty);
    document.getElementById("cartSummary")?.classList.toggle("hidden", empty);
}

function renderWishlist() {
    const savedIds = currentWishlist();
    const savedProducts = products.filter(product => savedIds.includes(String(product.id)));

    setHTML("wishlistProducts", savedProducts.map(product => `
        <article class="product-card">
            <div class="product-art">
                <span aria-hidden="true">${escapeHTML(product.icon || "📦")}</span>
                <button class="wishlist-button selected" data-action="wishlist" data-id="${escapeHTML(product.id)}" aria-label="Remove from wishlist">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <span class="product-category">${escapeHTML(product.category)}</span>
                <h3>${escapeHTML(product.name)}</h3>
                <div class="product-bottom">
                    <span class="product-price">${money(product.price)}</span>
                    <button class="btn btn-primary btn-small" data-action="wishlist-cart" data-id="${escapeHTML(product.id)}" ${Number(product.stock) <= 0 ? "disabled" : ""}>Move to Cart</button>
                </div>
            </div>
        </article>
    `).join(""));

    document.getElementById("emptyWishlist")?.classList.toggle("hidden", savedProducts.length > 0);
}

function renderCustomerOrders() {
    const orders = getCustomerOrders().slice().reverse();

    setHTML("customerOrdersTable", orders.map(order => {
        const items = getOrderItems(order);
        const names = items.map(item =>
            `${escapeHTML(item.name || item.productName || "Product")} × ${Number(item.quantity) || 1}`
        ).join(", ");

        return `
            <tr>
                <td><strong>${escapeHTML(order.orderNumber || order.id || "—")}</strong></td>
                <td>${dateText(order.date || order.createdAt)}</td>
                <td>${names}</td>
                <td><strong>${money(orderTotal(order))}</strong></td>
                <td>${statusBadge(orderStatus(order))}</td>
            </tr>`;
    }).join(""));

    document.getElementById("emptyCustomerOrders")?.classList.toggle("hidden", orders.length > 0);
}

function renderSellerProducts() {
    const search = (document.getElementById("sellerProductSearch")?.value || "").trim().toLowerCase();

    const filtered = products.filter(product =>
        `${product.name} ${product.category}`.toLowerCase().includes(search)
    );

    setHTML("sellerProductsTable", filtered.map(product => `
        <tr>
            <td>
                <div class="table-product">
                    <div class="table-product-icon">${escapeHTML(product.icon || "📦")}</div>
                    <div><strong>${escapeHTML(product.name)}</strong><span>ID: ${escapeHTML(product.id)}</span></div>
                </div>
            </td>
            <td>${escapeHTML(product.category)}</td>
            <td><strong>${money(product.price)}</strong></td>
            <td>${Number(product.stock) <= 0 ? '<span class="status-badge cancelled">Out of stock</span>' : escapeHTML(product.stock)}</td>
            <td>
                <button class="btn btn-outline btn-small" data-action="edit" data-id="${escapeHTML(product.id)}"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="btn btn-danger btn-small" data-action="delete" data-id="${escapeHTML(product.id)}"><i class="fa-solid fa-trash"></i> Delete</button>
            </td>
        </tr>
    `).join(""));

    document.getElementById("emptySellerProducts")?.classList.toggle("hidden", filtered.length > 0);
}

function renderSellerOrders() {
    const orders = allOrders.slice().reverse();

    setHTML("sellerOrdersTable", orders.map(order => {
        const items = getOrderItems(order);
        const names = items.map(item =>
            `${escapeHTML(item.name || item.productName || "Product")} × ${Number(item.quantity) || 1}`
        ).join(", ");

        const orderId = escapeHTML(order.orderNumber || order.id || "");
        const status = orderStatus(order);

        return `
            <tr>
                <td><strong>${orderId || "—"}</strong></td>
                <td>${escapeHTML(getCustomerName(order))}</td>
                <td>${names}</td>
                <td>${dateText(order.date || order.createdAt)}</td>
                <td><strong>${money(orderTotal(order))}</strong></td>
                <td>${statusBadge(status)}</td>
                <td>
                    <select data-action="order-status" data-id="${orderId}" aria-label="Update status for ${orderId}">
                        ${["Pending", "Processing", "Completed", "Cancelled"].map(option =>
                            `<option value="${option}" ${String(status).toLowerCase() === option.toLowerCase() ? "selected" : ""}>${option}</option>`
                        ).join("")}
                    </select>
                </td>
            </tr>`;
    }).join(""));

    document.getElementById("emptySellerOrders")?.classList.toggle("hidden", orders.length > 0);
}

function renderReports() {
    const totalSales = allOrders.reduce((sum, order) => {
        return sum + (normalizedStatus(orderStatus(order)) === "cancelled" ? 0 : orderTotal(order));
    }, 0);

    const pending = allOrders.filter(order => normalizedStatus(orderStatus(order)) === "pending").length;
    const statuses = ["Pending", "Processing", "Completed", "Cancelled"];

    setText("reportProducts", products.length);
    setText("reportOrders", allOrders.length);
    setText("reportSales", money(totalSales));
    setText("reportPending", pending);

    setHTML("reportSummaryTable", statuses.map(status => {
        const matching = allOrders.filter(order => String(orderStatus(order)).toLowerCase() === status.toLowerCase());
        const amount = matching.reduce((sum, order) => sum + orderTotal(order), 0);

        return `<tr><td>${statusBadge(status)}</td><td>${matching.length}</td><td><strong>${money(amount)}</strong></td></tr>`;
    }).join(""));
}

function renderDashboardStats() {
    if (isSeller) {
        const sales = allOrders.reduce((sum, order) =>
            sum + (normalizedStatus(orderStatus(order)) === "cancelled" ? 0 : orderTotal(order)), 0);

        const pending = allOrders.filter(order => normalizedStatus(orderStatus(order)) === "pending").length;

        setText("statProducts", products.length);
        setText("statOrders", allOrders.length);
        setText("statWishlist", pending);
        setText("statSales", money(sales));
    } else {
        const orders = getCustomerOrders();
        const spent = orders.reduce((sum, order) =>
            sum + (normalizedStatus(orderStatus(order)) === "cancelled" ? 0 : orderTotal(order)), 0);

        setText("statProducts", products.length);
        setText("statOrders", orders.length);
        setText("statWishlist", currentWishlist().length);
        setText("statSales", money(spent));
    }
}

function renderProfile() {
    setText("profileName", "");
    const fields = {
        profileName: activeUser.name || activeUser.fullName || "",
        profileUsername: activeUser.username || "",
        profileEmail: activeUser.email || "",
        profileContact: activeUser.contact || activeUser.phone || "",
        profileStore: activeUser.storeName || `${fullName(activeUser)}'s Store`,
        profileStoreContact: activeUser.storeContact || activeUser.contact || activeUser.email || ""
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });
}

function renderEverything() {
    updateUserInterface();
    populateCategoryFilters();
    renderFeaturedProducts();
    renderAllProducts();
    renderCategories();
    renderCart();
    renderWishlist();
    renderCustomerOrders();
    renderSellerProducts();
    renderSellerOrders();
    renderReports();
    renderDashboardStats();
    renderProfile();
}

function addToCart(productId) {
    const product = products.find(item => String(item.id) === String(productId));
    if (!product) return showToast("Product not found.");

    if (Number(product.stock) <= 0) return showToast("This product is out of stock.");

    const cart = currentCart();
    const existing = cart.find(item => String(item.productId) === String(productId));

    if (existing) {
        if (Number(existing.quantity) >= Number(product.stock)) {
            return showToast("You have reached the available stock.");
        }
        existing.quantity = Number(existing.quantity) + 1;
    } else {
        cart.push({ productId: String(productId), quantity: 1 });
    }

    carts[userKey] = cart;
    saveCart();
    renderCart();
    renderDashboardStats();
    showToast(`${product.name} added to your cart.`);
}

function changeCartQuantity(productId, change) {
    const cart = currentCart();
    const item = cart.find(entry => String(entry.productId) === String(productId));
    const product = products.find(entry => String(entry.id) === String(productId));

    if (!item || !product) return;

    const next = Number(item.quantity) + change;

    if (next <= 0) {
        carts[userKey] = cart.filter(entry => String(entry.productId) !== String(productId));
    } else if (next > Number(product.stock)) {
        showToast("Quantity cannot exceed available stock.");
        return;
    } else {
        item.quantity = next;
        carts[userKey] = cart;
    }

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    carts[userKey] = currentCart().filter(item => String(item.productId) !== String(productId));
    saveCart();
    renderCart();
    showToast("Item removed from cart.");
}

function toggleWishlist(productId) {
    const id = String(productId);
    const wishlist = currentWishlist();

    if (wishlist.includes(id)) {
        wishlists[userKey] = wishlist.filter(item => item !== id);
        showToast("Removed from wishlist.");
    } else {
        wishlist.push(id);
        wishlists[userKey] = wishlist;
        showToast("Added to wishlist.");
    }

    saveWishlist();
    renderWishlist();
    renderAllProducts();
    renderFeaturedProducts();
    renderDashboardStats();
}

function moveWishlistToCart(productId) {
    addToCart(productId);

    const wishlist = currentWishlist();
    wishlists[userKey] = wishlist.filter(id => id !== String(productId));
    saveWishlist();
    renderWishlist();
    renderAllProducts();
    renderFeaturedProducts();
    renderDashboardStats();
}

function checkout() {
    const details = getCartDetails();

    if (details.length === 0) {
        showToast("Your cart is empty.");
        return;
    }

    for (const item of details) {
        if (item.quantity > Number(item.product.stock)) {
            showToast(`Not enough stock for ${item.product.name}.`);
            return;
        }
    }

    const total = details.reduce((sum, item) => sum + item.subtotal, 0);
    const confirmed = window.confirm(`Confirm checkout for ${money(total)}?`);

    if (!confirmed) return;

    details.forEach(item => {
        const product = products.find(entry => String(entry.id) === String(item.product.id));
        if (product) product.stock = Math.max(0, Number(product.stock) - item.quantity);
    });

    const order = {
        id: createId("ORD-"),
        orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
        customerKey: userKey,
        userId: activeUser.id || "",
        customerName: fullName(activeUser),
        customerEmail: activeUser.email || "",
        date: new Date().toISOString(),
        items: details.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            category: item.product.category,
            price: Number(item.product.price),
            quantity: item.quantity
        })),
        total: Number(total.toFixed(2)),
        status: "Pending"
    };

    allOrders.push(order);
    saveOrders();
    saveProducts();

    carts[userKey] = [];
    saveCart();

    renderEverything();
    navigateTo("customerOrders");
    showToast(`Order ${order.orderNumber} placed successfully.`);
}

function openProductModal(productId = null) {
    if (!isSeller) return;

    const form = document.getElementById("productForm");
    form.reset();

    const product = productId
        ? products.find(item => String(item.id) === String(productId))
        : null;

    setText("productModalTitle", product ? "Edit Product" : "Add Product");
    document.getElementById("editProductId").value = product?.id || "";
    document.getElementById("inputProductName").value = product?.name || "";
    document.getElementById("inputProductPrice").value = product?.price ?? "";
    document.getElementById("inputProductCategory").value = product?.category || "";
    document.getElementById("inputProductStock").value = product?.stock ?? "";
    document.getElementById("inputProductIcon").value = product?.icon || "";

    document.getElementById("productModal").classList.remove("hidden");
    document.getElementById("inputProductName").focus();
}

function closeProductModal() {
    document.getElementById("productModal").classList.add("hidden");
}

function saveProduct(event) {
    event.preventDefault();
    if (!isSeller) return;

    const editId = document.getElementById("editProductId").value;
    const name = document.getElementById("inputProductName").value.trim();
    const price = Number(document.getElementById("inputProductPrice").value);
    const category = document.getElementById("inputProductCategory").value.trim();
    const stock = Number(document.getElementById("inputProductStock").value);
    const icon = document.getElementById("inputProductIcon").value.trim() || "📦";

    if (!name || !category || !Number.isFinite(price) || price <= 0 ||
        !Number.isInteger(stock) || stock < 0) {
        showToast("Please enter valid product details.");
        return;
    }

    const duplicate = products.some(product =>
        product.name.toLowerCase() === name.toLowerCase() &&
        String(product.id) !== String(editId)
    );

    if (duplicate) {
        showToast("A product with that name already exists.");
        return;
    }

    if (editId) {
        const index = products.findIndex(product => String(product.id) === String(editId));
        if (index === -1) return showToast("Product could not be found.");

        products[index] = {
            ...products[index],
            name,
            price: Number(price.toFixed(2)),
            category,
            stock,
            icon
        };

        showToast("Product updated successfully.");
    } else {
        products.push({
            id: createId("P-"),
            name,
            price: Number(price.toFixed(2)),
            category,
            stock,
            icon
        });

        showToast("Product added successfully.");
    }

    saveProducts();
    closeProductModal();
    renderEverything();
}

function deleteProduct(productId) {
    if (!isSeller) return;

    const product = products.find(item => String(item.id) === String(productId));
    if (!product) return;

    const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
    if (!confirmed) return;

    products = products.filter(item => String(item.id) !== String(productId));

    Object.keys(carts).forEach(key => {
        if (Array.isArray(carts[key])) {
            carts[key] = carts[key].filter(item => String(item.productId) !== String(productId));
        }
    });

    Object.keys(wishlists).forEach(key => {
        if (Array.isArray(wishlists[key])) {
            wishlists[key] = wishlists[key].filter(id => String(id) !== String(productId));
        }
    });

    saveProducts();
    saveCart();
    saveWishlist();
    renderEverything();
    showToast("Product deleted.");
}

function updateOrderStatus(orderNumber, status) {
    if (!isSeller) return;

    const allowed = ["Pending", "Processing", "Completed", "Cancelled"];
    if (!allowed.includes(status)) return showToast("Invalid order status.");

    const order = allOrders.find(item =>
        String(item.orderNumber || item.id) === String(orderNumber)
    );

    if (!order) return showToast("Order not found.");

    if (normalizedStatus(orderStatus(order)) === "cancelled" && status !== "Cancelled") {
        showToast("Cancelled orders cannot be reopened in this demo.");
        renderSellerOrders();
        return;
    }

    order.status = status;
    saveOrders();
    renderSellerOrders();
    renderCustomerOrders();
    renderReports();
    renderDashboardStats();
    showToast(`Order status updated to ${status}.`);
}

function saveProfile(event) {
    event.preventDefault();

    const name = document.getElementById("profileName").value.trim();
    const username = document.getElementById("profileUsername").value.trim();
    const email = document.getElementById("profileEmail").value.trim();
    const contact = document.getElementById("profileContact").value.trim();
    const storeName = document.getElementById("profileStore").value.trim();
    const storeContact = document.getElementById("profileStoreContact").value.trim();

    if (!name || !username || !email) {
        showToast("Name, username, and email are required.");
        return;
    }

    const users = getAllUsers();
    const duplicate = users.some(user =>
        String(user.id || "") !== String(activeUser.id || "") &&
        (
            String(user.username || "").toLowerCase() === username.toLowerCase() ||
            String(user.email || "").toLowerCase() === email.toLowerCase()
        )
    );

    if (duplicate) {
        showToast("That username or email is already registered.");
        return;
    }

    activeUser = {
        ...activeUser,
        name,
        username,
        email,
        contact,
        phone: contact
    };

    if (isSeller) {
        activeUser.storeName = storeName || `${name}'s Store`;
        activeUser.storeContact = storeContact || contact || email;
    }

    const userIndex = users.findIndex(user =>
        String(user.id || "") === String(activeUser.id || "") ||
        (
            String(user.email || "").toLowerCase() === String(activeUser.email || "").toLowerCase()
        )
    );

    if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...activeUser };
    } else {
        users.push({ ...activeUser });
    }

    writeStorage(STORAGE.users, users);
    saveActiveUser();

    const remembered = readStorage("myStoreRememberedUser", null);
    if (remembered && typeof remembered === "object") {
        remembered.username = username;
        remembered.email = email;
        writeStorage("myStoreRememberedUser", remembered);
    }

    updateUserInterface();
    renderProfile();
    showToast("Profile saved successfully.");
}

function logout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    localStorage.removeItem(STORAGE.activeUser);
    window.location.replace("index.html");
}

function openSidebar() {
    document.getElementById("sidebar")?.classList.add("open");
    document.getElementById("sidebarOverlay")?.classList.add("show");
}

function closeSidebar() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebarOverlay")?.classList.remove("show");
}

document.addEventListener("click", event => {
    const nav = event.target.closest("[data-page]");
    if (nav) {
        navigateTo(nav.dataset.page);
        return;
    }

    const goButton = event.target.closest("[data-go]");
    if (goButton) {
        navigateTo(goButton.dataset.go);
        return;
    }

    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.action;
    const id = actionElement.dataset.id;

    switch (action) {
        case "add-cart":
            addToCart(id);
            break;

        case "wishlist":
            toggleWishlist(id);
            break;

        case "wishlist-cart":
            moveWishlistToCart(id);
            break;

        case "increase":
            changeCartQuantity(id, 1);
            break;

        case "decrease":
            changeCartQuantity(id, -1);
            break;

        case "remove-cart":
            removeFromCart(id);
            break;

        case "edit":
            openProductModal(id);
            break;

        case "delete":
            deleteProduct(id);
            break;

        case "category": {
            const filter = document.getElementById("productCategoryFilter");
            if (filter) filter.value = actionElement.dataset.category;

            const search = document.getElementById("productSearch");
            if (search) search.value = "";

            renderAllProducts();
            navigateTo("products");
            break;
        }
    }
});

document.addEventListener("change", event => {
    const element = event.target;

    if (element.matches('[data-action="order-status"]')) {
        updateOrderStatus(element.dataset.id, element.value);
    }
});

document.getElementById("productSearch")?.addEventListener("input", renderAllProducts);
document.getElementById("productCategoryFilter")?.addEventListener("change", renderAllProducts);
document.getElementById("productSort")?.addEventListener("change", renderAllProducts);
document.getElementById("sellerProductSearch")?.addEventListener("input", renderSellerProducts);

document.getElementById("checkoutButton")?.addEventListener("click", checkout);
document.getElementById("newProductButton")?.addEventListener("click", () => openProductModal());
document.getElementById("productForm")?.addEventListener("submit", saveProduct);
document.getElementById("closeProductModal")?.addEventListener("click", closeProductModal);
document.getElementById("cancelProductModal")?.addEventListener("click", closeProductModal);
document.getElementById("productModal")?.addEventListener("click", event => {
    if (event.target.id === "productModal") closeProductModal();
});

document.getElementById("profileForm")?.addEventListener("submit", saveProfile);
document.getElementById("logoutButton")?.addEventListener("click", logout);
document.getElementById("settingsLogout")?.addEventListener("click", logout);

document.getElementById("menuToggle")?.addEventListener("click", openSidebar);
document.getElementById("closeMenu")?.addEventListener("click", closeSidebar);
document.getElementById("sidebarOverlay")?.addEventListener("click", closeSidebar);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeProductModal();
        closeSidebar();
    }
});

renderEverything();
navigateTo("home");
