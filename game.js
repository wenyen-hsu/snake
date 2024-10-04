const CELL_SIZE = 20;
const CELL_NUMBER = 20;
const COLORS = {
    WHITE: '#FFFFFF',
    RED: '#FF0000',
    GREEN: '#00FF00',
    BLUE: '#0000FF',
    BLACK: '#000000',
    GOLD: '#FFD700'
};

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
}

class Snake {
    constructor() {
        this.body = [new Vector2(5, 10), new Vector2(4, 10), new Vector2(3, 10)];
        this.direction = new Vector2(1, 0);
        this.color = COLORS.WHITE;
        this.width = 1;
        this.rainbowMode = false;
        this.rainbowStartTime = 0;
    }

    draw(ctx) {
        this.body.forEach((segment, i) => {
            const x = segment.x * CELL_SIZE;
            const y = segment.y * CELL_SIZE;
            ctx.beginPath();
            ctx.rect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = this.rainbowMode ? this.getRainbowColor(i) : this.getGradientColor(i);
            ctx.fill();
            ctx.strokeStyle = COLORS.BLACK;
            ctx.stroke();

            if (i === 0) {
                this.drawEyes(ctx, x, y);
            }
        });
    }

    getGradientColor(index) {
        const fade = Math.max(0, 1 - index * 0.1);
        const r = Math.floor(parseInt(this.color.slice(1, 3), 16) * fade);
        const g = Math.floor(parseInt(this.color.slice(3, 5), 16) * fade);
        const b = Math.floor(parseInt(this.color.slice(5, 7), 16) * fade);
        return `rgb(${r}, ${g}, ${b})`;
    }

