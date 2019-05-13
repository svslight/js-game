'use strict';

const ACTOR_TYPES = {
  ACTOR: 'actor',
  PLAYER: 'player',
  FIREBALL: 'fireball',
  COIN: 'coin',
};

const OBSTACLE_TYPES = {
  WALL: 'wall',
  LAVA: 'lava',
};

const OBSTACLE_SYMBOLS = {
  'x': OBSTACLE_TYPES.WALL,
  '!': OBSTACLE_TYPES.LAVA,
};

const LEVEL_STATUSES = {
  NULL: null,
  LOST: 'lost',
  WON: 'won',
}

/* Вектор. 
Класс Vector контролирирует расположение объектов и управляет их размером и перемещением.
*/

class Vector {    
  constructor(x = 0, y = 0) { 
    this.x = x;
    this.y = y;
  }
	
  static isVector(obj) {
    return obj instanceof Vector;
  }	
  
  // Метод plus создает и возвращает новый объект типа Vector, с новыми координатами.
  plus(vector) {
    if (!(Vector.isVector(vector))) {
      throw new Error(`Можно прибавлять к вектору только вектор типа Vector`);
    }
    return new Vector(this.x + vector.x, this.y + vector.y);
  }

  // Метод times создает и возвращает новый объект типа Vector, с новыми координатами.
  times(number) {
    return new Vector(this.x * number, this.y * number);
  }
}

/* Движущийся объект. 
Класс Actor контролирирует все движущиеся объекты на игровом поле и их пересечение.
*/

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {	
    if (!(Vector.isVector(pos || size || speed))) {
      throw new Error('Объект не является объектом типа Vector')			
    }
    this.pos = pos;
    this.size = size;
    this.speed = speed;		
  }
  
  static isActor(obj) {
    return obj instanceof Actor;
  }	
	
  act() {} 	

  get left() { 
    return this.pos.x;
  }  

  get right() {  
    return this.pos.x + this.size.x;
  }
	
  get top() {  
    return this.pos.y;
  }
	
  get bottom() {  
    return this.pos.y + this.size.y;
  }
	 
  get type() {
    return ACTOR_TYPES.ACTOR;
  }	
	
  // Метод isIntersect проверяет, пересекается ли текущий объект с переданным объектом.
  isIntersect(actor) {
    if (!(Actor.isActor(actor))) {
      throw new Error('Объект не существует или не является объектом класса Actor')
    }
    if (actor === this) {
      return false;
    }
    return this.left < actor.right &&
      this.right > actor.left &&
      this.top < actor.bottom && 
      this.bottom > actor.top;	
  }  
} 

/* Игровое поле. 
Объекты класса Level реализуют схему игрового поля конкретного уровня, контролируют все движущиеся объекты на нём и реализуют логику игры. 
grid[] - сетка игрового поля, actors[]- список движущихся объектов игрового поля.
*/

class Level {	
  constructor(grid = [], actors = []) {  
    this.grid = grid;  
    this.actors = actors;
    this.player = actors.find(actor => actor.type === ACTOR_TYPES.PLAYER); 	  
    this.status = LEVEL_STATUSES.NULL;  
    this.finishDelay = 1;  
    this.height = grid.length;  
    this.width = grid.reduce(((max, arr) => (arr.length > max) ? arr.length : max), 0); 
  }		
	
  // Метод isFinished определяет, завершен ли уровень.
  isFinished() { 
    return (this.status !== LEVEL_STATUSES.NULL) && (this.finishDelay < 0) ? true : false;
  }
	
  // Метод actorAt определяет, расположен ли другой движущийся объект в переданной позиции.
  actorAt(actor) {  
    if (!(Actor.isActor(actor)))  {
      throw new Error('Объект не существует или не является объектом класса Actor')	  
    }
    return this.actors.find(obj => obj.isIntersect(actor));
  }
  
  // Метод obstacleAt определяет, нет ли препятствия в указанном месте.	
  obstacleAt(pos, size)  {  
    if (!(Vector.isVector(pos || size))) {
      throw new Error('Объект не существует или не является объектом класса Vector');
    }
    const borderLeft = Math.floor(pos.x);
    const borderTop = Math.floor(pos.y);
    const borderRight = Math.ceil(pos.x + size.x);
    const borderBottom = Math.ceil(pos.y + size.y);	

    if (borderBottom > this.height)  {
      return OBSTACLE_TYPES.LAVA;
    }
	  
    if (borderLeft < 0 || borderTop < 0 || borderRight > this.width) {
      return OBSTACLE_TYPES.WALL;
    }	
	
    for (let y = borderTop; y < borderBottom; y++) {
      for (let x = borderLeft; x < borderRight; x++) {
        const gridLevel = this.grid[y][x];
	if (gridLevel) {
	  return gridLevel;
	}
      }
    }		
  }
	
  // Метод removeActor удаляет переданный объект с игрового поля.	
  removeActor(actor) { 
    const indexActor = this.actors.indexOf(actor); 
    if (indexActor !== -1) {
      this.actors.splice(indexActor, 1);  
    }
  }
	
