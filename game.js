const NONE = 1;
const WALK_A = 0;
const WALK_B = 2;

const DOWN = 0;
const LEFT_DOWN = 1;
const LEFT = 2;
const LEFT_UP = 5;
const UP = 6;
const RIGHT_UP = 7;
const RIGHT = 4;
const RIGHT_DOWN = 3;

const DV = {
	0: { x: 1, y: 1, s: 1 },
	1: { x: 0, y: 1, s: Math.sqrt(2) },
	2: { x: -1, y: 1, s: 1 },
	5: { x: -1, y: 0, s: Math.sqrt(2) },
	6: { x: -1, y: -1, s: 1 },
	7: { x: 0, y: -1, s: Math.sqrt(2) },
	4: { x: 1, y: -1, s: 1 },
	3: { x: 1, y: 0, s: Math.sqrt(2) }
};

const DEV = {
	0: { x: 0, y: 1 },
	1: { x: -1 / Math.sqrt(2), y: 1 / Math.sqrt(2) },
	2: { x: -1, y: 0 },
	5: { x: -1 / Math.sqrt(2), y: -1 / Math.sqrt(2) },
	6: { x: 0, y: -1 },
	7: { x: 1 / Math.sqrt(2), y: -1 / Math.sqrt(2) },
	4: { x: 1, y: 0 },
	3: { x: 1 / Math.sqrt(2), y: 1 / Math.sqrt(2) }
};

function Game(width, height) {
	this.width = width;
	this.height = height;

	this.screenCanvas = document.createElement('canvas');
	this.screenCanvas.width = width;
	this.screenCanvas.height = height;
	this.screenCanvas.style.width = width + 'px';
	this.screenCanvas.style.height = height + 'px';
}

Game.prototype.start = function (scene) {
	this.currentScene = scene;
	var fps = 12;

	var update = function() {
		var start_ms = new Date().getTime();
		scene.update();
		var elapsed_ms = new Date().getTime() - start_ms;
		var time = 1000 / fps - elapsed_ms;

		setTimeout (function() {
			update();
		}, time)
	}

	update();
}


function Key() {
	this.pushed = {};
	this._keyEventConsumers = [];

	var key = this;
	document.onkeydown = function (e) {
		key.pushed[e.keyCode] = true;
		key._keyEventConsume();
	}

	document.onkeyup = function (e) {
		key.pushed[e.keyCode] = false;
		key._keyEventConsume();
	}
}

Key.prototype.listenKeyEvent = function (eventConsumer) {
	this._keyEventConsumers.push(eventConsumer);
}

Key.prototype._keyEventConsume = function () {
	var codes = [];
	for (var keyCode in this.pushed) {
		if (this.pushed[keyCode]) {
			codes.push(keyCode);
		}
	}

	for (var i = 0; i < this._keyEventConsumers.length; ++i) {
		this._keyEventConsumers[i](codes);
	}
}


function MainScene(game, assets, player) {
	this.game = game;
	this.assets = assets;
	this.player = player;

	this.camera = new Camera(0, 0, game.width, game.height, player);

	this._keyEventConsumers = [];
	this._clickEventConsumers = [];

	this.key = new Key();

	var scene = this;
	game.screenCanvas.onclick = function (e) {
		scene._clickEventConsumer(e);
	}
}

MainScene.prototype.listenKeyEvent = function (eventConsumer) {
	this._keyEventConsumers.push(eventConsumer);
}

MainScene.prototype.listenClickEvent = function (eventConsumer) {
	this._clickEventConsumers.push(eventConsumer);
}

MainScene.prototype.update = function () {
	this.player.sprite.update();
	this.camera.update();
	this.draw();
}

MainScene.prototype._keyEventConsumer = function (e) {
	for (var i = 0; i < this._keyEventConsumers.length; ++i) {
		(this._keyEventConsumers[i])(e);
	}
}

MainScene.prototype._clickEventConsumer = function (e) {
	var rect = game.screenCanvas.getBoundingClientRect();
	var positionX = rect.left + window.pageXOffset;
	var positionY = rect.top + window.pageYOffset;
	var x = this.camera.x + e.pageX - positionX;
	var y = this.camera.y + e.pageY - positionY;
	var drawX = convertDrawX(x, y, this.player.sprite.offsetX, this.player.sprite.offsetY);
	var drawY = convertDrawY(x, y, this.player.sprite.offsetX, this.player.sprite.offsetY);

	for (var i in this._clickEventConsumers) {
		this._clickEventConsumers[i](drawX, drawY);
	}
}

