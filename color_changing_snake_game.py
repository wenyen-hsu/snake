import pygame
import random
import time
import math
from pygame.math import Vector2

# Initialize Pygame
pygame.init()

# Set up the display
CELL_SIZE = 40
CELL_NUMBER = 20
screen = pygame.display.set_mode((CELL_NUMBER * CELL_SIZE, CELL_NUMBER * CELL_SIZE))
pygame.display.set_caption('Color Changing Snake Game')

# Define colors
WHITE = (255, 255, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
BLACK = (0, 0, 0)
GOLD = (255, 215, 0)

class Snake:
    def __init__(self):
        self.body = [Vector2(5, 10), Vector2(4, 10), Vector2(3, 10)]
        self.direction = Vector2(1, 0)
        self.color = WHITE
        self.width = 1
        self.rainbow_mode = False
        self.rainbow_start_time = 0 

    def draw(self):
        for i, segment in enumerate(self.body):
            x = int(segment.x * CELL_SIZE)
            y = int(segment.y * CELL_SIZE)
            rect = pygame.Rect(x, y, CELL_SIZE, CELL_SIZE)
            
            try:
                color = self.get_rainbow_color(i) if self.rainbow_mode else self.get_gradient_color(i)
                pygame.draw.rect(screen, color, rect, border_radius=int(CELL_SIZE * self.width / 2))
            except ValueError:
                # Fallback to white if there's an issue with the color
                pygame.draw.rect(screen, WHITE, rect, border_radius=int(CELL_SIZE * self.width / 2))
            
            if i == 0:
                self.draw_eyes(x, y)

    def get_gradient_color(self, index):
        fade = max(0, 1 - index * 0.1)
        r = int(self.color[0] * fade)
        g = int(self.color[1] * fade)
        b = int(self.color[2] * fade)
        return (r, g, b)

    def get_rainbow_color(self, index):
        t = pygame.time.get_ticks() / 1000  # Time in seconds
        frequency = 0.5
        r = int((math.sin(frequency * t + index * 0.5) * 127 + 128))
        g = int((math.sin(frequency * t + index * 0.5 + 2) * 127 + 128))
        b = int((math.sin(frequency * t + index * 0.5 + 4) * 127 + 128))
        return (r, g, b)

    def draw_eyes(self, x, y):
        eye_radius = CELL_SIZE // 8
        left_eye = (x + CELL_SIZE // 4, y + CELL_SIZE // 4)
        right_eye = (x + 3 * CELL_SIZE // 4, y + CELL_SIZE // 4)
        pygame.draw.circle(screen, BLACK, left_eye, eye_radius)
        pygame.draw.circle(screen, BLACK, right_eye, eye_radius)

    def move(self):
        if len(self.body) > 0:
            body_copy = self.body[:-1]
            body_copy.insert(0, body_copy[0] + self.direction)
            self.body = body_copy

    def grow(self):
        self.body.append(self.body[-1])

    def shrink(self):
        if len(self.body) > 1:
            self.body.pop()

    def change_color(self, new_color):
        if self.color == WHITE:
            self.color = new_color
        else:
            r = (self.color[0] + new_color[0]) // 2
            g = (self.color[1] + new_color[1]) // 2
            b = (self.color[2] + new_color[2]) // 2
            self.color = (r, g, b)

    def activate_rainbow_mode(self):
        self.rainbow_mode = True
        self.rainbow_start_time = time.time()

    def update_rainbow_mode(self):
        if self.rainbow_mode and time.time() - self.rainbow_start_time > 10:
            self.rainbow_mode = False

    def fatten(self):
        self.width = min(self.width + 0.1, 1)

    def slim(self):
        self.width = max(self.width - 0.1, 0.5)

class Food:
    def __init__(self):
        self.fruits = [self.create_fruit(), self.create_fruit()]
        self.golden_fruit = None
        self.golden_fruit_spawn_time = 0

    def create_fruit(self):
        return {
            'pos': Vector2(random.randint(0, CELL_NUMBER - 1), random.randint(0, CELL_NUMBER - 1)),
            'color': random.choice([RED, GREEN, BLUE])
        }

    def draw(self):
        for fruit in self.fruits:
            self.draw_fruit(fruit['pos'], fruit['color'])
        if self.golden_fruit:
            self.draw_fruit(self.golden_fruit['pos'], GOLD)

    def draw_fruit(self, pos, color):
        rect = pygame.Rect(int(pos.x * CELL_SIZE), int(pos.y * CELL_SIZE), CELL_SIZE, CELL_SIZE)
        pygame.draw.ellipse(screen, color, rect)
        shine_pos = (int(pos.x * CELL_SIZE + CELL_SIZE * 0.2), int(pos.y * CELL_SIZE + CELL_SIZE * 0.2))
        pygame.draw.circle(screen, WHITE, shine_pos, CELL_SIZE // 8)

    def respawn_fruit(self, index):
        self.fruits[index] = self.create_fruit()

    def spawn_golden_fruit(self):
        if not self.golden_fruit and random.random() < 0.01:  # 1% chance each frame
            self.golden_fruit = {
                'pos': Vector2(random.randint(0, CELL_NUMBER - 1), random.randint(0, CELL_NUMBER - 1)),
                'spawn_time': time.time()
            }

    def update_golden_fruit(self):
        if self.golden_fruit and time.time() - self.golden_fruit['spawn_time'] > 5:  # Disappear after 5 seconds
            self.golden_fruit = None

class Sprite:
    def __init__(self):
        self.pos = self.random_position()
        self.respawn_time = None

    def draw(self):
        if self.respawn_time is None:
            rect = pygame.Rect(int(self.pos.x * CELL_SIZE), int(self.pos.y * CELL_SIZE), CELL_SIZE, CELL_SIZE)
            pygame.draw.rect(screen, BLACK, rect, border_radius=CELL_SIZE // 4)
            eye_radius = CELL_SIZE // 8
            left_eye = (int(self.pos.x * CELL_SIZE + CELL_SIZE // 4), int(self.pos.y * CELL_SIZE + CELL_SIZE // 4))
            right_eye = (int(self.pos.x * CELL_SIZE + 3 * CELL_SIZE // 4), int(self.pos.y * CELL_SIZE + CELL_SIZE // 4))
            pygame.draw.circle(screen, WHITE, left_eye, eye_radius)
            pygame.draw.circle(screen, WHITE, right_eye, eye_radius)

    def random_position(self):
        return Vector2(random.randint(0, CELL_NUMBER - 1), random.randint(0, CELL_NUMBER - 1))

    def move(self):
        if self.respawn_time is None:
            direction = random.choice([Vector2(1, 0), Vector2(-1, 0), Vector2(0, 1), Vector2(0, -1)])
            new_pos = self.pos + direction
            if 0 <= new_pos.x < CELL_NUMBER and 0 <= new_pos.y < CELL_NUMBER:
                self.pos = new_pos

    def eliminate(self):
        self.respawn_time = time.time() + 10  # Set to respawn after 10 seconds

    def update(self):
        if self.respawn_time and time.time() >= self.respawn_time:
            self.pos = self.random_position()
            self.respawn_time = None

class Game:
    def __init__(self):
        self.reset()

    def reset(self):
        self.snake = Snake()
        self.food = Food()
        self.sprites = [Sprite()]
        self.score = 0
        self.start_time = time.time()
        self.last_sprite_spawn = time.time()
        self.game_over = False
        self.speed = 150
        self.last_speed_increase = time.time()

    def check_collision(self):
        head = self.snake.body[0]
        print(f"Snake in rainbow mode: {self.snake.rainbow_mode}")  
         
        # 檢查與食物的碰撞
        for i, fruit in enumerate(self.food.fruits):
            if fruit['pos'] == head:
                self.snake.grow()
                self.snake.change_color(fruit['color'])
                self.snake.fatten()
                self.food.respawn_fruit(i)
                self.score += 1

        # 檢查與金色食物的碰撞
        if self.food.golden_fruit and self.food.golden_fruit['pos'] == head:
            self.snake.activate_rainbow_mode()
            self.food.golden_fruit = None
            self.score += 5

        # 檢查與小精靈的碰撞
        for sprite in self.sprites:
            if sprite.respawn_time is None:  # 只檢查活躍的小精靈
                if sprite.pos == head:
                    if self.snake.rainbow_mode:
                        sprite.eliminate()
                        self.score += 2
                    else:
                        self.snake.shrink()
                        self.snake.slim()
                        if self.score > 0:
                            self.score -= 1
                        if len(self.snake.body) == 1:
                            self.game_over = True
                elif sprite.pos in self.snake.body[1:]:
                    self.snake.shrink()
                    self.snake.slim()
                    if self.score > 0:
                        self.score -= 1
                    if len(self.snake.body) == 1:
                        self.game_over = True

    def update(self):
        if not self.game_over:
            self.snake.move()
            self.snake.update_rainbow_mode()
            self.check_collision()
            self.check_fail()
            self.move_sprites()
            self.spawn_sprites()
            self.update_speed()
            self.food.spawn_golden_fruit()
            self.food.update_golden_fruit()
            for sprite in self.sprites:
                sprite.update()

    def draw_elements(self):
        self.food.draw()
        self.snake.draw()
        for sprite in self.sprites:
            sprite.draw()
        self.draw_score()
        self.draw_timer()
        if self.game_over:
            self.draw_game_over()

    def check_collision(self):
        head = self.snake.body[0]
        for i, fruit in enumerate(self.food.fruits):
            if fruit['pos'] == head:
                self.snake.grow()
                self.snake.change_color(fruit['color'])
                self.snake.fatten()
                self.food.respawn_fruit(i)
                self.score += 1

        if self.food.golden_fruit and self.food.golden_fruit['pos'] == head:
            self.snake.activate_rainbow_mode()
            self.food.golden_fruit = None
            self.score += 5

        for sprite in self.sprites:
            if sprite.respawn_time is None:  # Only check collision if sprite is active
                if sprite.pos in self.snake.body:
                    if sprite.pos == head and self.snake.rainbow_mode:
                        sprite.eliminate()
                        self.score += 2
                    else:
                        self.snake.shrink()
                        self.snake.slim()
                        if self.score > 0:
                            self.score -= 1
                        if len(self.snake.body) == 1:
                            self.game_over = True
                        else:
                            self.snake.color = WHITE if len(self.snake.body) == 2 else self.snake.color

    def check_fail(self):
        if not 0 <= self.snake.body[0].x < CELL_NUMBER or not 0 <= self.snake.body[0].y < CELL_NUMBER:
            self.game_over = True

        for segment in self.snake.body[1:]:
            if segment == self.snake.body[0]:
                self.game_over = True

    def move_sprites(self):
        for sprite in self.sprites:
            sprite.move()

    def spawn_sprites(self):
        current_time = time.time()
        if current_time - self.start_time > 60 and current_time - self.last_sprite_spawn > 30:
            self.sprites.append(Sprite())
            self.last_sprite_spawn = current_time

    def update_speed(self):
        current_time = time.time()
        if current_time - self.start_time > 60 and current_time - self.last_speed_increase > 30:
            self.speed = max(50, self.speed - 10)
            self.last_speed_increase = current_time

    def draw_score(self):
        score_surface = pygame.font.Font(None, 36).render(f'Score: {self.score}', True, WHITE)
        score_rect = score_surface.get_rect(topright=(CELL_NUMBER * CELL_SIZE - 10, 10))
        screen.blit(score_surface, score_rect)

    def draw_timer(self):
        elapsed_time = int(time.time() - self.start_time)
        minutes, seconds = divmod(elapsed_time, 60)
        timer_surface = pygame.font.Font(None, 36).render(f'{minutes:02d}:{seconds:02d}', True, WHITE)
        timer_rect = timer_surface.get_rect(topleft=(10, 10))
        screen.blit(timer_surface, timer_rect)

    def draw_game_over(self):
        game_over_surface = pygame.font.Font(None, 72).render('GAME OVER', True, RED)
        game_over_rect = game_over_surface.get_rect(center=(CELL_NUMBER * CELL_SIZE // 2, CELL_NUMBER * CELL_SIZE // 2))
        screen.blit(game_over_surface, game_over_rect)

        restart_surface = pygame.font.Font(None, 36).render('Press SPACE to restart', True, WHITE)
        restart_rect = restart_surface.get_rect(center=(CELL_NUMBER * CELL_SIZE // 2, CELL_NUMBER * CELL_SIZE // 2 + 50))
        screen.blit(restart_surface, restart_rect)

def main():
    game = Game()
    clock = pygame.time.Clock()

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN:
                if not game.game_over:
                    if event.key == pygame.K_UP and game.snake.direction != Vector2(0, 1):
                        game.snake.direction = Vector2(0, -1)
                    if event.key == pygame.K_DOWN and game.snake.direction != Vector2(0, -1):
                        game.snake.direction = Vector2(0, 1)
                    if event.key == pygame.K_LEFT and game.snake.direction != Vector2(1, 0):
                        game.snake.direction = Vector2(-1, 0)
                    if event.key == pygame.K_RIGHT and game.snake.direction != Vector2(-1, 0):
                        game.snake.direction = Vector2(1, 0)
                else:
                    if event.key == pygame.K_SPACE:
                        game.reset()

        screen.fill((175, 215, 70))
        game.update()
        game.draw_elements()
        pygame.display.update()

        clock.tick(1000 // game.speed)  # Adjust game speed

if __name__ == "__main__":
    main()