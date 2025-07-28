document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://jodbumjdczmsvunwhrbu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZGJ1bWpkY3ptc3Z1bndocmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDMyOTQsImV4cCI6MjA2OTI3OTI5NH0.f5ME3dgrRLTqYUsFpVeMKjf_ubM6rzWDNcXX8iYFDro';
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

    // --- DOM ELEMENTS ---
    const splashScreen = document.getElementById('splash-screen');
    const animeGrid = document.getElementById('anime-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilters = document.getElementById('category-filters');
    const offlineMessage = document.getElementById('offline-message');

    let allAnimes = [];

    // --- INITIALIZATION ---
    function init() {
        handleOfflineStatus();
        window.addEventListener('online', handleOfflineStatus);
        window.addEventListener('offline', handleOfflineStatus);

        setTimeout(() => {
            splashScreen.style.opacity = '0';
            setTimeout(() => splashScreen.style.display = 'none', 500);
        }, 2000);

        loadAnimes();
        setupEventListeners();
    }

    function handleOfflineStatus() {
        offlineMessage.style.display = navigator.onLine ? 'none' : 'block';
    }

    async function fetchFromSupabase() {
        const url = `${SUPABASE_URL}/rest/v1/animes?select=id,title,poster_url,category&order=created_at.desc`;
        try {
            const response = await fetch(url, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching from Supabase:", error);
            animeGrid.innerHTML = `<p class="text-danger">Failed to load anime. Please try again later.</p>`;
            return null;
        }
    }

    async function loadAnimes() {
        showSkeletonLoaders(10);
        const cachedData = JSON.parse(localStorage.getItem('animeCache'));

        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
            allAnimes = cachedData.data;
        } else {
            const fetchedAnimes = await fetchFromSupabase();
            if (fetchedAnimes) {
                allAnimes = fetchedAnimes;
                localStorage.setItem('animeCache', JSON.stringify({ timestamp: Date.now(), data: allAnimes }));
            }
        }
        filterAndDisplayAnimes();
    }
    
    function showSkeletonLoaders(count) {
        animeGrid.innerHTML = '';
        for (let i = 0; i < count; i++) {
            animeGrid.innerHTML += `<div class="col"><div class="skeleton-card"><div class="skeleton-img"></div><div class="card-body"><div class="skeleton-text"></div></div></div></div>`;
        }
    }

    function displayAnimes(animes) {
        animeGrid.innerHTML = '';
        if (animes.length === 0) {
            animeGrid.innerHTML = `<p class="text-center col-12">No anime found matching your criteria.</p>`;
            return;
        }
        animes.forEach(anime => {
            const card = document.createElement('div');
            card.className = 'col animate__animated animate__fadeIn';
            card.innerHTML = `
                <a href="watch.html?id=${anime.id}" class="text-decoration-none text-white">
                    <div class="card anime-card h-100">
                        <img src="${anime.poster_url}" class="card-img-top" alt="${anime.title}" loading="lazy">
                        <div class="card-body"><h5 class="card-title">${anime.title}</h5></div>
                    </div>
                </a>`;
            animeGrid.appendChild(card);
        });
    }
    
    function setupEventListeners() {
        searchInput.addEventListener('keyup', () => filterAndDisplayAnimes());
        categoryFilters.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                document.querySelector('.filter-btn.active').classList.remove('active');
                e.target.classList.add('active');
                filterAndDisplayAnimes();
            }
        });
    }

    function filterAndDisplayAnimes() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const activeCategory = document.querySelector('.filter-btn.active').dataset.category;
        
        let filteredAnimes = allAnimes;
        if (activeCategory !== 'All') {
            filteredAnimes = filteredAnimes.filter(anime => anime.category === activeCategory);
        }
        if (searchTerm) {
            filteredAnimes = filteredAnimes.filter(anime => anime.title.toLowerCase().includes(searchTerm));
        }
        displayAnimes(filteredAnimes);
    }

    init();
});