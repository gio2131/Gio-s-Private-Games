const games = [
    {
        "id": "crazy-cattle-3d",
        "title": "Crazy Cattle 3D",
        "thumbnail": "https://rawcdn.githack.com/genizy/cc3d-mobile/main/CrazyCattle3D.png",
        "iframeUrl": "crazy-cattle-3d.html"
    },
    {
        "id": "ragdoll-hit",
        "title": "Ragdoll Hit",
        "thumbnail": "https://rawcdn.githack.com/genizy/google-class/main/ragdoll-hit/thumbnail.png",
        "iframeUrl": "ragdoll-hit.html"
    }
];

let selectedGame = null;
let searchQuery = '';
let currentView = 'games'; // 'games' or 'chat'
let chatUsername = localStorage.getItem('chatUsername') || '';
let socket = null;
let messages = [];
let userCount = 0;
let connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'

const mainContent = document.getElementById('main-content');
const searchInput = document.getElementById('search-input');
const logo = document.getElementById('logo');
const navGames = document.getElementById('nav-games');
const navChat = document.getElementById('nav-chat');

function render() {
    if (currentView === 'chat') {
        renderChat();
    } else if (selectedGame) {
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
                            referrerpolicy="no-referrer"
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

function renderChat() {
    if (!chatUsername) {
        mainContent.innerHTML = `
            <div class="max-w-md mx-auto py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <h2 class="text-2xl font-bold mb-2">Join Live Chat</h2>
                    <p class="text-zinc-500 mb-6">Enter a unique username to start chatting with others.</p>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-zinc-400 mb-1">Username</label>
                            <input 
                                type="text" 
                                id="chat-username-input"
                                class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                placeholder="e.g. PlayerOne"
                                maxlength="20"
                            />
                            <p id="username-error" class="text-red-500 text-xs mt-1 hidden"></p>
                        </div>
                        <button 
                            onclick="joinChat()"
                            id="join-btn"
                            class="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ${connectionStatus === 'connecting' ? 'Connecting...' : 'Join Chat'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto h-[70vh] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2">
                        <h2 class="text-2xl font-bold">Live Chat</h2>
                        <div class="w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}"></div>
                    </div>
                    <p class="text-zinc-500 text-sm">${userCount} users online</p>
                </div>
                <button 
                    onclick="leaveChat()"
                    class="text-sm text-zinc-500 hover:text-red-400 transition-colors"
                >
                    Leave Chat
                </button>
            </div>

            <div class="flex-1 bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col backdrop-blur-xl">
                <div id="chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4">
                    ${messages.map(msg => {
                        if (msg.type === 'system') {
                            return `<div class="text-center text-xs text-zinc-600 italic">${msg.text}</div>`;
                        }
                        const isMe = msg.username === chatUsername;
                        return `
                            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                                <span class="text-[10px] text-zinc-500 mb-1 px-2">${msg.username}</span>
                                <div class="max-w-[80%] px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-emerald-500 text-black rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}">
                                    ${msg.text}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="p-4 border-t border-white/5 bg-black/20">
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            id="chat-input"
                            class="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            placeholder="${connectionStatus === 'connected' ? 'Type a message...' : 'Connecting to server...'}"
                            ${connectionStatus !== 'connected' ? 'disabled' : ''}
                        />
                        <button 
                            onclick="sendChatMessage()"
                            class="bg-emerald-500 hover:bg-emerald-600 text-black p-2 rounded-xl transition-all disabled:opacity-50"
                            ${connectionStatus !== 'connected' ? 'disabled' : ''}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
        chatInput.focus();
    }
}

function initSocket() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    connectionStatus = 'connecting';
    if (currentView === 'chat') renderChat();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    try {
        socket = new WebSocket(`${protocol}//${host}`);

        socket.onopen = () => {
            connectionStatus = 'connected';
            console.log('WebSocket connected');
            if (chatUsername) {
                socket.send(JSON.stringify({ type: 'join', username: chatUsername }));
            }
            if (currentView === 'chat') renderChat();
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'join_success') {
                chatUsername = data.username;
                localStorage.setItem('chatUsername', chatUsername);
                render();
            } else if (data.type === 'error') {
                const errorEl = document.getElementById('username-error');
                if (errorEl) {
                    errorEl.textContent = data.message;
                    errorEl.classList.remove('hidden');
                }
                // If we were already in, but got an error (e.g. kicked or session issue)
                if (chatUsername) {
                    chatUsername = '';
                    localStorage.removeItem('chatUsername');
                    render();
                }
            } else if (data.type === 'message' || data.type === 'system') {
                messages.push(data);
                if (messages.length > 100) messages.shift();
                if (currentView === 'chat') renderChat();
            } else if (data.type === 'user_count') {
                userCount = data.count;
                if (currentView === 'chat') renderChat();
            }
        };

        socket.onclose = () => {
            console.log('WebSocket closed');
            socket = null;
            connectionStatus = 'disconnected';
            if (currentView === 'chat') {
                renderChat();
                // Auto-reconnect
                setTimeout(initSocket, 3000);
            }
        };

        socket.onerror = (err) => {
            console.error('WebSocket error:', err);
            connectionStatus = 'disconnected';
            if (currentView === 'chat') renderChat();
        };
    } catch (e) {
        console.error('Failed to create WebSocket:', e);
        connectionStatus = 'disconnected';
    }
}

window.joinChat = () => {
    const input = document.getElementById('chat-username-input');
    const username = input.value.trim();
    if (!username) return;

    const errorEl = document.getElementById('username-error');
    if (errorEl) errorEl.classList.add('hidden');

    if (!socket || socket.readyState !== WebSocket.OPEN) {
        initSocket();
        // Wait for connection to send join
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'join', username }));
                clearInterval(checkInterval);
            } else if (attempts > 50 || connectionStatus === 'disconnected') {
                clearInterval(checkInterval);
                if (errorEl) {
                    errorEl.textContent = "Connection failed. Please try again.";
                    errorEl.classList.remove('hidden');
                }
            }
        }, 100);
    } else {
        socket.send(JSON.stringify({ type: 'join', username }));
    }
};

window.leaveChat = () => {
    chatUsername = '';
    localStorage.removeItem('chatUsername');
    if (socket) {
        socket.close();
        socket = null;
    }
    messages = [];
    render();
};

window.sendChatMessage = () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !socket) return;

    socket.send(JSON.stringify({ type: 'chat', text }));
    input.value = '';
};

window.selectGame = (id) => {
    selectedGame = games.find(g => g.id === id);
    currentView = 'games';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.closeGame = () => {
    selectedGame = null;
    render();
};

searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (currentView === 'games' && !selectedGame) renderGrid();
});

logo.addEventListener('click', () => {
    selectedGame = null;
    currentView = 'games';
    searchQuery = '';
    searchInput.value = '';
    render();
});

navGames.addEventListener('click', () => {
    currentView = 'games';
    selectedGame = null;
    render();
});

navChat.addEventListener('click', () => {
    currentView = 'chat';
    if (chatUsername) initSocket();
    render();
});

// Initial render
render();
if (chatUsername) initSocket();

