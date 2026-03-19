import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
    getFirestore,
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit, 
    serverTimestamp, 
    doc, 
    setDoc, 
    updateDoc,
    getDoc,
    getDocs,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Initialize Firebase variables
let db = null;
let auth = null;

// Fetch config and initialize Firebase
fetch('./firebase-applet-config.json')
    .then(response => response.json())
    .then(config => {
        const app = initializeApp(config);
        db = getFirestore(app, config.firestoreDatabaseId);
        auth = getAuth(app);
        window.db = db; // For debugging if needed
        
        signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User logged in:", user.email, user.uid);
                if (user.email === "gigip9612@gmail.com") {
                    initAdminListeners();
                }
                initUserListeners(user.uid);
                checkEntryLogin();
            }
        });

        if (chatUsername) initFirebaseChat();
    })
    .catch(err => {
        console.error("Firebase initialization failed:", err);
    });

const games = [
    {
        "id": "pvz",
        "title": "Plants Vs Zombies",
        "thumbnail": "https://vignette.wikia.nocookie.net/logopedia/images/0/01/Pvz_logo_stacked_rgb.png/revision/latest?cb=20120408101754",
        "iframeUrl": "pvz.html"
    },
    {
        "id": "minecraft",
        "title": "Minecraft",
        "thumbnail": "https://logos-world.net/wp-content/uploads/2020/04/Minecraft-Emblem.jpg",
        "iframeUrl": "minecraft.html"
    },
    {
        "id": "retrobowl",
        "title": "Retro Bowl",
        "thumbnail": "https://i.ibb.co/ZX99dDz/retro-bowl-unblocked.jpg",
        "iframeUrl": "https://game316009.konggames.com/gamez/0031/6009/live/index.html"
    },
    {
        "id": "8ball",
        "title": "8 Ball Pool",
        "thumbnail": "https://img-cdn.heygame.io/gameimages/b16adad8-cff5-4274-84a3-3bc8e1a6205c-8%20Ball%20Pool%20Online.webp",
        "iframeUrl": "8ball.html"
    },
    {
        "id": "bloons-td",
        "title": "Bloons TD",
        "thumbnail": "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/en_US/games/switch/b/bloons-td-5-switch/hero",
        "iframeUrl": "bloons-td.html"
    },
    {
        "id": "blackjack",
        "title": "BlackJack",
        "thumbnail": "https://www.888casino.com/blog/sites/newblog.888casino.com/files/inline-images/blackjack_1.jpg",
        "iframeUrl": "blackjack-game.html"
    },
    {
        "id": "spacebar-clicker",
        "title": "Spacebar Clicker",
        "thumbnail": "https://tse2.mm.bing.net/th/id/OIP.BaaQE0h22Ri8w4h2MAOZwgHaHa?pid=Api&h=220&P=0",
        "iframeUrl": "spacebar-clicker.html"
    },
    {
        "id": "fnaf-ucn",
        "title": "FNAF UCN",
        "thumbnail": "https://play-lh.googleusercontent.com/pB7dsLLcRgADtFpEPeKc5mSyAn1E1JzrdQ1V7-Y5hizgub3G8e9UJIc5opC9mYXKSBw",
        "iframeUrl": "fnaf-ucn.html"
    },
    {
        "id": "geometry-dash",
        "title": "Geometry Dash",
        "thumbnail": "https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/2a/6f/ea/2a6feaae-3202-5356-eb1b-409208bcb0af/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png",
        "iframeUrl": "geometry-dash.html"
    },
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
    },
    {
        "id": "ultrakill",
        "title": "ULTRAKILL",
        "thumbnail": "https://wallpapers.com/images/hd/ultrakill-game-artwork-xgsd9l8nrbkuldvg.jpg",
        "iframeUrl": "ultrakill.html"
    },
    {
        "id": "drive-mad",
        "title": "Drive Mad",
        "thumbnail": "https://github.com/WanoCapy/ChickenKingsVault/blob/main/drivemad.png?raw=true",
        "iframeUrl": "drive-mad.html"
    },
    {
        "id": "melon-playground",
        "title": "Melon Playground",
        "thumbnail": "https://i.pinimg.com/736x/bd/e7/f5/bde7f58165f0359b49ba628f16727db5.jpg",
        "iframeUrl": "melon-playground.html"
    },
    {
        "id": "fnaf-world",
        "title": "Fnaf World",
        "thumbnail": "https://imag.malavida.com/mvimgbig/download-fs/fnaf-world-27444-3.jpg",
        "iframeUrl": "fnaf-world.html"
    },
    {
        "id": "baldis-basics",
        "title": "Baldi's Basics Plus",
        "thumbnail": "https://i.ytimg.com/vi/7SKjBg1eslk/maxresdefault.jpg",
        "iframeUrl": "baldis-basics.html"
    }
];

