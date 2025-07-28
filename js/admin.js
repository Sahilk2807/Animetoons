document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://jodbumjdczmsvunwhrbu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZGJ1bWpkY3ptc3Z1bndocmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDMyOTQsImV4cCI6MjA2OTI3OTI5NH0.f5ME3dgrRLTqYUsFpVeMKjf_ubM6rzWDNcXX8iYFDro';
    const TMDB_API_KEY = '0fa29b9776379b581628812491d38e39';
    const ADMIN_USERNAME = 'Animetoons@99898';
    const ADMIN_PASSWORD = 'z7n49c0Mvq1zC45x';

    // --- DOM ELEMENTS ---
    const loginDiv = document.getElementById('admin-login');
    const form = document.getElementById('add-anime-form');
    const fetchBtn = document.getElementById('fetch-tmdb-btn');
    const searchInput = document.getElementById('anime-search');
    const episodeListAdmin = document.getElementById('episode-list-admin');
    const addEpisodeBtn = document.getElementById('add-episode-btn');
    const submitBtn = document.getElementById('submit-btn');

    // --- LOGIN ---
    function authenticate() {
        const user = prompt("Enter Username:");
        const pass = prompt("Enter Password:");
        if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
            loginDiv.style.display = 'block';
            setupEventListeners();
            addEpisodeField(); // Add one episode field by default
        } else {
            alert("Authentication Failed. Access Denied.");
            document.body.innerHTML = '<h1 class="text-center mt-5 text-danger">Access Denied</h1>';
        }
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        fetchBtn.addEventListener('click', fetchDetails);
        addEpisodeBtn.addEventListener('click', () => addEpisodeField());
        form.addEventListener('submit', handleSubmit);
    }
    
    // --- UI & LOADING STATE ---
    function toggleSpinner(buttonId, show) {
        const btn = document.getElementById(buttonId);
        const spinner = btn.querySelector('.spinner-border');
        btn.disabled = show;
        spinner.style.display = show ? 'inline-block' : 'none';
    }
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alert-container');
        alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }

    // --- TMDB FETCH ---
    async function fetchDetails() {
        toggleSpinner('fetch-tmdb-btn', true);
        const query = searchInput.value.trim();
        if (!query) {
            showAlert('Please enter a title or TMDb ID.', 'warning');
            toggleSpinner('fetch-tmdb-btn', false);
            return;
        }

        const isId = /^\d+$/.test(query);
        const tmdbUrl = isId 
            ? `https://api.themoviedb.org/3/tv/${query}?api_key=${TMDB_API_KEY}&language=en-US`
            : `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US`;

        try {
            const response = await fetch(tmdbUrl);
            const data = await response.json();
            const anime = isId ? data : data.results[0];

            if (anime) {
                document.getElementById('title').value = anime.name || anime.original_name;
                document.getElementById('description').value = anime.overview;
                document.getElementById('poster_url').value = anime.poster_path ? `https://image.tmdb.org/t/p/w500${anime.poster_path}` : '';
                showAlert('Details fetched successfully!', 'success');
            } else {
                showAlert('No results found on TMDb.', 'warning');
            }
        } catch (error) {
            showAlert('Failed to fetch from TMDb.', 'danger');
        } finally {
            toggleSpinner('fetch-tmdb-btn', false);
        }
    }

    // --- EPISODE MANAGEMENT ---
    function addEpisodeField(title = '', url = '') {
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'input-group mb-2 animate__animated animate__fadeIn';
        episodeDiv.innerHTML = `
            <input type="text" class="form-control" placeholder="Episode Title (e.g., Ep 1)" value="${title}">
            <input type="text" class="form-control" placeholder="Video URL" value="${url}">
            <button type="button" class="btn btn-outline-danger remove-episode-btn">Remove</button>`;
        episodeListAdmin.appendChild(episodeDiv);

        episodeDiv.querySelector('.remove-episode-btn').addEventListener('click', () => {
            episodeDiv.classList.add('animate__fadeOut');
            episodeDiv.addEventListener('animationend', () => episodeDiv.remove());
        });
    }

    // --- FORM SUBMISSION ---
    async function handleSubmit(e) {
        e.preventDefault();
        toggleSpinner('submit-btn', true);

        const episodes = [];
        episodeListAdmin.querySelectorAll('.input-group').forEach(group => {
            const inputs = group.querySelectorAll('input');
            const title = inputs[0].value.trim();
            const url = inputs[1].value.trim();
            if (title && url) {
                episodes.push({ title, url });
            }
        });

        const animeData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            poster_url: document.getElementById('poster_url').value,
            episodes: episodes
        };
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/animes`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(animeData)
            });
            if (response.ok) {
                showAlert('Anime added/updated successfully!', 'success');
                form.reset();
                episodeListAdmin.innerHTML = '';
                addEpisodeField();
                localStorage.removeItem('animeCache'); // Clear cache
            } else {
                throw new Error((await response.json()).message);
            }
        } catch (error) {
            showAlert(`Error: ${error.message}`, 'danger');
        } finally {
            toggleSpinner('submit-btn', false);
        }
    }
    
    // --- START ---
    authenticate();
});