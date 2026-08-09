import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot,
    doc,
    addDoc,
    serverTimestamp,
    orderBy,
    limit,
    deleteDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyCLo9rfV279AoHGGs3HheHgYQ5EgLcCzJo",
    authDomain: "tattva-nexus.firebaseapp.com",
    projectId: "tattva-nexus",
    storageBucket: "tattva-nexus.firebasestorage.app",
    messagingSenderId: "275334528",
    appId: "1:275334528:web:48a4d050fdb91c1c142d65"
};

// 2. INITIALIZE FIREBASE & FIRESTORE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 🛑 TASK 1: GLOBAL BROADCAST FUNCTION
// ==========================================
export const sendNotification = async (type, title, message, link, recipientId) => {
    try {
        await addDoc(collection(db, "notifications"), {
            type: type,             // e.g., 'GIG', 'NOTE', 'MARKET', 'MESSAGE', 'EVENT'
            title: title,           // Short heading
            message: message,       // Details
            link: link,             // URL to redirect to
            recipientId: recipientId, // UID or "all"
            status: 'unread',
            timestamp: serverTimestamp()
        });
        console.log(`Notification sent successfully to: ${recipientId}`);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

// 3. INJECT GLOBAL NOTIFICATION UI & STYLES
const injectNotificationSystem = () => {
    if (document.getElementById('notification-system-styles')) return;
    const styleTag = `
<style id="notification-system-styles">
    .notification-wrapper { position: relative; display: inline-block; }
    
    .notification-dot {
        position: absolute; top: -2px; right: -2px;
        background-color: #ef4444; color: white;
        font-size: 10px; font-weight: 800;
        min-width: 18px; height: 18px; padding: 0 4px;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        border: 2px solid #fff; animation: pulse-red 2s infinite; z-index: 100;
    }

    @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .notification-dropdown {
        position: absolute; top: 50px; right: 0; width: 340px;
        background: white; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        display: none; flex-direction: column; overflow: hidden; z-index: 9999;
        border: 1px solid #e5e7eb;
    }

    .notification-header {
        padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;
        font-weight: 700; display: flex; justify-content: space-between; align-items: center;
    }

    .notification-list { max-height: 400px; overflow-y: auto; }

    .notification-item {
        padding: 12px 16px; border-bottom: 1px solid #f3f4f6; display: flex;
        gap: 12px; cursor: pointer; transition: background 0.2s; position: relative;
    }

    .notification-item:hover { background: #f0f9ff; }
    .notification-item.unread { background: #eff6ff; border-left: 4px solid #3b82f6; }

    .notif-icon {
        width: 36px; height: 36px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px;
    }

    .icon-chat { background: #dbeafe; color: #1d4ed8; }
    .icon-market { background: #fef3c7; color: #b45309; }
    .icon-system { background: #fee2e2; color: #b91c1c; }
    .icon-gig { background: #e0e7ff; color: #4338ca; }
    .icon-note { background: #dcfce7; color: #15803d; }
    .icon-event { background: #fae8ff; color: #a21caf; }

    .notif-content { flex-grow: 1; padding-right: 20px; }
    .notif-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 2px; }
    .notif-text { font-size: 13px; color: #4b5563; line-height: 1.4; }
    .notif-time { font-size: 11px; color: #6b7280; margin-top: 4px; }

    .delete-notif-btn {
        position: absolute; right: 12px; top: 12px;
        background: none; border: none; font-size: 14px;
        color: #9ca3af; cursor: pointer; padding: 4px; border-radius: 4px;
    }
    
    .delete-notif-btn:hover { color: #ef4444; background: #fee2e2; }

    .clear-all-btn {
        font-size: 12px; color: #ef4444; background: none;
        border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px;
    }
    .clear-all-btn:hover { background: #fee2e2; }

    .empty-notif { padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; }
</style>`;
    document.head.insertAdjacentHTML('beforeend', styleTag);

    const headerActions = document.querySelector('.header-actions') || document.querySelector('.header-right');
    if (headerActions && !document.getElementById('notif-anchor')) {
        const notifHTML = `
        <div class="notification-wrapper" id="notif-anchor" style="margin-right: 15px;">
            <div id="notif-trigger" style="font-size: 24px; cursor: pointer; padding: 8px; position: relative;">🔔</div>
            <div id="notif-badge-container"></div>
            <div class="notification-dropdown" id="notif-dropdown">
                <div class="notification-header">
                    <span>Notifications</span>
                    <button class="clear-all-btn" id="clear-all-notifs">Clear All</button>
                </div>
                <div class="notification-list" id="notif-list-container">
                    <div class="empty-notif">Loading...</div>
                </div>
            </div>
        </div>`;
        headerActions.insertAdjacentHTML('afterbegin', notifHTML);

        document.getElementById('notif-trigger').addEventListener('click', (e) => {
            const dropdown = document.getElementById('notif-dropdown');
            dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
            e.stopPropagation();
        });

        document.addEventListener('click', () => {
            const dropdown = document.getElementById('notif-dropdown');
            if (dropdown) dropdown.style.display = 'none';
        });

        document.getElementById('notif-dropdown').addEventListener('click', (e) => e.stopPropagation());
    }
};

// 4. MAIN NOTIFICATION LISTENER (FIRESTORE)
const initNotificationListener = () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // 🛑 TASK 2: Listen for both current user AND "all"
            const notifQuery = query(
                collection(db, "notifications"),
                where("recipientId", "in", [user.uid, "all"]), // Grabs personal + global
                orderBy("timestamp", "desc"),
                limit(30)
            );
            
            onSnapshot(notifQuery, (snapshot) => {
                const notifications = [];
                let unreadCount = 0;

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    notifications.push({ id: doc.id, ...data });
                    if (data.status === 'unread') unreadCount++;
                });

                renderNotificationUI(notifications);
                updateBadge(unreadCount);
            }, (error) => {
                console.error("Notification Sync Failed:", error);
            });

            // "Clear All" logic hook
            document.addEventListener('click', async (e) => {
                if (e.target && e.target.id === 'clear-all-notifs') {
                    // Fetch personal & global notifications and delete them
                    const q = query(collection(db, "notifications"), where("recipientId", "in", [user.uid, "all"]));
                    const snap = await getDocs(q);
                    snap.forEach(async (documentSnap) => {
                        await deleteDoc(doc(db, "notifications", documentSnap.id));
                    });
                }
            });

            // Keep existing chat dot logic intact
            const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
            onSnapshot(chatsQuery, (snapshot) => {
                let globalUnreadChatCount = 0;
                snapshot.forEach((docSnap) => {
                    globalUnreadChatCount += docSnap.data().unreadCount?.[user.uid] || 0;
                });

                const sidebarDot = document.getElementById('sidebarDot');
                if (sidebarDot) sidebarDot.style.display = globalUnreadChatCount > 0 ? 'block' : 'none';

                const triggerIcon = document.getElementById('notif-trigger');
                if (triggerIcon) {
                    let chatDot = document.getElementById('global-chat-dot');
                    if (globalUnreadChatCount > 0 && !chatDot) {
                        triggerIcon.insertAdjacentHTML('beforeend', '<div id="global-chat-dot" style="position: absolute; top: 5px; right: 2px; width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; box-shadow: 0 0 0 2px #fff; animation: pulse-red 2s infinite;"></div>');
                    } else if (globalUnreadChatCount === 0 && chatDot) {
                        chatDot.remove();
                    }
                }
            });
        }
    });
};

