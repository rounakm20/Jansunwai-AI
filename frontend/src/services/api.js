const API_BASE = "https://jansunwai-ai.onrender.com";

export async function createComplaint(title, description, location, preferred_language = "en", image_data = null) {
  const response = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, description, location, preferred_language, image_data }),
  });
  if (!response.ok) {
    throw new Error("Failed to file complaint");
  }
  return response.json();
}

export async function getComplaints(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.category) params.append("category", filters.category);
  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.department) params.append("department", filters.department);
  
  const response = await fetch(`${API_BASE}/complaints?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch complaints");
  }
  return response.json();
}

export async function getComplaintDetails(id) {
  const response = await fetch(`${API_BASE}/complaints/${id}`);
  if (!response.ok) {
    throw new Error("Complaint details not found");
  }
  return response.json();
}

export async function updateComplaintStatus(id, status, actionTaken = "") {
  const response = await fetch(`${API_BASE}/complaints/${id}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status, action_taken: actionTaken }),
  });
  if (!response.ok) {
    throw new Error("Failed to update status");
  }
  return response.json();
}

export async function simulateTick() {
  const response = await fetch(`${API_BASE}/simulate-tick`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to trigger simulation");
  }
  return response.json();
}

export async function getTrends(days = 14) {
  const response = await fetch(`${API_BASE}/trends?days=${days}`);
  if (!response.ok) {
    throw new Error("Failed to retrieve trends");
  }
  return response.json();
}

export async function getStats(department = "") {
  const params = new URLSearchParams();
  if (department) params.append("department", department);
  
  const response = await fetch(`${API_BASE}/stats?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to retrieve metrics");
  }
  return response.json();
}
