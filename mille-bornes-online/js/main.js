import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDadsPbXI4xMieRDWgZMOb3WzkP8f7aonc",
    authDomain: "mille-bornes-vibe.firebaseapp.com",
    projectId: "mille-bornes-vibe",
    storageBucket: "mille-bornes-vibe.firebasestorage.app",
    messagingSenderId: "103987030199",
    appId: "1:103987030199:web:b444656c87a5a458ef0532",
    databaseURL: "https://mille-bornes-vibe-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let myID = null;
let roomID = null;
let playerName = "";

// --- GÉNÉRATEUR DE DECK COMPLET ---
const createDeck = () => {
    let deck = [];
    const add = (card, count) => { for(let i=0; i<count; i++) deck.push(card); };
    // Bornes (Total 46)
    add("25", 10); add("50", 10); add("75", 10); add("100", 12); add("200", 4);
    // Attaques (Total 14)
    add("Panne d'essence", 3); add("Crevaison", 3); add("Accident", 3); add("Feu Rouge", 5);
    // Défenses (Total 32)
    add("Essence", 6); add("Roue de Secours", 6); add("Réparations", 6); add("Feu Vert", 14);
    return deck.sort(() => Math.random() - 0.5);
};

// --- CONNEXION / SALON ---
document.getElementById('create-btn').onclick = () => {
    playerName = document.getElementById('player-name').value;
    if (!playerName) return alert("Pseudo requis !");
    roomID = Math.random().toString(36).substring(2, 6).toUpperCase();
    setupPlayer(true);
};

document.getElementById('join-btn').onclick = () => {
    playerName = document.getElementById('player-name').value;
    roomID = document.getElementById('room-code-input').value.toUpperCase();
    if (!playerName || !roomID) return alert("Pseudo et Code requis !");
    setupPlayer(false);
};

async function setupPlayer(isHost) {
    myID = "P_" + Math.floor(Math.random() * 999999);
    const roomRef = ref(db, `rooms/${roomID}`);

    if (isHost) {
        await set(roomRef, {
            status: 'waiting',
            host: myID,
            deck: createDeck(),
            discard: "Début"
        });
    }

    await set(ref(db, `rooms/${roomID}/players/${myID}`), {
        name: playerName,
        points: 0,
        hand: ["En attente..."] // Placeholder pour éviter le vide
    });

    startLobbySync();
}

