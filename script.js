
// ---------------- AUTHENTICATION ----------------

let currentUser = localStorage.getItem("careerflow_currentUser");
let applications = [];

const authPage = document.getElementById("authPage");
const dashboard = document.getElementById("dashboard");

// Switch between Login and Signup
function toggleAuth() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const button = document.getElementById("switchAuth");

    const isLogin = !loginForm.hidden;

    loginForm.hidden = isLogin;
    signupForm.hidden = !isLogin;

    document.getElementById("authTitle").textContent =
        isLogin ? "Create Your Account" : "Welcome Back!";

    document.getElementById("authSubtitle").textContent =
        isLogin
            ? "Join CareerFlow and manage your job search."
            : "Login to manage your job applications.";

    document.getElementById("switchMessage").textContent =
        isLogin ? "Already have an account?" : "Don't have an account?";

    button.textContent = isLogin ? "Login" : "Sign Up";

    document.getElementById("authMessage").textContent = "";
}

// Display messages
function showMessage(message, success = false) {
    const element = document.getElementById("authMessage");
    element.textContent = message;
    element.style.color = success ? "green" : "red";
}

// ---------------- SIGN UP ----------------

document.getElementById("signupForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;

    if (password.length < 6) {
        showMessage("Password must contain at least 6 characters.");
        return;
    }

    let users = JSON.parse(localStorage.getItem("careerflow_users")) || [];

    const exists = users.some(user => user.email === email);

    if (exists) {
        showMessage("Email already registered. Please login.");
        return;
    }

    users.push({
        name: name,
        email: email,
        password: password
    });

    localStorage.setItem("careerflow_users", JSON.stringify(users));

    this.reset();

    toggleAuth();

    showMessage("Account created successfully! Please login.", true);
});

// ---------------- LOGIN ----------------

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    let users = JSON.parse(localStorage.getItem("careerflow_users")) || [];

    const user = users.find(
        item => item.email === email && item.password === password
    );

    if (!user) {
        showMessage("Invalid email or password. Please sign up first.");
        return;
    }

    currentUser = user.email;

    localStorage.setItem("careerflow_currentUser", currentUser);

    this.reset();

    openDashboard(user);
});

// ---------------- OPEN DASHBOARD ----------------

function openDashboard(user) {
    authPage.hidden = true;
    dashboard.hidden = false;

    document.getElementById("welcomeUser").textContent =
        "Welcome, " + user.name;

    applications = JSON.parse(
        localStorage.getItem("careerflow_apps_" + currentUser)
    ) || [];

    showPage("overview");
    updateDashboard();
}

// Check existing login
function checkLogin() {
    if (!currentUser) return;

    const users = JSON.parse(localStorage.getItem("careerflow_users")) || [];

    const user = users.find(item => item.email === currentUser);

    if (user) {
        openDashboard(user);
    } else {
        localStorage.removeItem("careerflow_currentUser");
        currentUser = null;
    }
}

// ---------------- LOGOUT ----------------

function logout() {
    localStorage.removeItem("careerflow_currentUser");

    currentUser = null;
    applications = [];

    dashboard.hidden = true;
    authPage.hidden = false;

    document.getElementById("loginForm").reset();
    document.getElementById("signupForm").reset();
    document.getElementById("authMessage").textContent = "";

    // Show Login form
    document.getElementById("loginForm").hidden = false;
    document.getElementById("signupForm").hidden = true;

    document.getElementById("authTitle").textContent = "Welcome Back!";
    document.getElementById("authSubtitle").textContent =
        "Login to manage your job applications.";

    document.getElementById("switchMessage").textContent =
        "Don't have an account?";

    document.getElementById("switchAuth").textContent = "Sign Up";
}

// ---------------- PAGE NAVIGATION ----------------

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.hidden = true;
    });

    document.getElementById(page).hidden = false;

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
    });

    const pages = ["overview", "applications", "calendar", "analytics"];
    const index = pages.indexOf(page);

    if (index !== -1) {
        document.querySelectorAll(".nav-btn")[index].classList.add("active");
    }

    updateDashboard();
}

// ---------------- ADD APPLICATION ----------------

function openForm() {
    document.getElementById("formModal").classList.add("show");

    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];
}

function closeForm() {
    document.getElementById("formModal").classList.remove("show");
    document.getElementById("jobForm").reset();
}

document.getElementById("jobForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const application = {
        id: Date.now(),
        company: document.getElementById("company").value.trim(),
        role: document.getElementById("role").value.trim(),
        location: document.getElementById("location").value.trim(),
        jobType: document.getElementById("jobType").value,
        date: document.getElementById("date").value,
        status: document.getElementById("status").value,
        followDate: document.getElementById("followDate").value,
        jobUrl: document.getElementById("jobUrl").value.trim(),
        notes: document.getElementById("notes").value.trim()
    };

    applications.push(application);

    saveData();
    closeForm();
    updateDashboard();

    alert("Application added successfully!");
});

