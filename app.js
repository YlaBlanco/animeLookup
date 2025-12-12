const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const results = document.getElementById("results");
const pagination = document.getElementById("pagination");
const loading = document.getElementById("loading");

let currentQuery = "";
let currentPage = 1;

searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query === "") return;

    currentQuery = query;
    currentPage = 1;  // Reset to first page
    searchAnime(currentQuery, currentPage);

    loading.classList.remove("hidden");  // SHOW SPINNER

    const url = `https://api.jikan.moe/v4/anime?q=${query}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            displayResults(data.data);
        })
        .catch(err => console.log("Error:", err))
        .finally(() => {
            loading.classList.add("hidden"); // HIDE SPINNER
        });
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchBtn.click();
    }
});


function searchAnime(query, page = 1) {

    // SHOW LOADING
    loading.style.display = "block";
    results.innerHTML = "";
    pagination.innerHTML = "";

    const url = `https://api.jikan.moe/v4/anime?q=${query}&page=${page}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            console.log("API Response:", data);

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
            console.error("Error:", err);
        });
}

function displayResults(animeList) {
    results.innerHTML = "";

    if (!animeList || animeList.length === 0) {
        results.innerHTML = "<p>No results found.</p>";
        return;
    }

    const limited = animeList.slice(0, 12); // ONLY FIRST 12 RESULTS

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

function openModal(anime) {
    const modal = document.getElementById("animeModal");

    document.getElementById("modalImage").src = anime.images.jpg.large_image_url;
    document.getElementById("modalTitle").textContent = anime.title;
    document.getElementById("modalScore").textContent = anime.score ?? "N/A";
    document.getElementById("modalEpisodes").textContent = anime.episodes ?? "Unknown";
    document.getElementById("modalStatus").textContent = anime.status ?? "Unknown";

    // Format genres
    const genreContainer = document.getElementById("modalGenres");
    genreContainer.innerHTML = "";

        if (anime.genres && anime.genres.length > 0) {
            anime.genres.forEach(g => {
                const tag = document.createElement("span");
                tag.classList.add("modal-tag");
                tag.textContent = g.name;
                genreContainer.appendChild(tag);
            });
        }

    document.getElementById("modalSynopsis").textContent =
        anime.synopsis || "No description available.";

    document.getElementById("animeModal").style.display = "flex";

    modal.classList.remove("modal-hide"); 
    modal.classList.remove("modal-show");  // reset animation
    void modal.offsetWidth;                // trick: forces reflow to restart animation
    modal.classList.add("modal-show");     // play animation
}

function closeModal() {
    const modal = document.getElementById("animeModal");

    // Play fade-out animation
    modal.classList.remove("modal-show");
    modal.classList.add("modal-hide");

    // After animation ends → hide it
    setTimeout(() => {
        modal.style.display = "none";
        modal.classList.remove("modal-hide");
    }, 300); // match fadeOut duration
}


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

document.getElementById("closeModal").addEventListener("click", closeModal);

window.addEventListener("click", (e) => {
    if (e.target.id === "animeModal") {
        closeModal();
    }
});

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
    }
});

//For Dark Mode
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "☀️";
}

// Toggle theme on click
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");

    themeIcon.textContent = isDark ? "☀️" : "🌙";
    localStorage.setItem("theme", isDark ? "dark" : "light");
});
