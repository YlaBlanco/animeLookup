const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const results = document.getElementById("results");
const pagination = document.getElementById("pagination");
const loading = document.getElementById("loading");

let currentQuery = "";
let currentPage = 1;

/* ============================================================
   SEARCH HANDLING
============================================================ */
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (!query) return;

    currentQuery = query;
    currentPage = 1;

    searchAnime(currentQuery, currentPage);
    loading.classList.remove("hidden");
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

/* ============================================================
   API SEARCH FUNCTION
============================================================ */
function searchAnime(query, page = 1) {

    loading.style.display = "block";
    results.innerHTML = "";
    pagination.innerHTML = "";

    fetch(`https://api.jikan.moe/v4/anime?q=${query}&page=${page}`)
        .then(res => res.json())
        .then(data => {
            loading.style.display = "none";

            if (!data.data || data.data.length === 0) {
                results.innerHTML = "<p>No results found.</p>";
                return;
            }

            displayResults(data.data);
            displayPagination(data.pagination);
        })
        .catch(err => {
            loading.style.display = "none";
            results.innerHTML = "<p>Failed to fetch data. Try again later.</p>";
            console.error(err);
        });
}

/* ============================================================
   DISPLAY RESULTS (12 cards)
============================================================ */
function displayResults(animeList) {
    results.innerHTML = "";

    const limited = animeList.slice(0, 12);

    limited.forEach(anime => {
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
   OPEN MODAL
============================================================ */
function openModal(anime) {
    const modal = document.getElementById("animeModal");
    const genreContainer = document.getElementById("modalGenres");

    // Basic info
    document.getElementById("modalImage").src = anime.images.jpg.large_image_url;
    document.getElementById("modalTitle").textContent = anime.title;
    document.getElementById("modalScore").textContent = anime.score ?? "N/A";
    document.getElementById("modalEpisodes").textContent = anime.episodes ?? "Unknown";
    document.getElementById("modalStatus").textContent = anime.status ?? "Unknown";
    document.getElementById("modalSynopsis").textContent = anime.synopsis || "No description available.";

    // Genres
    genreContainer.innerHTML = "";
    if (anime.genres?.length) {
        anime.genres.forEach(g => {
            const tag = document.createElement("span");
            tag.classList.add("modal-tag");
            tag.textContent = g.name;
            genreContainer.appendChild(tag);
        });
    }

    // Show modal with animation
    modal.style.display = "flex";
    modal.classList.remove("modal-hide");
    modal.classList.remove("modal-show");
    void modal.offsetWidth;
    modal.classList.add("modal-show");
}

/* ============================================================
   CLOSE MODAL (with animation)
============================================================ */
function closeModal() {
    const modal = document.getElementById("animeModal");

    modal.classList.remove("modal-show");
    modal.classList.add("modal-hide");

    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("modal-hide");
    }, 300);
}

// Click X
document.getElementById("closeModal").addEventListener("click", closeModal);

// Click outside modal
window.addEventListener("click", (e) => {
    if (e.target.id === "animeModal") closeModal();
});

// ESC key
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

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
   DARK MODE TOGGLE
============================================================ */
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Load saved theme
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
