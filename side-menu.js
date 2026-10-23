
document.addEventListener("DOMContentLoaded", function () {
    let activeUser;

    try {
        activeUser = JSON.parse(localStorage.getItem("activeStoreUser") || "null");
    } catch (error) {
        activeUser = null;
    }

    if (!activeUser) {
        window.location.href = "index.html";
        return;
    }

    const userKey = String(activeUser.username || activeUser.email || "customer")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_");

    const cartKey = "myStoreCart_" + userKey;
    const ordersKey = "myStoreOrders_" + userKey;
    const wishlistKey = "myStoreWishlist_" + userKey;

    const products = [
        {
            name: "Wireless Headphones",
            category: "Accessories",
            price: 1499,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30b?auto=format&fit=crop&w=600&q=80"
        },
        {
            name: "Smartphone",
            category: "Electronics",
            price: 12999,
            image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80"
        },
        {
            name: "Mechanical Keyboard",
            category: "Accessories",
            price: 2499,
            image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"
        },
        {
            name: "Wireless Mouse",
            category: "Accessories",
            price: 799,
            image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80"
        },
        {
            name: "Laptop",
            category: "Electronics",
            price: 35999,
            image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80"
        },
        {
            name: "Gaming Controller",
            category: "Gaming",
            price: 1999,
            image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=600&q=80"
        }
    ];

    function readStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    let cart = readStorage(cartKey);
    let orders = readStorage(ordersKey);
    let wishlist = readStorage(wishlistKey);

    function saveData() {
        localStorage.setItem(cartKey, JSON.stringify(cart));
        localStorage.setItem(ordersKey, JSON.stringify(orders));
        localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
    }

    function money(amount) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2
        }).format(amount);
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function productCard(product, extraClass = "") {
        return `
            <article class="product-card ${extraClass}">
                <div class="product-image">
                    <img src="${product.image}" alt="${escapeHTML(product.name)}" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-category">${escapeHTML(product.category)}</span>
                    <h3>${escapeHTML(product.name)}</h3>
                    <p class="product-price">${money(product.price)}</p>
                    <button class="add-cart" type="button" data-product="${escapeHTML(product.name)}" data-price="${product.price}">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="wishlist-button" type="button" data-wishlist="${escapeHTML(product.name)}">
                        <i class="fas fa-heart"></i> Add to Wishlist
                    </button>
                </div>
            </article>
        `;
    }

    document.getElementById("dashboardProducts").innerHTML =
        products.slice(0, 4).map(function (product) {
            return productCard(product);
        }).join("");

    document.getElementById("allProducts").innerHTML =
        products.map(function (product) {
            return productCard(product);
        }).join("");

    const sectionTitles = {
        home: "Dashboard",
        products: "Products",
        categories: "Categories",
        cart: "My Cart",
        orders: "My Orders",
        wishlist: "Wishlist",
        profile: "My Profile",
        settings: "Settings"
    };

    function showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        document.querySelectorAll(".page-section").forEach(function (item) {
            item.classList.remove("active");
        });

        section.classList.add("active");

        document.querySelectorAll(".menu-link[data-section]").forEach(function (link) {
            link.classList.toggle("active", link.dataset.section === sectionId);
        });

        document.getElementById("pageTitle").textContent =
            sectionTitles[sectionId] || "My Store";

        if (window.innerWidth <= 900) {
            document.body.classList.remove("sidebar-open");
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll(".menu-link[data-section]").forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const sectionId = link.dataset.section;

            if (sectionId === "logout") {
                if (confirm("Are you sure you want to logout?")) {
                    localStorage.removeItem("activeStoreUser");
                    window.location.href = "index.html";
                }
                return;
            }

            showSection(sectionId);
        });
    });

    document.querySelectorAll("[data-go]").forEach(function (button) {
        button.addEventListener("click", function () {
            showSection(button.dataset.go);
        });
    });

    document.getElementById("toggleBtn").addEventListener("click", function () {
        if (window.innerWidth <= 900) {
            document.body.classList.toggle("sidebar-open");
        } else {
            document.body.classList.toggle("sidebar-collapsed");
        }
    });

    document.getElementById("topCartButton").addEventListener("click", function () {
        showSection("cart");
    });

    function updateCartCount() {
        const count = cart.reduce(function (total, item) {
            return total + item.quantity;
        }, 0);

        document.getElementById("cartCount").textContent = count;
        document.getElementById("topCartCount").textContent = count;
    }

    function renderCart() {
        const container = document.getElementById("cartItems");

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add some products to get started.</p>
                </div>
            `;
        } else {
            container.innerHTML = cart.map(function (item) {
                return `
                    <div class="cart-row">
                        <div>
                            <h3>${escapeHTML(item.name)}</h3>
                            <p>${money(item.price)} each</p>
                            <p>Subtotal: ${money(item.price * item.quantity)}</p>
                        </div>
                        <div class="cart-row-actions">
                            <button class="quantity-button" data-cart-action="minus" data-name="${escapeHTML(item.name)}" aria-label="Decrease quantity">−</button>
                            <strong>${item.quantity}</strong>
                            <button class="quantity-button" data-cart-action="plus" data-name="${escapeHTML(item.name)}" aria-label="Increase quantity">+</button>
                            <button class="remove-button" data-cart-action="remove" data-name="${escapeHTML(item.name)}">Remove</button>
                        </div>
                    </div>
                `;
            }).join("");
        }

        const total = cart.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);

        document.getElementById("cartTotal").textContent = money(total);
        updateCartCount();
        saveData();
    }

    function addToCart(name) {
        const product = products.find(function (item) {
            return item.name === name;
        });

        if (!product) return;

        const existing = cart.find(function (item) {
            return item.name === product.name;
        });

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }

        renderCart();
    }

    document.addEventListener("click", function (event) {
        const addButton = event.target.closest(".add-cart");

        if (addButton) {
            addToCart(addButton.dataset.product);
            return;
        }

        const cartAction = event.target.closest("[data-cart-action]");

        if (cartAction) {
            const name = cartAction.dataset.name;
            const action = cartAction.dataset.cartAction;
            const item = cart.find(function (product) {
                return product.name === name;
            });

            if (!item) return;

            if (action === "plus") item.quantity += 1;
            if (action === "minus") item.quantity -= 1;
            if (action === "remove" || item.quantity <= 0) {
                cart = cart.filter(function (product) {
                    return product.name !== name;
                });
            }

            renderCart();
            return;
        }

        const wishlistButton = event.target.closest("[data-wishlist]");

        if (wishlistButton) {
            const name = wishlistButton.dataset.wishlist;
            const exists = wishlist.some(function (item) {
                return item.name === name;
            });

            if (exists) {
                alert("Nasa wishlist mo na ang product na ito.");
            } else {
                const product = products.find(function (item) {
                    return item.name === name;
                });

                if (product) {
                    wishlist.push(product);
                    renderWishlist();
                    alert("Naidagdag sa wishlist!");
                }
            }
        }

        const removeWishlist = event.target.closest("[data-remove-wishlist]");

        if (removeWishlist) {
            wishlist = wishlist.filter(function (item) {
                return item.name !== removeWishlist.dataset.removeWishlist;
            });
            renderWishlist();
        }

        const wishlistAddCart = event.target.closest("[data-wishlist-cart]");

        if (wishlistAddCart) {
            addToCart(wishlistAddCart.dataset.wishlistCart);
        }
    });

    function renderWishlist() {
        const container = document.getElementById("wishlistItems");

        if (wishlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>Your wishlist is empty</h3>
                    <p>Add products to save them for later.</p>
                </div>
            `;
        } else {
            container.innerHTML = wishlist.map(function (item) {
                return `
                    <article class="product-card">
                        <div class="product-image">
                            <img src="${item.image}" alt="${escapeHTML(item.name)}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <span class="product-category">${escapeHTML(item.category)}</span>
                            <h3>${escapeHTML(item.name)}</h3>
                            <p class="product-price">${money(item.price)}</p>
                            <button class="add-cart" type="button" data-product="${escapeHTML(item.name)}" data-price="${item.price}">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                            <button class="wishlist-button" type="button" data-remove-wishlist="${escapeHTML(item.name)}">
                                <i class="fas fa-trash"></i> Remove
                            </button>
                        </div>
                    </article>
                `;
            }).join("");
        }

        saveData();
    }

    function renderOrders() {
        const container = document.getElementById("ordersContainer");

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No orders yet</h3>
                    <p>Your completed checkouts will appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(function (order) {
            const items = order.items.map(function (item) {
                return escapeHTML(item.name) + " × " + item.quantity;
            }).join(", ");

            return `
                <div class="order-card">
                    <h3>Order #${escapeHTML(order.id)}</h3>
                    <p>${escapeHTML(order.date)}</p>
                    <p>${items}</p>
                    <p><strong>Total: ${money(order.total)}</strong></p>
                    <span class="order-status">${escapeHTML(order.status)}</span>
                </div>
            `;
        }).join("");
    }

    document.getElementById("checkoutBtn").addEventListener("click", function () {
        if (cart.length === 0) {
            alert("Your cart is empty. Please add products first.");
            return;
        }

        const total = cart.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);

        if (!confirm("Confirm your order with a total of " + money(total) + "?")) {
            return;
        }

        orders.unshift({
            id: Date.now().toString().slice(-8),
            date: new Date().toLocaleString(),
            items: cart.map(function (item) {
                return {
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                };
            }),
            total: total,
            status: "Order Placed"
        });

        cart = [];
        saveData();
        renderCart();
        renderOrders();
        showSection("orders");
        alert("Order placed successfully!");
    });

    const categoryProducts = document.getElementById("categoryProducts");
    const categoryProductGrid = document.getElementById("categoryProductGrid");
    const selectedCategoryTitle = document.getElementById("selectedCategoryTitle");
    const categoryResultsCount = document.getElementById("categoryResultsCount");
    const categoryList = document.getElementById("categoryList");

    function showCategory(category) {
        const filtered = products.filter(function (product) {
            return product.category === category;
        });

        selectedCategoryTitle.textContent = category;
        categoryResultsCount.textContent = filtered.length +
            (filtered.length === 1 ? " product available" : " products available");

        categoryProductGrid.innerHTML = filtered.map(function (product) {
            return productCard(product, "category-product-card");
        }).join("");

        categoryProducts.hidden = false;

        categoryList.querySelectorAll(".category-card").forEach(function (card) {
            card.classList.toggle("selected", card.dataset.category === category);
        });

        categoryProducts.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    categoryList.querySelectorAll(".category-card").forEach(function (card) {
        card.addEventListener("click", function () {
            showCategory(card.dataset.category);
        });
    });

    document.getElementById("backToCategories").addEventListener("click", function () {
        categoryProducts.hidden = true;

        categoryList.querySelectorAll(".category-card").forEach(function (card) {
            card.classList.remove("selected");
        });

        categoryList.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    function getUserValue() {
        return activeUser.username || activeUser.email || "My Account";
    }

    const username = getUserValue();
    const role = activeUser.role || "customer";
    const email = activeUser.email || "-";
    const fullName = activeUser.fullname || activeUser.name || username;

    document.getElementById("sidebarUsername").textContent = username;
    document.getElementById("sidebarRole").textContent = role;
    document.getElementById("customerName").textContent = fullName;
    document.getElementById("customerUsername").textContent = username;
    document.getElementById("customerEmail").textContent = email;
    document.getElementById("customerRole").textContent = role;

    renderCart();
    renderWishlist();
    renderOrders();
});
