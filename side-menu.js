
document.addEventListener("DOMContentLoaded", () => {
    const activeUser = JSON.parse(localStorage.getItem("activeStoreUser") || "null");

    if (!activeUser) {
        window.location.href = "index.html";
        return;
    }

    const role = String(activeUser.role || "customer").toLowerCase();
    const isSeller = role === "seller";
    const userKey = String(activeUser.email || activeUser.username || "guest")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");

    const keys = {
        products: "myStoreProducts",
        orders: "myStoreOrders",
        cart: `myStoreCart_${userKey}`,
        wishlist: `myStoreWishlist_${userKey}`
    };

    const defaultProducts = [
        {
            id: "p1",
            name: "Wireless Headphones",
            category: "Accessories",
            price: 1499,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"
        },
        {
            id: "p2",
            name: "Smartphone",
            category: "Electronics",
            price: 12999,
            image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80"
        },
        {
            id: "p3",
            name: "Mechanical Keyboard",
            category: "Accessories",
            price: 2499,
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80"
        },
        {
            id: "p4",
            name: "Wireless Mouse",
            category: "Accessories",
            price: 799,
            image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=700&q=80"
        },
        {
            id: "p5",
            name: "Laptop",
            category: "Electronics",
            price: 35999,
            image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80"
        },
        {
            id: "p6",
            name: "Gaming Controller",
            category: "Gaming",
            price: 1999,
            image: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=700&q=80"
        }
    ];

    function readStorage(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value === null ? fallback : value;
        } catch {
            return fallback;
        }
    }

    function saveStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    let products = readStorage(keys.products, null);

    if (!Array.isArray(products)) {
        products = defaultProducts;
        saveStorage(keys.products, products);
    }

    let cart = readStorage(keys.cart, []);
    let wishlist = readStorage(keys.wishlist, []);
    let orders = readStorage(keys.orders, []);

    if (!Array.isArray(cart)) cart = [];
    if (!Array.isArray(wishlist)) wishlist = [];
    if (!Array.isArray(orders)) orders = [];

    function getAllOrders() {
        const all = readStorage("myStoreAllOrders", []);
        return Array.isArray(all) ? all : [];
    }

    function saveAllOrders(all) {
        saveStorage("myStoreAllOrders", all);
    }

    function money(value) {
        return Number(value || 0).toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP"
        });
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function safeImageURL(value) {
        try {
            const url = new URL(String(value || ""));
            return ["http:", "https:"].includes(url.protocol) ? url.href : "";
        } catch {
            return "";
        }
    }

    function imageMarkup(product) {
        const url = safeImageURL(product.image);

        if (!url) {
            return `<div class="product-placeholder"><i class="fa-solid fa-box"></i></div>`;
        }

        return `
            <img
                class="product-image"
                src="${escapeHTML(url)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"
            >
            <div class="product-placeholder" style="display:none">
                <i class="fa-solid fa-box"></i>
            </div>
        `;
    }

    function findProduct(productId) {
        return products.find(product => String(product.id) === String(productId));
    }

    function getCartCount() {
        return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }

    function getCartTotal() {
        return cart.reduce((sum, item) => {
            const product = findProduct(item.id);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    function getUserOrders() {
        return getAllOrders().filter(order =>
            String(order.customerKey) === userKey
        );
    }

    function getTotalSales() {
        return getAllOrders()
            .filter(order => order.status !== "Cancelled")
            .reduce((sum, order) => sum + Number(order.total || 0), 0);
    }

    function productCard(product) {
        const saved = wishlist.includes(String(product.id));

        return `
            <article class="product-card">
                <div class="product-image-wrap">
                    ${imageMarkup(product)}
                </div>
                <div class="product-content">
                    <span class="product-category">${escapeHTML(product.category)}</span>
                    <h3>${escapeHTML(product.name)}</h3>
                    <div class="product-price">${money(product.price)}</div>
                    <div class="product-actions">
                        <button class="primary-btn" data-add-cart="${escapeHTML(product.id)}">
                            <i class="fa-solid fa-cart-plus"></i> Add to Cart
                        </button>
                        <button class="icon-btn ${saved ? "is-saved" : ""}"
                            data-toggle-wishlist="${escapeHTML(product.id)}"
                            aria-label="Toggle wishlist"
                            title="Add to Wishlist">
                            <i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    function showEmpty(container, title, description, icon = "fa-box-open") {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid ${icon}"></i>
                <strong>${escapeHTML(title)}</strong>
                <span>${escapeHTML(description)}</span>
            </div>
        `;
    }

    function renderProducts(container, list) {
        if (!container) return;

        if (!list.length) {
            showEmpty(container, "No products found", "Try another search or category.");
            return;
        }

        container.innerHTML = list.map(productCard).join("");
    }

    function renderDashboardProducts() {
        const container = document.getElementById("dashboardProducts");
        if (!container) return;

        const list = isSeller ? products.slice(0, 3) : products.slice(0, 6);
        renderProducts(container, list);
    }

    function renderAllProducts() {
        const search = document.getElementById("productSearch");
        const filter = document.getElementById("productFilter");

        const query = search ? search.value.trim().toLowerCase() : "";
        const category = filter ? filter.value : "All";

        const list = products.filter(product => {
            const matchesSearch =
                product.name.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query);

            const matchesCategory =
                category === "All" || product.category === category;

            return matchesSearch && matchesCategory;
        });

        renderProducts(document.getElementById("allProducts"), list);
    }

    function renderCategory(category) {
        const results = document.getElementById("categoryResults");
        const title = document.getElementById("categoryTitle");
        const container = document.getElementById("categoryProducts");

        if (!results || !container || !title) return;

        title.textContent = `${category} Products`;
        results.hidden = false;

        renderProducts(
            container,
            products.filter(product => product.category === category)
        );
    }

    function renderCart() {
        const container = document.getElementById("cartItems");
        const total = document.getElementById("cartTotal");
        const count = document.getElementById("cartCount");
        const customerCount = document.getElementById("customerCartCount");

        if (count) count.textContent = getCartCount();
        if (customerCount) customerCount.textContent = getCartCount();
        if (total) total.textContent = money(getCartTotal());

        if (!container) return;

        cart = cart.filter(item => findProduct(item.id));
        saveStorage(keys.cart, cart);

        if (!cart.length) {
            showEmpty(container, "Your cart is empty", "Add some products to get started.", "fa-cart-shopping");
            return;
        }

        container.innerHTML = cart.map(item => {
            const product = findProduct(item.id);
            if (!product) return "";

            return `
                <div class="cart-item">
                    <div>
                        <h3>${escapeHTML(product.name)}</h3>
                        <p>${money(product.price)} each</p>
                        <p>Subtotal: <strong>${money(product.price * item.quantity)}</strong></p>
                    </div>
                    <div class="quantity-control">
                        <button data-quantity="${escapeHTML(product.id)}" data-change="-1" aria-label="Decrease quantity">−</button>
                        <strong>${item.quantity}</strong>
                        <button data-quantity="${escapeHTML(product.id)}" data-change="1" aria-label="Increase quantity">+</button>
                    </div>
                    <button class="remove-btn" data-remove-cart="${escapeHTML(product.id)}">Remove</button>
                </div>
            `;
        }).join("");
    }

    function addToCart(productId) {
        const product = findProduct(productId);
        if (!product) return;

        const item = cart.find(entry => String(entry.id) === String(productId));

        if (item) {
            item.quantity += 1;
        } else {
            cart.push({ id: productId, quantity: 1 });
        }

        saveStorage(keys.cart, cart);
        renderCart();
        renderDashboardStats();
        alert(`${product.name} added to your cart.`);
    }

    function changeQuantity(productId, amount) {
        const item = cart.find(entry => String(entry.id) === String(productId));
        if (!item) return;

        item.quantity += amount;

        if (item.quantity <= 0) {
            cart = cart.filter(entry => String(entry.id) !== String(productId));
        }

        saveStorage(keys.cart, cart);
        renderCart();
        renderDashboardStats();
    }

    function renderWishlist() {
        const container = document.getElementById("wishlistItems");
        if (!container) return;

        const savedProducts = wishlist
            .map(id => findProduct(id))
            .filter(Boolean);

        renderProducts(container, savedProducts);
    }

    function toggleWishlist(productId) {
        const id = String(productId);

        if (!findProduct(id)) return;

        if (wishlist.includes(id)) {
            wishlist = wishlist.filter(item => item !== id);
        } else {
            wishlist.push(id);
        }

        saveStorage(keys.wishlist, wishlist);
        renderWishlist();
        renderDashboardProducts();
        renderAllProducts();
        renderDashboardStats();

        const categoryTitle = document.getElementById("categoryTitle");
        if (categoryTitle && !document.getElementById("categoryResults").hidden) {
            renderCategory(categoryTitle.textContent.replace(" Products", ""));
        }
    }

    function renderCustomerOrders() {
        const container = document.getElementById("ordersContainer");
        if (!container) return;

        orders = getUserOrders();

        if (!orders.length) {
            showEmpty(container, "No orders yet", "Your purchases will appear here.", "fa-receipt");
            return;
        }

        container.innerHTML = [...orders].reverse().map(order => `
            <article class="order-card">
                <div class="order-top">
                    <div>
                        <h3>Order #${escapeHTML(order.id)}</h3>
                        <p>${escapeHTML(order.date)}</p>
                    </div>
                    <span class="status-badge ${order.status === "Completed" ? "completed" : order.status === "Cancelled" ? "cancelled" : ""}">
                        ${escapeHTML(order.status)}
                    </span>
                </div>
                <p>${order.items.map(item =>
                    `${escapeHTML(item.name)} × ${Number(item.quantity)}`
                ).join(", ")}</p>
                <p>Total: <strong>${money(order.total)}</strong></p>
            </article>
        `).join("");
    }

    function checkout() {
        if (!cart.length) {
            alert("Your cart is empty.");
            return;
        }

        const items = cart.map(item => {
            const product = findProduct(item.id);
            return product ? {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            } : null;
        }).filter(Boolean);

        if (!items.length) {
            alert("Your cart no longer contains available products.");
            return;
        }

        const total = items.reduce((sum, item) =>
            sum + item.price * item.quantity, 0
        );

        const allOrders = getAllOrders();

        const order = {
            id: `ORD-${Date.now().toString().slice(-8)}`,
            customerKey: userKey,
            customerName: String(activeUser.name || activeUser.username || "Customer"),
            customerEmail: String(activeUser.email || ""),
            items,
            total,
            status: "Pending",
            date: new Date().toLocaleString("en-PH")
        };

        allOrders.push(order);
        saveAllOrders(allOrders);

        cart = [];
        saveStorage(keys.cart, cart);

        renderCart();
        renderCustomerOrders();
        renderSellerOrders();
        renderReports();
        renderDashboardStats();

        alert("Your order has been placed successfully!");
        showSection("orders");
    }

    function renderSellerProducts() {
        const tbody = document.getElementById("sellerProductTable");
        if (!tbody) return;

        if (!products.length) {
            tbody.innerHTML = `<tr><td colspan="4">No products available.</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <div class="table-product">
                        ${safeImageURL(product.image)
                            ? `<img src="${escapeHTML(safeImageURL(product.image))}" alt="">`
                            : `<div class="product-placeholder" style="width:42px;height:42px;font-size:18px"><i class="fa-solid fa-box"></i></div>`
                        }
                        <strong>${escapeHTML(product.name)}</strong>
                    </div>
                </td>
                <td>${escapeHTML(product.category)}</td>
                <td>${money(product.price)}</td>
                <td>
                    <div class="table-actions">
                        <button class="edit-btn" data-edit-product="${escapeHTML(product.id)}">Edit</button>
                        <button class="delete-btn" data-delete-product="${escapeHTML(product.id)}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    function resetProductForm() {
        document.getElementById("productForm").reset();
        document.getElementById("editProductId").value = "";
        document.getElementById("saveProductBtn").textContent = "Add Product";
        document.getElementById("cancelProductEdit").hidden = true;
    }

    function saveProduct(event) {
        event.preventDefault();

        const id = document.getElementById("editProductId").value;
        const name = document.getElementById("sellerProductName").value.trim();
        const category = document.getElementById("sellerProductCategory").value;
        const price = Number(document.getElementById("sellerProductPrice").value);
        const image = safeImageURL(document.getElementById("sellerProductImage").value);

        if (!name || !Number.isFinite(price) || price <= 0) {
            alert("Enter a valid product name and price.");
            return;
        }

        if (id) {
            const product = findProduct(id);
            if (!product) {
                alert("This product could not be found.");
                resetProductForm();
                return;
            }

            product.name = name;
            product.category = category;
            product.price = price;
            product.image = image;
        } else {
            products.push({
                id: `p${Date.now()}`,
                name,
                category,
                price,
                image
            });
        }

        saveStorage(keys.products, products);

        resetProductForm();
        renderEverything();
        alert(id ? "Product updated successfully." : "Product added successfully.");
    }

    function editProduct(productId) {
        const product = findProduct(productId);
        if (!product) return;

        document.getElementById("editProductId").value = product.id;
        document.getElementById("sellerProductName").value = product.name;
        document.getElementById("sellerProductCategory").value = product.category;
        document.getElementById("sellerProductPrice").value = product.price;
        document.getElementById("sellerProductImage").value = safeImageURL(product.image);
        document.getElementById("saveProductBtn").textContent = "Save Changes";
        document.getElementById("cancelProductEdit").hidden = false;

        document.getElementById("productForm").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function deleteProduct(productId) {
        const product = findProduct(productId);
        if (!product) return;

        if (!confirm(`Delete "${product.name}" from the store?`)) return;

        products = products.filter(item => String(item.id) !== String(productId));
        cart = cart.filter(item => String(item.id) !== String(productId));
        wishlist = wishlist.filter(id => String(id) !== String(productId));

        saveStorage(keys.products, products);
        saveStorage(keys.cart, cart);
        saveStorage(keys.wishlist, wishlist);

        resetProductForm();
        renderEverything();
    }

    function renderSellerOrders() {
        const tbody = document.getElementById("sellerOrdersTable");
        if (!tbody) return;

        const allOrders = getAllOrders();

        if (!allOrders.length) {
            tbody.innerHTML = `<tr><td colspan="6">No customer orders yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = [...allOrders].reverse().map(order => `
            <tr>
                <td><strong>${escapeHTML(order.id)}</strong></td>
                <td>${escapeHTML(order.customerName || "Customer")}</td>
                <td>${order.items.map(item =>
                    `${escapeHTML(item.name)} × ${Number(item.quantity)}`
                ).join(", ")}</td>
                <td>${money(order.total)}</td>
                <td><span class="status-badge ${order.status === "Completed" ? "completed" : order.status === "Cancelled" ? "cancelled" : ""}">${escapeHTML(order.status)}</span></td>
                <td>
                    <select data-order-status="${escapeHTML(order.id)}" aria-label="Update order status">
                        ${["Pending", "Processing", "Completed", "Cancelled"].map(status =>
                            `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`
                        ).join("")}
                    </select>
                </td>
            </tr>
        `).join("");
    }

    function updateOrderStatus(orderId, status) {
        const validStatuses = ["Pending", "Processing", "Completed", "Cancelled"];
        if (!validStatuses.includes(status)) return;

        const allOrders = getAllOrders();
        const order = allOrders.find(item => String(item.id) === String(orderId));

        if (!order) return;

        order.status = status;
        saveAllOrders(allOrders);

        renderSellerOrders();
        renderCustomerOrders();
        renderReports();
        renderDashboardStats();
    }

    function renderReports() {
        const allOrders = getAllOrders();
        const sales = getTotalSales();

        const reportOrders = document.getElementById("reportOrders");
        const reportSales = document.getElementById("reportSales");
        const tbody = document.getElementById("reportsTable");

        if (reportOrders) reportOrders.textContent = allOrders.length;
        if (reportSales) reportSales.textContent = money(sales);

        if (tbody) {
            if (!allOrders.length) {
                tbody.innerHTML = `<tr><td colspan="5">No sales or orders to display.</td></tr>`;
            } else {
                tbody.innerHTML = [...allOrders].reverse().map(order => `
                    <tr>
                        <td>${escapeHTML(order.id)}</td>
                        <td>${escapeHTML(order.customerName || "Customer")}</td>
                        <td>${escapeHTML(order.date)}</td>
                        <td>${money(order.total)}</td>
                        <td>${escapeHTML(order.status)}</td>
                    </tr>
                `).join("");
            }
        }
    }

    function renderDashboardStats() {
        const userOrders = getUserOrders();
        const allOrders = getAllOrders();

        const elements = {
            customerProducts: document.getElementById("customerProductCount"),
            customerCart: document.getElementById("customerCartCount"),
            customerOrders: document.getElementById("customerOrderCount"),
            sellerProducts: document.getElementById("sellerProductCount"),
            sellerOrders: document.getElementById("sellerOrderCount"),
            sellerSales: document.getElementById("sellerSales")
        };

        if (elements.customerProducts) elements.customerProducts.textContent = products.length;
        if (elements.customerCart) elements.customerCart.textContent = getCartCount();
        if (elements.customerOrders) elements.customerOrders.textContent = userOrders.length;
        if (elements.sellerProducts) elements.sellerProducts.textContent = products.length;
        if (elements.sellerOrders) elements.sellerOrders.textContent = allOrders.length;
        if (elements.sellerSales) elements.sellerSales.textContent = money(getTotalSales());
    }

    function fillProfile() {
        const name = String(activeUser.name || activeUser.fullName || activeUser.username || "User");
        const username = String(activeUser.username || "");
        const email = String(activeUser.email || "");

        document.getElementById("sidebarName").textContent = name;
        document.getElementById("sidebarRole").textContent = isSeller ? "Seller" : "Customer";
        document.getElementById("welcomeName").textContent = name;
        document.getElementById("topRole").textContent = isSeller ? "Seller" : "Customer";
        document.getElementById("settingsUsername").textContent = username || email || name;

        document.getElementById("profileName").value = name;
        document.getElementById("profileUsername").value = username;
        document.getElementById("profileEmail").value = email;
        document.getElementById("profileRole").value = isSeller ? "Seller" : "Customer";

        document.getElementById("currentDate").textContent =
            new Date().toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });

        document.getElementById("bannerEyebrow").textContent =
            isSeller ? "SELLER CENTER" : "MY STORE";

        document.getElementById("bannerTitle").textContent =
            isSeller ? "Manage your store with ease." : "Find your next favorite item.";

        document.getElementById("bannerText").textContent =
            isSeller
                ? "Manage products, review orders, and monitor your store's sales."
                : "Explore our products, save your favorites, and shop with ease.";

        document.getElementById("featuredHeading").textContent =
            isSeller ? "Your Products" : "Featured Products";

        document.getElementById("featuredDescription").textContent =
            isSeller ? "A quick look at your current inventory." : "Discover products you might like.";

        document.querySelectorAll(".customer-only").forEach(element => {
            element.hidden = isSeller;
        });

        document.querySelectorAll(".seller-only").forEach(element => {
            element.hidden = !isSeller;
        });

        document.getElementById("sidebarNav").querySelectorAll("[data-section]").forEach(link => {
            const section = link.dataset.section;

            if (isSeller && ["products", "categories", "cart", "orders", "wishlist"].includes(section)) {
                link.hidden = true;
            }

            if (!isSeller && ["manage-products", "manage-orders", "reports"].includes(section)) {
                link.hidden = true;
            }
        });
    }

    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        if (isSeller && ["products", "categories", "cart", "orders", "wishlist"].includes(sectionId)) {
            return;
        }

        if (!isSeller && ["manage-products", "manage-orders", "reports"].includes(sectionId)) {
            return;
        }

        document.querySelectorAll(".page-section").forEach(item => {
            item.classList.toggle("active", item.id === sectionId);
        });

        document.querySelectorAll(".menu-link[data-section]").forEach(link => {
            link.classList.toggle("active", link.dataset.section === sectionId);
        });

        document.body.classList.remove("sidebar-open");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function logout() {
        if (!confirm("Are you sure you want to log out?")) return;

        localStorage.removeItem("activeStoreUser");
        window.location.href = "index.html";
    }

    function renderEverything() {
        renderDashboardProducts();
        renderAllProducts();
        renderCart();
        renderWishlist();
        renderCustomerOrders();
        renderSellerProducts();
        renderSellerOrders();
        renderReports();
        renderDashboardStats();
    }

    document.querySelectorAll(".menu-link[data-section]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();

            if (link.id === "logoutButton") {
                logout();
                return;
            }

            showSection(link.dataset.section);
        });
    });

    document.getElementById("logoutButton").addEventListener("click", event => {
        event.preventDefault();
        logout();
    });

    document.getElementById("settingsLogout").addEventListener("click", logout);

    document.getElementById("toggleBtn").addEventListener("click", () => {
        if (window.innerWidth <= 760) {
            document.body.classList.toggle("sidebar-open");
        } else {
            document.body.classList.toggle("sidebar-collapsed");
        }
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", () => showSection(button.dataset.go));
    });

    document.querySelectorAll("[data-category]").forEach(button => {
        button.addEventListener("click", () => renderCategory(button.dataset.category));
    });

    document.getElementById("clearCategory").addEventListener("click", () => {
        document.getElementById("categoryResults").hidden = true;
    });

    document.getElementById("productSearch").addEventListener("input", renderAllProducts);
    document.getElementById("productFilter").addEventListener("change", renderAllProducts);

    document.addEventListener("click", event => {
        const addButton = event.target.closest("[data-add-cart]");
        if (addButton) {
            addToCart(addButton.dataset.addCart);
            return;
        }

        const wishlistButton = event.target.closest("[data-toggle-wishlist]");
        if (wishlistButton) {
            toggleWishlist(wishlistButton.dataset.toggleWishlist);
            return;
        }

        const quantityButton = event.target.closest("[data-quantity]");
        if (quantityButton) {
            changeQuantity(
                quantityButton.dataset.quantity,
                Number(quantityButton.dataset.change)
            );
            return;
        }

        const removeButton = event.target.closest("[data-remove-cart]");
        if (removeButton) {
            cart = cart.filter(item => String(item.id) !== String(removeButton.dataset.removeCart));
            saveStorage(keys.cart, cart);
            renderCart();
            renderDashboardStats();
            return;
        }

        const editButton = event.target.closest("[data-edit-product]");
        if (editButton && isSeller) {
            editProduct(editButton.dataset.editProduct);
            return;
        }

        const deleteButton = event.target.closest("[data-delete-product]");
        if (deleteButton && isSeller) {
            deleteProduct(deleteButton.dataset.deleteProduct);
        }
    });

    document.getElementById("checkoutBtn").addEventListener("click", checkout);
    document.getElementById("productForm").addEventListener("submit", event => {
        if (isSeller) saveProduct(event);
    });

    document.getElementById("cancelProductEdit").addEventListener("click", resetProductForm);

    document.getElementById("sellerOrdersTable").addEventListener("change", event => {
        const select = event.target.closest("[data-order-status]");
        if (select && isSeller) {
            updateOrderStatus(select.dataset.orderStatus, select.value);
        }
    });

    document.getElementById("profileForm").addEventListener("submit", event => {
        event.preventDefault();

        const updatedUser = {
            ...activeUser,
            name: document.getElementById("profileName").value.trim(),
            username: document.getElementById("profileUsername").value.trim(),
            email: document.getElementById("profileEmail").value.trim(),
            role
        };

        if (!updatedUser.name || !updatedUser.username || !updatedUser.email) {
            alert("Please fill in all profile fields.");
            return;
        }

        localStorage.setItem("activeStoreUser", JSON.stringify(updatedUser));

        document.getElementById("sidebarName").textContent = updatedUser.name;
        document.getElementById("welcomeName").textContent = updatedUser.name;
        document.getElementById("settingsUsername").textContent = updatedUser.username;

        alert("Profile updated for this session.");
    });

    fillProfile();
    renderEverything();
});