MainScene.prototype.draw = function () {
	var map = this.player.map;

	var context = this.game.screenCanvas.getContext("2d");
	context.clearRect(0, 0, this.game.width, this.game.height);

	var d = this.player.sprite.direction;
	var playerX = this.player.sprite.targetGameX;
	var playerY = this.player.sprite.targetGameY;
	if (this.player.isWalk() && (d == UP || d == LEFT_UP || d == RIGHT_UP)) {
		playerX = this.player.sprite.gameX;
		playerY = this.player.sprite.gameY;
	}

	for (var l = 0; l < map.layer; ++l) {
		var tileData = map.getTileData(l);
		var offsetX = tileData.offsetX;
		var offsetY = tileData.offsetY;

		for (var x = 0; x < playerX + playerY + 1; ++x) {
			for (var y = 0; y < playerX + playerY + 1 - x; ++y) {
				if (tileData[y][x] == 0 || (this.player.h + 1 == l && playerX == x && playerY == y)) {
					continue;
				}
				var image = this.assets.getTileImage(map.id, tileData[y][x]);
				var drawX = convertX(x, y) + offsetX - 16 - this.camera.x;
				var drawY = convertY(x, y) + offsetY - 8 - this.camera.y;
				if (drawX < - 50 || drawX > 690 || drawY < - 50 || drawY > 530) {
					continue;
				}
				context.drawImage(image, drawX, drawY);
			}
		}
	}

	context.drawImage(this.player.sprite.getImage(),
		this.player.sprite.x - this.camera.x,
		this.player.sprite.y - this.camera.y);

	if (this.player.h + 1 < map.layer) {
		var tileData = map.getTileData(this.player.h + 1);
		if (tileData[playerY][playerX] != 0) {
			var offsetX = tileData.offsetX;
			var offsetY = tileData.offsetY;

			var image = this.assets.getTileImage(map.id, tileData[playerY][playerX]);
			var drawX = convertX(playerX, playerY) + offsetX - 16 - this.camera.x;
			var drawY = convertY(playerX, playerY) + offsetY - 8 - this.camera.y;
			if (drawX < - 50 || drawX > 690 || drawY < - 50 || drawY > 530) {
			} else {
				context.drawImage(image, drawX, drawY);
			}
		}
	}

	for (var l = 0; l < map.layer; ++l) {
		var tileData = map.getTileData(l);
		var offsetX = tileData.offsetX;
		var offsetY = tileData.offsetY;

		for (var x = 0; x < map.width; ++x) {
			var startY = playerX + playerY + 1 - x;
			startY = startY < 0 ? 0 : startY;
			for (var y = startY; y < map.height; ++y) {
				if (tileData[y][x] == 0) {
					continue;
				}
				var image = this.assets.getTileImage(map.id, tileData[y][x]);
				var drawX = convertX(x, y) + offsetX - 16 - this.camera.x;
				var drawY = convertY(x, y) + offsetY - 8 - this.camera.y;
				if (drawX < - 50 || drawX > 690 || drawY < - 50 || drawY > 530) {
					continue;
				}
				if (l > this.player.h + 1 && (x - playerX >= 0 && x - playerX <= 2 && y - playerY >= 0 && y - playerY <= 2)) {
					context.globalAlpha = 0.2;
					context.drawImage(image, drawX, drawY);
					context.globalAlpha = 1;
				} else {
					context.drawImage(image, drawX, drawY);
				}
			}
		}
	}
}

function convertX(x, y) {
	return 16 * x - 16 * y;
}

function convertY(x, y) {
	return 8 * x + 8 * y;
}

function convertDrawX(x, y, offsetX, offsetY) {
	return Math.floor((x + 2 * y - 2 * offsetY + offsetX) / 32 + 0.5);
}

function convertDrawY(x, y, offsetX, offsetY) {
	return Math.floor((2 * y - x - 2 * offsetY - offsetX) / 32 + 0.5);
}


function Camera(x, y, width, height, player) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.player = player;
}

Camera.prototype.update = function () {
	this.x = this.player.sprite.getCenterX() - this.width / 2;
	this.y = this.player.sprite.getCenterY() - this.height / 2;
}

Camera.prototype.move = function (x, y) {
	this.x = x;
	this.y = y;
}

Camera.prototype.getCenterX = function () {
	return this.x + this.width / 2;
}

Camera.prototype.getCenterY = function () {
	return this.y + this.height / 2;
}