let selectedGame = null;
let searchQuery = '';
let currentView = 'games'; // 'games' or 'chat'
let chatUsername = localStorage.getItem('chatUsername') || '';
let messages = [];
let userCount = 0;
let unsubscribeMessages = null;
let unsubscribeUsers = null;
let unsubscribeAnnouncements = null;
let heartbeatInterval = null;
let lastMessageSentAt = 0;
let isTrusted = false;
let registeredUsers = [];
let suggestions = [];
let currentCatImage = '';
let currentVideoId = '';
let currentTheme = localStorage.getItem('currentTheme') || 'default';
let customThemeUrl = localStorage.getItem('customThemeUrl') || '';
const CAT_IMAGES = [
    'https://i.pinimg.com/736x/e9/7c/fe/e97cfea50835dc14689ba16f10a47216.jpg',
    'https://i.pinimg.com/736x/6f/44/60/6f446080c188b1eaaeb22264d9d250cd.jpg',
    'https://i.pinimg.com/736x/49/62/b0/4962b01ecb81613e7197f83342ea5ede.jpg',
    'https://i.pinimg.com/736x/82/76/de/8276def31054c455dad15a84619df78b.jpg',
    'https://i.pinimg.com/736x/ca/91/67/ca9167da99ae2709a40fb261229d0256.jpg',
    'https://i.pinimg.com/736x/38/b7/d1/38b7d17290eae7f95b332d454ae86272.jpg',
    'https://i.pinimg.com/1200x/e5/9e/6e/e59e6e13619242230110d1920878ae55.jpg',
    'https://i.pinimg.com/736x/ad/95/93/ad9593d4e16ce6b64b6a2fd08aff1441.jpg',
    'https://i.pinimg.com/736x/c7/ab/d0/c7abd0abeaa1fbe932a9225ca90140fe.jpg',
    'https://i.pinimg.com/736x/1a/6e/d5/1a6ed57b5d233d2edda76348e254da7b.jpg'
];
const SLOW_MODE_MS = 2000;
const TRUSTED_CODE = "00999";

function initAdminListeners() {
    onSnapshot(collection(db, 'users'), (snapshot) => {
        registeredUsers = snapshot.docs.map(doc => doc.data());
        if (currentView === 'trusted') render();
    });
    onSnapshot(collection(db, 'suggestions'), (snapshot) => {
        suggestions = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        if (currentView === 'trusted') render();
    });
}

const mainContent = document.getElementById('main-content');
const searchInput = document.getElementById('search-input');
const logo = document.getElementById('logo');
const navGames = document.getElementById('nav-games');
const navChat = document.getElementById('nav-chat');
const navOthers = document.getElementById('nav-others');
const navVideo = document.getElementById('nav-video');
const navThemes = document.getElementById('nav-themes');
const navSuggest = document.getElementById('nav-suggest');
const navTrusted = document.getElementById('nav-trusted');

function render() {
    applyTheme(currentTheme, customThemeUrl);
    if (currentView === 'chat') {
        renderChat();
    } else if (currentView === 'others') {
        renderOthers();
    } else if (currentView === 'video') {
        renderVideoPlayer();
    } else if (currentView === 'themes') {
        renderThemes();
    } else if (currentView === 'suggest') {
        renderSuggest();
    } else if (currentView === 'trusted') {
        renderTrusted();
    } else if (selectedGame) {
        renderPlayer();
    } else {
        renderGrid();
    }
}

const TRUSTED_GAMES = [
    {
        "id": "hotline-miami",
        "title": "Hotline Miami",
        "thumbnail": "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/31184640-b024-47d1-b392-50174b836348/dfl2mir-25d215ac-7297-4ce0-a09e-2ba261ef9462.png/v1/fill/w_512,h_512/hotline_miami_icon_by_keke4050_dfl2mir-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTEyIiwicGF0aCI6IlwvZlwvMzExODQ2NDAtYjAyNC00N2QxLWIzOTItNTAxNzRiODM2MzQ4XC9kZmwybWlyLTI1ZDIxNWFjLTcyOTctNGNlMC1hMDllLTJiYTI2MWVmOTQ2Mi5wbmciLCJ3aWR0aCI6Ijw9NTEyIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.tnba7n1PbhiiDb86u-VSiFcHpG2moicpYc3aMfTCtBA",
        "iframeUrl": "hotline-miami.html"
    }
];

