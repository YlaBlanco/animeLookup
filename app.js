/* ============================================================
   DOM REFERENCES
============================================================ */
const searchInput   = document.getElementById("searchInput");
const searchBtn     = document.getElementById("searchBtn");
const results       = document.getElementById("results");
const pagination    = document.getElementById("pagination");
const loading       = document.getElementById("loading");

const seasonSelect  = document.getElementById("seasonSelect");
const yearSelect    = document.getElementById("yearSelect");
const genreSelect   = document.getElementById("genreSelect");
const tabs          = document.querySelectorAll(".tab");

/* ============================================================
   GLOBAL STATE
============================================================ */
let currentQuery   = "";
let currentPage    = 1;
let currentHeading = null;
let requestId      = 0;
let activeTab      = "top";

/* ============================================================
   INITIAL SETUP
============================================================ */

// Populate year dropdown (1990 → current year)
const currentYear = new Date().getFullYear();
for (let y = currentYear; y >= 1990; y--) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
}

// Disable filters on first load
updateFilterVisibility("top");

/* ============================================================
   SEARCH HANDLING
============================================================ */
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (!query) return;

    deactivateTabs();

    currentQuery = query;
    currentPage = 1;

    searchAnime(currentQuery, currentPage);
});

searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") searchBtn.click();
});

/* ============================================================
   SHARED FETCH + DISPLAY (RACE-SAFE)
============================================================ */
function fetchAndDisplay(url, title) {
    const currentRequest = ++requestId;

    loading.classList.remove("hidden");
    results.innerHTML = "";
    pagination.innerHTML = "";

    if (currentHeading) currentHeading.remove();

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (currentRequest !== requestId) return;

            loading.classList.add("hidden");

            if (!data.data || data.data.length === 0) {
                results.innerHTML = "<p>No anime found.</p>";
                return;
            }

            const heading = document.createElement("h2");
            heading.textContent = title;
            heading.style.width = "80%";
            heading.style.margin = "20px auto 10px";
            heading.style.textAlign = "left";

            results.before(heading);
            currentHeading = heading;

            displayResults(data.data);
        })
        .catch(err => {
            if (currentRequest !== requestId) return;
            loading.classList.add("hidden");
            console.error(err);
        });
}

/* ============================================================
   SEARCH API
============================================================ */
function searchAnime(query, page = 1) {
    loading.classList.remove("hidden");
    results.innerHTML = "";
    pagination.innerHTML = "";

    if (currentHeading) currentHeading.remove();

    fetch(`https://api.jikan.moe/v4/anime?q=${query}&page=${page}`)
        .then(res => res.json())
        .then(data => {
            loading.classList.add("hidden");

            if (!data.data || data.data.length === 0) {
                results.innerHTML = "<p>No results found.</p>";
                return;
            }

            displayResults(data.data);
            displayPagination(data.pagination);
        })
        .catch(err => {
            loading.classList.add("hidden");
            console.error(err);
        });
}

/* ============================================================
   TAB DATA LOADERS
============================================================ */
function loadTopAnime() {
    currentQuery = "";
    fetchAndDisplay(
        "https://api.jikan.moe/v4/top/anime?limit=12",
        "Top Anime on MAL"
    );
}

function loadAiringAnime() {
    currentQuery = "";
    fetchAndDisplay(
        "https://api.jikan.moe/v4/seasons/now?limit=12",
        "Currently Airing Right Now"
    );
}

function loadSeasonFromDropdown() {
    const season = seasonSelect.value;
    const year   = yearSelect.value;

    fetchAndDisplay(
        `https://api.jikan.moe/v4/seasons/${year}/${season}?limit=12`,
        `${season.toUpperCase()} ${year}`
    );
}

function loadGenreFromDropdown() {
    const genreId   = genreSelect.value;
    const genreName = genreSelect.options[genreSelect.selectedIndex].text;

    fetchAndDisplay(
        `https://api.jikan.moe/v4/anime?genres=${genreId}&limit=12`,
        `${genreName} Anime`
    );
}

