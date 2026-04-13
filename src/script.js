import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';
import katex from 'katex';
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
} from 'firebase/firestore';

// Initialize Firebase variables
let db = null;
let auth = null;
const mainContent = document.getElementById('main-content');

// Fetch config and initialize Firebase
fetch('/firebase-applet-config.json')
    .then(response => {
        console.log("Config fetch response:", response);
        return response.json();
    })
    .then(config => {
        console.log("Config loaded:", config);
        const app = initializeApp(config);
        db = getFirestore(app, config.firestoreDatabaseId);
        auth = getAuth(app);
        console.log("Firebase initialized, db:", db);
        window.db = db; // For debugging if needed
        
        signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User logged in:", user.uid);
                initAdminListeners();
                initUserListeners(user.uid);
                checkEntryLogin();
            }
        });

        if (chatUsername) initFirebaseChat();
        render(); // Global render call
    })
    .catch(err => {
        console.error("Firebase initialization failed:", err);
    });

const games = [
    {
        "id": "csgo-clicker",
        "title": "CS:GO Clicker",
        "thumbnail": "https://s.yimg.com/fz/api/res/1.2/xrJXp46VQQK.ekX3EV1uEg--~C/YXBwaWQ9c3JjaGRkO2ZpPWZpbGw7aD0yNDA7cT0xMDA7dz0yNDA-/https://s.yimg.com/cv/apiv2/default/20230504/cs-go.png",
        "iframeUrl": "csgo-clicker.html",
        "category": "Action"
    },
    {
        "id": "basketball-stars",
        "title": "Basketball Stars",
        "thumbnail": "https://img-cdn.heygame.io/gameimages/8efc8be9-15e4-4a70-8d5d-3082252dd12e-Basketball%20Stars.webp",
        "iframeUrl": "basketball-stars.html",
        "category": "Sports"
    },
    {
        "id": "pvz",
        "title": "Plants Vs Zombies",
        "thumbnail": "https://vignette.wikia.nocookie.net/logopedia/images/0/01/Pvz_logo_stacked_rgb.png/revision/latest?cb=20120408101754",
        "iframeUrl": "pvz.html",
        "category": "Strategy"
    },
    {
        "id": "minecraft",
        "title": "Minecraft",
        "thumbnail": "https://logos-world.net/wp-content/uploads/2020/04/Minecraft-Emblem.jpg",
        "iframeUrl": "minecraft.html",
        "category": "Sandbox"
    },
    {
        "id": "retrobowl",
        "title": "Retro Bowl",
        "thumbnail": "https://i.ibb.co/ZX99dDz/retro-bowl-unblocked.jpg",
        "iframeUrl": "https://game316009.konggames.com/gamez/0031/6009/live/index.html",
        "category": "Sports"
    },
    {
        "id": "8ball",
        "title": "8 Ball Pool",
        "thumbnail": "https://img-cdn.heygame.io/gameimages/b16adad8-cff5-4274-84a3-3bc8e1a6205c-8%20Ball%20Pool%20Online.webp",
        "iframeUrl": "8ball.html",
        "category": "Sports"
    },
    {
        "id": "bloons-td",
        "title": "Bloons TD",
        "thumbnail": "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/en_US/games/switch/b/bloons-td-5-switch/hero",
        "iframeUrl": "bloons-td.html",
        "category": "Strategy"
    },
    {
        "id": "blackjack",
        "title": "BlackJack",
        "thumbnail": "https://www.888casino.com/blog/sites/newblog.888casino.com/files/inline-images/blackjack_1.jpg",
        "iframeUrl": "blackjack-game.html",
        "category": "Casino"
    },
    {
        "id": "spacebar-clicker",
        "title": "Spacebar Clicker",
        "thumbnail": "https://tse2.mm.bing.net/th/id/OIP.BaaQE0h22Ri8w4h2MAOZwgHaHa?pid=Api&h=220&P=0",
        "iframeUrl": "spacebar-clicker.html",
        "category": "Action"
    },
    {
        "id": "geometry-dash",
        "title": "Geometry Dash",
        "thumbnail": "https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/2a/6f/ea/2a6feaae-3202-5356-eb1b-409208bcb0af/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png",
        "iframeUrl": "geometry-dash.html",
        "category": "Action"
    },
    {
        "id": "crazy-cattle-3d",
        "title": "Crazy Cattle 3D",
        "thumbnail": "https://rawcdn.githack.com/genizy/cc3d-mobile/main/CrazyCattle3D.png",
        "iframeUrl": "crazy-cattle-3d.html",
        "category": "Adventure"
    },
    {
        "id": "ragdoll-hit",
        "title": "Ragdoll Hit",
        "thumbnail": "https://rawcdn.githack.com/genizy/google-class/main/ragdoll-hit/thumbnail.png",
        "iframeUrl": "ragdoll-hit.html",
        "category": "Action"
    },
    {
        "id": "ultrakill",
        "title": "ULTRAKILL",
        "thumbnail": "https://wallpapers.com/images/hd/ultrakill-game-artwork-xgsd9l8nrbkuldvg.jpg",
        "iframeUrl": "ultrakill.html",
        "category": "Action"
    },
    {
        "id": "drive-mad",
        "title": "Drive Mad",
        "thumbnail": "https://github.com/WanoCapy/ChickenKingsVault/blob/main/drivemad.png?raw=true",
        "iframeUrl": "drive-mad.html",
        "category": "Racing"
    },
    {
        "id": "melon-playground",
        "title": "Melon Playground",
        "thumbnail": "https://i.pinimg.com/736x/bd/e7/f5/bde7f58165f0359b49ba628f16727db5.jpg",
        "iframeUrl": "melon-playground.html",
        "category": "Sandbox"
    },
    {
        "id": "granny",
        "title": "Granny",
        "thumbnail": "https://github.com/WanoCapy/ChickenKingsVault/blob/main/gameimages/granny.png?raw=true",
        "iframeUrl": "granny.html",
        "category": "Horror"
    },
    {
        "id": "infinite-craft",
        "title": "Infinite Craft",
        "thumbnail": "https://primagames.com/wp-content/uploads/2024/02/infinite-craft-adam-eve.jpg?fit=1200%2C675",
        "iframeUrl": "infinite-craft.html",
        "category": "Puzzle"
    },
    {
        "id": "snow-rider-3d",
        "title": "Snow Rider 3D",
        "thumbnail": "https://play-lh.googleusercontent.com/uN5CywrCDvsutWq8RaRa5wPJryI1pkDhktF-zfAhwzx875lftsAIDMtYLbgUM1k6VwuoVM5HjYKCrebmI1uMKdc",
        "iframeUrl": "snow-rider-3d.html",
        "category": "Sports"
    },
    {
        "id": "sonic-but-better",
        "title": "Sonic but Better..?",
        "thumbnail": "https://ichef.bbci.co.uk/news/976/cpsprodpb/FB73/production/_119017346_sonicoldemblem1.jpg",
        "iframeUrl": "sonic-but-better.html",
        "category": "Action"
    },
    {
        "id": "baldis-basics-classic",
        "title": "Baldi's Basics Classic",
        "thumbnail": "https://github.com/WanoCapy/ChickenKingsVault/blob/main/gameimages/baldi'sbasicsplus.webp?raw=true",
        "iframeUrl": "baldis-basics.html",
        "category": "Horror"
    },
    {
        "id": "baldis-basics",
        "title": "Baldi's Basics Plus",
        "thumbnail": "https://i.ytimg.com/vi/7SKjBg1eslk/maxresdefault.jpg",
        "iframeUrl": "baldis-basics.html",
        "category": "Horror"
    },
    {
        "id": "fnaf1",
        "title": "Five Nights at Freddy's 1",
        "thumbnail": "https://image.api.playstation.com/vulcan/img/cfn/11307DoSLwchucsk9cIFbYAUkuJPuQv-VO-yZnBwENvMx2LIl8KhWu89t3V7zhDTFfE55wbSW5908XNkd_RJeNid8t4tbScw.png",
        "iframeUrl": "fnaf1.html",
        "category": "FNAF"
    },
    {
        "id": "fnaf2",
        "title": "Five Nights at Freddy's 2",
        "thumbnail": "https://tse1.mm.bing.net/th/id/OIP.WbMxAHSM184KwBFjFxyg8wHaEK?pid=Api&h=220&P=0",
        "iframeUrl": "fnaf2.html",
        "category": "FNAF"
    },
    {
        "id": "fnaf3",
        "title": "Five Nights at Freddy's 3",
        "thumbnail": "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000024638/08708de0a6534fc7ace6a3a76fa4a0a2294c27484a20d93146f66d392699ee5f",
        "iframeUrl": "fnaf3.html",
        "category": "FNAF"
    },
    {
        "id": "fnaf4",
        "title": "Five Nights at Freddy's 4",
        "thumbnail": "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/en_US/games/switch/f/five-nights-at-freddys-4-switch/hero",
        "iframeUrl": "fnaf4.html",
        "category": "FNAF"
    },
    {
        "id": "fnaf-ps",
        "title": "Five Nights at Freddy's Pizzeria Simulator",
        "thumbnail": "https://nintendoeverything.com/wp-content/uploads/freddy-fazbears-pizza-simulator-1.jpg",
        "iframeUrl": "fnaf-ps.html",
        "category": "FNAF"
    },
    {
        "id": "fnaf-ucn",
        "title": "FNAF UCN",
        "thumbnail": "https://play-lh.googleusercontent.com/pB7dsLLcRgADtFpEPeKc5mSyAn1E1JzrdQ1V7-Y5hizgub3G8e9UJIc5opC9mYXKSBw",
        "iframeUrl": "fnaf-ucn.html",
        "category": "FNAF"
    },
    {
        "id": "fnaf-world",
        "title": "Fnaf World",
        "thumbnail": "https://imag.malavida.com/mvimgbig/download-fs/fnaf-world-27444-3.jpg",
        "iframeUrl": "fnaf-world.html",
        "category": "FNAF"
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
let isOwner = false;
let registeredUsers = [];
let activeUsers = [];
let suggestions = [];
// Removed currentVideoId.
let currentTheme = localStorage.getItem('currentTheme') || 'default';
let customThemeUrl = localStorage.getItem('customThemeUrl') || '';
const SLOW_MODE_MS = 2000;
const TRUSTED_CODE = "00999";
const OWNER_CODE = "ImSoEpic";

function initAdminListeners() {
    if (!db) {
        setTimeout(initAdminListeners, 100);
        return;
    }
    onSnapshot(collection(db, 'users'), (snapshot) => {
        registeredUsers = snapshot.docs.map(doc => doc.data());
        if (currentView === 'trusted') render();
    });
    onSnapshot(collection(db, 'suggestions'), (snapshot) => {
        suggestions = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        if (currentView === 'trusted' || currentView === 'suggest') render();
    });
}

// const mainContent = document.getElementById('main-content');
const searchInput = document.getElementById('search-input');
const logo = document.getElementById('logo');
const navGames = document.getElementById('nav-games');
const navChat = document.getElementById('nav-chat');
const navThemes = document.getElementById('nav-themes');
const navSuggest = document.getElementById('nav-suggest');
const navTrusted = document.getElementById('nav-trusted');
const navCategories = document.getElementById('nav-categories');
const navAIChat = document.getElementById('nav-aichat');

navAIChat.addEventListener('click', () => {
    currentView = 'aichat';
    render();
});

function render() {
    console.log("Rendering...", { currentView, selectedGame });
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error("mainContent is null!");
        return;
    }
    console.log("mainContent found:", mainContent);
    applyTheme(currentTheme, customThemeUrl);
    if (currentView === 'chat') {
        renderChat();
    } else if (currentView === 'themes') {
        renderThemes();
    } else if (currentView === 'suggest') {
        renderSuggest();
    } else if (currentView === 'categories') {
        renderCategories();
    } else if (currentView === 'aichat') {
        renderAIChat();
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
    },
    {
        "id": "moto-x3m-winter",
        "title": "MOTO X3M WINTER",
        "thumbnail": "https://img1.ugamezone.com/201901/2019/0505/94/c/553161/original.jpg",
        "iframeUrl": "moto-x3m-winter.html"
    }
];

window.selectTrustedGame = (id) => {
    selectedGame = TRUSTED_GAMES.find(g => g.id === id);
    currentView = 'trusted'; // Keep the header state
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Removed renderOthers and associated cat generator functionality.

// Removed renderVideoPlayer.

// Removed unused code.

function renderSuggest() {
    mainContent.innerHTML = `
        <div class="max-w-2xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mb-8">
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

window.deleteSuggestion = async (id) => {
    if (!confirm("Are you sure you want to delete this suggestion?")) return;
    try {
        await deleteDoc(doc(db, 'suggestions', id));
    } catch (e) {
        console.error("Delete error:", e);
        alert("Failed to delete suggestion: " + e.message);
    }
};

window.purgeAllSuggestions = async () => {
    if (!confirm("Are you sure you want to delete ALL suggestions?")) return;
    try {
        const snapshot = await getDocs(collection(db, 'suggestions'));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        alert('All suggestions purged!');
    } catch (e) {
        console.error("Purge error:", e);
        alert("Failed to purge suggestions: " + e.message);
    }
};

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

// Removed loadVideo.

function renderCategories() {
    const categories = [...new Set(games.map(g => g.category))];
    mainContent.innerHTML = `
        <div class="max-w-7xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
            ${categories.map(cat => `
                <div class="space-y-4">
                    <h2 class="text-2xl font-bold text-white">${cat}</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${games.filter(g => g.category === cat).map(game => `
                            <button onclick="window.selectGame('${game.id}')" class="group relative overflow-hidden rounded-2xl aspect-video border border-white/10 hover:border-emerald-500/50 transition-all">
                                <img src="${game.thumbnail}" alt="${game.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerpolicy="no-referrer" />
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                                    <span class="font-bold text-white">${game.title}</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Removed joinTutorboi as it is no longer needed.

function renderAIChat() {
    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl h-[600px] flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">AI Chat</h2>
                    <button onclick="window.createNewAIChat()" class="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-xl transition-all">New Chat</button>
                </div>
                <div id="chat-messages" class="flex-1 overflow-y-auto mb-4 space-y-4"></div>
                <div class="flex gap-2">
                    <input type="file" id="image-upload" accept="image/*" class="hidden">
                    <button onclick="document.getElementById('image-upload').click()" class="bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-4 rounded-xl transition-all">Upload</button>
                    <input type="text" id="chat-input" placeholder="Type a message..." class="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all">
                    <button onclick="window.sendAIMessage()" class="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 px-6 rounded-xl transition-all">Send</button>
                </div>
            </div>
        </div>
    `;
}

let userAIChat = null;

window.sendAIMessage = async () => {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    if (!userAIChat) {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        userAIChat = ai.chats.create({
            model: "gemini-3-flash-preview",
            config: {
                systemInstruction: "You are a helpful AI assistant.",
            },
        });
    }

    // Add user message to UI
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML += `<div class="text-right text-white bg-emerald-600 p-2 rounded-lg">${message}</div>`;
    input.value = '';

    // Send message to Gemini
    const response = await userAIChat.sendMessage({ message });
    
    // Add AI response to UI
    const html = marked.parse(response.text);
    const renderedHtml = html.replace(/\$(.*?)\$/g, (match, p1) => {
        try {
            return katex.renderToString(p1, { throwOnError: false });
        } catch (e) {
            return match;
        }
    });
    
    chatMessages.innerHTML += `<div class="text-left text-white bg-zinc-700 p-2 rounded-lg">${renderedHtml}</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

window.createNewAIChat = () => {
    userAIChat = null;
    document.getElementById('chat-messages').innerHTML = '';
};

// Note: This needs to be called after renderAIChat is called, or use event delegation
document.addEventListener('change', async (e) => {
    if (e.target.id === 'image-upload') {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target.result.split(',')[1];
            const mimeType = file.type;

            // Add user image to UI
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML += `<div class="text-right"><img src="${event.target.result}" class="max-w-[200px] rounded-lg inline-block" /></div>`;

            if (!userAIChat) {
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                userAIChat = ai.chats.create({
                    model: "gemini-3-flash-preview",
                    config: {
                        systemInstruction: "You are a helpful AI assistant.",
                    },
                });
            }

            const response = await tutorboiChat.sendMessage({
                message: {
                    parts: [
                        { inlineData: { data: base64Image, mimeType } },
                        { text: "What is this?" }
                    ]
                }
            });
            const html = marked.parse(response.text);
            const renderedHtml = html.replace(/\$(.*?)\$/g, (match, p1) => {
                try {
                    return katex.renderToString(p1, { throwOnError: false });
                } catch (e) {
                    return match;
                }
            });
            chatMessages.innerHTML += `<div class="text-left text-white bg-zinc-700 p-2 rounded-lg">${renderedHtml}</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        reader.readAsDataURL(file);
    }
});

// ...

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
                    <button 
                        onclick="window.openUploadModal()"
                        class="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                        Upload Game
                    </button>
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
                                        <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${activeUsers.includes(user.username) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-500/20 text-zinc-500'}">
                                            ${activeUsers.includes(user.username) ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td class="py-4">
                                        <div class="flex items-center gap-2">
                                            <button 
                                                onclick="window.promptMute('${user.uid}', '${user.username}', ${user.isMuted})"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                                title="${user.isMuted ? 'Unmute' : 'Mute'}"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${user.isMuted ? '<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>' : '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'}</svg>
                                            </button>
                                            <button 
                                                onclick="window.openJumpscareModal('${user.uid}')"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors text-zinc-400 hover:text-red-500"
                                                title="Jumpscare"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                            </button>
                                            <button 
                                                onclick="window.removeUserFromLogs('${user.uid}')"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors text-zinc-400 hover:text-red-500"
                                                title="Remove"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                            <button 
                                                onclick="window.triggerFullscreen('${user.uid}')"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-blue-500/20 transition-colors text-zinc-400 hover:text-blue-500"
                                                title="Fullscreen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                                            </button>
                                            <button 
                                                onclick="window.promptImageScreen('${user.uid}')"
                                                class="p-2 rounded-lg bg-white/5 hover:bg-purple-500/20 transition-colors text-zinc-400 hover:text-purple-500"
                                                title="Image Screen"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
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
                    <button onclick="window.purgeAllSuggestions()" class="text-red-500 hover:text-red-400 text-sm font-bold">Purge All</button>
                </div>

                <div class="overflow-x-auto mb-8">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-white/5 text-zinc-500 text-sm">
                                <th class="pb-4 font-medium">Username</th>
                                <th class="pb-4 font-medium">Title</th>
                                <th class="pb-4 font-medium">Description</th>
                                <th class="pb-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${suggestions.map(s => `
                                <tr class="group">
                                    <td class="py-4 font-medium">${s.username}</td>
                                    <td class="py-4">${s.title}</td>
                                    <td class="py-4 text-zinc-400">${s.desc}</td>
                                    <td class="py-4">
                                        <button onclick="window.deleteSuggestion('${s.id}')" class="text-red-500 hover:text-red-400 text-sm">Delete</button>
                                    </td>
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

                    <div class="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            Image Management
                        </h3>
                        <p class="text-zinc-500 text-sm mb-4">Upload a new image to the site.</p>
                        <button id="open-image-upload-btn" class="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition-all">Upload Image</button>
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
    console.log("Rendering Grid...");
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

window.removeUser = async (uid) => {
    if (confirm("Are you sure you want to remove this user?")) {
        try {
            await deleteDoc(doc(db, 'users', uid));
            console.log("User removed successfully:", uid);
        } catch (e) {
            console.error("Remove error:", e);
            alert("Failed to remove user: " + e.message);
        }
    }
};


window.promptMute = async (uid, username, isMuted) => {
    if (isMuted) {
        try {
            await updateDoc(doc(db, 'users', uid), {
                isMuted: false,
                mutedUntil: null
            });
            alert(`${username} unmuted.`);
        } catch (e) {
            console.error("Unmute failed:", e);
            alert("Failed to unmute user.");
        }
    } else {
        const duration = prompt(`Mute ${username} for how many minutes? (Leave empty for permanent)`);
        if (duration === null) return;

        const mutedUntil = duration ? new Date(Date.now() + parseInt(duration) * 60000) : null;

        try {
            await updateDoc(doc(db, 'users', uid), {
                isMuted: true,
                mutedUntil: mutedUntil
            });
            alert(`${username} muted.`);
        } catch (e) {
            console.error("Mute failed:", e);
            alert("Failed to mute user.");
        }
    }
};

// ... existing code ...
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

document.addEventListener('visibilitychange', () => {
    console.log('Visibility changed to:', document.visibilityState);
    if (document.visibilityState === 'visible') {
        updateUserStatus('active');
    } else {
        updateUserStatus('inactive');
    }
});

function updateUserStatus(status) {
    if (!chatUsername) return;
    const userRef = doc(db, 'active_users', chatUsername);
    if (status === 'active') {
        setDoc(userRef, { username: chatUsername, lastSeen: serverTimestamp() });
    } else {
        deleteDoc(userRef);
    }
}

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
        activeUsers = active.map(doc => doc.data().username);
        userCount = active.length;
        if (currentView === 'chat') renderChat();
        if (currentView === 'trusted') render();
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

if (logo) {
    logo.addEventListener('click', () => {
        selectedGame = null;
        currentView = 'games';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        render();
    });
}

if (navGames) {
    navGames.addEventListener('click', () => {
        currentView = 'games';
        selectedGame = null;
        render();
    });
}

if (navChat) {
    navChat.addEventListener('click', () => {
        currentView = 'chat';
        if (chatUsername) initFirebaseChat();
        render();
    });
}

// ...

if (navThemes) {
    navThemes.addEventListener('click', () => {
        currentView = 'themes';
        render();
    });
}

if (navSuggest) {
    navSuggest.addEventListener('click', () => {
        currentView = 'suggest';
        render();
    });
}

if (navTrusted) {
    navTrusted.addEventListener('click', () => {
        currentView = 'trusted';
        render();
    });
}

if (navCategories) {
    navCategories.addEventListener('click', () => {
        currentView = 'categories';
        render();
    });
}

navAIChat.addEventListener('click', () => {
    currentView = 'aichat';
    render();
});

// ...

// Initial render
// render(); // Removed, now called inside Firebase init
if (chatUsername) initFirebaseChat();

function checkEntryLogin() {
    const overlay = document.getElementById('entry-login-overlay');
    if (sessionStorage.getItem('user_name')) {
        overlay.classList.add('hidden');
        return;
    }
    overlay.classList.remove('hidden');
    document.getElementById('entry-login-btn').onclick = async () => {
        const name = document.getElementById('entry-name-input').value.trim();
        if (name.length >= 2) {
            sessionStorage.setItem('user_name', name);
            overlay.classList.add('hidden');
            if (auth.currentUser) {
                console.log("Registering user:", auth.currentUser.uid, name);
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
    if (!db) {
        setTimeout(() => initUserListeners(uid), 100);
        return;
    }
    onSnapshot(doc(db, 'users', uid), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.jumpscareTriggered) {
                triggerJumpscareEffect(uid, data.jumpscareType || 1);
            }
            if (data.fullscreenTriggered) {
                window.toggleFullscreen();
                updateDoc(doc(db, 'users', uid), { fullscreenTriggered: false });
            }
            if (data.imageScreenTriggered) {
                window.showImageScreen(data.imageScreenTriggered);
                updateDoc(doc(db, 'users', uid), { imageScreenTriggered: null });
            }
        }
    });
}

function triggerJumpscareEffect(uid, type = 1) {
    const overlay = document.getElementById('jumpscare-overlay');
    const img = document.getElementById('jumpscare-img');
    const video = document.getElementById('jumpscare-video');
    const videoSource = video.querySelector('source');
    overlay.classList.remove('hidden');
    
    // Reset
    img.classList.add('hidden');
    video.classList.add('hidden');
    video.pause();
    video.currentTime = 0;

    if (type === 1) {
        // Jeff the Killer
        img.classList.remove('hidden');
        img.src = 'https://gifdb.com/images/high/jeff-the-killer-animated-face-laughing-ha67dpqdsbl9wx80.gif';
        setTimeout(() => {
            overlay.classList.add('hidden');
            if (db) {
                updateDoc(doc(db, 'users', uid), { jumpscareTriggered: false });
            }
        }, 3000);
    } else if (type === 2) {
        // Jumpscare 2
        img.classList.remove('hidden');
        const images = [
            'https://i.pinimg.com/474x/83/b0/87/83b087b2f75d6e8dc96bbe815a729799.jpg?nii=t',
            'https://static1.colliderimages.com/wordpress/wp-content/uploads/2023/01/analog-horror.jpg',
            'https://d3q27bh1u24u2o.cloudfront.net/news/LBB_-_New_40_2bKD7fT.png',
            'https://i.pinimg.com/236x/fc/28/9d/fc289d40780f057480a4adeb468bb370.jpg',
            'https://i.pinimg.com/originals/3b/41/d1/3b41d10814afbe160cfdc41fb0eca3f8.jpg',
            'https://preview.redd.it/the-source-of-all-the-tapping-i-heard-last-night-v0-anyvsoze8aha1.jpg?width=1080&crop=smart&auto=webp&s=7845a263b023cf244a6c40aff1c12a1834397db8'
        ];
        const lastImage = 'https://wallpaperaccess.com/full/14378199.jpg';
        const jumpSound = new Audio('https://videotourl.com/audio/1775867546961-6db9970d-d3ed-4052-9163-9432a61c5f29.mp3');
        jumpSound.play().catch(e => console.warn("Jump sound play interrupted:", e));

        // Jitter effect
        const jitterInterval = setInterval(() => {
            overlay.style.opacity = Math.random() > 0.5 ? '1' : '0';
        }, 50);

        // Image switching
        let imgIndex = 0;
        const switchInterval = setInterval(() => {
            img.src = images[imgIndex % images.length];
            imgIndex++;
        }, 100);

        setTimeout(() => {
            clearInterval(switchInterval);
            img.src = lastImage;
            setTimeout(() => {
                clearInterval(jitterInterval);
                jumpSound.pause();
                jumpSound.currentTime = 0;
                overlay.style.opacity = '1';
                overlay.classList.add('hidden');
                if (db) {
                    updateDoc(doc(db, 'users', uid), { jumpscareTriggered: false });
                }
            }, 3000);
        }, 3000);
    } else if (type === 3) {
        // Jumpscare 3
        video.classList.remove('hidden');
        videoSource.src = 'https://image2url.com/r2/default/videos/1775872381737-f4c3474e-a2af-40a0-a16d-4c81b7be8097.mp4';
        video.load();
        video.play().catch(e => console.warn("Video play interrupted:", e));
        
        video.onended = () => {
            overlay.classList.add('hidden');
            if (db) {
                updateDoc(doc(db, 'users', uid), { jumpscareTriggered: false });
            }
        };
    }
}

window.triggerJumpscare = async (uid, type = 1) => {
    if (!db) return;
    await updateDoc(doc(db, 'users', uid), {
        jumpscareTriggered: true,
        jumpscareType: type
    });
};

window.removeUserFromLogs = async (uid) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, 'users', uid));
        alert('User removed from logs. They will need to re-enter their name.');
    } catch (error) {
        console.error('Error removing user:', error);
        alert('Failed to remove user: ' + error.message);
    }
};

window.toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

window.triggerFullscreen = async (uid) => {
    if (!db) return;
    await updateDoc(doc(db, 'users', uid), {
        fullscreenTriggered: true
    });
};

window.promptImageScreen = (uid) => {
    currentJumpscareUid = uid; // Reuse this variable to store the target UID
    document.getElementById('image-upload-modal').classList.remove('hidden');
};

window.triggerImageScreen = async (uid, imageUrl) => {
    if (!db) return;
    await updateDoc(doc(db, 'users', uid), {
        imageScreenTriggered: imageUrl
    });
};

window.showImageScreen = (imageUrl) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[2000] bg-black flex items-center justify-center';
    overlay.innerHTML = `<img src="${imageUrl}" class="max-w-full max-h-full" referrerpolicy="no-referrer" />`;
    document.body.appendChild(overlay);
    
    document.documentElement.requestFullscreen();

    setTimeout(() => {
        document.body.removeChild(overlay);
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }, 3000);
};

window.openUploadModal = () => {
    document.getElementById('upload-game-modal').classList.remove('hidden');
};

const uploadCancelBtn = document.getElementById('upload-cancel-btn');
if (uploadCancelBtn) {
    uploadCancelBtn.addEventListener('click', () => {
        document.getElementById('upload-game-modal').classList.add('hidden');
    });
}

let currentJumpscareUid = null;

window.openJumpscareModal = (uid) => {
    currentJumpscareUid = uid;
    document.getElementById('jumpscare-modal').classList.remove('hidden');
};

const jumpscareCancelBtn = document.getElementById('jumpscare-cancel-btn');
if (jumpscareCancelBtn) {
    jumpscareCancelBtn.addEventListener('click', () => {
        document.getElementById('jumpscare-modal').classList.add('hidden');
    });
}

const jumpscare1Btn = document.getElementById('jumpscare-1-btn');
if (jumpscare1Btn) {
    jumpscare1Btn.addEventListener('click', () => {
        document.getElementById('jumpscare-modal').classList.add('hidden');
        window.triggerJumpscare(currentJumpscareUid, 1);
    });
}

const jumpscare2Btn = document.getElementById('jumpscare-2-btn');
if (jumpscare2Btn) {
    jumpscare2Btn.addEventListener('click', () => {
        document.getElementById('jumpscare-modal').classList.add('hidden');
        window.triggerJumpscare(currentJumpscareUid, 2);
    });
}

const jumpscare3Btn = document.getElementById('jumpscare-3-btn');
if (jumpscare3Btn) {
    jumpscare3Btn.addEventListener('click', () => {
        document.getElementById('jumpscare-modal').classList.add('hidden');
        window.triggerJumpscare(currentJumpscareUid, 3);
    });
}

const imageUploadCancelBtn = document.getElementById('image-upload-cancel-btn');
if (imageUploadCancelBtn) {
    imageUploadCancelBtn.addEventListener('click', () => {
        document.getElementById('image-upload-modal').classList.add('hidden');
    });
}

const imageUploadSubmitBtn = document.getElementById('image-upload-submit-btn');
if (imageUploadSubmitBtn) {
    imageUploadSubmitBtn.addEventListener('click', async () => {
        const url = document.getElementById('upload-image-url').value;
        if (url) {
            if (currentJumpscareUid) {
                window.triggerImageScreen(currentJumpscareUid, url);
                currentJumpscareUid = null; // Reset
            } else {
                // Here you would add logic to save the image URL, for now just log it
                console.log('Image uploaded:', url);
            }
            document.getElementById('image-upload-modal').classList.add('hidden');
            document.getElementById('upload-image-url').value = ''; // Clear input
            alert('Image uploaded successfully!');
        }
    });
}

const openImageUploadBtn = document.getElementById('open-image-upload-btn');
if (openImageUploadBtn) {
    openImageUploadBtn.addEventListener('click', () => {
        document.getElementById('image-upload-modal').classList.remove('hidden');
    });
}

const uploadSubmitBtn = document.getElementById('upload-submit-btn');
if (uploadSubmitBtn) {
    uploadSubmitBtn.addEventListener('click', async () => {
        const title = document.getElementById('upload-title').value;
        const thumbnail = document.getElementById('upload-thumbnail').value;
        const htmlContent = document.getElementById('upload-html').value;

        if (!title || !thumbnail || !htmlContent) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await addDoc(collection(db, 'games'), {
                title,
                thumbnail,
                htmlContent,
                uploaderUid: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });
            document.getElementById('upload-game-modal').classList.add('hidden');
            alert('Game uploaded successfully!');
            // Refresh games list if needed
        } catch (error) {
            console.error('Error uploading game:', error);
            alert('Failed to upload game');
        }
    });
}