window.selectTrustedGame = (id) => {
    selectedGame = TRUSTED_GAMES.find(g => g.id === id);
    currentView = 'trusted'; // Keep the header state
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function renderOthers() {
    mainContent.innerHTML = `
        <div class="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl text-center">
                <div class="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.27 1.73 4.42 0 6.42-1.73 2-5 1.71-5 1.71s-3.33.29-5-1.71c-1.73-2-.57-5.15 0-6.42 0 0-1.82-6.42-.42-7 1.39-.58 4.64.26 6.42 2.26.65-.17 1.33-.26 2-.26Z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/></svg>
                </div>
                <h2 class="text-3xl font-bold mb-4">Cat Generator</h2>
                <p class="text-zinc-500 mb-8">Click the button below to see a random cute cat!</p>
                
                <div class="mb-8 min-h-[300px] flex items-center justify-center">
                    ${currentCatImage ? `
                        <div class="relative group">
                            <img 
                                src="${currentCatImage}" 
                                alt="Random Cat" 
                                class="max-w-full h-auto rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300"
                                referrerpolicy="no-referrer"
                            />
                        </div>
                    ` : `
                        <div class="w-full h-64 bg-white/5 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-zinc-600">
                            No cat generated yet
                        </div>
                    `}
                </div>

                <button 
                    onclick="window.generateRandomCat()"
                    class="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 mx-auto active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                    Generate Random Cat
                </button>
            </div>
        </div>
    `;
}

window.generateRandomCat = () => {
    const randomIndex = Math.floor(Math.random() * CAT_IMAGES.length);
    currentCatImage = CAT_IMAGES[randomIndex];
    render();
};

function renderVideoPlayer() {
    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">Video Player</h2>
                        <p class="text-zinc-500 text-sm">Paste a YouTube URL or Video ID to watch</p>
                    </div>
                </div>

                <div class="flex gap-2 mb-8">
                    <div class="flex-1 relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                        <input 
                            type="text" 
                            id="youtube-url-input"
                            placeholder="https://www.youtube.com/watch?v=..."
                            class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                    <button 
                        onclick="window.loadVideo()"
                        class="bg-red-500 hover:bg-red-600 text-white font-bold px-8 rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95"
                    >
                        Load
                    </button>
                </div>

                <div class="aspect-video bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl mb-8">
                    ${currentVideoId ? `
                        <iframe 
                            width="100%" 
                            height="100%" 
                            src="https://www.youtube.com/embed/${currentVideoId}" 
                            title="YouTube video player" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowfullscreen
                        ></iframe>
                    ` : `
                        <div class="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-20"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m9 8 6 4-6 4Z"/></svg>
                            <p class="font-medium">No video loaded</p>
                        </div>
                    `}
                </div>

                <div class="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h3 class="text-lg font-bold mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                        How To get links
                    </h3>
                    <p class="text-zinc-400 text-sm leading-relaxed">
                        Search on bing/google for a video you'd like 2 watch and click it then copy the url (make sure its youtube)
                    </p>
                </div>
            </div>
        </div>
    `;

    // Add enter key listener to input
    const input = document.getElementById('youtube-url-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.loadVideo();
        });
    }
}

function renderSuggest() {
    mainContent.innerHTML = `
        <div class="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <h2 class="text-3xl font-bold mb-4">Suggest a New Game</h2>
                <p class="text-zinc-500 mb-8">Have a game you want to see? Let us know!</p>
                <div class="space-y-4">
                    <input type="text" id="suggestion-title" placeholder="Game Title" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all">
                    <textarea id="suggestion-desc" placeholder="Brief description or link" class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all h-32"></textarea>
                    <button onclick="window.submitSuggestion()" class="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20">Submit Suggestion</button>
                </div>
            </div>
        </div>
    `;
}

window.submitSuggestion = async () => {
    const title = document.getElementById('suggestion-title').value.trim();
    const desc = document.getElementById('suggestion-desc').value.trim();
    if (title && desc) {
        await addDoc(collection(db, 'suggestions'), {
            title,
            desc,
            username: sessionStorage.getItem('user_name') || 'Anonymous',
            timestamp: serverTimestamp()
        });
        alert('Suggestion submitted!');
        document.getElementById('suggestion-title').value = '';
        document.getElementById('suggestion-desc').value = '';
    }
};

function renderThemes() {
    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">UI Themes</h2>
                        <p class="text-zinc-500 text-sm">Customize your experience</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onclick="window.applyTheme('galaxy')" class="group relative overflow-hidden rounded-2xl aspect-video border border-white/10 hover:border-indigo-500/50 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-xl font-bold group-hover:scale-110 transition-transform">Galaxy</span>
                        </div>
                    </button>

                    <button onclick="window.applyTheme('nebula')" class="group relative overflow-hidden rounded-2xl aspect-video border border-white/10 hover:border-pink-500/50 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-br from-pink-600 via-purple-700 to-blue-800"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-xl font-bold group-hover:scale-110 transition-transform">Nebula</span>
                        </div>
                    </button>

                    <button onclick="window.applyTheme('iidk')" class="group relative overflow-hidden rounded-2xl aspect-video border border-white/10 hover:border-orange-500/50 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-xl font-bold group-hover:scale-110 transition-transform">IIDK (Orange)</span>
                        </div>
                    </button>

                    <button onclick="window.showCustomThemePopup()" class="group relative overflow-hidden rounded-2xl aspect-video border border-white/10 hover:border-emerald-500/50 transition-all">
                        <div class="absolute inset-0 bg-zinc-800 flex flex-col items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            <span class="text-xl font-bold group-hover:scale-110 transition-transform">Custom Image</span>
                        </div>
                    </button>
                </div>

                <div class="mt-8 flex justify-center">
                    <button onclick="window.applyTheme('default')" class="text-zinc-500 hover:text-white transition-colors text-sm underline underline-offset-4">Reset to Default</button>
                </div>
            </div>
        </div>

        <!-- Custom Theme Popup -->
        <div id="theme-popup" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden animate-in fade-in duration-300">
            <div class="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300">
                <h3 class="text-xl font-bold mb-2">Custom Background</h3>
                <p class="text-zinc-500 text-sm mb-6">Enter an image URL to set as your background.</p>
                
                <input 
                    type="text" 
                    id="custom-theme-input"
                    placeholder="https://example.com/image.jpg"
                    class="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all mb-6"
                />

                <div class="flex gap-3">
                    <button 
                        onclick="window.closeThemePopup()"
                        class="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button 
                        onclick="window.applyCustomTheme()"
                        class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.showCustomThemePopup = () => {
    const popup = document.getElementById('theme-popup');
    if (popup) popup.classList.remove('hidden');
};

window.closeThemePopup = () => {
    const popup = document.getElementById('theme-popup');
    if (popup) popup.classList.add('hidden');
};

window.applyCustomTheme = () => {
    const input = document.getElementById('custom-theme-input');
    const url = input.value.trim();
    if (url) {
        window.applyTheme('custom', url);
        window.closeThemePopup();
    }
};

window.applyTheme = (theme, customUrl = '') => {
    currentTheme = theme;
    customThemeUrl = customUrl;
    localStorage.setItem('currentTheme', theme);
    localStorage.setItem('customThemeUrl', customUrl);

    const bgOverlay = document.getElementById('theme-bg-overlay');
    const mainHeader = document.getElementById('main-header');
    const navContainer = document.getElementById('nav-container');
    const headerSearch = document.getElementById('search-input');
    if (!bgOverlay || !mainHeader) return;

    bgOverlay.className = 'fixed inset-0 -z-10 transition-all duration-1000';
    bgOverlay.style.backgroundImage = '';
    bgOverlay.style.backgroundSize = 'cover';
    bgOverlay.style.backgroundPosition = 'center';

    mainHeader.className = 'sticky top-0 z-40 backdrop-blur-xl border-b transition-all duration-1000';
    if (navContainer) navContainer.className = 'hidden sm:flex items-center gap-6 text-sm font-medium transition-colors duration-1000';
    if (headerSearch) headerSearch.className = 'w-full rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 transition-all duration-1000';

    switch (theme) {
        case 'galaxy':
            bgOverlay.classList.add('bg-gradient-to-br', 'from-blue-900', 'via-purple-900', 'to-black');
            mainHeader.classList.add('bg-blue-950/80', 'border-blue-500/20', 'text-white');
            if (navContainer) navContainer.classList.add('text-blue-200');
            if (headerSearch) headerSearch.classList.add('bg-blue-900/30', 'border-blue-500/30', 'text-white', 'placeholder:text-blue-400/50', 'focus:ring-blue-500/50');
            break;
        case 'nebula':
            bgOverlay.classList.add('bg-gradient-to-br', 'from-pink-600', 'via-purple-700', 'to-blue-800');
            mainHeader.classList.add('bg-purple-900/80', 'border-pink-500/20', 'text-white');
            if (navContainer) navContainer.classList.add('text-pink-200');
            if (headerSearch) headerSearch.classList.add('bg-purple-800/30', 'border-pink-500/30', 'text-white', 'placeholder:text-pink-400/50', 'focus:ring-pink-500/50');
            break;
        case 'iidk':
            bgOverlay.classList.add('bg-gradient-to-br', 'from-orange-500', 'to-red-600');
            mainHeader.classList.add('bg-orange-900/80', 'border-orange-500/20', 'text-white');
            if (navContainer) navContainer.classList.add('text-orange-200');
            if (headerSearch) headerSearch.classList.add('bg-orange-800/30', 'border-orange-500/30', 'text-white', 'placeholder:text-orange-400/50', 'focus:ring-orange-500/50');
            break;
        case 'custom':
            bgOverlay.style.backgroundImage = `url('${customUrl}')`;
            mainHeader.classList.add('bg-black/60', 'border-white/10', 'text-white');
            if (navContainer) navContainer.classList.add('text-zinc-300');
            if (headerSearch) headerSearch.classList.add('bg-white/5', 'border-white/10', 'text-white', 'placeholder:text-zinc-600', 'focus:ring-emerald-500/50');
            break;
        default:
            bgOverlay.classList.add('bg-[#0a0a0c]');
            mainHeader.classList.add('bg-[#0a0a0c]/80', 'border-white/5', 'text-zinc-100');
            if (navContainer) navContainer.classList.add('text-zinc-400');
            if (headerSearch) headerSearch.classList.add('bg-white/5', 'border-white/10', 'text-zinc-100', 'placeholder:text-zinc-600', 'focus:ring-emerald-500/50');
            break;
    }
};

window.toggleFullscreen = () => {
    const iframe = document.getElementById('game-iframe');
    if (!iframe) return;

    if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
    } else if (iframe.mozRequestFullScreen) { // Firefox
        iframe.mozRequestFullScreen();
    } else if (iframe.webkitRequestFullscreen) { // Chrome, Safari and Opera
        iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) { // IE/Edge
        iframe.msRequestFullscreen();
    }
};

window.loadVideo = () => {
    const input = document.getElementById('youtube-url-input');
    const val = input.value.trim();
    if (!val) return;

    let videoId;
    
    // Extract ID from various YouTube URL formats
    if (val.includes('youtube.com/watch?v=')) {
        videoId = val.split('v=')[1].split('&')[0];
    } else if (val.includes('youtu.be/')) {
        videoId = val.split('youtu.be/')[1].split('?')[0];
    } else if (val.includes('youtube.com/embed/')) {
        videoId = val.split('embed/')[1].split('?')[0];
    } else {
        // Assume it's a direct ID
        videoId = val;
    }

    if (videoId) {
        currentVideoId = videoId;
        render();
    } else {
        alert('Invalid YouTube URL or Video ID');
    }
};

function renderTrusted() {
    if (!isTrusted) {
        mainContent.innerHTML = `
            <div class="max-w-md mx-auto py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <h2 class="text-2xl font-bold mb-2">Trusted Access</h2>
                    <p class="text-zinc-500 mb-6">Enter the access code to enter the trusted area.</p>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-zinc-400 mb-1">Access Code</label>
                            <input 
                                type="password" 
                                id="trusted-code-input"
                                class="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                placeholder="•••••"
                            />
                        </div>
                        <button 
                            onclick="window.joinTrusted()"
                            class="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Verify Access
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (selectedGame) {
        renderPlayer();
        return;
    }

    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">User Logs & Moderation</h2>
                            <p class="text-zinc-500 text-sm">Manage active users and mute status</p>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto mb-8">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white/5 text-zinc-500 text-sm">
                                <th class="pb-4 font-medium">Username</th>
                                <th class="pb-4 font-medium">Status</th>
                                <th class="pb-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${registeredUsers.map(user => `
                                <tr class="group">
                                    <td class="py-4 font-medium">${user.username}</td>
                                    <td class="py-4">
                                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.isMuted ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}">
                                            ${user.isMuted ? (user.mutedUntil ? `Muted until ${new Date(user.mutedUntil.toMillis()).toLocaleTimeString()}` : 'Muted') : 'Active'}
                                        </span>
                                    </td>
                                    <td class="py-4">
                                        <div class="flex items-center gap-2">
                                            <button 
                                                onclick="window.promptMute('${user.username}', ${user.isMuted})"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                                title="${user.isMuted ? 'Unmute' : 'Mute'}"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${user.isMuted ? '<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>' : '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'}</svg>
                                            </button>
                                            <button 
                                                onclick="window.triggerJumpscare('${user.uid}')"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors text-zinc-400 hover:text-red-500"
                                                title="Jumpscare"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                            </button>
                                            <button 
                                                onclick="window.promptPrivateMessage('${user.username}', '${user.username}')"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                                title="Send Private Message"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">Game Suggestions</h2>
                            <p class="text-zinc-500 text-sm">Review user suggested games</p>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto mb-8">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white/5 text-zinc-500 text-sm">
                                <th class="pb-4 font-medium">Username</th>
                                <th class="pb-4 font-medium">Title</th>
                                <th class="pb-4 font-medium">Description</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${suggestions.map(s => `
                                <tr class="group">
                                    <td class="py-4 font-medium">${s.username}</td>
                                    <td class="py-4">${s.title}</td>
                                    <td class="py-4 text-zinc-400">${s.desc}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">Trusted Dashboard</h2>
                        <p class="text-zinc-500 text-sm">Welcome to the secure management area.</p>
                    </div>
                </div>

                <div class="space-y-8">
                    <div class="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="m3 21 1.9-1.9"></path><path d="M20.2 20.2 22 22"></path><path d="m20 7 2 2"></path><path d="M2 9.5V11a10 10 0 0 0 16 8l2.5 2.5"></path><path d="M22 5.5V4a10 10 0 0 0-16-8L3.5-1.5"></path><path d="m15 11-4 4"></path><path d="m9 5 2 2"></path></svg>
                            Global Message Announce
                        </h3>
                        <p class="text-zinc-500 text-sm mb-4">Send a message that will appear as a popup for every active user on the site for 5 seconds.</p>
                        <div class="flex gap-2">
                            <input 
                                type="text" 
                                id="announce-input"
                                class="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                placeholder="Enter announcement message..."
                            />
                            <button 
                                onclick="window.sendAnnouncement()"
                                class="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    Secret Games
                </h3>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    ${TRUSTED_GAMES.map(game => `
                        <div 
                            onclick="window.selectTrustedGame('${game.id}')"
                            class="group cursor-pointer"
                        >
                            <div class="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800 border border-white/5 group-hover:border-emerald-500/50 transition-all shadow-lg">
                                <img 
                                    src="${game.thumbnail}" 
                                    alt="${game.title}"
                                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    referrerpolicy="no-referrer"
                                />
                            </div>
                            <h4 class="mt-2 text-sm font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors truncate">
                                ${game.title}
                            </h4>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
                    Admin Codes
                </h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </div>
                            <div>
                                <p class="font-medium text-white">Clear Chat Code</p>
                                <p class="text-xs text-zinc-500">Used to wipe all messages from the global chat.</p>
                            </div>
                        </div>
                        <code class="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-lg font-mono font-bold text-lg border border-emerald-500/20">15867</code>
                    </div>
                </div>
            </div>
        </div>
    `;
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
                <div class="group cursor-pointer game-card transition-all duration-300" onclick="window.selectGame('${game.id}')">
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
                        onclick="window.closeGame()"
                        class="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                    </button>
                    <h2 class="text-2xl font-bold">${selectedGame.title}</h2>
                </div>
                <div class="flex items-center gap-2">
                    <button 
                        onclick="window.toggleFullscreen()"
                        class="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        title="Toggle Fullscreen"
                    >
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
                    id="game-iframe"
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
                            onclick="window.joinChat()"
                            id="join-btn"
                            class="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Join Chat
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
                        <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    </div>
                    <p class="text-zinc-500 text-sm">${userCount} users online</p>
                </div>
                <div class="flex items-center gap-4">
                    <button 
                        onclick="window.promptClearChat()"
                        class="text-xs bg-white/5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 px-3 py-1 rounded-lg transition-all border border-white/5"
                    >
                        Clear Chat
                    </button>
                    <button 
                        onclick="window.leaveChat()"
                        class="text-sm text-zinc-500 hover:text-red-400 transition-colors"
                    >
                        Leave Chat
                    </button>
                </div>
            </div>

            <div class="flex-1 bg-zinc-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col backdrop-blur-xl">
                <div id="chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4">
                    ${messages.map(msg => {
                        if (msg.type === 'system') {
                            return `<div class="text-center text-xs text-zinc-600 italic">${msg.text}</div>`;
                        }
                        const isMe = msg.username === chatUsername;
                        return `
                            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} group">
                                <div class="flex items-center gap-2 mb-1 px-2">
                                    <span class="text-[10px] text-zinc-500">${msg.username}</span>
                                    ${msg.isEdited ? '<span class="text-[8px] text-zinc-600 italic">(edited)</span>' : ''}
                                </div>
                                <div class="relative max-w-[80%] flex flex-col gap-2">
                                    <div class="px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-emerald-500 text-black rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}">
                                        ${msg.imageUrl ? `
                                            <img src="${msg.imageUrl}" class="w-20 h-20 object-cover rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" onclick="window.open('${msg.imageUrl}', '_blank')" />
                                        ` : ''}
                                        ${msg.text}
                                    </div>
                                    ${isMe ? `
                                        <div class="absolute -left-16 top-0 hidden group-hover:flex items-center gap-1">
                                            <button onclick="window.editMessagePrompt('${msg.id}')" class="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-emerald-400 transition-all">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>
                                            </button>
                                            <button onclick="window.deleteMessage('${msg.id}')" class="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-400 transition-all">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="p-4 border-t border-white/5 bg-black/20">
                    <div class="flex items-center gap-2">
                        <label class="cursor-pointer p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-emerald-400 transition-all">
                            <input type="file" id="chat-image-input" class="hidden" accept="image/*" onchange="window.handleImageSelect(this)" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>
                        </label>
                        <div class="flex-1 relative">
                            <input 
                                type="text" 
                                id="chat-input"
                                class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                placeholder="Type a message..."
                            />
                            <div id="image-preview" class="hidden absolute bottom-full left-0 mb-2 p-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl">
                                <img id="preview-img" src="" class="h-20 rounded-lg" />
                                <button onclick="window.clearImagePreview()" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                        <button 
                            onclick="window.sendChatMessage()"
                            class="bg-emerald-500 hover:bg-emerald-600 text-black p-2 rounded-xl transition-all"
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
            if (e.key === 'Enter') window.sendChatMessage();
        });
        chatInput.focus();
    }
}

// Firestore Error Handling
const OperationType = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    LIST: 'list',
    GET: 'get',
    WRITE: 'write',
};

let lastAnnouncementId = null;
function initAnnouncements() {
    if (!db || unsubscribeAnnouncements) return;
    
    // Listen for new announcements
    const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(1));
    unsubscribeAnnouncements = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return;
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        // Skip the first one on load to avoid showing old announcements
        if (lastAnnouncementId === null) {
            lastAnnouncementId = doc.id;
            return;
        }
        
        if (doc.id !== lastAnnouncementId) {
            lastAnnouncementId = doc.id;
            // Check if it's a private message for someone else
            if (data.targetUsername && data.targetUsername !== chatUsername) return;
            showAnnouncement(data.text);
        }
    });
}

function showAnnouncement(text) {
    const container = document.getElementById('announcement-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'mb-4 bg-emerald-500 text-black font-bold py-4 px-8 rounded-2xl shadow-2xl shadow-emerald-500/40 animate-in fade-in zoom-in slide-in-from-top-4 duration-300 flex items-center gap-3 border-2 border-white/20 pointer-events-auto';
    el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <span>${text}</span>
    `;
    
    container.appendChild(el);

    setTimeout(() => {
        el.classList.add('animate-out', 'fade-out', 'zoom-out', 'slide-out-to-top-4');
        setTimeout(() => el.remove(), 300);
    }, 5000);
}

let isSendingAnnounce = false;
window.sendAnnouncement = async () => {
    const input = document.getElementById('announce-input');
    const text = input.value.trim();
    if (!text || !db || isSendingAnnounce) return;

    isSendingAnnounce = true;
    try {
        await addDoc(collection(db, 'announcements'), {
            text: text,
            timestamp: serverTimestamp()
        });
        input.value = '';
        alert("Announcement sent!");
    } catch (e) {
        console.error("Announce error:", e);
        alert("Failed to send announcement: " + e.message);
    } finally {
        isSendingAnnounce = false;
    }
};

window.joinTrusted = () => {
    const input = document.getElementById('trusted-code-input');
    if (input.value === TRUSTED_CODE) {
        isTrusted = true;
        render();
    } else {
        alert("Incorrect access code.");
    }
};

window.promptMute = async (username, currentMuted) => {
    if (currentMuted) {
        if (confirm(`Unmute ${username}?`)) {
            try {
                await updateDoc(doc(db, 'users', username), {
                    isMuted: false,
                    mutedUntil: null
                });
            } catch (e) {
                console.error("Unmute failed:", e);
            }
        }
        return;
    }

    const duration = prompt(`Mute ${username} for how many minutes? (Leave empty for permanent)`);
    if (duration === null) return;

    const mutedUntil = duration ? new Date(Date.now() + parseInt(duration) * 60000) : null;

    try {
        await updateDoc(doc(db, 'users', username), {
            isMuted: true,
            mutedUntil: mutedUntil
        });
        alert(`${username} muted.`);
    } catch (e) {
        console.error("Mute failed:", e);
        alert("Failed to mute user.");
    }
};

window.promptPrivateMessage = async (username, name) => {
    const msg = prompt(`Send a private announcement to ${name}:`);
    if (!msg) return;

    try {
        await addDoc(collection(db, 'announcements'), {
            text: `[PRIVATE] ${msg}`,
            timestamp: serverTimestamp(),
            targetUsername: username
        });
        alert("Message sent!");
    } catch (e) {
        console.error("Private message failed:", e);
        alert("Failed to send message.");
    }
};

function handleFirestoreError(error, operationType, path) {
    const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth?.currentUser?.uid,
            email: auth?.currentUser?.email,
            emailVerified: auth?.currentUser?.emailVerified,
            isAnonymous: auth?.currentUser?.isAnonymous,
        },
        operationType,
        path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    
    // Show user-friendly error in UI if possible
    const errorEl = document.getElementById('username-error');
    if (errorEl) {
        if (error.message?.includes('permission-denied')) {
            errorEl.textContent = "Permission denied. Please try a different username.";
        } else {
            errorEl.textContent = "Connection issue. Please try again in a moment.";
        }
        errorEl.classList.remove('hidden');
    }
    
    throw new Error(JSON.stringify(errInfo));
}

function initFirebaseChat() {
    if (!db) {
        console.warn("Firebase not ready yet, retrying...");
        setTimeout(initFirebaseChat, 500);
        return;
    }

    initAnnouncements();

    if (unsubscribeMessages) unsubscribeMessages();
    if (unsubscribeUsers) unsubscribeUsers();

    // Listen for messages
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (currentView === 'chat') renderChat();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'messages'));

    // Listen for active users
    const usersQ = query(collection(db, 'active_users'));
    unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
        const now = Date.now();
        const active = snapshot.docs.filter(doc => {
            const data = doc.data();
            const lastSeen = data.lastSeen?.toMillis() || 0;
            return (now - lastSeen) < 120000; // Active in last 2 minutes
        });
        userCount = active.length;
        if (currentView === 'chat') renderChat();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'active_users'));

    // Heartbeat
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(async () => {
        if (chatUsername && db) {
            try {
                const userRef = doc(db, 'active_users', chatUsername);
                await setDoc(userRef, { 
                    username: chatUsername, 
                    lastSeen: serverTimestamp() 
                }, { merge: true });
            } catch (e) {
                console.error("Heartbeat error:", e);
            }
        }
    }, 30000);
}

