
const API_BASE = "http://localhost:5000/api";
const BASIC_AUTH_HEADER = "Basic " + btoa("admin:password123");
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

let tasks = [];
let logs = [];
let currentPage = 1;
const tasksPerPage = 5;
let currentSearchQuery = ""; // Track current search term
let currentLogPage = 1;
const logsPerPage = 5;
/* ---------- auth helpers ---------- */
function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) return "Bearer " + token;
  return BASIC_AUTH_HEADER;
}

function setUserFromStorage() {
  const p = document.getElementById("username");
  if (!p) return;
  const userJson = localStorage.getItem(USER_KEY);
  if (userJson) {
    try {
      const u = JSON.parse(userJson);
      p.textContent = u.username || u.email || "User";
    } catch {
      p.textContent = "User";
    }
  } else {
    p.textContent = "Guest";
  }
}

/* ---------- network helpers ---------- */
async function safeFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  // Ensure Authorization is set
  if (!opts.headers.Authorization) opts.headers.Authorization = getAuthHeader();
  const res = await fetch(url, opts);
  return res;
}

/* ---------- fetch tasks ---------- */
async function fetchTasks(page = 1, search = currentSearchQuery) {
  currentPage = page;
  currentSearchQuery = search;
  try {
    const res = await safeFetch(`${API_BASE}/tasks?page=${page}&limit=${tasksPerPage}&search=${encodeURIComponent(search)}`);
    if (!res.ok) {
      if (res.status === 401) return handleUnauthorized();
      throw new Error("Failed to fetch tasks");
    }
    const data = await res.json();
    tasks = data.tasks || [];
    currentPage = data.meta?.page || page;
    renderTasks();
    renderPagination(data.meta);
  } catch (err) {
    console.error(err);
    // Clear tasks and show error message on UI
    const tbody = document.getElementById("taskBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;color:var(--danger);">Error fetching tasks. Please sign in or check server.</td></tr>`;
    // Update pagination info on error
    const info = document.getElementById("paginationInfo");
    if (info) info.textContent = `Showing 0 of 0 tasks`;
    renderPagination({ page: currentPage, totalPages: 1 });
  }
}

/* ---------- fetch logs ---------- */
async function fetchLogs(page = 1) {
  currentLogPage = page;
  try {
    // ⬇️ MODIFIED: Send page and logsPerPage to backend ⬇️
    const res = await safeFetch(`${API_BASE}/logs?page=${page}&limit=${logsPerPage}`);
    if (!res.ok) {
      if (res.status === 401) return handleUnauthorized();
      throw new Error("Failed to fetch logs");
    }
    const data = await res.json();
    logs = data.logs || [];
    renderLogs(data.meta); // Pass meta data to renderLogs for pager
  } catch (err) {
    console.error(err);
    const tbody = document.getElementById("logBody");
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="padding:24px;color:var(--danger);">Error fetching logs. Please sign in or check server.</td></tr>`;
    document.getElementById("logCount") && (document.getElementById("logCount").textContent = "Error");
  }
}

/* ---------- render tasks ---------- */
function renderTasks() {
  const tbody = document.getElementById("taskBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:24px;color:var(--muted);">No tasks to show</td></tr>`;
    updatePaginationInfo(0);
    return;
  }

  // Get totalTasks from meta if available, otherwise fall back
  const totalTasks = tasks[0]?.meta?.totalTasks || tasks.length;
  
  tasks.forEach((t, i) => {
    const row = document.createElement("tr");
    const idCell = `<td class="col-id">#${t._id ? t._id.substring(0, 4) + '...' : (i+1)}</td>`;
    const titleCell = `<td class="col-title">${escapeHtml(t.title || "")}</td>`;
    const descCell = `<td class="col-desc">${escapeHtml(t.description || "")}</td>`;
    const dateCell = `<td class="col-date">${t.createdAt ? new Date(t.createdAt).toLocaleString() : "-"}</td>`;
    
    // FIX: Replaced inline onclick with data-id attributes (CSP fix)
    const actions = `
      <td class="col-actions">
        <div class="row-actions">
          <button class="action-btn edit-btn" data-id="${t._id}">Edit</button>
          <button class="action-btn delete-btn" data-id="${t._id}">Delete</button>
        </div>
      </td>`;
    
    row.innerHTML = idCell + titleCell + descCell + dateCell + actions;
    tbody.appendChild(row);
  });
  updatePaginationInfo(totalTasks);
  // Attach event listeners after rendering (CSP fix)
  attachTaskEventListeners();
}

