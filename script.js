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

// Navigation
const navGames = document.getElementById('nav-games');
const navChat = document.getElementById('nav-chat');
const navThemes = document.getElementById('nav-themes');
const navSuggest = document.getElementById('nav-suggest');
const navTrusted = document.getElementById('nav-trusted');

const navCategories = document.getElementById('nav-categories');
const navAiChat = document.getElementById('nav-aichat');

if (navGames) navGames.addEventListener('click', () => { currentView = 'games'; selectedGame = null; render(); });
if (navCategories) navCategories.addEventListener('click', () => { currentView = 'categories'; selectedGame = null; render(); });
if (navAiChat) navAiChat.addEventListener('click', () => { currentView = 'aichat'; selectedGame = null; render(); });
if (navChat) navChat.addEventListener('click', () => { currentView = 'chat'; selectedGame = null; render(); });
if (navThemes) navThemes.addEventListener('click', () => { currentView = 'themes'; selectedGame = null; render(); });
if (navSuggest) navSuggest.addEventListener('click', () => { currentView = 'suggest'; selectedGame = null; render(); });
if (navTrusted) navTrusted.addEventListener('click', () => { currentView = 'trusted'; selectedGame = null; render(); });

window.toggleFullscreen = () => {
    const iframe = document.getElementById('game-iframe');
    if (iframe) {
        if (iframe.requestFullscreen) iframe.requestFullscreen();
        else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
    }
};

