var game = new Game(640, 480);
document.body.appendChild(game.screenCanvas);

var map = new Map('test', map1);
var world = new World();
var player = new Player('勇者', 5, 5, 0, 24, 40, map, world);

game.start(new MainScene(game, player));