function startLobbySync() {
    onValue(ref(db, `rooms/${roomID}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.status === 'waiting') {
            document.getElementById('auth-box').classList.add('hidden');
            document.getElementById('waiting-room').classList.remove('hidden');
            document.getElementById('display-room-code').innerText = roomID;
            const listUI = document.getElementById('player-list');
            listUI.innerHTML = Object.values(data.players).map(p => `<li>${p.name}</li>`).join("");
            
            if (data.host === myID) document.getElementById('start-game-btn').classList.remove('hidden');
        } 
        else if (data.status === 'playing') {
            renderGame(data);
        }
    });
}

// --- INITIALISATION DE LA PARTIE ---
document.getElementById('start-game-btn').onclick = async () => {
    const snap = await get(ref(db, `rooms/${roomID}`));
    const data = snap.val();
    let currentDeck = [...data.deck];
    let updates = {};

    // Distribution réelle de 6 cartes par joueur
    Object.keys(data.players).forEach(pID => {
        updates[`players/${pID}/hand`] = currentDeck.splice(0, 6);
    });

    updates[`deck`] = currentDeck;
    updates[`status`] = 'playing';
    updates[`turn`] = myID;

    await update(ref(db, `rooms/${roomID}`), updates);
};

// --- AFFICHAGE DU JEU ---
function renderGame(data) {
    document.getElementById('lobby-container').classList.add('hidden');
    document.getElementById('game-board').classList.remove('hidden');
    document.getElementById('cards-left').innerText = data.deck ? data.deck.length : 0;
    document.getElementById('discard-val').innerText = data.discard;

    const circle = document.getElementById('players-circle');
    circle.innerHTML = "";
    const pIDs = Object.keys(data.players);

    pIDs.forEach((id, index) => {
        const p = data.players[id];
        // Positionnement en cercle
        const angle = (index / pIDs.length) * 2 * Math.PI;
        const x = Math.cos(angle) * 350 + (window.innerWidth / 2);
        const y = Math.sin(angle) * 200 + (window.innerHeight / 2);

        const div = document.createElement('div');
        div.className = `player-slot ${data.turn === id ? 'active-turn' : ''}`;
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        div.innerHTML = `
            <div class="avatar"></div>
            <div class="player-name">${p.name}</div>
            <div class="player-km">${p.points} km</div>
        `;
        circle.appendChild(div);

        // Si c'est ma main, je l'affiche
        if (id === myID) {
            renderHand(p.hand || [], data.turn === myID, data);
        }
    });
}

function renderHand(hand, isMyTurn, gameData) {
    const container = document.getElementById('my-cards');
    container.innerHTML = "";

    hand.forEach((card, idx) => {
        const cDiv = document.createElement('div');
        cDiv.className = `card ${getCardTypeClass(card)}`;
        cDiv.innerText = card;
        cDiv.onclick = () => {
            if (isMyTurn) openActionMenu(card, idx, gameData);
            else alert("Attends ton tour !");
        };
        container.appendChild(cDiv);
    });
}

function getCardTypeClass(card) {
    if (!isNaN(card)) return "card-borne";
    if (["Essence", "Roue de Secours", "Réparations", "Feu Vert"].includes(card)) return "card-defense";
    return "card-attaque";
}

// --- ACTIONS ---
function openActionMenu(card, cardIdx, gameData) {
    const modal = document.getElementById('action-modal');
    const btns = document.getElementById('action-buttons');
    document.getElementById('modal-card-title').innerText = card;
    modal.classList.remove('hidden');
    btns.innerHTML = "";

    // Bouton Jouer
    const bPlay = document.createElement('button');
    bPlay.innerText = (isNaN(card) && card !== "Feu Vert") ? "Lancer Attaque" : "Jouer la carte";
    bPlay.onclick = () => executeMove(card, cardIdx, gameData, false);
    btns.appendChild(bPlay);

    // Bouton Défausser
    const bDiscard = document.createElement('button');
    bDiscard.innerText = "Défausser (Poubelle)";
    bDiscard.className = "btn-cancel";
    bDiscard.onclick = () => executeMove(card, cardIdx, gameData, true);
    btns.appendChild(bDiscard);
}

async function executeMove(card, cardIdx, gameData, isDiscard) {
    closeModal();
    let currentHand = [...gameData.players[myID].hand];
    let currentDeck = [...(gameData.deck || [])];
    let myPoints = gameData.players[myID].points || 0;

    // 1. Retirer la carte de la main
    currentHand.splice(cardIdx, 1);

    // 2. Piocher si possible
    if (currentDeck.length > 0) {
        currentHand.push(currentDeck.shift());
    }

    // 3. Appliquer les points si c'est une borne
    if (!isDiscard && !isNaN(card)) {
        myPoints += parseInt(card);
    }

    // 4. Calculer le prochain tour
    const pIDs = Object.keys(gameData.players);
    let nextIndex = (pIDs.indexOf(myID) + 1) % pIDs.length;

    const updates = {};
    updates[`players/${myID}/hand`] = currentHand;
    updates[`players/${myID}/points`] = myPoints;
    updates[`deck`] = currentDeck;
    updates[`discard`] = isDiscard ? `Défausse: ${card}` : card;
    updates[`turn`] = pIDs[nextIndex];

    await update(ref(db, `rooms/${roomID}`), updates);
}

window.closeModal = () => document.getElementById('action-modal').classList.add('hidden');