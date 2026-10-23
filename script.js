
document.addEventListener("DOMContentLoaded", () => {
    const USERS_KEY = "myStoreUsers";
    const ACTIVE_KEY = "activeStoreUser";
    const REMEMBER_KEY = "myStoreRememberedUser";

    const loginBox = document.getElementById("loginBox");
    const signupBox = document.getElementById("signupBox");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    function readUsers() {
        try {
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
            return Array.isArray(users) ? users : [];
        } catch {
            return [];
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function showMessage(element, message, success = false) {
        element.textContent = message;
        element.className = success
            ? "form-message success-message"
            : "form-message error-message";
    }

    function showLogin() {
        signupBox.hidden = true;
        loginBox.hidden = false;
        document.getElementById("signupMessage").textContent = "";
    }

    function showSignup() {
        loginBox.hidden = true;
        signupBox.hidden = false;
        document.getElementById("loginMessage").textContent = "";
    }

    function togglePassword(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        button.addEventListener("click", () => {
            const isPassword = input.type === "password";
            input.type = isPassword ? "text" : "password";

            button.innerHTML = isPassword
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';
        });
    }

    togglePassword("password", "togglePassword");
    togglePassword("newPassword", "toggleNewPassword");

    document.getElementById("showSignup").addEventListener("click", showSignup);
    document.getElementById("showLogin").addEventListener("click", showLogin);

    const remembered = localStorage.getItem(REMEMBER_KEY);

    if (remembered) {
        try {
            const saved = JSON.parse(remembered);
            document.getElementById("username").value = saved.username || "";
            document.getElementById("accountRole").value = saved.role || "customer";
            document.getElementById("rememberMe").checked = true;
        } catch {
            localStorage.removeItem(REMEMBER_KEY);
        }
    }

    signupForm.addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById("newName").value.trim();
        const username = document.getElementById("newUsername").value.trim();
        const email = document.getElementById("newEmail").value.trim().toLowerCase();
        const password = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const roleInput = document.querySelector('input[name="signupRole"]:checked');
        const role = roleInput ? roleInput.value : "customer";
        const message = document.getElementById("signupMessage");

        if (name.length < 2 || username.length < 3) {
            showMessage(message, "Enter a valid name and a username with at least 3 characters.");
            return;
        }

        if (password.length < 6) {
            showMessage(message, "Password must contain at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage(message, "Passwords do not match.");
            return;
        }

        const users = readUsers();

        const usernameExists = users.some(user =>
            String(user.username).toLowerCase() === username.toLowerCase()
        );

        const emailExists = users.some(user =>
            String(user.email).toLowerCase() === email
        );

        if (usernameExists) {
            showMessage(message, "That username is already registered.");
            return;
        }

        if (emailExists) {
            showMessage(message, "That email is already registered.");
            return;
        }

        const newUser = {
            id: String(Date.now()),
            name,
            username,
            email,
            password,
            role
        };

        users.push(newUser);
        saveUsers(users);

        loginForm.reset();
        document.getElementById("username").value = email;
        document.getElementById("accountRole").value = role;
        document.getElementById("password").value = password;

        showLogin();
        showMessage(
            document.getElementById("loginMessage"),
            `Account created as ${role}. You can now log in.`,
            true
        );
    });

    loginForm.addEventListener("submit", event => {
        event.preventDefault();

        const identifier = document.getElementById("username").value.trim().toLowerCase();
        const password = document.getElementById("password").value;
        const selectedRole = document.getElementById("accountRole").value;
        const userError = document.getElementById("userError");
        const passError = document.getElementById("passError");
        const message = document.getElementById("loginMessage");

        userError.textContent = "";
        passError.textContent = "";
        message.textContent = "";

        const users = readUsers();

        const user = users.find(account =>
            (
                String(account.username).toLowerCase() === identifier ||
                String(account.email).toLowerCase() === identifier
            ) &&
            account.password === password
        );

        if (!user) {
            showMessage(message, "Incorrect username/email or password.");
            return;
        }

        if (String(user.role).toLowerCase() !== selectedRole) {
            showMessage(
                message,
                `This account is registered as ${user.role}. Please select ${user.role} in the Login as field.`
            );
            return;
        }

        const activeUser = {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: String(user.role).toLowerCase()
        };

        localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeUser));

        if (document.getElementById("rememberMe").checked) {
            localStorage.setItem(REMEMBER_KEY, JSON.stringify({
                username: identifier,
                role: selectedRole
            }));
        } else {
            localStorage.removeItem(REMEMBER_KEY);
        }

        window.location.href = "side-menu.html";
    });

    document.getElementById("forgotPassword").addEventListener("click", () => {
        alert("This demo does not send password-reset emails. Please create a new test account if needed.");
    });
});