// Save application data separately for each user
function saveData() {
    if (!currentUser) return;

    localStorage.setItem(
        "careerflow_apps_" + currentUser,
        JSON.stringify(applications)
    );
}

// ---------------- SEARCH AND DISPLAY ----------------

document.getElementById("search").addEventListener("input", render);

function render() {
    const search = document.getElementById("search").value.toLowerCase();

    const filtered = applications.filter(app =>
        app.company.toLowerCase().includes(search) ||
        app.role.toLowerCase().includes(search)
    );

    const list = document.getElementById("applicationList");
    const empty = document.getElementById("emptyApplications");

    list.innerHTML = "";
    empty.hidden = filtered.length > 0;

    filtered.forEach(app => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(app.company)}</td>
            <td>${escapeHTML(app.role)}</td>
            <td>${escapeHTML(app.location || "-")}</td>
            <td>${escapeHTML(app.date || "-")}</td>
            <td>
                <span class="status status-${app.status}">
                    ${app.status}
                </span>
            </td>
            <td>
                <button class="delete-btn"
                    onclick="deleteApplication(${app.id})">
                    Delete
                </button>
            </td>
        `;

        list.appendChild(row);
    });
}

// Protect displayed text
function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ---------------- DELETE APPLICATION ----------------

function deleteApplication(id) {
    if (!confirm("Are you sure you want to delete this application?")) {
        return;
    }

    applications = applications.filter(app => app.id !== id);

    saveData();
    updateDashboard();
}

// ---------------- DASHBOARD STATISTICS ----------------

function updateDashboard() {
    const total = applications.length;

    const progress = applications.filter(app =>
        ["Saved", "Applied"].includes(app.status)
    ).length;

    const interviews = applications.filter(
        app => app.status === "Interview"
    ).length;

    const offers = applications.filter(
        app => app.status === "Offer"
    ).length;

    document.getElementById("total").textContent = total;
    document.getElementById("progress").textContent = progress;
    document.getElementById("interviews").textContent = interviews;
    document.getElementById("offers").textContent = offers;

    render();
    updateRecent();
    updateReminders();
    updateAnalytics();
}

// ---------------- RECENT APPLICATIONS ----------------

function updateRecent() {
    const recent = document.getElementById("recent");

    if (applications.length === 0) {
        recent.textContent = "No applications yet.";
        return;
    }

    recent.innerHTML = "";

    applications.slice(-5).reverse().forEach(app => {
        const item = document.createElement("div");
        item.className = "recent-item";

        item.innerHTML = `
            <strong>${escapeHTML(app.company)}</strong>
            — ${escapeHTML(app.role)}
            <span class="status status-${app.status}">
                ${app.status}
            </span>
        `;

        recent.appendChild(item);
    });
}

// ---------------- FOLLOW-UP REMINDERS ----------------

function updateReminders() {
    const reminders = applications
        .filter(app => app.followDate)
        .sort((a, b) => a.followDate.localeCompare(b.followDate));

    const reminderBox = document.getElementById("reminders");
    const allReminders = document.getElementById("allReminders");

    reminderBox.innerHTML = "";
    allReminders.innerHTML = "";

    if (reminders.length === 0) {
        reminderBox.textContent = "No upcoming follow-ups.";
        allReminders.textContent = "No follow-ups scheduled.";
        return;
    }

    reminders.forEach(app => {
        const item = document.createElement("div");
        item.className = "reminder-item";

        item.textContent =
            app.company + " — " + app.role +
            " | Follow-up: " + app.followDate;

        reminderBox.appendChild(item.cloneNode(true));
        allReminders.appendChild(item);
    });
}

// ---------------- ANALYTICS ----------------

function updateAnalytics() {
    const total = applications.length;

    const responses = applications.filter(app =>
        ["Interview", "Offer", "Rejected"].includes(app.status)
    ).length;

    const offers = applications.filter(
        app => app.status === "Offer"
    ).length;

    const responseRate = total
        ? Math.round(responses / total * 100)
        : 0;

    const offerRate = total
        ? Math.round(offers / total * 100)
        : 0;

    document.getElementById("response").textContent = responseRate + "%";
    document.getElementById("offerRate").textContent = offerRate + "%";

    const statuses = ["Saved", "Applied", "Interview", "Offer", "Rejected"];
    const breakdown = document.getElementById("breakdown");

    breakdown.innerHTML = "";

    statuses.forEach(status => {
        const count = applications.filter(
            app => app.status === status
        ).length;

        const line = document.createElement("p");
        line.style.padding = "8px 0";
        line.textContent = status + ": " + count;

        breakdown.appendChild(line);
    });
}

// ---------------- START WEBSITE ----------------

checkLogin();
