var player;
var asteroids = [];// Polje koje sadrži objekte koji predstavljaju asteroide
var offsetWithoutscrollbars = 10;// Offset za računanje širine i visine canvasa bez scrollbara
var startTime; // Vrijeme početka igre od kojeg cemo racunati delta
var bestTime = localStorage.getItem('bestTime') || 0;// Najbolje vrijeme u igri (u milisekundama)
var bestTimeMinutes = localStorage.getItem('bestTimeMinutes') || 0;// Najbolje vrijeme u igri u minute
var bestTimeSeconds = localStorage.getItem('bestTimeSeconds') || 0;// Najbolje vrijeme u igri u sekunde
var bestTimeMili = localStorage.getItem('bestTimeMili') || 0;// Najbolje vrijeme u igri u milisekunde

var gameStarted = false;// zastavica koja označava je li igra započela ili ne

function startGame() {// Funkcija koja pokreće igru

    player = new component(30, 30, "red", (window.innerWidth - offsetWithoutscrollbars) / 2, (window.innerHeight - offsetWithoutscrollbars) / 2, true);
    myGameArea.start();
    startTime = Date.now();
}
// Objekt koji predstavlja igru (canvas)
var myGameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.id = "myGameCanvas";
        this.canvas.width = (window.innerWidth - offsetWithoutscrollbars);
        this.canvas.height = (window.innerHeight - offsetWithoutscrollbars);
        this.context = this.canvas.getContext("2d");
        this.context.strokeStyle = "#FF0000";
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);

        window.addEventListener('keydown', function (e) {// Postavljanje event listenera za tipke
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = true;
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = false;
        })
    },
    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
// Funkcija koja stvara novi objekt (komponentu)
function component(width, height, color, x, y, shadow) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speed_x = 0;
    this.speed_y = 0;

    this.update = function () {
        ctx = myGameArea.context;
        ctx.shadowBlur = 3;
        ctx.shadowColor = "black";
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    this.newPos = function () {
        if (this.x > myGameArea.canvas.width) {
            this.x = 0 - this.width;
        } else if (this.x + this.width < 0) {
            this.x = myGameArea.canvas.width;
        }

        if (this.y > myGameArea.canvas.height) {
            this.y = 0 - this.height;
        } else if (this.y + this.height < 0) {
            this.y = myGameArea.canvas.height;
        }

        this.x += this.speed_x;
        this.y += this.speed_y;
    };
}
// Funkcija za stvaranje asteroida
function spawnAsteroid() {
    var side = Math.floor(Math.random() * 4);
    var x, y;

    switch (side) {
        case 0:
            x = Math.random() * myGameArea.canvas.width;
            y = -20;
            break;
        case 1:
            x = myGameArea.canvas.width + 20;
            y = Math.random() * myGameArea.canvas.height;
            break;
        case 2:
            x = Math.random() * myGameArea.canvas.width;
            y = myGameArea.canvas.height + 20;
            break;
        case 3:
            x = -20;
            y = Math.random() * myGameArea.canvas.height;
            break;
    }
 // Postavljanje nijansi sive boje
    var shadesOfGray = ['#555', '#666', '#777', '#888', '#999'];
    var randomShade = shadesOfGray[Math.floor(Math.random() * shadesOfGray.length)];

    var asteroid = new component(20, 20, randomShade, x, y, false);//stavaranje asteroida random sivih boja

    asteroids.push(asteroid);
}
// Funkcija za postavljanje asteroida na sredinu ekrana
function centerAsteroid(asteroid) {
    asteroid.x += asteroid.speed_x;
    asteroid.y += asteroid.speed_y;
// Provjera je li asteroid izašao izvan ekrana
    if (
        asteroid.x + asteroid.width < 0 ||
        asteroid.x > myGameArea.canvas.width ||
        asteroid.y + asteroid.height < 0 ||
        asteroid.y > myGameArea.canvas.height
    ) {
        // Postavljanje asteroida na slučajan rub ekrana
        var spawnSide = Math.floor(Math.random() * 4);

        switch (spawnSide) {
            case 0:
                asteroid.x = Math.random() * myGameArea.canvas.width;
                asteroid.y = -20;
                break;
            case 1:
                asteroid.x = myGameArea.canvas.width;
                asteroid.y = Math.random() * myGameArea.canvas.height;
                break;
            case 2:
                asteroid.x = Math.random() * myGameArea.canvas.width;
                asteroid.y = myGameArea.canvas.height;
                break;
            case 3:
                asteroid.x = -20;
                asteroid.y = Math.random() * myGameArea.canvas.height;
                break;
        }
// Postavljanje slučajne brzine asteroida
        var speedMagnitude = Math.random() * 4 + 1;
        var angle = Math.random() * 2 * Math.PI;
        asteroid.speed_x = speedMagnitude * Math.cos(angle);
        asteroid.speed_y = speedMagnitude * Math.sin(angle);
    }
}
// Inicijalizacija varijable za završetak igre ako spaceship i asteroid naprave koliziu
var gameOver = false;

