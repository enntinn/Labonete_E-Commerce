const loginBox = document.getElementById("loginBox");
const signupBox = document.getElementById("signupBox");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const username = document.getElementById("username");
const password = document.getElementById("password");

const userError = document.getElementById("userError");
const passError = document.getElementById("passError");

const togglePassword = document.getElementById("togglePassword");

const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

showSignup.addEventListener("click", function (e) {

    e.preventDefault();

    loginBox.style.display = "none";
    signupBox.style.display = "block";

});

showLogin.addEventListener("click", function (e) {

    e.preventDefault();

    signupBox.style.display = "none";
    loginBox.style.display = "block";

});


togglePassword.addEventListener("click", function () {

    if (password.type === "password") {

        password.type = "text";
        togglePassword.textContent = "Hide";

    } else {

        password.type = "password";
        togglePassword.textContent = "Show";

    }

});


signupForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const newUsername = document.getElementById("newUsername").value.trim();
    const newEmail = document.getElementById("newEmail").value.trim();
    const newPassword = document.getElementById("newPassword").value;

    if (newUsername === "" || newEmail === "" || newPassword === "") {

        alert("Please complete all fields.");
        return;

    }

    if (newPassword.length < 6) {

        alert("Password must be at least 6 characters.");
        return;

    }

    localStorage.setItem("username", newUsername);
    localStorage.setItem("email", newEmail);
    localStorage.setItem("password", newPassword);

    alert("Account created successfully!");

    signupForm.reset();

    signupBox.style.display = "none";
    loginBox.style.display = "block";

});

loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    userError.textContent = "";
    passError.textContent = "";

    let valid = true;

    if (username.value.trim() === "") {

        userError.textContent = "Please enter your username or email.";
        valid = false;

    }

    if (password.value.trim() === "") {

        passError.textContent = "Please enter your password.";
        valid = false;

    } else if (password.value.length < 6) {

        passError.textContent = "Password must be at least 6 characters.";
        valid = false;

    }

    if (!valid) return;

    const savedUsername = localStorage.getItem("username");
    const savedEmail = localStorage.getItem("email");
    const savedPassword = localStorage.getItem("password");

    if (savedUsername === null) {

        alert("No account found. Please sign up first.");
        return;

    }

    if (
    (username.value === savedUsername ||
     username.value === savedEmail) &&
    password.value === savedPassword
) {

    alert("Login successful!");

    loginForm.reset();

    window.location.href = "side-menu.html";

} else {

    alert("Invalid username/email or password.");

}

});