window.joinChat = async () => {
    const input = document.getElementById('chat-username-input');
    const username = input.value.trim();
    if (!username || !db) return;

    const errorEl = document.getElementById('username-error');
    if (errorEl) errorEl.classList.add('hidden');

    try {
        // Check if user is muted
        const userRef = doc(db, 'users', username);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.isMuted) {
                if (data.mutedUntil && data.mutedUntil.toMillis() > Date.now()) {
                    const remaining = Math.ceil((data.mutedUntil.toMillis() - Date.now()) / 60000);
                    if (errorEl) {
                        errorEl.textContent = `This username is muted for ${remaining} more minutes.`;
                        errorEl.classList.remove('hidden');
                    }
                    return;
                } else if (!data.mutedUntil) {
                    if (errorEl) {
                        errorEl.textContent = "This username is permanently muted.";
                        errorEl.classList.remove('hidden');
                    }
                    return;
                }
            }
        }

        // Check if username is active
        const activeRef = doc(db, 'active_users', username);
        const activeSnap = await getDoc(activeRef);
        if (activeSnap.exists()) {
            const data = activeSnap.data();
            const lastSeen = data.lastSeen?.toMillis() || 0;
            if ((Date.now() - lastSeen) < 120000) {
                if (errorEl) {
                    errorEl.textContent = "Username already taken and active.";
                    errorEl.classList.remove('hidden');
                }
                return;
            }
        }

        // Create/Update user profile for moderation
        await setDoc(userRef, {
            username: username,
            lastSeen: serverTimestamp(),
            isMuted: userSnap.exists() ? (userSnap.data().isMuted || false) : false,
            mutedUntil: userSnap.exists() ? (userSnap.data().mutedUntil || null) : null
        }, { merge: true });

        // Set active status
        await setDoc(activeRef, { 
            username: username, 
            lastSeen: serverTimestamp() 
        });

        chatUsername = username;
        localStorage.setItem('chatUsername', chatUsername);
        
        await addDoc(collection(db, 'messages'), {
            text: `${username} joined the chat`,
            username: 'System',
            timestamp: serverTimestamp(),
            type: 'system'
        });

        initFirebaseChat();
        render();
    } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'join_chat');
    }
};

