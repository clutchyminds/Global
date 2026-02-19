/**
 * JEU SVT : L'Odyssée du Photon
 * Configuré pour dossier : jeu-svt
 */

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 800 }, 
            debug: false 
        }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player, bosses, currentBossIndex = 0;
let isQuizActive = false;

function preload() {
    // Chemins relatifs pointant vers ton arborescence GitHub
    this.load.image('tiles', './assets/backgrounds/tileset.png');
    this.load.tilemapTiledJSON('map', './assets/backgrounds/mappe.json');
    this.load.image('player', './assets/sprites/player.png');
    this.load.image('boss', './assets/sprites/boss.png');
}

function create() {
    // 1. CHARGEMENT DE LA MAP
    const map = this.make.tilemap({ key: 'map' });
    
    // IMPORTANT : 'mon_tileset' doit correspondre au nom du tileset DANS Tiled
    const tileset = map.addTilesetImage('tileset', 'tiles'); 

    // Détection automatique du nom du calque pour éviter l'écran noir
    const layerName = map.getTileLayerNames()[0]; 
    const groundLayer = map.createLayer(layerName, tileset, 0, 0);

    if (groundLayer) {
        // Active les collisions pour les tuiles ayant la propriété "collides" dans Tiled
        groundLayer.setCollisionByProperty({ collides: true });
    } else {
        console.error("Le calque de tuiles n'a pas été trouvé. Vérifie Tiled !");
    }

    // 2. LE JOUEUR (PHOTON)
    // On le place un peu au dessus du sol (ajuste le 100, 100 si besoin)
    player = this.physics.add.sprite(100, 100, 'player');
    player.setCollideWorldBounds(true);
    player.setScale(0.5); // Réduit la taille si ton image est grande

    // Collision entre le joueur et le sol
    if (groundLayer) this.physics.add.collider(player, groundLayer);

    // 3. LA CAMÉRA
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // 4. LES BOSS
    bosses = this.physics.add.staticGroup();
    
    // Positionnement des 3 Boss (Ajuste les X selon la longueur de ta map)
    // Boss 1 : La Feuille | Boss 2 : La Matière | Boss 3 : Le Mondial
    let b1 = bosses.create(800, 450, 'boss').setData({id: 0, hp: 2}).setScale(0.2).refreshBody();
    let b2 = bosses.create(1600, 450, 'boss').setData({id: 1, hp: 3}).setScale(0.2).refreshBody();
    let b3 = bosses.create(2400, 450, 'boss').setData({id: 2, hp: 4}).setScale(0.2).refreshBody();

    // Déclenchement du combat quand on touche un boss
    this.physics.add.overlap(player, bosses, startCombat, null, this);

    // 5. CONTRÔLES TACTILES (Optimisés Tablette)
    this.input.on('pointerdown', (pointer) => {
        if (isQuizActive) return;

        // Si on touche le haut de l'écran -> Saut
        if (pointer.y < 250) {
            if (player.body.blocked.down || player.body.touching.down) {
                player.setVelocityY(-450);
            }
        } 
        // Si on touche à gauche -> Marche à gauche
        else if (pointer.x < 400) {
            player.setVelocityX(-200);
        } 
        // Si on touche à droite -> Marche à droite
        else {
            player.setVelocityX(200);
        }
    });

    this.input.on('pointerup', () => {
        player.setVelocityX(0);
    });
}

function update() {
    // Si le quiz est ouvert, on fige le joueur
    if (isQuizActive) {
        player.setVelocity(0, 0);
    }
}

function startCombat(player, boss) {
    let id = boss.getData('id');
    
    // On ne combat le boss que si c'est son tour
    if (id !== currentBossIndex || isQuizActive) return;

    isQuizActive = true;
    this.physics.pause(); // Stop la physique du jeu
    showQuiz(id, boss);
}

function showQuiz(id, bossInstance) {
    const container = document.getElementById('quiz-container');
    const qText = document.getElementById('question-text');
    const optionsDiv = document.getElementById('options');
    
    // Pioche une question au hasard pour ce boss
    let pool = quizData[id].questions;
    let q = pool[Math.floor(Math.random() * pool.length)];
    
    container.style.display = 'flex';
    qText.innerHTML = `<strong style="color:#27ae60">${quizData[id].bossName}</strong><br><br>${q.q}`;
    optionsDiv.innerHTML = "";

    q.options.forEach((opt, index) => {
        let btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            if (index === q.answer) {
                // BONNE RÉPONSE
                let hp = bossInstance.getData('hp') - 1;
                bossInstance.setData('hp', hp);
                
                if (hp <= 0) {
                    alert("BRAVO ! Bilan maîtrisé.");
                    bossInstance.destroy();
                    currentBossIndex++;
                    finishCombat();
                } else {
                    alert("Correct ! Le boss faiblit...");
                    showQuiz(id, bossInstance); // Question suivante pour le même boss
                }
            } else {
                // MAUVAISE RÉPONSE
                alert("Erreur scientifique ! Le boss vous repousse.");
                finishCombat();
                // Effet de recul
                player.x -= 200;
            }
        };
        optionsDiv.appendChild(btn);
    });
}

function finishCombat() {
    const container = document.getElementById('quiz-container');
    container.style.display = 'none';
    isQuizActive = false;
    game.scene.scenes[0].physics.resume(); // Relance le jeu
}