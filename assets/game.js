var game = new Phaser.Game(640, 480, Phaser.CANVAS, 'phaser-example', {preload: preload, create: create, update: update, render: render});

function preload() {
    game.load.image('background','assets/tests/debug-grid-1920x1920.png');
    game.load.image('player','assets/sprites/phaser-dude.png');
}

var player;

var x = 0;
var y = 0;

function create() {
    game.add.tileSprite(0, 0, 1920, 1920, 'background');
    game.world.setBounds(0, 0, 1920, 1920);
    game.physics.startSystem(Phaser.Physics.P2JS);
    player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
    game.physics.p2.enable(player);
    game.camera.follow(player);

	x = player.body.x;
	y = player.body.y;
}

function update() {
    player.body.setZeroVelocity();

	var pointer = game.input.activePointer;
	if (pointer.isDown) {
		x = pointer.x - game.width / 2 + game.camera.view.centerX;
		y = pointer.y - game.height / 2 + game.camera.view.centerY;
	}

	var dx = x - player.body.x;
	var dy = y - player.body.y;
	var d = Math.sqrt(dx*dx + dy*dy);
	if ((dx != 0 || dy != 0) && d >= 1) {

    	player.body.moveRight(dx / d * 100);
    	player.body.moveDown(dy / d * 100);
	}
}

function render() {
    game.debug.cameraInfo(game.camera, 32, 32);
    game.debug.spriteCoords(player, 32, 500);
}