window.leaveChat = async () => {
    if (chatUsername && db) {
        try {
            const userRef = doc(db, 'active_users', chatUsername);
            await deleteDoc(userRef);
            
            await addDoc(collection(db, 'messages'), {
                text: `${chatUsername} left the chat`,
                username: 'System',
                timestamp: serverTimestamp(),
                type: 'system'
            });
        } catch (e) {
            console.error("Leave error:", e);
        }
    }

    chatUsername = '';
    localStorage.removeItem('chatUsername');
    if (unsubscribeMessages) unsubscribeMessages();
    if (unsubscribeUsers) unsubscribeUsers();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    messages = [];
    render();
};

window.sendChatMessage = async () => {
    // Check mute status locally first
    if (chatUsername && db) {
        try {
            const userSnap = await getDoc(doc(db, 'users', chatUsername));
            if (userSnap.exists()) {
                const data = userSnap.data();
                if (data.isMuted) {
                    if (data.mutedUntil && data.mutedUntil.toMillis() > Date.now()) {
                        const remaining = Math.ceil((data.mutedUntil.toMillis() - Date.now()) / 60000);
                        alert(`You are muted for ${remaining} more minutes.`);
                        return;
                    } else if (!data.mutedUntil) {
                        alert("You are permanently muted.");
                        return;
                    }
                }
            }
        } catch (e) {
            console.error("Mute check failed:", e);
        }
    }

    const now = Date.now();
    if (now - lastMessageSentAt < SLOW_MODE_MS) {
        const remaining = Math.ceil((SLOW_MODE_MS - (now - lastMessageSentAt)) / 1000);
        alert(`Slow mode active. Please wait ${remaining}s.`);
        return;
    }

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text && !selectedImageBase64) return;
    if (!chatUsername || !db) return;

    try {
        await addDoc(collection(db, 'messages'), {
            text: text || (selectedImageBase64 ? "Sent an image" : ""),
            username: chatUsername,
            timestamp: serverTimestamp(),
            type: 'message',
            imageUrl: selectedImageBase64 || null
        });
        lastMessageSentAt = Date.now();
        input.value = '';
        window.clearImagePreview();
    } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'messages');
    }
};