const games = [
    { "id": "csgo-clicker", "title": "CS:GO Clicker", "thumbnail": "https://s.yimg.com/fz/api/res/1.2/xrJXp46VQQK.ekX3EV1uEg--~C/YXBwaWQ9c3JjaGRkO2ZpPWZpbGw7aD0yNDA7cT0xMDA7dz0yNDA-/https://s.yimg.com/cv/apiv2/default/20230504/cs-go.png", "iframeUrl": "csgo-clicker.html", "category": "Action" },
    { "id": "basketball-stars", "title": "Basketball Stars", "thumbnail": "https://img-cdn.heygame.io/gameimages/8efc8be9-15e4-4a70-8d5d-3082252dd12e-Basketball%20Stars.webp", "iframeUrl": "basketball-stars.html", "category": "Sports" },
    { "id": "pvz", "title": "Plants Vs Zombies", "thumbnail": "https://vignette.wikia.nocookie.net/logopedia/images/0/01/Pvz_logo_stacked_rgb.png/revision/latest?cb=20120408101754", "iframeUrl": "pvz.html", "category": "Strategy" },
    { "id": "minecraft", "title": "Minecraft", "thumbnail": "https://logos-world.net/wp-content/uploads/2020/04/Minecraft-Emblem.jpg", "iframeUrl": "minecraft.html", "category": "Sandbox" },
    { "id": "retrobowl", "title": "Retro Bowl", "thumbnail": "https://i.ibb.co/ZX99dDz/retro-bowl-unblocked.jpg", "iframeUrl": "https://game316009.konggames.com/gamez/0031/6009/live/index.html", "category": "Sports" },
    { "id": "8ball", "title": "8 Ball Pool", "thumbnail": "https://img-cdn.heygame.io/gameimages/b16adad8-cff5-4274-84a3-3bc8e1a6205c-8%20Ball%20Pool%20Online.webp", "iframeUrl": "8ball.html", "category": "Sports" },
    { "id": "bloons-td", "title": "Bloons TD", "thumbnail": "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/en_US/games/switch/b/bloons-td-5-switch/hero", "iframeUrl": "bloons-td.html", "category": "Strategy" },
    { "id": "blackjack", "title": "BlackJack", "thumbnail": "https://www.888casino.com/blog/sites/newblog.888casino.com/files/inline-images/blackjack_1.jpg", "iframeUrl": "blackjack-game.html", "category": "Casino" },
    { "id": "spacebar-clicker", "title": "Spacebar Clicker", "thumbnail": "https://tse2.mm.bing.net/th/id/OIP.BaaQE0h22Ri8w4h2MAOZwgHaHa?pid=Api&h=220&P=0", "iframeUrl": "spacebar-clicker.html", "category": "Action" },
    { "id": "geometry-dash", "title": "Geometry Dash", "thumbnail": "https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/2a/6f/ea/2a6feaae-3202-5356-eb1b-409208bcb0af/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png", "iframeUrl": "geometry-dash.html", "category": "Action" },
    { "id": "crazy-cattle-3d", "title": "Crazy Cattle 3D", "thumbnail": "https://rawcdn.githack.com/genizy/cc3d-mobile/main/CrazyCattle3D.png", "iframeUrl": "crazy-cattle-3d.html", "category": "Adventure" },
    { "id": "ragdoll-hit", "title": "Ragdoll Hit", "thumbnail": "https://rawcdn.githack.com/genizy/google-class/main/ragdoll-hit/thumbnail.png", "iframeUrl": "ragdoll-hit.html", "category": "Action" },
    { "id": "ultrakill", "title": "ULTRAKILL", "thumbnail": "https://wallpapers.com/images/hd/ultrakill-game-artwork-xgsd9l8nrbkuldvg.jpg", "iframeUrl": "ultrakill.html", "category": "Action" },
    { "id": "drive-mad", "title": "Drive Mad", "thumbnail": "https://github.com/WanoCapy/ChickenKingsVault/blob/main/drivemad.png?raw=true", "iframeUrl": "drive-mad.html", "category": "Racing" },
    { "id": "melon-playground", "title": "Melon Playground", "thumbnail": "https://i.pinimg.com/736x/bd/e7/f5/bde7f58165f0359b49ba628f16727db5.jpg", "iframeUrl": "melon-playground.html", "category": "Sandbox" },
    { "id": "granny", "title": "Granny", "thumbnail": "https://github.com/WanoCapy/ChickenKingsVault/blob/main/gameimages/granny.png?raw=true", "iframeUrl": "granny.html", "category": "Horror" },
    { "id": "infinite-craft", "title": "Infinite Craft", "thumbnail": "https://primagames.com/wp-content/uploads/2024/02/infinite-craft-adam-eve.jpg?fit=1200%2C675", "iframeUrl": "infinite-craft.html", "category": "Puzzle" },
    { "id": "snow-rider-3d", "title": "Snow Rider 3D", "thumbnail": "https://play-lh.googleusercontent.com/uN5CywrCDvsutWq8RaRa5wPJryI1pkDhktF-zfAhwzx875lftsAIDMtYLbgUM1k6VwuoVM5HjYKCrebmI1uMKdc", "iframeUrl": "snow-rider-3d.html", "category": "Sports" },
    { "id": "sonic-but-better", "title": "Sonic but Better..?", "thumbnail": "https://ichef.bbci.co.uk/news/976/cpsprodpb/FB73/production/_119017346_sonicoldemblem1.jpg", "iframeUrl": "sonic-but-better.html", "category": "Action" },
    { "id": "baldis-basics-classic", "title": "Baldi's Basics Classic", "thumbnail": "https://github.com/WanoCapy/ChickenKingsVault/blob/main/gameimages/baldi'sbasicsplus.webp?raw=true", "iframeUrl": "baldis-basics.html", "category": "Horror" },
    { "id": "baldis-basics", "title": "Baldi's Basics Plus", "thumbnail": "https://i.ytimg.com/vi/7SKjBg1eslk/maxresdefault.jpg", "iframeUrl": "baldis-basics.html", "category": "Horror" },
    { "id": "fnaf1", "title": "Five Nights at Freddy's 1", "thumbnail": "https://image.api.playstation.com/vulcan/img/cfn/11307DoSLwchucsk9cIFbYAUkuJPuQv-VO-yZnBwENvMx2LIl8KhWu89t3V7zhDTFfE55wbSW5908XNkd_RJeNid8t4tbScw.png", "iframeUrl": "fnaf1.html", "category": "FNAF" },
    { "id": "fnaf2", "title": "Five Nights at Freddy's 2", "thumbnail": "https://tse1.mm.bing.net/th/id/OIP.WbMxAHSM184KwBFjFxyg8wHaEK?pid=Api&h=220&P=0", "iframeUrl": "fnaf2.html", "category": "FNAF" },
    { "id": "fnaf3", "title": "Five Nights at Freddy's 3", "thumbnail": "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000024638/08708de0a6534fc7ace6a3a76fa4a0a2294c27484a20d93146f66d392699ee5f", "iframeUrl": "fnaf3.html", "category": "FNAF" },
    { "id": "fnaf4", "title": "Five Nights at Freddy's 4", "thumbnail": "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/en_US/games/switch/f/five-nights-at-freddys-4-switch/hero", "iframeUrl": "fnaf4.html", "category": "FNAF" },
    { "id": "fnaf-ps", "title": "Five Nights at Freddy's Pizzeria Simulator", "thumbnail": "https://nintendoeverything.com/wp-content/uploads/freddy-fazbears-pizza-simulator-1.jpg", "iframeUrl": "fnaf-ps.html", "category": "FNAF" },
    { "id": "fnaf-ucn", "title": "FNAF UCN", "thumbnail": "https://play-lh.googleusercontent.com/pB7dsLLcRgADtFpEPeKc5mSyAn1E1JzrdQ1V7-Y5hizgub3G8e9UJIc5opC9mYXKSBw", "iframeUrl": "fnaf-ucn.html", "category": "FNAF" },
    { "id": "fnaf-world", "title": "Fnaf World", "thumbnail": "https://imag.malavida.com/mvimgbig/download-fs/fnaf-world-27444-3.jpg", "iframeUrl": "fnaf-world.html", "category": "FNAF" }
];
let selectedGame = null;
let searchQuery = '';
let currentView = 'games';
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
let currentTheme = localStorage.getItem('currentTheme') || 'default';
let customThemeUrl = localStorage.getItem('customThemeUrl') || '';
const SLOW_MODE_MS = 2000;
const TRUSTED_CODE = "00999";
const OWNER_CODE = "ImSoEpic";

