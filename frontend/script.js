
const API_URL = "http://localhost:7000/api/issues";

// LOAD ALL COMPLAINTS
async function loadComplaints() {
    const table = document.getElementById("complaintTable");
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(API_URL, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch complaints");
        }

        const issues = result.data || [];

        document.getElementById("totalCount").textContent = issues.length;

        document.getElementById("pendingCount").textContent =
            issues.filter(issue => issue.status === "Pending").length;

        document.getElementById("progressCount").textContent =
            issues.filter(issue =>
                issue.status === "In Progress" || issue.status === "Assigned"
            ).length;

        document.getElementById("resolvedCount").textContent =
            issues.filter(issue => issue.status === "Resolved").length;

        if (issues.length === 0) {
            table.innerHTML =
                '<tr><td colspan="5">No complaints reported yet.</td></tr>';
            return;
        }

        table.innerHTML = issues.map(issue => `
            <tr>
                <td>${escapeHTML(issue.title)}</td>
                <td>${escapeHTML(issue.category)}</td>
                <td>${escapeHTML(issue.block)} / ${escapeHTML(issue.room)}</td>
                <td>${escapeHTML(issue.severity)}</td>
                <td>
                    <select class="status-select"
                        onchange="updateStatus('${issue._id}', this.value)">
                        <option value="Pending" ${issue.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="Assigned" ${issue.status === "Assigned" ? "selected" : ""}>Assigned</option>
                        <option value="In Progress" ${issue.status === "In Progress" ? "selected" : ""}>In Progress</option>
                        <option value="Resolved" ${issue.status === "Resolved" ? "selected" : ""}>Resolved</option>
                    </select>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Complaint loading error:", error);

        table.innerHTML = `
            <tr>
                <td colspan="5">${escapeHTML(error.message)}</td>
            </tr>
        `;
    }
}

// PREVENT HTML INJECTION
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// UPDATE COMPLAINT STATUS
async function updateStatus(issueId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${issueId}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Status update failed");
        }

        await loadComplaints();

    } catch (error) {
        alert(error.message);
        await loadComplaints();
    }
}

// LOAD DASHBOARD
loadComplaints();