    getRainbowColor(index) {
        const t = Date.now() / 1000;
        const frequency = 0.5;
        const r = Math.sin(frequency * t + index * 0.5) * 127 + 128;
        const g = Math.sin(frequency * t + index * 0.5 + 2) * 127 + 128;
        const b = Math.sin(frequency * t + index * 0.5 + 4) * 127 + 128;
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    drawEyes(ctx, x, y) {
        const eyeRadius = CELL_SIZE / 8;
        ctx.fillStyle = COLORS.BLACK;
        ctx.beginPath();
        ctx.arc(x + CELL_SIZE / 4, y + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 3 * CELL_SIZE / 4, y + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
        ctx.fill();
    }

    move() {
        const newHead = this.body[0].add(this.direction);
        this.body.unshift(newHead);
        this.body.pop();
    }

    grow() {
        const newHead = this.body[0].add(this.direction);
        this.body.unshift(newHead);
    }

    shrink() {
        if (this.body.length > 1) {
            this.body.pop();
        }
    }

    changeColor(newColor) {
        if (this.color === COLORS.WHITE) {
            this.color = newColor;
        } else {
            const r = Math.floor((parseInt(this.color.slice(1, 3), 16) + parseInt(newColor.slice(1, 3), 16)) / 2);
            const g = Math.floor((parseInt(this.color.slice(3, 5), 16) + parseInt(newColor.slice(3, 5), 16)) / 2);
            const b = Math.floor((parseInt(this.color.slice(5, 7), 16) + parseInt(newColor.slice(5, 7), 16)) / 2);
            this.color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
    }

    activateRainbowMode() {
        this.rainbowMode = true;
        this.rainbowStartTime = Date.now();
    }

    updateRainbowMode() {
        if (this.rainbowMode && Date.now() - this.rainbowStartTime > 10000) {
            this.rainbowMode = false;
        }
    }

    fatten() {
        this.width = Math.min(this.width + 0.1, 1);
    }

    slim() {
        this.width = Math.max(this.width - 0.1, 0.5);
    }
}

class Food {
    constructor() {
        this.fruits = [this.createFruit(), this.createFruit()];
        this.goldenFruit = null;
        this.goldenFruitSpawnTime = 0;
    }

    createFruit() {
        return {
            pos: new Vector2(Math.floor(Math.random() * CELL_NUMBER), Math.floor(Math.random() * CELL_NUMBER)),
            color: [COLORS.RED, COLORS.GREEN, COLORS.BLUE][Math.floor(Math.random() * 3)]
        };
    }

    draw(ctx) {
        this.fruits.forEach(fruit => this.drawFruit(ctx, fruit.pos, fruit.color));
        if (this.goldenFruit) {
            this.drawFruit(ctx, this.goldenFruit.pos, COLORS.GOLD);
        }
    }

    drawFruit(ctx, pos, color) {
        ctx.beginPath();
        ctx.ellipse(pos.x * CELL_SIZE + CELL_SIZE / 2, pos.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE / 2, 0, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = COLORS.BLACK;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pos.x * CELL_SIZE + CELL_SIZE * 0.2, pos.y * CELL_SIZE + CELL_SIZE * 0.2, CELL_SIZE / 8, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.WHITE;
        ctx.fill();
    }

    respawnFruit(index) {
        this.fruits[index] = this.createFruit();
    }

    spawnGoldenFruit() {
        if (!this.goldenFruit && Math.random() < 0.01) {
            this.goldenFruit = {
                pos: new Vector2(Math.floor(Math.random() * CELL_NUMBER), Math.floor(Math.random() * CELL_NUMBER)),
                spawnTime: Date.now()
            };
        }
    }

    updateGoldenFruit() {
        if (this.goldenFruit && Date.now() - this.goldenFruit.spawnTime > 5000) {
            this.goldenFruit = null;
        }
    }
}

class Sprite {
    constructor() {
        this.pos = this.randomPosition();
        this.respawnTime = null;
    }

    draw(ctx) {
        if (this.respawnTime === null) {
            ctx.fillStyle = COLORS.BLACK;
            ctx.fillRect(this.pos.x * CELL_SIZE, this.pos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            const eyeRadius = CELL_SIZE / 8;
            ctx.fillStyle = COLORS.WHITE;
            ctx.beginPath();
            ctx.arc(this.pos.x * CELL_SIZE + CELL_SIZE / 4, this.pos.y * CELL_SIZE + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.pos.x * CELL_SIZE + 3 * CELL_SIZE / 4, this.pos.y * CELL_SIZE + CELL_SIZE / 4, eyeRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    randomPosition() {
        return new Vector2(Math.floor(Math.random() * CELL_NUMBER), Math.floor(Math.random() * CELL_NUMBER));
    }

    move() {
        if (this.respawnTime === null) {
            const directions = [new Vector2(1, 0), new Vector2(-1, 0), new Vector2(0, 1), new Vector2(0, -1)];
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const newPos = this.pos.add(direction);
            if (newPos.x >= 0 && newPos.x < CELL_NUMBER && newPos.y >= 0 && newPos.y < CELL_NUMBER) {
                this.pos = newPos;
            }
        }
    }

    eliminate() {
        this.respawnTime = Date.now() + 10000;
    }

    update() {
        if (this.respawnTime && Date.now() >= this.respawnTime) {
            this.pos = this.randomPosition();
            this.respawnTime = null;
        }
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();
    }

    reset() {
        this.snake = new Snake();
        this.food = new Food();
        this.sprites = [new Sprite()];
        this.score = 0;
        this.startTime = Date.now();
        this.lastSpriteSpawn = Date.now();
        this.gameOver = false;
        this.speed = 150;
        this.lastSpeedIncrease = Date.now();
    }

    checkCollision() {
        const head = this.snake.body[0];

        // Check collision with food
        this.food.fruits.forEach((fruit, i) => {
            if (fruit.pos.equals(head)) {
                this.snake.grow();
                this.snake.changeColor(fruit.color);
                this.snake.fatten();
                this.food.respawnFruit(i);
                this.score++;
            }
        });

        // Check collision with golden fruit
        if (this.food.goldenFruit && this.food.goldenFruit.pos.equals(head)) {
            this.snake.activateRainbowMode();
            this.food.goldenFruit = null;
            this.score += 5;
        }

        // Check collision with sprites
        this.sprites.forEach(sprite => {
            if (sprite.respawnTime === null) {
                if (sprite.pos.equals(head)) {
                    if (this.snake.rainbowMode) {
                        sprite.eliminate();
                        this.score += 2;
                    } else {
                        this.snake.shrink();
                        this.snake.slim();
                        if (this.score > 0) this.score--;
                        if (this.snake.body.length === 1) this.gameOver = true;
                    }
                } else if (this.snake.body.slice(1).some(segment => segment.equals(sprite.pos))) {
                    this.snake.shrink();
                    this.snake.slim();
                    if (this.score > 0) this.score--;
                    if (this.snake.body.length === 1) this.gameOver = true;
                }
            }
        });
    }

    update() {
        if (!this.gameOver) {
            this.snake.move();
            this.snake.updateRainbowMode();
            this.checkCollision();
            this.checkFail();
            this.moveSprites();
            this.spawnSprites();
            this.updateSpeed();
            this.food.spawnGoldenFruit();
            this.food.updateGoldenFruit();
            this.sprites.forEach(sprite => sprite.update());
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#afdb77';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.food.draw(this.ctx);
        this.snake.draw(this.ctx);
        this.sprites.forEach(sprite => sprite.draw(this.ctx));
        
        this.drawScore();
        this.drawTimer();
        
        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    checkFail() {
        const head = this.snake.body[0];
        if (head.x < 0 || head.x >= CELL_NUMBER || head.y < 0 || head.y >= CELL_NUMBER) {
            this.gameOver = true;
        }

        for (let i = 1; i < this.snake.body.length; i++) {
            if (this.snake.body[i].equals(head)) {
                this.gameOver = true;
                break;
            }
        }
    }

    moveSprites() {
        this.sprites.forEach(sprite => sprite.move());
    }

    spawnSprites() {
        const currentTime = Date.now();
        if (currentTime - this.startTime > 60000 && currentTime - this.lastSpriteSpawn > 30000) {
            this.sprites.push(new Sprite());
            this.lastSpriteSpawn = currentTime;
        }
    }

    updateSpeed() {
        const currentTime = Date.now();
        if (currentTime - this.startTime > 60000 && currentTime - this.lastSpeedIncrease > 30000) {
            this.speed = Math.max(50, this.speed - 10);
            this.lastSpeedIncrease = currentTime;
        }
    }

    drawScore() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }

    drawTimer() {
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
        const seconds = (elapsedTime % 60).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.font = '48px Arial';
        this.ctx.fillStyle = COLORS.RED;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-board');
    canvas.width = CELL_SIZE * CELL_NUMBER;
    canvas.height = CELL_SIZE * CELL_NUMBER;
    
    const game = new Game(canvas);
    
    let lastTime = 0;
    function gameLoop(currentTime) {
        const deltaTime = currentTime - lastTime;
        
        if (deltaTime >= game.speed) {
            game.update();
            game.draw();
            lastTime = currentTime;
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop(0);
    
    document.addEventListener('keydown', (event) => {
        if (!game.gameOver) {
            switch (event.key) {
                case 'ArrowUp':
                    if (game.snake.direction.y !== 1) game.snake.direction = new Vector2(0, -1);
                    break;
                case 'ArrowDown':
                    if (game.snake.direction.y !== -1) game.snake.direction = new Vector2(0, 1);
                    break;
                case 'ArrowLeft':
                    if (game.snake.direction.x !== 1) game.snake.direction = new Vector2(-1, 0);
                    break;
                case 'ArrowRight':
                    if (game.snake.direction.x !== -1) game.snake.direction = new Vector2(1, 0);
                    break;
            }
        } else if (event.key === ' ') {
            game.reset();
        }
    });
});