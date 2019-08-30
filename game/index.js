var game = new Game(640, 480);
document.body.appendChild(game.screenCanvas);

var assets = new Assets();
assets.loadTile(function () {
	var map = new Map(0, 'test', assets.getTileData(0));
	var world = new World();
	var player = new Player('勇者', 5, 5, 0, 24, 40, map, world);

	var mainScene = new MainScene(game, assets, player);
	game.start(mainScene);

	mainScene.key.listenKeyEvent(function (codes) {
		var dx = 0;
		var dy = 0;

		for (var i in codes) {
			var code = codes[i];
			if (code == 38) {
				dy -= 1;
				dx -= 1;
			}
			if (code == 40) {
				dy += 1;
				dx += 1;
			}
			if (code == 37) {
				dx -= 1;
				dy += 1;
			}
			if (code == 39) {
				dx += 1;
				dy -= 1;
			}

			switch (parseInt(code)) {
				case 81:
					dx -= 1;
					break;
				case 87:
					dx -= 1;
					dy -= 1;
					break;
				case 69:
					dy -= 1;
					break;
				case 68:
					dx += 1;
					dy -= 1;
				case 67:
					dx += 1;
					break;
				case 88:
					dx += 1;
					dy += 1;
					break;
				case 90:
					dy += 1;
					break;
				case 65:
					dx -= 1;
					dy += 1;
					break;
			}
		}

		dx = Math.abs(dx) >= 2 ? dx / Math.abs(dx) : dx;
		dy = Math.abs(dy) >= 2 ? dy / Math.abs(dy) : dy;

		if (dx != 0 || dy != 0) {
			player.walk(player.x + dx, player.y + dy);
		}
	});

	mainScene.listenClickEvent(function (x, y) {
		player.walk(x, y);
	});
});
