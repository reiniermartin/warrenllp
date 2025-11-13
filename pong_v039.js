var DIRECTION = {
  IDLE: 0,
  UP: 1,
  DOWN: 2,
  LEFT: 3,
  RIGHT: 4 },
  rounds = [5,5,5,5,5],
  finalRound = rounds.length-1,
  nextRound = document.getElementById('gameNext'),
  gameMode = document.getElementById('gameMode'),
  gameMessage = document.getElementById('gameMessage'),
  gameStart = document.getElementById('messageStart'),
  gameWon = document.getElementById('messageWon'),
  gameEnd = document.getElementById('messageEnd'),
  playingPong = false,
  windowWidth = window.innerWidth,
  windowHeight = window.innerHeight,
  initialPaddleSpeed,
  initialBallSpeed,
  //ballImage = new Image(),
  soundHit = new Audio(),
  soundWall = new Audio(),
  soundScoreUser = new Audio(),
  soundScoreComp = new Audio();
  /*audio*/
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);
soundHit.src = 'https://cdn.jsdelivr.net/gh/reiniermartin/warrenllp@main/sounds/hit.mp3';
soundWall.src = 'https://cdn.jsdelivr.net/gh/reiniermartin/warrenllp@main/sounds/wall.mp3';
soundScoreUser.src = 'https://cdn.jsdelivr.net/gh/reiniermartin/warrenllp@main/sounds/userScore.mp3';
soundScoreComp.src = 'https://cdn.jsdelivr.net/gh/reiniermartin/warrenllp@main/sounds/comScore.mp3';
function setPaddleSpeed() {
  if (windowWidth >= 2560) { return 10.2; } 
  else if (windowWidth < 2560 && windowWidth >= 1920) { return 9.2; }
  else if (windowWidth < 1920 && windowWidth >= 1440) { return 8.6; }
  else if (windowWidth < 1440 && windowWidth >= 992) { return 8.4; }
  else if (windowWidth < 992 && windowWidth >= 768) { return 7.6; }
  else { return 7; }
}
function setBallSpeed() {
  if (windowWidth >= 2560) { return 12; } 
  else if (windowWidth < 2560 && windowWidth >= 1920) { return 11; }
  else if (windowWidth < 1920 && windowWidth >= 1440) { return 10; }
  else if (windowWidth < 1440 && windowWidth >= 992) { return 9; }
  else if (windowWidth < 992 && windowWidth >= 768) { return 8; }
  else if (windowWidth < 768 && windowWidth >= 640) { return 7; }
  else { return 6; }
}
function paddleMargin() {
  if (windowWidth >= 2560) { return .225;}
  else if (windowWidth < 2560 && windowWidth >= 1920) { return .2; }
  else if (windowWidth < 1920 && windowWidth >= 1440) { return .175; }
  else if (windowWidth < 1440 && windowWidth >= 992) { return .15; }
  else if (windowWidth < 992 && windowWidth >= 640) { return .1; }
  else { return .075; }
}
var Ball = {
  new: function (incrementedSpeed) {
    return {
      width: this.canvas.height / 40,
      height: this.canvas.height / 40,
      x: (this.canvas.width / 2) - (this.canvas.height / 80),
      y: (this.canvas.height / 10),
      moveX: DIRECTION.IDLE,
      moveY: DIRECTION.IDLE,
      speed: incrementedSpeed || setBallSpeed()
    };
  }
};
var Ai = {
  new: function (side) {
    return {
      width: this.canvas.height / 40,
      height: this.canvas.height / 5,
      x: side === 'left' ? (this.canvas.width * paddleMargin()) - (this.canvas.height / 40) : (this.canvas.width * (1 - paddleMargin())),
      y: (this.canvas.height / 2) - this.canvas.height / 10,
      score: 0,
      move: DIRECTION.IDLE,
      speed: setPaddleSpeed()
    };
  }
};
var Game = {
  initialize: function () {
    this.canvas = document.getElementById('pongwarrenllp');
    this.context = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.player = Ai.new.call(this, 'left');
    this.ai = Ai.new.call(this, 'right');
    this.ball = Ball.new.call(this);
    this.ai.speed = setPaddleSpeed() * .925;
    initialPaddleSpeed = setPaddleSpeed();
    initialBallSpeed = setBallSpeed();
    this.running = this.over = false;
    this.turn = this.ai;
    this.timer = this.round = 0;
    gameStart.style.display = 'block';
    gameWon.style.display = 'none';
    gameEnd.style.display = 'none';
    Pong.menu();
    Pong.listen();
  },
  endGameMenu: function (text) {
    setTimeout(function () {
      Pong = Object.assign({}, Game);
      Pong.initialize();
    }, 3000);
  },
  menu: function () {
      Pong.draw();
  },
  update: function () {
      if (!this.over && playingPong) {
        gameMode.classList.remove('paused');
        // If the ball collides with the bound limits - correct the x and y coords.
        if (this.ball.x <= 0) Pong._resetTurn.call(this, this.ai, this.player);
        if (this.ball.x >= this.canvas.width - this.ball.width) Pong._resetTurn.call(this, this.player, this.ai);
        if (this.ball.y <= 0) this.ball.moveY = DIRECTION.DOWN;
        if (this.ball.y >= this.canvas.height - this.ball.height) this.ball.moveY = DIRECTION.UP;
        // Move player if they player.move value was updated by a keyboard event
        if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
        else if (this.player.move === DIRECTION.DOWN) this.player.y += this.player.speed;
        // On new serve (start of each turn) move the ball to the correct side
        if (Pong._turnDelayIsOver.call(this) && this.turn) {
          this.ball.moveX = this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
          this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
          if (this.ball.moveX === DIRECTION.LEFT) {
            this.ball.x = this.canvas.width - (this.canvas.width / 5);
          } else {
            this.ball.x = this.canvas.width / 5;
          }
          this.ball.y = Math.floor(Math.random() * this.canvas.height - 200) + 200;
          this.turn = null;
        }
        if (this.player.y <= 0) this.player.y = 0;
        else if (this.player.y >= (this.canvas.height - this.player.height)) this.player.y = (this.canvas.height - this.player.height);
        // Move ball in intended direction based on moveY and moveX values
        if (this.ball.moveY === DIRECTION.UP) this.ball.y -= (this.ball.speed / 1.5);
        else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += (this.ball.speed / 1.5);
        if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
        else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;
        // Handle ai (AI) UP and DOWN movement
        if (this.ai.y > this.ball.y - (this.ai.height / 2)) {
          if (this.ball.moveX === DIRECTION.RIGHT) this.ai.y -= this.ai.speed / 1.5;
          else this.ai.y -= this.ai.speed / 4;
        }
        if (this.ai.y < this.ball.y - (this.ai.height / 2)) {
          if (this.ball.moveX === DIRECTION.RIGHT) this.ai.y += this.ai.speed / 1.5;
          else this.ai.y += this.ai.speed / 4;
        }
        // Handle ai (AI) wall collision
        if (this.ai.y >= this.canvas.height - this.ai.height) this.ai.y = this.canvas.height - this.ai.height;
        else if (this.ai.y <= 0) this.ai.y = 0;
        // Handle Player-Ball collisions
        if (this.ball.x - (this.ball.width/2) <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
          if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
            this.ball.x = (this.player.x + this.ball.width);
            this.ball.moveX = DIRECTION.RIGHT;
            //var audio = soundHit;
            soundHit.play();
            //playBeep(300, 50, .3);
          }
        }
        // Handle ai-ball collision
        if (this.ball.x - this.ball.width <= this.ai.x && this.ball.x >= this.ai.x - this.ai.width) {
          if (this.ball.y <= this.ai.y + this.ai.height && this.ball.y + this.ball.height >= this.ai.y) {
            this.ball.x = (this.ai.x - this.ball.width);
            this.ball.moveX = DIRECTION.LEFT;
            soundHit.play();
            //playBeep(250, 50, .3);
          }
        }
        if (this.ball.x <= 0) {
          soundScoreComp.play();
          //playBeep(100, 300, .3);
        }
        if ((this.ball.x) >= (this.canvas.width - this.ball.width )) {
          soundScoreUser.play();
          //playBeep(500, 300, .3);
        }
        if ((this.ball.y) <= (0) || (this.ball.y) >= (this.canvas.height - this.ball.height)) {
          soundWall.play();
          //playBeep(300, 50, .3);
        }
      }
      // Handle the end of round transition
      if (this.player.score === rounds[this.round]) {
        if (!rounds[this.round + 1]) {
          this.over = true;
          let count = 5;
          const countDown = document.getElementById('restartCountdown1');
          countDown.textContent = count;
          gameStart.style.display = 'none';
          gameEnd.style.display = 'none';
          gameWon.style.display = 'block';
          gameMode.classList.add('paused');
          const interval = setInterval(() => {
            countDown.textContent = count-1;
            count--;
            if (count < 0) {
              clearInterval(interval);
              countDown.textContent = '0';
            }
          }, 1000);
          Pong.endGameMenu('Winner!');
        } else {
          this.player.score = this.ai.score = 0;
          this.player.speed += 0.5;
          this.ai.speed += 1;
          this.ball.speed += 1;
          this.round += 1;
          if(this.round == finalRound) {
            nextRound.textContent = 'win!';
          }
        }
      }
      // Check to see if the ai/AI has won the round.
      else if (this.ai.score === rounds[this.round]) {
        this.over = true;
        let count = 3;
        const countDown = document.getElementById('restartCountdown2');
        countDown.textContent = count;
        gameStart.style.display = 'none';
        gameWon.style.display = 'none';
        gameEnd.style.display = 'block';
        gameMode.classList.add('paused');
        const interval = setInterval(() => {
          countDown.textContent = count-1;
          count--;
          if (count < 0) {
            clearInterval(interval);
            countDown.textContent = '0';
          }
        }, 1000);
        Pong.endGameMenu('Game Over!');
      }
  },
  // Draw the objects to the canvas element
  draw: function () {
      // Clear the Canvas
      this.context.clearRect(
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      this.context.fillStyle = this.color; 
      this.context.fillStyle = '#e8b62a';
      // Draw the Player
      this.context.fillRect(
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height
      );
      // Draw the Ai
      this.context.fillRect(
        this.ai.x,
        this.ai.y,
        this.ai.width,
        this.ai.height 
      );
      // Draw the Ball
      if (Pong._turnDelayIsOver.call(this)) {
        this.context.fillRect(
            this.ball.x,
            this.ball.y,
            this.ball.width,
            this.ball.height
        );
        /*this.context.drawImage(
          this.ball.image, 
          this.ball.x, 
          this.ball.y, 
          this.ball.width, 
          this.ball.height
        );*/
      }
      var scorePlayer = document.getElementById('scorePlayer'),
          scoreComputer = document.getElementById('scoreComputer'),
          gameLevel = document.getElementById('gameLevel'),
          gameLevelPoints = document.getElementById('levelGoal');
      scorePlayer.textContent = this.player.score.toString();
      scoreComputer.textContent = this.ai.score.toString();
      gameLevel.textContent = (Pong.round + 1);
      gameLevelPoints.textContent = rounds[Pong.round] ? rounds[Pong.round] : rounds[Pong.round - 1];
  },
  loop: function () {
      Pong.update();
      Pong.draw();
      if (!Pong.over) requestAnimationFrame(Pong.loop);
  },
  listen: function () {
      document.addEventListener('keydown', function (key) {
        if (key.keyCode !== 27) {
          if (Pong.running === false && playingPong) {
            Pong.running = true;
            window.requestAnimationFrame(Pong.loop);
          }
          if (key.keyCode === 38 || key.keyCode === 87) Pong.player.move = DIRECTION.UP;
          if (key.keyCode === 40 || key.keyCode === 83) Pong.player.move = DIRECTION.DOWN;
        }
      });
      document.addEventListener('keyup', function (key) { Pong.player.move = DIRECTION.IDLE; });
      var handleButtonDown = function(moveDirection) {
        return function(e) {
          e.preventDefault();
          Pong.player.move = moveDirection;
          if (Pong.running === false && playingPong) {
            Pong.running = true;
            window.requestAnimationFrame(Pong.loop);
          }
        };
      };
      var handleButtonUp = function() {
        Pong.player.move = DIRECTION.IDLE;
      };
      var buttonUp = document.getElementById('buttonUp');
      buttonUp.addEventListener('mousedown', handleButtonDown(DIRECTION.UP));
      buttonUp.addEventListener('touchstart', handleButtonDown(DIRECTION.UP));
      buttonUp.addEventListener('mouseup', handleButtonUp);
      buttonUp.addEventListener('touchend', handleButtonUp);
      var buttonDown = document.getElementById('buttonDown');
      buttonDown.addEventListener('mousedown', handleButtonDown(DIRECTION.DOWN));
      buttonDown.addEventListener('touchstart', handleButtonDown(DIRECTION.DOWN));
      buttonDown.addEventListener('mouseup', handleButtonUp);
      buttonDown.addEventListener('touchend', handleButtonUp);
  },
  _resetTurn: function(victor, loser) {
    this.ball = Ball.new.call(this, this.ball.speed);
    this.turn = loser;
    this.timer = (new Date()).getTime();
    victor.score++;
  },
  // Wait for a delay to have passed after each turn.
  _turnDelayIsOver: function() {
    return ((new Date()).getTime() - this.timer >= 1000);
  }

};
var Pong = Object.assign({}, Game);
Pong.initialize();
document.addEventListener('DOMContentLoaded', function() {
  //var activateButton = document.getElementById('activate_pong');
  var exitButton = document.getElementById('exit_pong');
  var pongGameElement = document.getElementById('pong_game');
  if (exitButton) {
    exitButton.addEventListener('click', function() {
      if (pongGameElement) {
        document.body.style.overflow = '';
        pongGameElement.classList.remove('active');
        playingPong = false;
      }
    });
  }
  // Long press detector for spacebar, mouse clicks, and touch
  class LongPressDetector {
    constructor(holdTime = 9500) {
      this.holdTime = holdTime;
      this.pressStart = 0;
      this.pressTimer = null;
      this.handlePressStartBound = this.handlePressStart.bind(this);
      this.handlePressEndBound = this.handlePressEnd.bind(this);
    }
    start() {
      document.addEventListener('keydown', this.handlePressStartBound);
      document.addEventListener('keyup', this.handlePressEndBound);
      document.addEventListener('mousedown', this.handlePressStartBound);
      document.addEventListener('mouseup', this.handlePressEndBound);
      document.addEventListener('touchstart', this.handlePressStartBound);
      document.addEventListener('touchend', this.handlePressEndBound);
    }
    stop() {
      document.removeEventListener('keydown', this.handlePressStartBound);
      document.removeEventListener('keyup', this.handlePressEndBound);
      document.removeEventListener('mousedown', this.handlePressStartBound);
      document.removeEventListener('mouseup', this.handlePressEndBound);
      document.removeEventListener('touchstart', this.handlePressStartBound);
      document.removeEventListener('touchend', this.handlePressEndBound);
      clearTimeout(this.pressTimer);
    }
    handlePressStart(event) {
      if ((event.type === 'keydown' && event.code === "Space") || event.type === 'mousedown' || event.type === 'touchstart') {
        if (!this.pressStart) {
          this.pressStart = Date.now();
          this.pressTimer = setTimeout(() => {
            this.onLongPressDetected();
          }, this.holdTime);
        }
      }
    }
    handlePressEnd(event) {
      if ((event.type === 'keyup' && event.code === "Space") || event.type === 'mouseup' || event.type === 'touchend') {
        clearTimeout(this.pressTimer);
        this.pressStart = 0;
      }
    }
    onLongPressDetected() {
      if (pongGameElement) {
        pongGameElement.classList.add('active');
        document.body.style.overflow = 'hidden';
        playingPong = true;
      }
    }
  }
  const longPressDetector = new LongPressDetector();
  longPressDetector.start();
});
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
      var exitButton = document.getElementById('exit_pong');
      if (exitButton) {
          exitButton.click();
      }
  }
});
function resizeCanvas() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  Pong.ball = Ball.new(initialBallSpeed);
  var canvas = document.getElementById('pongwarrenllp');
  if (canvas) {
      canvas.width = windowWidth;
      canvas.height = windowHeight;
      Pong = Object.assign({}, Game);
      Pong.initialize();
      Pong.player.speed = initialPaddleSpeed;
      Pong.ai.speed = initialPaddleSpeed;
      Pong.ball.speed = initialBallSpeed;
  }
}
window.addEventListener('resize', resizeCanvas);
