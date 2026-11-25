window.AUTH_API_URL = "http://localhost:7000/api/auth";
// ===============================
// STUDENT REGISTRATION
// ===============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("registerMessage");
        const button = registerForm.querySelector('button[type="submit"]');

        const formData = new FormData(registerForm);

        const userData = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password")
        };

        button.disabled = true;
        message.textContent = "Creating your account...";

        try {
            const response = await fetch(`${window.AUTH_API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed");
            }

            message.style.color = "#4ADE80";
            message.textContent = "Account created! Redirecting to login...";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

        } catch (error) {
            message.style.color = "#FF7777";
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
}


// ===============================
// USER LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("loginMessage");
        const button = loginForm.querySelector('button[type="submit"]');

        const formData = new FormData(loginForm);

        const credentials = {
            email: formData.get("email"),
            password: formData.get("password")
        };

        button.disabled = true;
        message.textContent = "Signing in...";

        try {
            const response = await fetch(`${window.AUTH_API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed");
            }

            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));

            const role = result.user.role.toLowerCase();

            message.style.color = "#4ADE80";
            message.textContent = "Login successful!";

            if (role === "student") {
                window.location.href = "student-dashboard.html";
            } else if (role === "warden") {
                window.location.href = "warden-dashboard.html";
            } else {
                throw new Error("Unknown user role");
            }

        } catch (error) {
            message.style.color = "#FF7777";
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
}


// ===============================
// LOGOUT
// ===============================

console.log("AUTH.JS LOADED");

const logoutButton = document.getElementById("logoutBtn");

console.log("Logout button found:", logoutButton);

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "login.html";
    });
}