/* ---------- attach event listeners for dynamically created buttons ---------- */
function attachTaskEventListeners() {
    const tbody = document.getElementById("taskBody");
    if (!tbody) return;

    // Attach listeners for Edit buttons
    tbody.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const taskId = e.currentTarget.getAttribute("data-id");
            openEditModal(taskId);
        });
    });

    // Attach listeners for Delete buttons
    tbody.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const taskId = e.currentTarget.getAttribute("data-id");
            deleteTask(taskId);
        });
    });
}

/* ---------- render task pagination ---------- */
function renderPagination(meta) {
  const totalPages = meta?.totalPages || 1;
  const pageIndicator = document.getElementById("pageIndicator");
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (pageIndicator)
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  attachTaskPagerListeners();
}

/* ---------- ATTACH TASK PAGER LISTENERS ---------- */
function attachTaskPagerListeners() {
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  if (prevBtn)
    prevBtn.onclick = () => {
      if (currentPage > 1) fetchTasks(currentPage - 1, currentSearchQuery);
    };
  if (nextBtn)
    nextBtn.onclick = () => {
      fetchTasks(currentPage + 1, currentSearchQuery);
    };
}

/* ---------- UPDATE TASK PAGINATION INFO ---------- */
function updatePaginationInfo(totalTasks = 0) {
  const info = document.getElementById("paginationInfo");
  if (!info) return;
  const start = Math.max(0, (currentPage - 1) * tasksPerPage);
  const end = Math.min(start + tasks.length, totalTasks);
  info.textContent =
    totalTasks === 0
      ? "Showing 0 of 0 tasks"
      : `Showing ${start + 1} to ${end} of ${totalTasks} tasks`;
}

/* ---------- render logs ---------- */
function renderLogs(meta) {
  const tbody = document.getElementById("logBody");
  const logCount = document.getElementById("logCount");
  
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!logs.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding:24px;color:var(--muted)">No logs found</td></tr>`;
    if (logCount) logCount.textContent = "0 logs";
    renderLogPagination(meta);
    return;
  }

  logs.forEach(log => {
    const tr = document.createElement("tr");
    const ts = new Date(log.timestamp).toLocaleString();
    let badge = `<span class="badge create">CREATE</span>`;
    if (log.action === "UPDATE") badge = `<span class="badge update">UPDATE</span>`;
    if (log.action === "DELETE") badge = `<span class="badge delete">DELETE</span>`;
    
    // Ensure content displays cleanly for null or undefined
    const contentData = log.updatedContent || {};
    const content = escapeHtml(JSON.stringify(contentData, null, 2).slice(0, 300) + (Object.keys(contentData).length > 300 ? '...' : ''));

    tr.innerHTML = `
      <td class="col-date">${ts}</td>
      <td class="col-action">${badge}</td>
      <td class="col-id">${log.taskId ? log.taskId.substring(0, 4) + '...' : "-"}</td>
      <td class="col-desc"><pre style="white-space:pre-wrap;margin:0;color:#cfe6ff">${content}</pre></td>
    `;
    tbody.appendChild(tr);
  });
  
  renderLogPagination(meta);
}

/* ---------- LOG PAGINATION RENDER ---------- */
function renderLogPagination(meta) {
  const totalLogs = meta?.totalLogs || 0;
  const totalPages = meta?.totalPages || 1;
  const pagerDiv = document.querySelector(".table-footer > div:last-child");
  const info = document.getElementById("logCount");
  if (!pagerDiv) return;

  const start = Math.max(0, (currentLogPage - 1) * logsPerPage);
  const end = Math.min(start + logs.length, totalLogs);

  if (info) {
    if (totalLogs === 0) {
      info.textContent = `Showing 0 of 0 logs`;
    } else {
      info.textContent = `Showing ${start + 1} to ${end} of ${totalLogs} logs`;
    }
  }

  pagerDiv.innerHTML = `
    <style>
    .btn{
      display:flex;align-items:center;gap:6px;font-size:14px;color:var(--muted);background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.05)
    }
    </style>
    <div class="pager">
      <button id="prevLogPage" class="btn" ${currentLogPage <= 1 ? "disabled" : ""}>Prev</button>
      <div id="logPageIndicator" class="page-indicator">Page ${currentLogPage} / ${totalPages}</div>
      <button id="nextLogPage" class="btn" ${currentLogPage >= totalPages ? "disabled" : ""}>Next</button>
    </div>
  `;

  attachLogPagerListeners();
}

