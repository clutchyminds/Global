const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player, bosses, currentBossIndex = 0;
let isQuizActive = false;

function preload() {
    // RACINES CORRIGÉES selon ta capture d'écran
    this.load.image('tiles', './assets/backgrounds/tileset.png');
    this.load.tilemapTiledJSON('map', './assets/backgrounds/mappe.json');
    this.load.spritesheet('player', './assets/sprites/player.png', { frameWidth: 32, frameHeight: 48 });
    this.load.image('boss', './assets/sprites/boss.png');
}

function create() {
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('mon_tileset', 'tiles'); // Vérifie ce nom dans Tiled
    
    // Remplacement par 'sol' (ou le nom exact dans ton JSON Tiled)
    const groundLayer = map.createLayer('sol', tileset, 0, 0); 
    groundLayer.setCollisionByProperty({ collides: true });

    player = this.physics.add.sprite(100, 450, 'player');
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, groundLayer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(player);

    bosses = this.physics.add.staticGroup();
    // Placement des 3 boss (Coordonnées X à ajuster selon ta map)
    bosses.create(800, 450, 'boss').setData('id', 0).setData('hp', 2);
    bosses.create(1600, 450, 'boss').setData('id', 1).setData('hp', 3);
    bosses.create(2400, 450, 'boss').setData('id', 2).setData('hp', 4);

    this.physics.add.overlap(player, bosses, startCombat, null, this);

    // CONTRÔLES TACTILES (Gauche / Droite / Saut)
    this.input.on('pointerdown', (pointer) => {
        if (isQuizActive) return;
        if (pointer.y < 300) { // Sauter si on touche le haut
            if (player.body.onFloor()) player.setVelocityY(-400);
        } else if (pointer.x < 400) {
            player.setVelocityX(-200);
        } else {
            player.setVelocityX(200);
        }
    });
    this.input.on('pointerup', () => player.setVelocityX(0));
}

function update() {}

function startCombat(player, boss) {
    let id = boss.getData('id');
    if (id !== currentBossIndex || isQuizActive) return;

    isQuizActive = true;
    player.setVelocity(0, 0);
    this.physics.pause();
    showQuiz(id, boss);
}

function showQuiz(id, bossInstance) {
    const container = document.getElementById('quiz-container');
    const qText = document.getElementById('question-text');
    const optionsDiv = document.getElementById('options');
    
    // Sélection aléatoire d'une question du pool du boss
    let questionsPool = quizData[id].questions;
    let randomQ = questionsPool[Math.floor(Math.random() * questionsPool.length)];
    
    container.style.display = 'flex';
    qText.innerHTML = `<small>${quizData[id].bossName}</small><br>${randomQ.q}`;
    optionsDiv.innerHTML = "";

    randomQ.options.forEach((opt, index) => {
        let btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => {
            if (index === randomQ.answer) {
                let currentHp = bossInstance.getData('hp') - 1;
                bossInstance.setData('hp', currentHp);
                
                if (currentHp <= 0) {
                    alert("BOSS VAINCU !");
                    bossInstance.destroy();
                    currentBossIndex++;
                    closeQuiz();
                } else {
                    alert(`Touché ! Encore ${currentHp} coup(s).`);
                    showQuiz(id, bossInstance); // Prochaine question
                }
            } else {
                alert("Erreur ! Le boss contre-attaque (Recul)");
                closeQuiz();
                // Petit effet de recul
                player.x -= 100; 
            }
        };
        optionsDiv.appendChild(btn);
    });
}

function closeQuiz() {
    document.getElementById('quiz-container').style.display = 'none';
    isQuizActive = false;
    game.scene.scenes[0].physics.resume();
}