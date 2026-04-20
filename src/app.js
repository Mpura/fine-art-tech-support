"use strict";

const form = document.getElementById("request-form");
const submitBtn = document.getElementById("submit-btn");
const queueList = document.getElementById("queue-list");
const queueStatus = document.getElementById("queue-status");

const supabaseUrl = window.SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "YOUR_SUPABASE_URL") {
  queueStatus.textContent = "Set Supabase URL and anon key in index.html.";
  queueStatus.classList.add("error-text");
} else {
  const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  startApp(supabaseClient);
}

function startApp(supabaseClient) {
  loadQueue(supabaseClient);

  supabaseClient
    .channel("public:requests")
    .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => {
      loadQueue(supabaseClient);
    })
    .subscribe();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const studentNumber = String(formData.get("studentNumber") || "").trim();
    const requestType = String(formData.get("requestType") || "General Query").trim();
    const notes = String(formData.get("notes") || "").trim();
    const filesReady = Boolean(formData.get("filesReady"));

    if (!name || !studentNumber) {
      alert("Name and student number are required.");
      return;
    }

    if (!filesReady) {
      alert("Please confirm your files are ready.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const { error } = await supabaseClient.from("requests").insert([
        {
          name,
          student_number: studentNumber,
          request_type: requestType,
          notes,
          status: "Pending"
        }
      ]);

      if (error) throw error;

      form.reset();
      await loadQueue(supabaseClient);
    } catch (error) {
      console.error("Failed to submit request:", error);
      alert(`Submission failed: ${error.message || "Please try again."}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Request";
    }
  });

  queueList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const requestId = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");

    if (!requestId || !action) return;

    const nextStatus = action === "start" ? "In Progress" : "Done";
    await updateRequestStatus(supabaseClient, requestId, nextStatus);
  });
}

async function loadQueue(supabaseClient) {
  queueStatus.textContent = "Loading requests...";
  queueStatus.classList.remove("error-text");

  const { data, error } = await supabaseClient
    .from("requests")
    .select("id, name, student_number, request_type, notes, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load queue:", error);
    queueStatus.textContent = `Could not load requests: ${error.message || "Unknown error"}`;
    queueStatus.classList.add("error-text");
    queueList.innerHTML = "";
    return;
  }

  renderQueue(data || []);
}

function renderQueue(requests) {
  queueList.innerHTML = "";

  if (requests.length === 0) {
    queueStatus.textContent = "No requests yet.";
    return;
  }

  queueStatus.textContent = `${requests.length} request(s) in queue`;

  requests.forEach((request) => {
    const card = document.createElement("article");
    card.className = "request-card";

    const title = document.createElement("h3");
    title.textContent = request.name;

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `Student #: ${request.student_number} | Type: ${request.request_type || "General Query"}`;

    const notes = document.createElement("p");
    notes.textContent = request.notes || "No notes provided.";

    const status = document.createElement("p");
    status.className = "request-status";
    status.textContent = `Status: ${request.status || "Pending"}`;

    const actions = document.createElement("div");
    actions.className = "request-actions";

    if ((request.status || "Pending") === "Pending") {
      const startBtn = document.createElement("button");
      startBtn.type = "button";
      startBtn.className = "action-btn";
      startBtn.setAttribute("data-action", "start");
      startBtn.setAttribute("data-id", String(request.id));
      startBtn.textContent = "Start";
      actions.appendChild(startBtn);
    } else if (request.status === "In Progress") {
      const completeBtn = document.createElement("button");
      completeBtn.type = "button";
      completeBtn.className = "action-btn done-btn";
      completeBtn.setAttribute("data-action", "complete");
      completeBtn.setAttribute("data-id", String(request.id));
      completeBtn.textContent = "Complete";
      actions.appendChild(completeBtn);
    }

    const time = document.createElement("p");
    time.className = "time";
    time.textContent = formatDate(request.created_at);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(notes);
    card.appendChild(status);
    if (actions.children.length > 0) {
      card.appendChild(actions);
    }
    card.appendChild(time);
    queueList.appendChild(card);
  });
}

async function updateRequestStatus(supabaseClient, requestId, nextStatus) {
  try {
    const { error } = await supabaseClient.from("requests").update({ status: nextStatus }).eq("id", requestId);
    if (error) throw error;
    await loadQueue(supabaseClient);
  } catch (error) {
    console.error("Failed to update status:", error);
    alert(`Could not update request status: ${error.message || "Please try again."}`);
  }
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}
