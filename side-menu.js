const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleBtn");

if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
    });
}

const menuLinks = document.querySelectorAll(".menu-link");
const pageSections = document.querySelectorAll(".page-section");

menuLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
        event.preventDefault();

        const sectionName = this.getAttribute("data-section");

        menuLinks.forEach(function (item) {
            item.classList.remove("active");
        });

        this.classList.add("active");

        pageSections.forEach(function (section) {
            section.classList.remove("active-section");
        });

        const selectedSection = document.getElementById(sectionName);

        if (selectedSection) {
            selectedSection.classList.add("active-section");
        }

        if (window.innerWidth <= 900 && sidebar) {
            sidebar.classList.remove("open");
        }
    });
});

let cart = [];

const addCartButtons = document.querySelectorAll(".add-cart");

addCartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const productName = this.getAttribute("data-product");
        const productPrice = Number(this.getAttribute("data-price"));

        const existingProduct = cart.find(function (item) {
            return item.name === productName;
        });

        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.push({
                name: productName,
                price: productPrice,
                quantity: 1
            });
        }

        updateCart();
        alert(productName + " has been added to your cart.");
    });
});

function updateCart() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");

    if (!cartItems || !cartCount || !cartTotal) {
        return;
    }

    let totalQuantity = 0;
    let totalPrice = 0;

    cart.forEach(function (item) {
        totalQuantity += item.quantity;
        totalPrice += item.price * item.quantity;
    });

    cartCount.textContent = totalQuantity;
    cartTotal.textContent = "₱" + totalPrice.toLocaleString();

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-cart-shopping"></i>
                <h2>Your cart is empty</h2>
                <p>Add products from the Products section.</p>
            </div>
        `;
        return;
    }

    cartItems.innerHTML = "";

    cart.forEach(function (item, index) {
        const itemTotal = item.price * item.quantity;
        const cartItem = document.createElement("div");

        cartItem.className = "order-card";

        cartItem.innerHTML = `
            <div>
                <h3>${item.name}</h3>
                <p>Price: ₱${item.price.toLocaleString()}</p>
                <p>Quantity: ${item.quantity}</p>
            </div>

            <div>
                <strong>₱${itemTotal.toLocaleString()}</strong>

                <button class="btn remove-cart" data-index="${index}">
                    <i class="fas fa-trash"></i>
                    Remove
                </button>
            </div>
        `;

        cartItems.appendChild(cartItem);
    });

    const removeButtons = document.querySelectorAll(".remove-cart");

    removeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const index = Number(this.getAttribute("data-index"));

            cart.splice(index, 1);
            updateCart();
        });
    });
}

const moveCartButtons = document.querySelectorAll(".move-cart");

moveCartButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const card = this.closest(".wishlist-card");
        const productName = card.querySelector("h3").textContent;
        const productPriceText = card.querySelector("strong").textContent;

        const productPrice = Number(
            productPriceText.replace("₱", "").replace(/,/g, "")
        );

        const existingProduct = cart.find(function (item) {
            return item.name === productName;
        });

        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.push({
                name: productName,
                price: productPrice,
                quantity: 1
            });
        }

        updateCart();
        alert(productName + " has been moved to your cart.");
    });
});

const checkoutBtn = document.getElementById("checkoutBtn");

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
        if (cart.length === 0) {
            alert("Your cart is empty. Please add a product first.");
            return;
        }

        let total = 0;

        cart.forEach(function (item) {
            total += item.price * item.quantity;
        });

        const confirmCheckout = confirm(
            "Proceed to checkout?\n\nTotal: ₱" + total.toLocaleString()
        );

        if (confirmCheckout) {
            alert("Checkout successful!\n\nThank you for shopping at My Store.");

            cart = [];
            updateCart();
        }
    });
}

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        const confirmLogout = confirm("Are you sure you want to logout?");

        if (confirmLogout) {
            window.location.href = "index.html";
        }
    });
}

const settingButtons = document.querySelectorAll(".setting-card .btn");

settingButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        alert("This settings option is ready for implementation.");
    });
});

updateCart();