let selectedImageBase64 = null;

window.handleImageSelect = (input) => {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 800000) { // Keep it under 800KB for Firestore 1MB limit
        alert("Image is too large. Please select an image under 800KB.");
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageBase64 = e.target.result;
        const preview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        previewImg.src = selectedImageBase64;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
};

window.clearImagePreview = () => {
    selectedImageBase64 = null;
    const preview = document.getElementById('image-preview');
    if (preview) preview.classList.add('hidden');
    const input = document.getElementById('chat-image-input');
    if (input) input.value = '';
};

window.editMessagePrompt = async (id) => {
    console.log("Attempting to edit message:", id);
    const msg = messages.find(m => m.id === id);
    if (!msg) {
        console.error("Message not found in local state:", id);
        alert("Error: Message not found. Try refreshing.");
        return;
    }

    const newText = prompt("Edit your message:", msg.text);
    if (newText === null || newText.trim() === "" || newText === msg.text) return;

    try {
        const msgRef = doc(db, 'messages', id);
        await updateDoc(msgRef, { 
            text: newText.trim(),
            isEdited: true
        });
        console.log("Message edited successfully:", id);
    } catch (e) {
        console.error("Edit error:", e);
        alert("Failed to edit message: " + e.message);
    }
};

window.deleteMessage = async (id) => {
    console.log("Attempting to delete message:", id);
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
        await deleteDoc(doc(db, 'messages', id));
        console.log("Message deleted successfully:", id);
    } catch (e) {
        console.error("Delete error:", e);
        alert("Failed to delete message: " + e.message);
    }
};

