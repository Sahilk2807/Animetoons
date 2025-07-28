document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const SUPABASE_URL = 'https://jodbumjdczmsvunwhrbu.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvZGJ1bWpkY3ptc3Z1bndocmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDMyOTQsImV4cCI6MjA2OTI3OTI5NH0.f5ME3dgrRLTqYUsFpVeMKjf_ubM6rzWDNcXX8iYFDro';
    const TMDB_API_KEY = '0fa29b9776379b581628812491d38e39';
    const ADMIN_USERNAME = 'Animetoons@99898';
    const ADMIN_PASSWORD = 'z7n49c0Mvq1zC45x';

    // --- DOM ELEMENTS & STATE---
    const loginDiv = document.getElementById('admin-login');
    const form = document.getElementById('add-anime-form');
    const manageTableBody = document.getElementById('anime-manage-table-body');
    const manageLoader = document.getElementById('manage-loader');
    const manageTable = document.getElementById('manage-table');
    const formTitle = document.getElementById('form-title');
    const animeIdInput = document.getElementById('anime_id');
    const clearFormBtn = document.getElementById('clear-form-btn');
    let manageableAnimes = [];

    function authenticate() {
        const user = prompt("Enter Username:");
        const pass = prompt("Enter Password:");
        if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
            loginDiv.style.display = 'block';
            setupEventListeners();
            loadManageableAnimes();
        } else {
            alert("Authentication Failed. Access Denied.");
            document.body.innerHTML = '<h1 class="text-center mt-5 text-danger">Access Denied</h1>';
        }
    }

    function setupEventListeners() {
        document.getElementById('fetch-tmdb-btn').addEventListener('click', fetchDetails);
        document.getElementById('add-episode-btn').addEventListener('click', () => addEpisodeField());
        form.addEventListener('submit', handleSubmit);
        manageTableBody.addEventListener('click', handleTableActions);
        clearFormBtn.addEventListener('click', clearForm);
    }
    
    function showAlert(message, type) {
        document.getElementById('alert-container').innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }

    async function fetchDetails() {
        const query = document.getElementById('anime-search').value.trim();
        if (!query) return showAlert('Please enter a title or TMDb ID.', 'warning');
        
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
            } else {
                showAlert('No results found on TMDb.', 'warning');
            }
        } catch (error) {
            showAlert('Failed to fetch from TMDb.', 'danger');
        }
    }

    function addEpisodeField(title = '', url = '') {
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'input-group mb-2';
        episodeDiv.innerHTML = `
            <input type="text" class="form-control" placeholder="Episode Title (e.g., Ep 1)" value="${title}">
            <input type="text" class="form-control" placeholder="Video URL" value="${url}">
            <button type="button" class="btn btn-outline-danger remove-episode-btn">Remove</button>`;
        document.getElementById('episode-list-admin').appendChild(episodeDiv);
        episodeDiv.querySelector('.remove-episode-btn').addEventListener('click', () => episodeDiv.remove());
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const episodes = Array.from(document.getElementById('episode-list-admin').querySelectorAll('.input-group')).map(group => {
            const inputs = group.querySelectorAll('input');
            return { title: inputs[0].value.trim(), url: inputs[1].value.trim() };
        }).filter(ep => ep.title && ep.url);

        const animeData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            poster_url: document.getElementById('poster_url').value,
            episodes: episodes
        };
        
        const id = animeIdInput.value;
        const isUpdating = !!id;
        const url = isUpdating ? `${SUPABASE_URL}/rest/v1/animes?id=eq.${id}` : `${SUPABASE_URL}/rest/v1/animes`;
        const method = isUpdating ? 'PATCH' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify(animeData)
            });
            if (response.ok) {
                showAlert(`Anime ${isUpdating ? 'updated' : 'added'} successfully!`, 'success');
                clearForm();
                loadManageableAnimes(); // Refresh the list
                localStorage.removeItem('animeCache');
            } else {
                throw new Error((await response.json()).message);
            }
        } catch (error) {
            showAlert(`Error: ${error.message}`, 'danger');
        }
    }
    
    // --- MANAGE ANIME FUNCTIONS ---
    async function loadManageableAnimes() {
        manageLoader.style.display = 'block';
        manageTable.style.display = 'none';
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/animes?select=*&order=created_at.desc`, {
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            manageableAnimes = await response.json();
            manageTableBody.innerHTML = '';
            manageableAnimes.forEach(anime => {
                manageTableBody.innerHTML += `
                    <tr>
                        <td>${anime.title}</td>
                        <td>${anime.category}</td>
                        <td>
                            <button class="btn btn-sm btn-warning edit-btn" data-id="${anime.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${anime.id}">Delete</button>
                        </td>
                    </tr>`;
            });
            manageLoader.style.display = 'none';
            manageTable.style.display = 'table';
        } catch (error) {
            manageLoader.innerHTML = '<div class="alert alert-danger">Failed to load anime list.</div>';
        }
    }

    function handleTableActions(e) {
        if (e.target.classList.contains('edit-btn')) {
            populateFormForEdit(e.target.dataset.id);
        }
        if (e.target.classList.contains('delete-btn')) {
            handleDelete(e.target.dataset.id);
        }
    }

    function populateFormForEdit(id) {
        const anime = manageableAnimes.find(a => a.id == id);
        if (!anime) return;
        
        formTitle.textContent = 'Edit Anime';
        animeIdInput.value = anime.id;
        document.getElementById('title').value = anime.title;
        document.getElementById('description').value = anime.description;
        document.getElementById('poster_url').value = anime.poster_url;
        document.getElementById('category').value = anime.category;
        
        const episodeContainer = document.getElementById('episode-list-admin');
        episodeContainer.innerHTML = '';
        (anime.episodes || []).forEach(ep => addEpisodeField(ep.title, ep.url));
        
        window.scrollTo(0, 0); // Scroll to top to see the form
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this anime permanently?')) return;
        
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/animes?id=eq.${id}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            if (response.ok) {
                showAlert('Anime deleted successfully!', 'info');
                loadManageableAnimes(); // Refresh the list
                localStorage.removeItem('animeCache');
            } else {
                throw new Error((await response.json()).message);
            }
        } catch (error) {
            showAlert(`Error: ${error.message}`, 'danger');
        }
    }
    
    function clearForm() {
        form.reset();
        animeIdInput.value = '';
        formTitle.textContent = 'Add New Anime';
        document.getElementById('episode-list-admin').innerHTML = '';
        addEpisodeField();
    }
    
    authenticate();
});