function SpritePlayer(player, width, height) {
	this.player = player;
	this.width = width;
	this.height = height;
	this.x = this._drawX(player.x, player.y);
	this.y = this._drawY(player.x, player.y);

	this.targetX = this.x;
	this.targetY = this.y;

	this.gameX = player.x;
	this.gameY = player.y;
	this.targetGameX = player.x;
	this.targetGameY = player.y;

	this.offsetX = 0;
	this.offsetY = 0;

	this.direction = null;

	this.images = [];
	this._loadAssets();

	this.count = 0;
}

SpritePlayer.prototype.update = function () {
	this.count++;
	if (this.count > 2) {
		if (this.player.status == WALK_A) {
			this.player.status = WALK_B;
		} else if (this.player.status == WALK_B) {
			this.player.status = WALK_A;
		}
		this.count = 0;
	}

	if (this.player.status == WALK_A || this.player.status == WALK_B) {
		var dx = this.targetX - this.x;
		var dy = this.targetY - this.y;
		var d = Math.sqrt(dx * dx + dy * dy);

		if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
			this.x = this.targetX;
			this.y = this.targetY;
		} else {
			dx /= d;
			dy /= d;

			this.x += dx * 5;
			this.y += dy * 5;
		}

		if (this.x == this.targetX && this.y == this.targetY) {
			this.player.endAnimate();
		}
	} else if (this.player.status == NONE) {
		this.player.endAnimate();
	}
}

SpritePlayer.prototype.moveTo = function (direction, dh) {
	this.gameX = this.player.x;
	this.gameY = this.player.y;
	this.targetGameX = this.player.x + DV[direction].x;
	this.targetGameY = this.player.y + DV[direction].y;
	var tile = this.player.map.getOffset(this.gameX, this.gameY, this.player.h);
	var targetTile = this.player.map.getOffset(this.targetGameX, this.targetGameY, this.player.h + dh);
	var ox = targetTile.offsetX - tile.offsetX;
	var oy = targetTile.offsetY - tile.offsetY;
	if (ox != 0 || oy != 0) {
		this.offsetX += ox;
		this.offsetY += oy;
	}
	this.targetX = this.x + convertX(DV[direction].x, DV[direction].y) + ox;
	this.targetY = this.y + convertY(DV[direction].x, DV[direction].y) + oy;
	this.direction = direction;
}

SpritePlayer.prototype.getCenterX = function () {
	return this.x + this.width / 2;
}

SpritePlayer.prototype.getCenterY = function () {
	return this.y + this.height / 2;
}

SpritePlayer.prototype.getImage = function () {
	return this.images[this.direction * 3 + this.player.status];
}

SpritePlayer.prototype._loadAssets = function () {
	for (var i = 0; i <= 23; ++i) {
		var image = new Image(this.width, this.height);
		image.src = 'assets/17_hero2/' + i + '.png';
		this.images[i] = image;
	}
}

SpritePlayer.prototype._drawX = function (x, y) {
	return convertX(x, y) - 12;
}

SpritePlayer.prototype._drawY = function (x, y) {
	return convertY(x, y) - 35;
}

function Assets() {
	this.tileData = {};
	this.tileImages = {};
	this.characterImages = {};

	this.tileLoaded = false;
	this.characterLoaded = false;
}

Assets.prototype.loadTile = function (loaded) {
	var rawData = [map1];
	var total = 0;
	for (var id in rawData) {
		total += rawData[id].tilesets[0].tilecount;
	}
	var imageCount = 0;

	for (var id in rawData) {
		var tileData = {};
		tileData.height = rawData[id].height;
		tileData.width = rawData[id].width;
		for (var l = 0; l < rawData[id].layers.length; ++l) {
			var rawTileData = rawData[id].layers[l].data;
			var offsetX = rawData[id].layers[l].offsetx != null ? rawData[id].layers[l].offsetx : 0;
			var offsetY = rawData[id].layers[l].offsety != null ? rawData[id].layers[l].offsety : 0;
			var data = {};
			data.offsetX = offsetX;
			data.offsetY = offsetY;

			for (var y = 0; y < rawData[id].height; ++y) {
				data[y] = [];
				for (var x = 0; x < rawData[id].width; ++x) {
					data[y].push(rawTileData[y * rawData[id].height + x] == 0 ? 0 : rawTileData[y * rawData[id].height + x] - 1);
				}
			}
			tileData[l] = data;
		}
		this.tileData[id] = tileData;

		var images = {};
		var tileset = rawData[id].tilesets[0];
		for (var i = 0; i < tileset.tilecount; ++i) {
			var image = new Image(32, 32);
			image.src = 'assets/50309019_p0/' + i + '.png';
			image.onload = function() {
				imageCount++;
				if (imageCount == total) {
					loaded();
				}
			}
			images[i] = image;
		}
		this.tileImages[id] = images;
	}
}

