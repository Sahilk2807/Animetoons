document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://jodbumjdczmsvunwhrbu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZGJ1bWpkY3ptc3Z1bndocmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDMyOTQsImV4cCI6MjA2OTI3OTI5NH0.f5ME3dgrRLTqYUsFpVeMKjf_ubM6rzWDNcXX8iYFDro';

    // --- DOM ELEMENTS ---
    const videoPlayer = document.getElementById('video-player');
    const animeTitle = document.getElementById('anime-title');
    const animeDescription = document.getElementById('anime-description');
    const episodeList = document.getElementById('episode-list');
    const recommendedGrid = document.getElementById('recommended-grid');
    const loader = document.getElementById('loader');
    const content = document.getElementById('content');
    const offlineMessage = document.getElementById('offline-message');

    function init() {
        handleOfflineStatus();
        window.addEventListener('online', handleOfflineStatus);
        window.addEventListener('offline', handleOfflineStatus);
        loadAnimeDetails();
    }
    
    function handleOfflineStatus() {
        offlineMessage.style.display = navigator.onLine ? 'none' : 'block';
    }

    async function loadAnimeDetails() {
        const params = new URLSearchParams(window.location.search);
        const animeId = params.get('id');

        if (!animeId || !navigator.onLine) {
            if (!animeId) window.location.href = 'index.html';
            return;
        }

        const url = `${SUPABASE_URL}/rest/v1/animes?id=eq.${animeId}&select=*`;
        try {
            const response = await fetch(url, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
            if (!response.ok) throw new Error('Failed to fetch anime details');
            
            const data = await response.json();
            if (data.length > 0) {
                displayAnime(data[0]);
                loadRecommendedAnime(data[0].id); // NEW: Load recommendations
            } else {
                handleError('Anime not found', 'The requested anime could not be found in our database.');
            }
        } catch (error) {
            handleError('Error Loading Anime', 'Could not load details. Please try again later.');
        }
    }

    function displayAnime(anime) {
        document.title = `Watch ${anime.title} - Animetoon`;
        animeTitle.textContent = anime.title;
        animeDescription.textContent = anime.description || "No description available.";

        const episodes = anime.episodes || [];
        if (episodes.length > 0 && episodes[0].url) {
            videoPlayer.src = episodes[0].url;
            
            if (episodes.length > 1) {
                episodeList.innerHTML = '';
                episodes.forEach((ep, index) => {
                    const epBtn = document.createElement('button');
                    epBtn.className = `btn episode-btn ${index === 0 ? 'btn-primary' : 'btn-outline-primary'}`;
                    epBtn.textContent = ep.title || `Ep ${index + 1}`;
                    epBtn.addEventListener('click', () => {
                        videoPlayer.src = ep.url;
                        document.querySelectorAll('.episode-btn').forEach(btn => btn.classList.replace('btn-primary', 'btn-outline-primary'));
                        epBtn.classList.replace('btn-outline-primary', 'btn-primary');
                    });
                    episodeList.appendChild(epBtn);
                });
            }
        } else {
            document.querySelector('.video-container').innerHTML = '<div class="alert alert-warning text-center">Video Not Available</div>';
        }
        
        loader.style.display = 'none';
        content.style.display = 'block';
    }

    // NEW: Function to load recommended anime
    async function loadRecommendedAnime(currentId) {
        const url = `${SUPABASE_URL}/rest/v1/animes?id=neq.${currentId}&select=id,title,poster_url&limit=6&order=created_at.desc`;
        try {
            const response = await fetch(url, { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } });
            const recommendedAnimes = await response.json();
            
            recommendedGrid.innerHTML = ''; // Clear skeleton loaders
            recommendedAnimes.forEach(anime => {
                const card = document.createElement('div');
                card.className = 'col';
                card.innerHTML = `
                    <a href="watch.html?id=${anime.id}" class="text-decoration-none">
                        <div class="card anime-card h-100">
                            <img src="${anime.poster_url}" class="card-img-top" alt="${anime.title}" loading="lazy">
                            <div class="card-body"><h5 class="card-title">${anime.title}</h5></div>
                        </div>
                    </a>`;
                recommendedGrid.appendChild(card);
            });
        } catch (error) {
            console.error("Failed to load recommended anime:", error);
            recommendedGrid.innerHTML = '<p class="text-muted">Could not load recommendations.</p>';
        }
    }

    function handleError(title, description) {
        animeTitle.textContent = title;
        animeDescription.textContent = description;
        loader.style.display = 'none';
        content.style.display = 'block';
        document.querySelector('.video-container').style.display = 'none';
    }

    init();
});