const allIssuesUrl = "https://phi-lab-server.vercel.app/api/v1/lab/issues";
const singleIssueUrl = "https://phi-lab-server.vercel.app/api/v1/lab/issue";
const searchIssueUrl = "https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=";

let allIssues = [];
let currentIssues = [];
let currentStatus = "all";

const manageSpinner = (status) => {
  if (status === true) {
    document.getElementById("loader").classList.remove("hidden");
    document.getElementById("issueGrid").classList.add("hidden");
    document.getElementById("emptyState").classList.add("hidden");
  } else {
    document.getElementById("loader").classList.add("hidden");
    document.getElementById("issueGrid").classList.remove("hidden");
  }
};

const removeActive = () => {
  const tabButtons = document.querySelectorAll(".tab");
  tabButtons.forEach((btn) => btn.classList.remove("active"));
};

const loginUser = (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const loginError = document.getElementById("loginError");

  if (username === "admin" && password === "admin123") {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("appScreen").classList.remove("hidden");
    loadAllIssues();
  } else {
    loginError.innerText = "Please use username admin and password admin123.";
  }
};

const loadAllIssues = () => {
  manageSpinner(true);

  fetch(allIssuesUrl)
    .then((res) => res.json())
    .then((json) => {
      allIssues = json.data || [];
      currentIssues = allIssues;
      currentStatus = "all";
      removeActive();
      document.querySelector('[data-filter="all"]').classList.add("active");
      displayIssues(allIssues);
    })
    .catch((error) => {
      console.log("Issue API load failed:", error);
      displayEmptyMessage("Issues could not be loaded. Please check your internet connection.");
      manageSpinner(false);
    });
};

const loadStatusIssues = (status) => {
  currentStatus = status;
  removeActive();
  document.querySelector(`[data-filter="${status}"]`).classList.add("active");

  if (status === "all") {
    displayIssues(currentIssues);
    return;
  }

  const filteredIssues = currentIssues.filter((issue) => issue.status === status);
  displayIssues(filteredIssues);
};

const loadIssueDetails = (id) => {
  const url = `${singleIssueUrl}/${id}`;

  fetch(url)
    .then((res) => res.json())
    .then((json) => displayIssueDetails(json.data))
    .catch(() => {
      const issue = allIssues.find((item) => item.id === id);
      if (issue) displayIssueDetails(issue);
    });
};

const searchIssues = (event) => {
  event.preventDefault();

  const input = document.getElementById("searchInput");
  const searchText = input.value.trim();

  if (searchText === "") {
    currentIssues = allIssues;
    loadStatusIssues(currentStatus);
    return;
  }

  manageSpinner(true);

  fetch(`${searchIssueUrl}${encodeURIComponent(searchText)}`)
    .then((res) => res.json())
    .then((json) => {
      currentIssues = json.data || [];
      loadStatusIssues(currentStatus);
      document.getElementById("summaryText").innerText = `Search results for "${searchText}"`;
    })
    .catch(() => {
      const lowerSearch = searchText.toLowerCase();
      currentIssues = allIssues.filter((issue) => {
        const labels = issue.labels ? issue.labels.join(" ") : "";
        return `${issue.title} ${issue.description} ${issue.author} ${issue.priority} ${labels}`
          .toLowerCase()
          .includes(lowerSearch);
      });
      loadStatusIssues(currentStatus);
      document.getElementById("summaryText").innerText = `Search results for "${searchText}"`;
    });
};