/* ---------- LOG PAGER LISTENERS ---------- */
function attachLogPagerListeners() {
  const prevBtn = document.getElementById("prevLogPage");
  const nextBtn = document.getElementById("nextLogPage");

  if (prevBtn)
    prevBtn.onclick = () => {
      if (currentLogPage > 1) fetchLogs(currentLogPage - 1);
    };
  if (nextBtn)
    nextBtn.onclick = () => {
      fetchLogs(currentLogPage + 1);
    };
}

/* ---------- BASIC UTILITIES ---------- */
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeInput(str) {
  // Simple sanitation: remove HTML tags and trim whitespace
  return String(str || "").replace(/<[^>]*>/g, "").trim();
}

/* ---------- task modal logic ---------- */
const modal = document.getElementById("modal");
const modalBackdrop = document.getElementById("modalBackdrop");
const taskForm = document.getElementById("taskForm");
const createBtn = document.getElementById("createBtn");
const closeModalBtn = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");

function openModal() {
  if(modal) modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal() {
  if(modal) modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if(taskForm) taskForm.reset();
  const taskIdField = document.getElementById("taskId");
  if(taskIdField) taskIdField.value = "";
}

closeModalBtn?.addEventListener("click", closeModal);
cancelBtn?.addEventListener("click", closeModal);
modalBackdrop?.addEventListener("click", closeModal);

/* ---------- create/update submit ---------- */
taskForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("taskId").value;
  let title = sanitizeInput(document.getElementById("title")?.value);
  let description = sanitizeInput(document.getElementById("description")?.value);

  if (!title || !description) return alert("Title and description are required.");
  if (title.length > 100) return alert("Title max 100 chars.");
  if (description.length > 500) return alert("Description max 500 chars.");

  try {
    const payload = { title, description };
    let res;
    if (id) {
      res = await safeFetch(`${API_BASE}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await safeFetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    if (!res.ok) {
      if (res.status === 401) return handleUnauthorized();
      const err = await res.json().catch(()=>({ error: "Server error" }));
      return alert(err.error || (err.errors && err.errors[0]?.msg) || "Error processing request");
    }
    await fetchTasks(currentPage, currentSearchQuery);
    await fetchLogs();
    closeModal();
  } catch (err) {
    console.error(err);
    alert("Server error during task save/update.");
  }
});

/* ---------- openEdit ---------- */
function openEditModal(id) {
  const t = tasks.find(x => String(x._id) === String(id));
  if (!t) return alert("Task not found locally. Try refreshing.");
  
  const taskIdField = document.getElementById("taskId");
  const titleField = document.getElementById("title");
  const descriptionField = document.getElementById("description");
  const modalTitle = document.getElementById("modalTitle");

  if(taskIdField) taskIdField.value = t._id;
  if(titleField) titleField.value = t.title;
  if(descriptionField) descriptionField.value = t.description;
  if(modalTitle) modalTitle.textContent = "Edit Task";
  
  openModal();
}

/* ---------- delete ---------- */
async function deleteTask(id) {
  if (!confirm("Delete this task? This action cannot be undone.")) return;
  try {
    const res = await safeFetch(`${API_BASE}/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) {
      if (res.status === 401) return handleUnauthorized();
      const err = await res.json().catch(()=>({ error: "Delete failed" }));
      return alert(err.error || "Error deleting task");
    }
    await fetchTasks(currentPage, currentSearchQuery);
    await fetchLogs();
  } catch (err) {
    console.error(err);
    alert("Server error during task deletion.");
  }
}

/* ---------- settings dropup ---------- */
const settingsBtn = document.getElementById("settingsBtn");
const settingsMenu = document.getElementById("settingsMenu");
settingsBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  settingsMenu?.classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (settingsMenu && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
    settingsMenu.classList.add("hidden");
  }
});

// signout
document.getElementById("signoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setUserFromStorage();
  closeAuthModalFunc(); // Ensure auth modal is not stuck open
  alert("Signed out");
  // Reload data for the now-logged-out user
  if (document.getElementById("taskBody")) fetchTasks(1, "");
  if (document.getElementById("logBody")) fetchLogs();
});

/* ---------- AUTH MODALS ---------- */
const authModal = document.getElementById("authModal");
const authBackdrop = document.getElementById("authModalBackdrop");
const authTitle = document.getElementById("authTitle");
const authForm = document.getElementById("authForm");
const authFields = document.getElementById("authFields");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const closeAuthModal = document.getElementById("closeAuthModal");
const cancelAuthBtn = document.getElementById("cancelAuthBtn");