function updateGameArea() {
    if (gameOver) {
        return;
    }

    myGameArea.clear();
    player.speed_x = 0;
    player.speed_y = 0;

    // postavljanje vremena u desni gornji kut 
    var elapsedTime = Date.now() - startTime;// Kalkulacija tog vremena
    var minutes = Math.floor(elapsedTime / (60 * 1000));
    var seconds = Math.floor((elapsedTime % (60 * 1000)) / 1000);
    var milliseconds = Math.floor((elapsedTime % 1000));

    // Formiranje vremena za prikaz u mm:ss:mili
    var formattedTime =
        (minutes < 10 ? '0' : '') + minutes + ':' +
        (seconds < 10 ? '0' : '') + seconds + ':' +
        (milliseconds < 100 ? '0' : '') + (milliseconds < 10 ? '0' : '') + milliseconds;

    myGameArea.context.font = "20px Arial";
    myGameArea.context.fillStyle = "black";
    myGameArea.context.fillText("Vrijeme: " + formattedTime, myGameArea.canvas.width - 180, 30);
    myGameArea.context.fillText("Najbolje vrijeme: " + bestTimeMinutes + ":" + bestTimeSeconds + ":" + bestTimeMili, myGameArea.canvas.width- 245, 60);
// Logika za kretanje igrača prema pritisnutim tipkama
    if (myGameArea.keys && myGameArea.keys[37]) { 
        player.speed_x = -2; 
    }
    if (myGameArea.keys && myGameArea.keys[39]) {
         player.speed_x = 2;
         }
    if (myGameArea.keys && myGameArea.keys[38]) { 
        player.speed_y = -2;
     }
    if (myGameArea.keys && myGameArea.keys[40]) { 
        player.speed_y = 2;
     }
// Ažuriranje pozicije igrača i crtanje
    player.newPos();
    player.update();
// Slučajno stvaranje asteroida
    if (Math.random() < 0.1) {
        spawnAsteroid();
    }
// Ažuriranje i crtanje asteroida
    for (var i = 0; i < asteroids.length; i++) {
        centerAsteroid(asteroids[i]);
        asteroids[i].update();
// Provjera kolizije s igračem
        if (collision(player, asteroids[i])) {
            gameOver = true;
        }
    }
// Prikaz poruke o kraju igre i mogućnost restarta
    if (gameOver) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "red";
        ctx.fillText("Game Over", myGameArea.canvas.width / 2 - 80, myGameArea.canvas.height / 2);
        ctx.fillText("Press R to Restart", myGameArea.canvas.width / 2 - 120, myGameArea.canvas.height / 2 + 40);
// Ispisivanje vremena
        var elapsedTime = Date.now() - startTime;
        console.log("elapsed time " + elapsedTime);
        console.log("best time " + bestTime);
        var minutes = Math.floor(elapsedTime / (60 * 1000));
        var seconds = Math.floor((elapsedTime % (60 * 1000)) / 1000);
        var milliseconds = Math.floor((elapsedTime % 1000));

        // Formatiranje vremena
        var formattedTime =
            (minutes < 10 ? '0' : '') + minutes + ':' +
            (seconds < 10 ? '0' : '') + seconds + ':' +
            (milliseconds < 100 ? '0' : '') + (milliseconds < 10 ? '0' : '') + milliseconds;
// Ispisivanje vremena na ekranu
        ctx.fillText("Time: " + formattedTime, myGameArea.canvas.width / 2 - 105, myGameArea.canvas.height / 2 + 80);
// Provjera najboljeg vremena
        if (elapsedTime > bestTime) {
            bestTime = elapsedTime
            bestTimeMinutes = minutes;
            bestTimeSeconds = seconds;
            bestTimeMili = milliseconds;
// Ažuriranje najboljeg vremena u lokalnom pohranjivanju web browsera
            localStorage.setItem('bestTime', bestTime);
            localStorage.setItem('bestTimeMinutes', minutes);
            localStorage.setItem('bestTimeSeconds', seconds);
            localStorage.setItem('bestTimeMili', milliseconds);

            ctx.fillText("New Best Time!", myGameArea.canvas.width / 2 - 100, myGameArea.canvas.height / 2 + 120);
        }
// Ispisivanje najboljeg vremena
        ctx.fillText("Best Time: " + bestTimeMinutes + ":" + bestTimeSeconds + ":" + bestTimeMili, myGameArea.canvas.width / 2 - 120, myGameArea.canvas.height / 2 + 160);
    }
}
// funkcija za provjeru kolizije izmedu dva objekta
function collision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}
// Event listener za tipku R za ponovno pokretanje igre
window.addEventListener('keydown', function (e) {
    if (gameOver && e.key === 'r') {
        restartGame();
    }
});

// Funkcija za ponovno pokretanje igre
function restartGame() {
    player = new component(30, 30, "red", myGameArea.canvas.width / 2, myGameArea.canvas.height / 2, true);
    asteroids = [];
    gameOver = false;
    startTime = Date.now();
}