/* ============================================================
   TAB INTERACTION
============================================================ */
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const type = tab.dataset.tab;
        if (type === activeTab) return;

        activeTab = type;

        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        updateFilterVisibility(type);

        if (type === "top")    loadTopAnime();
        if (type === "airing") loadAiringAnime();
        if (type === "season") loadSeasonFromDropdown();
        if (type === "genre")  loadGenreFromDropdown();
    });
});

/* ============================================================
   FILTER DROPDOWN EVENTS
============================================================ */
seasonSelect.addEventListener("change", () => {
    if (activeTab === "season") loadSeasonFromDropdown();
});

yearSelect.addEventListener("change", () => {
    if (activeTab === "season") loadSeasonFromDropdown();
});

genreSelect.addEventListener("change", () => {
    if (activeTab === "genre") loadGenreFromDropdown();
});

/* ============================================================
   FILTER VISIBILITY CONTROL
============================================================ */
function updateFilterVisibility(tab) {
    seasonSelect.disabled = tab !== "season";
    yearSelect.disabled   = tab !== "season";
    genreSelect.disabled  = tab !== "genre";
}

function deactivateTabs() {
    tabs.forEach(t => t.classList.remove("active"));
    activeTab = null;
    updateFilterVisibility(null);
}

/* ============================================================
   DISPLAY RESULTS
============================================================ */
function displayResults(animeList) {
    results.innerHTML = "";

    animeList.slice(0, 12).forEach(anime => {
        const card = document.createElement("div");
        card.classList.add("result-card");

        card.innerHTML = `
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}" />
            <h3>${anime.title}</h3>
        `;

        card.addEventListener("click", () => openModal(anime));
        results.appendChild(card);
    });
}

/* ============================================================
   PAGINATION
============================================================ */
function displayPagination(info) {
    currentPage = info.current_page;

    pagination.innerHTML = `
        ${info.current_page > 1
            ? `<button class="page-btn" onclick="searchAnime(currentQuery, ${info.current_page - 1})">Previous</button>`
            : ""}
        <span>Page ${info.current_page}</span>
        ${info.has_next_page
            ? `<button class="page-btn" onclick="searchAnime(currentQuery, ${info.current_page + 1})">Next</button>`
            : ""}
    `;
}

/* ============================================================
   MODAL HANDLING
============================================================ */
function openModal(anime) {
    const modal = document.getElementById("animeModal");
    const genreContainer = document.getElementById("modalGenres");

    document.getElementById("modalImage").src = anime.images.jpg.large_image_url;
    document.getElementById("modalTitle").textContent = anime.title;
    document.getElementById("modalScore").textContent = anime.score ?? "N/A";
    document.getElementById("modalEpisodes").textContent = anime.episodes ?? "Unknown";
    document.getElementById("modalStatus").textContent = anime.status ?? "Unknown";
    document.getElementById("modalSynopsis").textContent =
        anime.synopsis || "No description available.";

    genreContainer.innerHTML = "";
    anime.genres?.forEach(g => {
        const tag = document.createElement("span");
        tag.classList.add("modal-tag");
        tag.textContent = g.name;
        genreContainer.appendChild(tag);
    });

    modal.style.display = "flex";
    modal.classList.remove("modal-hide");
    void modal.offsetWidth;
    modal.classList.add("modal-show");
}

function closeModal() {
    const modal = document.getElementById("animeModal");

    modal.classList.remove("modal-show");
    modal.classList.add("modal-hide");

    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("modal-hide");
    }, 300);
}

document.getElementById("closeModal").addEventListener("click", closeModal);

window.addEventListener("click", e => {
    if (e.target.id === "animeModal") closeModal();
});

window.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
});

/* ============================================================
   DARK MODE TOGGLE
============================================================ */
const themeToggle = document.getElementById("themeToggle");
const themeIcon   = document.getElementById("themeIcon");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const dark = document.body.classList.contains("dark-mode");
    themeIcon.textContent = dark ? "☀️" : "🌙";
    localStorage.setItem("theme", dark ? "dark" : "light");
});

/* ============================================================
   INITIAL LOAD
============================================================ */
window.addEventListener("load", loadTopAnime);