function openAuthModal(mode = "signin") {
  if(!authModal) return;
  authForm?.reset();
  if(authFields) authFields.innerHTML = "";
  authModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  
  if (mode === "signin") {
    if(authTitle) authTitle.textContent = "Sign In";
    if(authFields) authFields.innerHTML = `
      <label class="form-row"><span class="label">Email</span><input id="authEmail" type="email" required /></label>
      <label class="form-row"><span class="label">Password</span><input id="authPassword" type="password" required /></label>
    `;
    if(authSubmitBtn) authSubmitBtn.textContent = "Sign In";
    if(authForm) authForm.dataset.mode = "signin";
  } else {
    if(authTitle) authTitle.textContent = "Sign Up";
    if(authFields) authFields.innerHTML = `
      <label class="form-row"><span class="label">Username</span><input id="authUsername" type="text" required /></label>
      <label class="form-row"><span class="label">Email</span><input id="authEmail" type="email" required /></label>
      <label class="form-row"><span class="label">Password</span><input id="authPassword" type="password" required /></label>
    `;
    if(authSubmitBtn) authSubmitBtn.textContent = "Sign Up";
    if(authForm) authForm.dataset.mode = "signup";
  }
}

closeAuthModal?.addEventListener("click", closeAuthModalFunc);
cancelAuthBtn?.addEventListener("click", closeAuthModalFunc);
authBackdrop?.addEventListener("click", closeAuthModalFunc);

function closeAuthModalFunc() {
  if(authModal) authModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.getElementById("signinBtn")?.addEventListener("click", () => openAuthModal("signin"));
document.getElementById("signupBtn")?.addEventListener("click", () => openAuthModal("signup"));

// Auth form submit
authForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const mode = authForm.dataset.mode || "signin";
  
  if (mode === "signin") {
    const email = sanitizeInput(document.getElementById("authEmail")?.value);
    const password = sanitizeInput(document.getElementById("authPassword")?.value);
    if (!email || !password) return alert("Email and Password are required.");
    
    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) return alert(data.error || (data.errors && data.errors[0]?.msg) || "Sign in failed. Check credentials.");
      
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user || { username: data.user?.username || data.user?.email }));
      setUserFromStorage();
      closeAuthModalFunc();
      alert("Signed in successfully!");
      // Reload data for the now-logged-in user
      if (document.getElementById("taskBody")) fetchTasks(1, "");
      if (document.getElementById("logBody")) fetchLogs();
    } catch (err) {
      console.error(err);
      alert("Sign in error. Check server status.");
    }
  } else {
    const username = sanitizeInput(document.getElementById("authUsername")?.value);
    const email = sanitizeInput(document.getElementById("authEmail")?.value);
    const password = sanitizeInput(document.getElementById("authPassword")?.value);
    if (!username || !email || !password) return alert("Username, Email, and Password are required.");
    
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      
      if (!res.ok) return alert(data.error || (data.errors && data.errors[0]?.msg) || "Sign up failed.");
      
      alert("Sign up successful — you can now sign in.");
      openAuthModal("signin");
    } catch (err) {
      console.error(err);
      alert("Sign up error. Check server status.");
    }
  }
});

/* ---------- handle unauthorized ---------- */
function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setUserFromStorage();
  // Open the modal to prompt for sign-in
  openAuthModal("signin"); 
  console.warn("Authorization failed. Signed out.");
}

/* ---------- attach static listeners (Fix for buttons not working) ---------- */
function attachStaticListeners() {
  // Create Button listener is already defined globally but is included here for clarity
  createBtn?.addEventListener("click", () => {
    const modalTitle = document.getElementById("modalTitle");
    if(modalTitle) modalTitle.textContent = "Create Task";
    openModal();
  });

  // Search Button
  document.getElementById("searchBtn")?.addEventListener("click", () => {
    const q = sanitizeInput(document.getElementById("searchInput")?.value);
    fetchTasks(1, q); 
  });
} 

/* ---------- init ---------- */
function init() {
  setUserFromStorage();
  
  // Attach all non-dynamically generated listeners once
  attachStaticListeners(); 

  // Load data only if the respective section exists in the DOM
  if (document.getElementById("taskBody")) {
    fetchTasks(1, "");
  }

  if (document.getElementById("logBody")) {
    fetchLogs(1);
  }
}

// Call init only when the document is fully loaded
document.addEventListener("DOMContentLoaded", init);