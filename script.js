
document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginBox = document.getElementById("loginBox");
    const signupBox = document.getElementById("signupBox");

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const accountRole = document.getElementById("accountRole");
    const rememberMe = document.getElementById("rememberMe");
    const togglePassword = document.getElementById("togglePassword");

    const userError = document.getElementById("userError");
    const passError = document.getElementById("passError");

    const showSignup = document.getElementById("showSignup");
    const showLogin = document.getElementById("showLogin");
    const forgotPassword = document.getElementById("forgotPassword");

    const USERS_KEY = "myStoreUsers";
    const REMEMBER_KEY = "myStoreRememberedUser";
    const ACTIVE_USER_KEY = "activeStoreUser";

    function getUsers() {
        try {
            const savedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

            const demoUsers = [
                {
                    username: "user",
                    email: "user@example.com",
                    password: "user123",
                    role: "customer"
                },
                {
                    username: "seller",
                    email: "seller@example.com",
                    password: "seller123",
                    role: "seller"
                }
            ];

            demoUsers.forEach(function (demoUser) {
                const exists = savedUsers.some(function (user) {
                    return user.username.toLowerCase() === demoUser.username ||
                        user.email.toLowerCase() === demoUser.email;
                });

                if (!exists) {
                    savedUsers.push(demoUser);
                }
            });

            localStorage.setItem(USERS_KEY, JSON.stringify(savedUsers));
            return savedUsers;
        } catch (error) {
            console.error("Unable to load accounts:", error);
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function clearErrors() {
        userError.textContent = "";
        passError.textContent = "";
    }

    function displayLogin() {
        loginBox.hidden = false;
        signupBox.hidden = true;
    }

    function displaySignup() {
        loginBox.hidden = true;
        signupBox.hidden = false;
    }

    function loadRememberedUser() {
        const remembered = localStorage.getItem(REMEMBER_KEY);

        if (remembered) {
            try {
                const data = JSON.parse(remembered);
                usernameInput.value = data.username || "";
                accountRole.value = data.role || "customer";
                rememberMe.checked = true;
            } catch (error) {
                localStorage.removeItem(REMEMBER_KEY);
            }
        }
    }

    togglePassword.addEventListener("click", function () {
        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";
        togglePassword.textContent = isPassword ? "Hide" : "Show";
    });

    showSignup.addEventListener("click", function (event) {
        event.preventDefault();
        displaySignup();
    });

    showLogin.addEventListener("click", function (event) {
        event.preventDefault();
        displayLogin();
    });

    forgotPassword.addEventListener("click", function (event) {
        event.preventDefault();

        const emailOrUsername = usernameInput.value.trim();

        if (!emailOrUsername) {
            alert("Enter your username or email first.");
            usernameInput.focus();
            return;
        }

        const users = getUsers();
        const user = users.find(function (item) {
            return item.username.toLowerCase() === emailOrUsername.toLowerCase() ||
                item.email.toLowerCase() === emailOrUsername.toLowerCase();
        });

        if (user) {
            alert("This is a demo website. Password recovery by email is not configured. Please use your registered password.");
        } else {
            alert("No account was found with that username or email.");
        }
    });

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearErrors();

        const enteredUsername = usernameInput.value.trim().toLowerCase();
        const enteredPassword = passwordInput.value;
        const selectedRole = accountRole.value;

        if (!enteredUsername) {
            userError.textContent = "Please enter your username or email.";
            return;
        }

        if (!enteredPassword) {
            passError.textContent = "Please enter your password.";
            return;
        }

        const users = getUsers();

        const matchedUser = users.find(function (user) {
            const usernameMatches =
                user.username.toLowerCase() === enteredUsername ||
                user.email.toLowerCase() === enteredUsername;

            return usernameMatches &&
                user.password === enteredPassword &&
                user.role === selectedRole;
        });

        if (!matchedUser) {
            passError.textContent = "Invalid login details or account type. Please try again.";
            return;
        }

        if (rememberMe.checked) {
            localStorage.setItem(REMEMBER_KEY, JSON.stringify({
                username: matchedUser.email,
                role: matchedUser.role
            }));
        } else {
            localStorage.removeItem(REMEMBER_KEY);
        }

        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify({
            username: matchedUser.username,
            email: matchedUser.email,
            role: matchedUser.role
        }));

        window.location.href = "side-menu.html";
    });

    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const newUsername = document.getElementById("newUsername").value.trim();
        const newEmail = document.getElementById("newEmail").value.trim().toLowerCase();
        const newPassword = document.getElementById("newPassword").value;

        if (newUsername.length < 3) {
            alert("Username must contain at least 3 characters.");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password must contain at least 6 characters.");
            return;
        }

        const users = getUsers();

        const accountExists = users.some(function (user) {
            return user.username.toLowerCase() === newUsername.toLowerCase() ||
                user.email.toLowerCase() === newEmail;
        });

        if (accountExists) {
            alert("That username or email is already registered.");
            return;
        }

        const newUser = {
            username: newUsername,
            email: newEmail,
            password: newPassword,
            role: "customer"
        };

        users.push(newUser);
        saveUsers(users);

        alert("Account created successfully! You can now log in.");

        signupForm.reset();
        usernameInput.value = newEmail;
        accountRole.value = "customer";
        passwordInput.value = "";
        displayLogin();
    });

    getUsers();
    loadRememberedUser();
});
