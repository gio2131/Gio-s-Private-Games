const games = [
    {
        "id": "2048",
        "title": "2048",
        "thumbnail": "https://picsum.photos/seed/2048/400/300",
        "iframeUrl": "https://play2048.co/"
    },
    {
        "id": "tetris",
        "title": "Tetris",
        "thumbnail": "https://picsum.photos/seed/tetris/400/300",
        "iframeUrl": "https://tetris.com/play-tetris"
    },
    {
        "id": "slope",
        "title": "Slope",
        "thumbnail": "https://picsum.photos/seed/slope/400/300",
        "iframeUrl": "https://krunker.io/"
    },
    {
        "id": "snake",
        "title": "Google Snake",
        "thumbnail": "https://picsum.photos/seed/snake/400/300",
        "iframeUrl": "https://www.google.com/logos/2010/pacman10-i.html"
    },
    {
        "id": "flappy-bird",
        "title": "Flappy Bird",
        "thumbnail": "https://picsum.photos/seed/flappy/400/300",
        "iframeUrl": "https://flappybird.io/"
    },
    {
        "id": "crossy-road",
        "title": "Crossy Road",
        "thumbnail": "https://picsum.photos/seed/crossy/400/300",
        "iframeUrl": "https://poki.com/en/g/crossy-road"
    }
];

let selectedGame = null;
let searchQuery = '';

const mainContent = document.getElementById('main-content');
const searchInput = document.getElementById('search-input');
const logo = document.getElementById('logo');

function render() {
    if (selectedGame) {
        renderPlayer();
    } else {
        renderGrid();
    }
}

function renderGrid() {
    const filteredGames = games.filter(game => 
        game.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    let html = `
        <div class="flex items-center justify-between mb-8">
            <h2 class="text-3xl font-bold tracking-tight">
                ${searchQuery ? `Search results for "${searchQuery}"` : 'Popular Games'}
            </h2>
            <div class="text-sm text-zinc-500">
                ${filteredGames.length} games available
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    `;

    if (filteredGames.length > 0) {
        filteredGames.forEach(game => {
            html += `
                <div class="group cursor-pointer game-card transition-all duration-300" onclick="selectGame('${game.id}')">
                    <div class="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-lg group-hover:border-emerald-500/50 transition-colors">
                        <img
                            src="${game.thumbnail}"
                            alt="${game.title}"
                            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <div class="w-full flex items-center justify-between">
                                <span class="font-bold text-white">Play Now</span>
                                <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-black"><line x1="6" x2="10" y1="12" y2="12"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="15" x2="15.01" y1="13" y2="13"></line><line x1="18" x2="18.01" y1="11" y2="11"></line><rect width="20" height="12" x="2" y="6" rx="2"></rect></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <h3 class="mt-3 font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors">
                        ${game.title}
                    </h3>
                </div>
            `;
        });
    } else {
        html = `
            <div class="py-20 text-center w-full col-span-full">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-600"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                </div>
                <h3 class="text-xl font-semibold text-zinc-400">No games found</h3>
                <p class="text-zinc-600 mt-2">Try searching for something else</p>
            </div>
        `;
    }

    html += `</div>`;
    mainContent.innerHTML = html;
}

function renderPlayer() {
    mainContent.innerHTML = `
        <div class="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <button 
                        onclick="closeGame()"
                        class="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    </button>
                    <h2 class="text-2xl font-bold">${selectedGame.title}</h2>
                </div>
                <div class="flex items-center gap-2">
                    <button class="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>
                    </button>
                    <a 
                        href="${selectedGame.iframeUrl}" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        class="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                    </a>
                </div>
            </div>

            <div class="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <iframe
                    src="${selectedGame.iframeUrl}"
                    class="w-full h-full border-none"
                    title="${selectedGame.title}"
                    allowfullscreen
                ></iframe>
            </div>

            <div class="mt-4 p-6 bg-white/5 rounded-2xl border border-white/10">
                <h3 class="text-lg font-semibold mb-2">About ${selectedGame.title}</h3>
                <p class="text-zinc-400 leading-relaxed">
                    Enjoy ${selectedGame.title} unblocked on Gio's private games. This game is hosted on a secure, high-speed server to ensure the best gaming experience without any restrictions.
                </p>
            </div>
        </div>
    `;
}

window.selectGame = (id) => {
    selectedGame = games.find(g => g.id === id);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.closeGame = () => {
    selectedGame = null;
    render();
};

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (!selectedGame) renderGrid();
});

logo.addEventListener('click', () => {
    selectedGame = null;
    searchQuery = '';
    searchInput.value = '';
    render();
});

// Initial render
render();
