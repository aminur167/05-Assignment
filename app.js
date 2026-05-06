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