Assets.prototype.getTileImage = function(id, imageId) {
	return this.tileImages[id][imageId];
}

Assets.prototype.getTileData = function(id) {
	return this.tileData[id];
}

function Player(name, x, y, h, width, height, map, world) {
	this.name = name;
	this.x = x;
	this.y = y;
	this.h = h;
	this.map = map;
	this.world = world;

	this.targetX = x;
	this.targetY = y;

	this.status = NONE;

	this.sprite = new SpritePlayer(this, width, height);
}

Player.prototype.walk = function (x, y) {
	this.targetX = x;
	this.targetY = y;
	this.status = WALK_A;
}

Player.prototype.endAnimate = function () {
	if (this.x != this.targetX || this.y != this.targetY) {
		this._walk();
	} else {
		if (this.status == WALK_A || this.status == WALK_B) {
			this.status = NONE;
		}
	}
}

Player.prototype.isWalk = function () {
	return this.status == WALK_A || this.status == WALK_B;
}

Player.prototype._walk = function () {
	var d = getDirection(this.x, this.y, this.targetX, this.targetY);
	var tx = this.x + DV[d].x;
	var ty = this.y + DV[d].y;

	if (this.map.canWalk(tx, ty, this.h)) {
		var dh = 0;
		if (this.map.upstairs(tx, ty, this.h + 1)) {
			dh += 1;
		} else if (this.map.downstairs(tx, ty, this.h - 1)) {
			dh -= 1;
		}
		this.sprite.moveTo(d, dh);
		this.x = tx;
		this.y = ty;
		this.h += dh;
		//console.log(this.x, this.y, this.h);
	} else {
		this.targetX = this.x;
		this.targetY = this.y;
		this.status = NONE;
	}
}

function getDirection(x, y, tx, ty) {
	var dx = tx - x;
	var dy = ty - y;

	if (dx == 0 && dy == 0) {
		return 0;
	}

	var steep = Math.abs(dy) > Math.abs(dx);
	if (steep) {
		var temp = dy;
		dy = dx;
		dx = temp;
	}

	var xstep = dx > 0 ? 1 : -1;
	var ystep = 0;
	if (2 * Math.abs(dy) - Math.abs(dx) > 0) {
		if (dy < 0) {
			ystep = -1;
		} else {
			ystep = 1;
		}
	}

	if (steep) {
		var temp = ystep;
		ystep = xstep;
		xstep = temp;
	}

	for (var i = 0; i < 8; ++i) {
		if (DV[i].x == xstep && DV[i].y == ystep) {
			return i;
		}
	}
	return 0;
}

function World() {
	this.maps = [];
}

World.prototype.addMap = function (map) {
	this.maps.push(map);
}

function Map(id, name, tileData) {
	this.id = id;
	this.name = name;

	this.width = tileData.width;
	this.height = tileData.height;

	this.tiles = {};
	this.npcs = [];

	this.layer = (Object.keys(tileData).length - 2) / 2;
	this.tileData = tileData;
}

Map.prototype.canWalk = function (x, y, h) {
	if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
		return false;
	}
	var data = this._tileData(h * 2 + 1);
	return data[y][x] == 0 || data[y][x] == 2 || data[y][x] == 3;
}

Map.prototype.upstairs = function (x, y, h) {
	return this.hasH(h) && this._tileData(h * 2 + 1)[y][x] == 2;
}

Map.prototype.downstairs = function (x, y, h) {
	return this.hasH(h) && this._tileData(h * 2 + 1)[y][x] == 3;
}

Map.prototype.isStair = function (x, y, h) {
	return this.hasH(h) && this._tileData(h * 2 + 1)[y][x] == 2;
}

Map.prototype.getTileData = function (h) {
	return this._tileData(h * 2);
}

Map.prototype.getOffset = function (x, y, h) {
	var tileData = this.getTileData(h);
	var offset = {};

	offset.offsetX = tileData.offsetX;
	offset.offsetY = tileData.offsetY;

	if (this.upstairs(x, y, h)) {
		offset.offsetY += 8;
	}

	return offset;
}

Map.prototype.hasH = function (h) {
	return h >= 0 && h < this.layer;
}

Map.prototype.getImage = function (id) {
	return this.tiles[id];
}

Map.prototype._tileData = function (number) {
	return this.tileData[number];
}