window.promptClearChat = async () => {
    console.log("Prompting clear chat...");
    const code = prompt("Enter admin code to clear chat:");
    if (code === "15867") {
        try {
            const q = query(collection(db, 'messages'));
            const snapshot = await getDocs(q);
            console.log(`Found ${snapshot.size} messages to clear.`);
            
            const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'messages', docSnap.id)));
            await Promise.all(deletePromises);
            
            await addDoc(collection(db, 'messages'), {
                text: "Chat was cleared by an administrator.",
                username: 'System',
                timestamp: serverTimestamp(),
                type: 'system'
            });
            console.log("Chat cleared successfully.");
        } catch (e) {
            console.error("Clear error:", e);
            alert("Failed to clear chat: " + e.message);
        }
    } else if (code !== null) {
        alert("Incorrect code.");
    }
};

// Auto-clear logic: Clear messages older than 15 minutes
setInterval(async () => {
    if (!db) return;
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const oldMessages = messages.filter(msg => {
        const ts = msg.timestamp?.toMillis() || 0;
        return ts < fifteenMinsAgo && msg.type !== 'system';
    });

    if (oldMessages.length > 0) {
        console.log(`Auto-clearing ${oldMessages.length} old messages...`);
        const deletePromises = oldMessages.map(msg => deleteDoc(doc(db, 'messages', msg.id)));
        await Promise.all(deletePromises);
    }
}, 60000); // Check every minute

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
    if (chatUsername) initFirebaseChat();
    render();
});

