import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
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
        
        if (chatUsername) initFirebaseChat();
    })
    .catch(err => {
        console.error("Firebase initialization failed:", err);
    });

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
let messages = [];
let userCount = 0;
let unsubscribeMessages = null;
let unsubscribeUsers = null;
let heartbeatInterval = null;
let lastMessageSentAt = 0;
const SLOW_MODE_MS = 2000;

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
        errorEl.textContent = "Connection issue. Please check if Anonymous Auth is enabled in Firebase.";
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
        const userRef = doc(db, 'active_users', username);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            const lastSeen = data.lastSeen?.toMillis() || 0;
            if ((Date.now() - lastSeen) < 120000) {
                if (errorEl) {
                    errorEl.textContent = "Username already taken and active.";
                    errorEl.classList.remove('hidden');
                }
                return;
            }
        }

        await setDoc(userRef, { 
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

// Initial render
render();
if (chatUsername) initFirebaseChat();