  // Метод noMoreActors определяет, остались ли еще объекты переданного типа на игровом поле.
  noMoreActors(type) {  
    return !this.actors.some(actor => actor.type === type);
  }
	
  // Метод playerTouched определяет логику игры, меняет состояние игрового поля при касании объектов.
  playerTouched(type, actor) { 
    if (this.status !== LEVEL_STATUSES.NULL) {
      return;
    } 
  
    if (type === OBSTACLE_TYPES.LAVA  || type === ACTOR_TYPES.FIREBALL) {
      return this.status = LEVEL_STATUSES.LOST;  
    }
	  
    if (type === ACTOR_TYPES.COIN && actor.type === ACTOR_TYPES.COIN) { 
      this.removeActor(actor);	
    }
	  
    if (this.noMoreActors(ACTOR_TYPES.COIN)) { 
      return this.status = LEVEL_STATUSES.WON;  
    }
  }	
} 
	
/* Парсер уровня.
Объект класса`LevelParser` позволяет создать игровое поле`Level` из массива строк. 
*/

class LevelParser {	
  constructor(actors) { 
    this.actors = actors;	   
  }
	
  // Метод actorFromSymbol возвращает конструктор объекта по его символу, используя словарь.
  actorFromSymbol(symbol) {
    if (symbol && this.actors) {
      return this.actors[symbol];
    }	 
  }
	
  // Метод obstacleFromSymbol возвращает строку, соответствующую символу препятствия.
  obstacleFromSymbol(symbol) {
    return OBSTACLE_SYMBOLS[symbol];
  }
	
  // Метод createGrid принимает массив строк и преобразует его в массив массивов.
  createGrid(plan) {
    return plan.map(row => [...row].map(this.obstacleFromSymbol));
  }	
  
  // Метод createActors принимает массив строк и преобразует его в массив движущихся объектов.
  createActors(plan) {
    return plan.reduce((prev, currY, y) => {
      currY.split('').forEach((currX, x) => {
	const constructor = this.actorFromSymbol(currX);
	if (typeof constructor === 'function') {  
	  const actor = new constructor(new Vector(x, y));
	  if (actor instanceof Actor) {    
	    prev.push(actor);
	  }
	} 
      });
      return prev;   
    }, []); 
  }
  	
  // Метод parse создает и возвращает игровое поле, заполненное препятствиями и движущимися объектами.  
  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }  	
} 

/* Шаровая молния. 
Класс Fireball - наследует 'Actor'
*/

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed)
  }
	
  get type() {
    return ACTOR_TYPES.FIREBALL;
  }
	
  // Метод getNextPosition создает и возвращает вектор `Vector` следующей позиции шаровой молнии.	
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
	
  // Метод handleObstacle обрабатывает столкновение молнии с препятствием.
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
	
  // Метод act обновляет состояние движущегося объекта	
  act(time, level) {
    const nextPos = this.getNextPosition(time);
    if (level.obstacleAt(nextPos, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPos;
    }		
  }		
} 

/* Горизонтальная шаровая молния. 
Класс HorizontalFireball - наследует Fireball - при столкновении с препятствием движется в обратную сторону.
*/

class HorizontalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(2, 0));
  }
}

/* Вертикальная шаровая молния. 
Класс VerticalFireball - наследует Fireball - при столкновении с препятствием движется в обратную сторону.
*/

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 2));	
  }
}

/* Огненный дождь. 
Класс FireRain - наследует Fireball - при столкновении с препятствием начинает движение в том же направлении из исходного положения, которое задано при создании.
*/

class FireRain extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 3));
    this.startPos = pos;  
  }
  
  handleObstacle() {
    this.pos = this.startPos; 
  }
} 

/* Монета. 
Класс Coin - наследует Actor - должен постоянно подпрыгивать в рамках своей ячейки.
*/

class Coin extends Actor {	
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.springSpeed = 8;   
    this.springDist = 0.07; 
    this.spring = Math.random() * Math.PI * 2.0; 
    this.startPos = this.pos;  
  }
	
  get type() {
    return ACTOR_TYPES.COIN;
  }	
	
  // Метод updateSpring обновляет фазу подпрыгивания. 
  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }
	
  // Метод getSpringVector создает и возвращает вектор подпрыгивания. 
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);  
  }	
	
  // Метод getNextPosition обновляет текущую фазу, создает и возвращает вектор новой позиции монетки.   
  getNextPosition(time = 1) {
    this.updateSpring(time);
    const newVector = this.getSpringVector();
    return this.startPos.plus(newVector);
  }

  // Метод act получает новую позицию объекта и задает её как текущую. 	
  act(time) {
    this.pos = this.getNextPosition(time);
  }	
}

/* Игрок. 
Класс Player - наследует Actor - содержит базовый функционал движущегося объекта.
*/

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5), new Vector(0, 0));
  }
	
  get type() {
    return ACTOR_TYPES.PLAYER;
  }	
} 

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
};

const parser = new LevelParser(actorDict);
loadLevels()
  .then(result => {
    runGame(JSON.parse(result), parser, DOMDisplay)
      .then(() => console.log('Вы выиграли приз!'));
})