function checkEntryLogin() {
    const overlay = document.getElementById('entry-login-overlay');
    if (!overlay) return;
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


function initAdminListeners() {
    if (!db) { setTimeout(initAdminListeners, 100); return; }
    onSnapshot(collection(db, 'users'), (snapshot) => { registeredUsers = snapshot.docs.map(doc => doc.data()); if (currentView === 'trusted') render(); });
    onSnapshot(collection(db, 'suggestions'), (snapshot) => { suggestions = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})); if (currentView === 'trusted' || currentView === 'suggest') render(); });
}

function initFirebaseChat() {
    if (!db) { setTimeout(initFirebaseChat, 500); return; }
    // ... logic ...
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    unsubscribeMessages = onSnapshot(q, (snapshot) => { messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); if (currentView === 'chat') renderChat(); });
    const usersQ = query(collection(db, 'active_users'));
    unsubscribeUsers = onSnapshot(usersQ, (snapshot) => { const now = Date.now(); const active = snapshot.docs.filter(doc => (now - doc.data().lastSeen?.toMillis()) < 120000); activeUsers = active.map(doc => doc.data().username); userCount = active.length; if (currentView === 'chat') renderChat(); if (currentView === 'trusted') render(); });
}

function initUserListeners(uid) {
    if (!db) { setTimeout(() => initUserListeners(uid), 100); return; }
    onSnapshot(doc(db, 'users', uid), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.jumpscareTriggered) triggerJumpscareEffect(uid, data.jumpscareType || 1);
            if (data.fullscreenTriggered) { window.toggleFullscreen(); updateDoc(doc(db, 'users', uid), { fullscreenTriggered: false }); }
            if (data.imageScreenTriggered) { window.showImageScreen(data.imageScreenTriggered); updateDoc(doc(db, 'users', uid), { imageScreenTriggered: null }); }
        }
    });
}

function render() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    
    if (selectedGame) renderPlayer();
    else if (currentView === 'chat') renderChat();
    else if (currentView === 'games') renderGrid();
    else if (currentView === 'aichat') renderAIChat();
    else if (currentView === 'themes') renderThemes();
    else if (currentView === 'suggest') renderSuggest();
    else if (currentView === 'trusted') renderTrusted();
    else if (currentView === 'categories') renderCategories();
}

function renderAIChat() { mainContent.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-xl">AI Chat Coming Soon...</div>`; }
function renderThemes() { mainContent.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-xl">Themes Coming Soon...</div>`; }
function renderTrusted() { mainContent.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-xl">Trusted Access Coming Soon...</div>`; }
function renderCategories() { mainContent.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-xl">Categories Coming Soon...</div>`; }
function renderChat() { mainContent.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-xl">Chat Coming Soon...</div>`; }
function renderSuggest() { mainContent.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-xl">Suggestions Coming Soon...</div>`; }

function renderPlayer() {
    if (!selectedGame) return;
    mainContent.innerHTML = `
        <div class="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="flex items-center justify-between">
                <button onclick="window.closeGame()" class="p-2 hover:bg-white/5 rounded-lg transition-colors">Back</button>
                <h2 class="text-2xl font-bold">${selectedGame.title}</h2>
            </div>
            <div class="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <iframe id="game-iframe" src="${selectedGame.iframeUrl}" class="w-full h-full border-none" title="${selectedGame.title}" allowfullscreen></iframe>
                <button onclick="window.toggleFullscreen()" class="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors">
                    Fullscreen
                </button>
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
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        html += `<div class="py-20 text-center w-full col-span-full">No games found</div>`;
    }

    html += `</div>`;
    mainContent.innerHTML = html;
}


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

document.getElementById('maintenance-ok-btn')?.addEventListener('click', () => {
    document.getElementById('maintenance-modal').classList.add('hidden');
});

fetch('firebase-applet-config.json')
    .then(response => response.json())
    .then(config => {
        const app = initializeApp(config);
        db = getFirestore(app, config.firestoreDatabaseId);
        auth = getAuth(app);
        signInAnonymously(auth);
        onAuthStateChanged(auth, user => { if(user) { initAdminListeners(); initUserListeners(user.uid); }});
        if (chatUsername) initFirebaseChat();
        render();
    });
