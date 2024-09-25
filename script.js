        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Ship
        const ship = {
            width: 50,
            height: 50,
            x: canvas.width / 2 - 25,
            y: canvas.height - 90,
            speed: 5,
            image: new Image(),
            bullets: [],
            lives: 3,
            hasQuadShot: false,
            quadShotTimer: 0
        };

        ship.image.src = './assets/ship.webp';

        // Power-up
        const powerUp = {
            width: 30,
            height: 30,
            x: Math.random() * (canvas.width - 30),
            y: Math.random() * (canvas.height - 200),
            image: new Image(),
            active: true
        };

        powerUp.image.src = './assets/Power.png';

        // Alien ship
        const alienShip = {
            width: 100,
            height: 100,
            speed: 2,
            image: new Image(),
            ships: [],
            bullets: [],
            killCount: 0
        };

        alienShip.image.src = './assets/ship_alien.webp';

        // Kill image
        const killImage = new Image();
        killImage.src = './assets/kill.webp';

        // Bullet and key properties
        let bulletSpeed = 7;
        let bulletColor = 'green';
        const alienBulletSpeed = 5;
        const alienBulletColor = 'red';
        const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
        let pause = false;
        let wave = 1;

        // Event listeners for movement, shooting, and pausing
        document.addEventListener('keydown', event => {
            if (event.code in keys) keys[event.code] = true;
            if (event.code === 'Space' && !pause) event.preventDefault(), shootBullet();
            if (event.code === 'KeyP') togglePause();
        });

        document.addEventListener('keyup', event => {
            if (event.code in keys) keys[event.code] = false;
        });

        // Game functions
        function handleMovement() {
            if (keys.ArrowLeft && ship.x > 0) ship.x -= ship.speed;
            if (keys.ArrowRight && ship.x < canvas.width - ship.width) ship.x += ship.speed;
            if (keys.ArrowUp && ship.y > 0) ship.y -= ship.speed;
            if (keys.ArrowDown && ship.y < canvas.height - ship.height) ship.y += ship.speed;
        }

        function shootBullet() {
            if (!pause) {
                if (ship.hasQuadShot) {
                    ship.bullets.push({ x: ship.x + 10, y: ship.y });
                    ship.bullets.push({ x: ship.x + ship.width - 30, y: ship.y });
                } else {
                    ship.bullets.push({ x: ship.x + ship.width / 2 - 2.5, y: ship.y });
                }
            }
        }

        function drawShip() {
            ctx.drawImage(ship.image, ship.x, ship.y, ship.width, ship.height);
        }

        function drawBullets() {
            ctx.fillStyle = bulletColor;
            ship.bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, 5, 15));
        }

        function moveBullets() {
            ship.bullets.forEach(bullet => bullet.y -= bulletSpeed);
            ship.bullets = ship.bullets.filter(bullet => bullet.y > 0);
        }

        function drawLives() {
            const lifeWidth = 25, lifeHeight = 25, lifeMargin = 10;
            for (let i = 0; i < ship.lives; i++) {
                const x = lifeMargin + (lifeWidth + lifeMargin) * i;
                ctx.drawImage(ship.image, x, lifeMargin, lifeWidth, lifeHeight);
            }
        }

        function createAliens() {
            alienShip.ships = [];
            const aliensPerWave = 5;
            for (let i = 0; i < aliensPerWave; i++) {
                alienShip.ships.push({
                    x: Math.random() * (canvas.width - alienShip.width),
                    y: -Math.random() * canvas.height,
                    hasFired: false
                });
            }
        }

        function drawAliens() {
            alienShip.ships.forEach(alien => ctx.drawImage(alienShip.image, alien.x, alien.y, alienShip.width, alienShip.height));
        }

        function moveAliens() {
            alienShip.ships.forEach(alien => {
                alien.y += alienShip.speed;
                if (alien.y >= canvas.height) alien.hasFired = false;
            });
            alienShip.ships = alienShip.ships.filter(alien => alien.y < canvas.height);
        }

        function drawAlienBullets() {
            ctx.fillStyle = alienBulletColor;
            alienShip.bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, 5, 15));
        }

        function moveAlienBullets() {
            alienShip.bullets.forEach(bullet => bullet.y += alienBulletSpeed);
            alienShip.bullets = alienShip.bullets.filter(bullet => bullet.y < canvas.height);
        }

        function checkPowerUpCollision() {
            if (
                powerUp.active &&
                ship.x < powerUp.x + powerUp.width &&
                ship.x + ship.width > powerUp.x &&
                ship.y < powerUp.y + powerUp.height &&
                ship.height + ship.y > powerUp.y
            ) {
                powerUp.active = false;
                ship.hasQuadShot = true;
                ship.quadShotTimer = 600;
            }
        }

        function checkBulletAlienCollision() {
            for (let i = 0; i < alienShip.ships.length; i++) {
                const alien = alienShip.ships[i];
                for (let j = 0; j < ship.bullets.length; j++) {
                    const bullet = ship.bullets[j];
                    if (
                        bullet.x < alien.x + alienShip.width &&
                        bullet.x + 5 > alien.x &&
                        bullet.y < alien.y + alienShip.height &&
                        bullet.y + 15 > alien.y
                    ) {
                        alienShip.ships.splice(i, 1);
                        ship.bullets.splice(j, 1);
                        alienShip.killCount++;
                        updateBulletColor();
                        drawKillImage(alien.x, alien.y);
                        updateKillCountDisplay();
                        break;
                    }
                }
            }
        }

        function updateBulletColor() {
            if (alienShip.killCount >= 6) bulletColor = 'yellow', bulletSpeed = 14;
        }

        function drawKillImage(x, y) {
            ctx.drawImage(killImage, x, y, 50, 50);
        }

        function updateKillCountDisplay() {
            document.getElementById('killCount').innerText = `Kills: ${alienShip.killCount}`;
        }

        function checkCollision() {
            alienShip.bullets.forEach(bullet => {
                if (
                    bullet.x < ship.x + ship.width &&
                    bullet.x + 5 > ship.x &&
                    bullet.y < ship.y + ship.height &&
                    bullet.y + 15 > ship.y
                ) {
                    ship.lives--;
                    if (ship.lives <= 0) endGame();
                    alienShip.bullets = alienShip.bullets.filter(b => b !== bullet);
                }
            });
        }

        function endGame() {
            pause = true;
            ctx.fillStyle = 'white';
            ctx.font = '48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        }

        function drawPauseMenu() {
            document.getElementById('pauseMenu').style.display = pause ? 'block' : 'none';
        }

        function togglePause() {
            pause = !pause;
            drawPauseMenu();
        }

        function update() {
            if (!pause) {
                handleMovement();
                moveBullets();