const displayIssues = (issues) => {
  const issueContainer = document.getElementById("issueGrid");
  issueContainer.innerHTML = "";

  document.getElementById("issueCount").innerText = issues.length;
  document.getElementById("summaryText").innerText = currentStatus === "all"
    ? "Track and manage your project issues"
    : `Showing ${currentStatus} project issues`;

  if (issues.length === 0) {
    displayEmptyMessage("No issues found. Try another search.");
    manageSpinner(false);
    return;
  }

  issues.forEach((issue) => {
    const card = document.createElement("button");
    card.className = `issue-card ${issue.status === "closed" ? "closed" : "open"} min-h-[190px] rounded border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`;
    card.type = "button";
    card.onclick = () => loadIssueDetails(issue.id);
    const statusIcon = issue.status === "closed"
      ? "assets/Closed- Status .png"
      : "assets/Open-Status.png";
    const priority = issue.priority || "normal";

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <img class="w-4 h-4 object-contain" src="${statusIcon}" alt="${issue.status}">
        <span class="rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase priority-${priority}">${priority}</span>
      </div>
      <h3 class="min-h-8 text-[10px] leading-4 font-extrabold mb-1">${issue.title || "No title found"}</h3>
      <p class="min-h-8 text-[9px] leading-4 text-slate-500 line-clamp-2 mb-2">${issue.description || "No description found"}</p>
      <div class="flex flex-wrap gap-1 mb-3">${createLabels(issue.labels)}</div>
      <div class="mt-auto border-t border-slate-200 pt-2 grid gap-1 text-[8.5px] leading-4 text-slate-500">
        <span>#${issue.id} by ${issue.author || "Unknown"}</span>
        <span>${formatDate(issue.createdAt)}</span>
      </div>
    `;

    issueContainer.append(card);
  });

  document.getElementById("emptyState").classList.add("hidden");
  manageSpinner(false);
};

const displayIssueDetails = (issue) => {
  const modalContent = document.getElementById("modalContent");
  const labels = createLabels(issue.labels);
  const priority = issue.priority || "normal";
  const assignee = issue.assignee || issue.author || "Not provided";

  modalContent.innerHTML = `
    <h2 id="modalTitle" class="text-lg font-extrabold mb-2">${issue.title || "No title found"}</h2>
    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span class="rounded-full px-2 py-1 text-[10px] font-bold text-white ${issue.status === "closed" ? "bg-[#7a5cff]" : "bg-[#18c37e]"}">${issue.status || "open"}</span>
      <span>Opened by ${issue.author || "Unknown"}</span>
      <span>- ${formatDate(issue.createdAt)}</span>
    </div>
    <div class="flex flex-wrap gap-1 mt-5">${labels}</div>
    <p class="text-sm leading-7 text-slate-500 my-5">${issue.description || "No description found"}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-md p-4">
      <div>
        <span class="block text-xs text-slate-500 mb-1">Assignee:</span>
        <strong class="text-sm">${assignee}</strong>
      </div>
      <div>
        <span class="block text-xs text-slate-500 mb-1">Priority:</span>
        <strong class="rounded-full px-2 py-1 text-[10px] uppercase priority-${priority}">${priority}</strong>
      </div>
    </div>
  `;

  document.getElementById("issueModal").classList.remove("hidden");
};

const closeIssueModal = () => {
  document.getElementById("issueModal").classList.add("hidden");
};

const displayEmptyMessage = (message) => {
  document.getElementById("emptyState").innerText = message;
  document.getElementById("emptyState").classList.remove("hidden");
  document.getElementById("issueGrid").innerHTML = "";
  document.getElementById("issueCount").innerText = 0;
};

const createLabels = (labels) => {
  if (!labels || labels.length === 0) {
    return `<span class="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[8px] font-extrabold uppercase text-slate-500">no label</span>`;
  }

  const htmlElements = labels.map((label, index) => {
    const style = index === 0
      ? "border-red-200 bg-red-50 text-red-500"
      : "border-amber-200 bg-amber-50 text-amber-500";
    return `<span class="rounded-full border ${style} px-2 py-0.5 text-[8px] font-extrabold uppercase">${label.toUpperCase()}</span>`;
  });
  return htmlElements.join(" ");
};

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

document.getElementById("loginForm").addEventListener("submit", loginUser);
document.getElementById("searchForm").addEventListener("submit", searchIssues);

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => loadStatusIssues(button.dataset.filter));
});

document.getElementById("issueModal").addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) {
    closeIssueModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeIssueModal();
  }
});