// 5. UI RENDERING LOGIC
const renderNotificationUI = (notifications) => {
    const container = document.getElementById('notif-list-container');
    if (!container) return;
    if (notifications.length === 0) {
        container.innerHTML = `<div class="empty-notif">No new notifications</div>`;
        return;
    }

    container.innerHTML = notifications.map(notif => {
        let iconClass = 'icon-system';
        let iconEmoji = '📢';
        
        if (notif.type === 'MESSAGE') { iconClass = 'icon-chat'; iconEmoji = '💬'; }
        if (notif.type === 'MARKET') { iconClass = 'icon-market'; iconEmoji = '🛒'; }
        if (notif.type === 'GIG') { iconClass = 'icon-gig'; iconEmoji = '💼'; }
        if (notif.type === 'NOTE') { iconClass = 'icon-note'; iconEmoji = '📚'; }
        if (notif.type === 'EVENT') { iconClass = 'icon-event'; iconEmoji = '🎟️'; }

        const timeStr = notif.timestamp ? new Date(notif.timestamp.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : 'Just now';

        // 🛑 TASK 2: Click to redirect, X button
        return `
        <div class="notification-item ${notif.status === 'unread' ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notif-icon ${iconClass}">${iconEmoji}</div>
            
            <div class="notif-content" onclick="window.location.href='${notif.link}'">
                <div class="notif-title">${notif.title}</div>
                <div class="notif-text">${notif.message}</div>
                <div class="notif-time">${timeStr}</div>
            </div>

            <button class="delete-notif-btn" data-id="${notif.id}" title="Remove notification">✕</button>
        </div>
    `;
    }).join('');

    // Attach click listeners to Cross (X) Buttons
    container.querySelectorAll('.delete-notif-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevents redirecting when X is clicked
            const id = btn.getAttribute('data-id');
            try {
                await deleteDoc(doc(db, "notifications", id));
            } catch (err) {
                console.error("Failed to delete notification:", err);
            }
        });
    });
};

// 6. UPDATE BADGE & DOT
const updateBadge = (count) => {
    const badgeContainer = document.getElementById('notif-badge-container');
    if (count > 0) {
        if(badgeContainer) badgeContainer.innerHTML = `<span class="notification-dot">${count > 9 ? '9+' : count}</span>`;
    } else {
        if(badgeContainer) badgeContainer.innerHTML = '';
    }
};

// EXECUTE
injectNotificationSystem();
initNotificationListener();