navOthers.addEventListener('click', () => {
    currentView = 'others';
    render();
});

navVideo.addEventListener('click', () => {
    currentView = 'video';
    render();
});

navThemes.addEventListener('click', () => {
    currentView = 'themes';
    render();
});

navSuggest.addEventListener('click', () => {
    currentView = 'suggest';
    render();
});

navTrusted.addEventListener('click', () => {
    currentView = 'trusted';
    render();
});

// Initial render
render();
if (chatUsername) initFirebaseChat();

function checkEntryLogin() {
    const overlay = document.getElementById('entry-login-overlay');
    overlay.classList.remove('hidden');
    document.getElementById('entry-login-btn').onclick = async () => {
        const name = document.getElementById('entry-name-input').value.trim();
        if (name.length >= 2) {
            sessionStorage.setItem('user_name', name);
            overlay.classList.add('hidden');
            if (auth.currentUser) {
                await registerUser(auth.currentUser.uid, name);
            }
        }
    };
}

async function registerUser(uid, name) {
    if (!db) return;
    await setDoc(doc(db, 'users', uid), {
        username: name,
        uid: uid,
        isMuted: false,
        jumpscareTriggered: false,
        lastSeen: serverTimestamp()
    }, { merge: true });
}

function initUserListeners(uid) {
    if (!db) return;
    onSnapshot(doc(db, 'users', uid), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.jumpscareTriggered) {
                triggerJumpscareEffect(uid);
            }
        }
    });
}

function triggerJumpscareEffect(uid) {
    const overlay = document.getElementById('jumpscare-overlay');
    overlay.classList.remove('hidden');
    
    // Reset the GIF by re-setting the src
    const img = document.getElementById('jumpscare-img');
    const originalSrc = img.src;
    img.src = '';
    img.src = originalSrc;

    setTimeout(async () => {
        overlay.classList.add('hidden');
        if (db) {
            await updateDoc(doc(db, 'users', uid), {
                jumpscareTriggered: false
            });
        }
    }, 3000); // GIF duration approx 3 seconds
}

window.triggerJumpscare = async (uid) => {
    if (!db) return;
    await updateDoc(doc(db, 'users', uid), {
        jumpscareTriggered: true
    });
};


