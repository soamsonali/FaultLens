
const API_URL = "/api/issues";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

// Protect student dashboard
// Protect student dashboard
if (!token || !user || user.role?.toLowerCase() !== "student") {
    window.location.replace("login.html");
}
// Display student details
if (user) {
    document.getElementById("studentName").textContent = user.name;
    document.getElementById("welcomeName").textContent = user.name;
    document.getElementById("studentInitial").textContent =
        user.name.charAt(0).toUpperCase();
}

// Submit complaint
const complaintForm = document.getElementById("complaintForm");

if (complaintForm) {
    complaintForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("complaintMessage");
        const button = complaintForm.querySelector('button[type="submit"]');

        const complaint = Object.fromEntries(
            new FormData(complaintForm).entries()
        );

        button.disabled = true;
        message.textContent = "Submitting complaint...";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(complaint)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Submission failed");
            }

            message.style.color = "#4ADE80";
            message.textContent = "Complaint submitted successfully!";

            complaintForm.reset();

            await loadMyComplaints();

        } catch (error) {
            message.style.color = "#FF7777";
            message.textContent = error.message;
        } finally {
            button.disabled = false;
        }
    });
}

// Load student's complaints
async function loadMyComplaints() {
    try {
        const response = await fetch(`${API_URL}/mine`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not load complaints");
        }

        const issues = result.data || [];

        document.getElementById("studentTotal").textContent = issues.length;
        document.getElementById("studentPending").textContent =
            issues.filter(issue => issue.status === "Pending").length;
        document.getElementById("studentProgress").textContent =
            issues.filter(issue => issue.status === "In Progress" ||
                                   issue.status === "Assigned").length;
        document.getElementById("studentResolved").textContent =
            issues.filter(issue => issue.status === "Resolved").length;

        const complaintList = document.getElementById("complaintList");

        if (issues.length === 0) {
            complaintList.innerHTML =
                '<p class="empty-state">No complaints yet. Report your first issue!</p>';
            return;
        }

        
complaintList.innerHTML = issues.map(issue => `
    <div class="complaint-item">
        <div>
            <h3>${escapeHTML(issue.title)}</h3>
            <p>${escapeHTML(issue.category)} · Room ${escapeHTML(issue.room)}</p>
            <small>${new Date(issue.createdAt).toLocaleDateString()}</small>
            <p>Status: ${escapeHTML(issue.status)}</p>

            ${issue.status === "Resolved" && issue.studentConfirmation === "Pending" ? `
                <button onclick="confirmRepair('${issue._id}', 'Confirmed')">
                    Confirm Repair
                </button>
                <button onclick="confirmRepair('${issue._id}', 'Unresolved')">
                    Report Unresolved
                </button>
            ` : ""}

            ${issue.studentConfirmation === "Confirmed" ?
                "<p>✓ Repair confirmed by you</p>" : ""}

            ${issue.studentConfirmation === "Unresolved" ?
                "<p>Issue reported as unresolved</p>" : ""}
        </div>
        <span class="complaint-status">${escapeHTML(issue.status)}</span>
    </div>
`).join("");


    } catch (error) {
        document.getElementById("complaintList").innerHTML =
            `<p class="empty-state">${escapeHTML(error.message)}</p>`;
    }
}

// Prevent HTML injection in complaint text
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

// Initial dashboard load
loadMyComplaints();

async function confirmRepair(issueId, confirmation) {
    try {
        const response = await fetch(`${API_URL}/${issueId}/confirmation`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ confirmation })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Confirmation failed");
        }

        alert(result.message);
        await loadMyComplaints();

    } catch (error) {
        alert(error.message);
    }
}
