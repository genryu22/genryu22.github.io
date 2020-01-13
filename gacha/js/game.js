(() => {

const app = new PIXI.Application({
	width: window.innerWidth,
	height: window.innerHeight
})
document.getElementById('gameRoot').appendChild(app.view)

let option
let startedCallback
let completedCallback

window.GAME = {
	setOption: op => {
		option = op
		return window.GAME
	},
	setStarted: callback => {
		startedCallback = callback
		return window.GAME
	},
	setCompleted: callback => {
		completedCallback = callback
		return window.GAME
	},
	start: async () => {
		if (option.statusIsCompleted) {
			location.href = option.nextPageUrl
			return
		}
		await preloadImages()
		restrictZoom()
		init()
	}
}

function init() {
	arrangeSprites()
}

function arrangeSprites() {
	const createSprite = img => new PIXI.Sprite(PIXI.loader.resources[getImageURL(img)].texture)

	const vw = v => app.screen.width * v

	const background = new PIXI.Sprite(PIXI.loader.resources[getImageURL('bg.jpg')].texture)
	background.anchor.set(0.5)
	background.x = app.screen.width / 2
	background.y = app.screen.height / 2
	const ratio = background.height / background.width
	background.width = app.screen.width
	background.height = app.screen.width * ratio
	app.stage.addChild(background)
	const scale = background.scale.x
	console.log(scale)
	const yOrigin = background.y - background.height / 2

	background.interactive = true
	background.on('touchstart', (e) => {
		const touch = e.data.originalEvent.changedTouches[0]
		console.log(`x: ${touch.globalX}, y:${touch.globalY - yOrigin}`)
		console.log(`rx: ${touch.globalX / app.screen.width}, ry:${(touch.globalY - yOrigin) / app.screen.width}`)
	})

	const searchlight = new PIXI.Sprite(PIXI.loader.resources[getImageURL('searchlight.png')].texture)
	searchlight.anchor.set(0.5)
	searchlight.x = background.x
	searchlight.y = background.y
	searchlight.width = background.width
	searchlight.height = background.height
	app.stage.addChild(searchlight)

	const characterContainer = new PIXI.Container()
	characterContainer.x = app.screen.width * 0.14
	characterContainer.y = yOrigin + app.screen.width * 0.15
	app.stage.addChild(characterContainer)

	const balls = createBalls(yOrigin, scale, (v) => app.screen.width * v)
	for (let b of balls) {
		characterContainer.addChild(b)
	}

	const character = new PIXI.Sprite(PIXI.loader.resources[getImageURL('case_all.png')].texture)
	character.scale.set(scale)
	characterContainer.addChild(character)

	const doorData = [
		{
			name: 'door_0default.png',
			vw: 0.288,
			vy: 0.727,
		},
		{
			name: 'door1.png',
			vw: 0.288,
			vy: 0.727,
		},
		{
			name: 'door2.png',
			vw: 0.288,
			vy: 0.727,
		},
		{
			name: 'door3.png',
			vw: 0.288,
			vy: 0.727,
		},
		{
			name: 'door_4full.png',
			vw: 0.17,
			vy: 0.72,
		}
	]
	const doors = []
	for (let data of doorData) {
		const door = new PIXI.Sprite(PIXI.loader.resources[getImageURL(data.name)].texture)
		door.scale.set(scale)
		door.x = vw(data.vw)
		door.y = vw(data.vy)
		door.visible = false
		doors.push(door)
		characterContainer.addChild(door)
	}
	doors[0].visible = true

	let leverCount = 2
	const lever = createSprite('lever.png')
	lever.x = app.screen.width * 0.165
	lever.y = app.screen.width * 0.75
	lever.anchor.x = 0.5
	lever.anchor.y = 0.99
	lever.scale.set(scale)
	{
		let started = false
		let startX
		let startY
		let currentX
		let currentY
		const originX = app.screen.width * 0.355
		const originY = yOrigin + app.screen.width * 0.928
		lever.on('touchstart', (e) => {
			const touch = e.data.originalEvent.changedTouches[0]
			if (touch.globalY > yOrigin + app.screen.width * 0.8) {
				return
			}
			startX = touch.globalX - originX
			startY = touch.globalY - originY
			started = true
		})
		lever.on('touchmove', (e) => {
			if (!started) {
				return
			}
			const touch = e.data.originalEvent.changedTouches[0]
			currentX = touch.globalX - originX
			currentY = touch.globalY - originY
			if (currentX < startX) {
				started = false
				return
			}
			lever.rotation = theta(startX, startY, currentX, currentY)
			if (lever.rotation > Math.PI / 4) {
				lever.interactive = false
				const maxRotation = lever.rotation
				{
					const ticker = new PIXI.Ticker()
					let frame = 0
					ticker.add(delta => {
						if (frame > 30) {
							if(--leverCount >= 0) {
								started = false
								arrow.visible = false
								/* ガチャの中身を振動させる */
								shakeBalls(balls).then(() => {
									if (leverCount == 0) {
										capsuleRoutine(characterContainer)
									} else {
										lever.interactive = true
										arrow.visible = true
									}
								})
							}
							ticker.stop()
							return
						}
						lever.rotation = (30 - frame) / 30 * maxRotation
						frame += 1
					})
					ticker.start()
				}
			}
		})
		lever.on('touchend', () => {
			const maxRotation = lever.rotation
			{
				const ticker = new PIXI.Ticker()
				let frame = 0
				ticker.add(delta => {
					if (frame > 30) {
						lever.interactive = true
						started = false
						ticker.stop()
					}
					lever.rotation = (30 - frame) / 30 * maxRotation
					frame += 1
				})
				ticker.start()
			}
		})
	}
	characterContainer.addChild(lever)

	const startButton = new PIXI.Sprite(PIXI.loader.resources[getImageURL('btn_play.png')].texture)
	startButton.anchor.set(0.5)
	startButton.x = app.screen.width / 2
	startButton.y = yOrigin + app.screen.width * 1.1
	startButton.scale.set(scale)
	startButton.interactive = true
	startButton.on('touchstart', (e) => {
		startButton.visible = false
		arrow.visible = true
		lever.interactive = true
	})
	app.stage.addChild(startButton)
	{
		let frame = 0
		app.ticker.add(delta => {
			startButton.scale.set(scale * (1 + 0.1 * Math.sin(Math.PI / 120 * frame++)))
			if (frame == 120) {
				frame = 0
			}
		})
	}

	const arrow = new PIXI.Sprite(PIXI.loader.resources[getImageURL('arrow.png')].texture)
	arrow.x = app.screen.width * 0.15
	arrow.y = app.screen.width * 0.3
	arrow.scale.set(scale)
	arrow.visible = false
	characterContainer.addChild(arrow)
	{
		let frame = 0
		app.ticker.add(delta => {
			arrow.scale.set(scale * (1 + 0.1 * Math.sin(Math.PI / 120 * frame++)))
			if (frame == 120) {
				frame = 0
			}
		})
	}
}

/* ドアを開く処理から */
async function capsuleRoutine(characterContainer) {
	await shakeCharacter(characterContainer)
	
}

function createBalls(yOrigin, scale, vw) {
	const capsuleColors = [
		'b',
		'gold',
		'l',
		'p',
		'r',
		'rainbow',
		'silver'
	]
	const ballData = [
		[0.2, 0.3], [0.2, 0.2], [0.4, 0.2], [0.6, 0.3], [0.4, 0.3], [0.55, 0.2], [0.3, 0.1], [0.15, 0.4]
	]
	const balls = []
	for (let data of ballData) {
		const ball = new PIXI.Sprite(PIXI.loader.resources[getImageURL(`capsule/capsule_${randomChoice(capsuleColors)}.png`)].texture)
		ball.anchor.set(0.5)
		ball.x = vw(data[0])
		ball.y = vw(data[1])
		ball.rotation = getRandomArbitrary(0, 2 * Math.PI)
		ball.scale.set(scale)
		balls.push(ball)
	}

	/*const types = ['b', 'g', 'gr', 'r']
	const balls = []
	const originX = app.screen.width / 2
	const originY = yOrigin + app.screen.width * 0.45
	for (let i = 0; i < 20; ++i) {
		const type = randomChoice(types)
		const ballContainer = new PIXI.Container()
		const ball1 = new PIXI.Sprite(PIXI.loader.resources[getImageURL(`capsule_${type}_1.png`)].texture)
		const ball2 = new PIXI.Sprite(PIXI.loader.resources[getImageURL(`capsule_${type}_2.png`)].texture)
		ball1.anchor.set(0.5)
		const rad = i / 20 * 2 * Math.PI
		const r = app.screen.width * getRandomArbitrary(0.06 + i * (0.2 / 20), 0.06 + (i + 1) * (0.2 / 20))
		let ball1ratio = ball1.height / ball1.width
		ball1.width = app.screen.width * 0.12
		ball1.height = ball1.width * ball1ratio
		ball2.anchor.set(0.5)
		ball2.y = app.screen.width * 0.045
		let ball2ratio = ball2.height / ball2.width
		ball2.width = app.screen.width * 0.11212
		ball2.height = ball2.width * ball2ratio
		ballContainer.x = originX + r * Math.cos(rad) * 1.1
		ballContainer.y = originY + r * Math.sin(rad) * 1.1
		ballContainer.pivot.set(ball1.width / 2, ball1.width * 0.4)
		ballContainer.rotation = getRandomArbitrary(0, 2 * Math.PI)
		ballContainer.addChild(ball2)
		ballContainer.addChild(ball1)
		balls.push(ballContainer)
	}*/
	return balls
}

function shakeBalls(balls) {
	const ticker = new PIXI.Ticker()
	return new Promise((resolve) => {
		for (let ball of balls) {
			const sign = getRandomInt(2) == 0 ? 1 : -1
			const initY = ball.y
			let f = 0
			ticker.add(() => {
				ball.y = initY + Math.sin(f / 10) * Math.sin(f / 10) * 10
				ball.rotation = ball.rotation + Math.sin(f / 120) * sign * 0.1
				f++
				if (f == 60) {
					ball.y = initY
					ticker.stop()
					resolve()
				}
			})
		}
		ticker.start()
	})
}

function shakeCharacter(characterContainer) {
	const ticker = new PIXI.Ticker()
	return new Promise((resolve) => {
		const initX = characterContainer.x
		const initY = characterContainer.y
		
		let frame = 0
		ticker.add(() => {
			characterContainer.x = initX + Math.sin(frame / 2) * 10
			characterContainer.y = initY + Math.cos(2 + frame / 4) * 10
			frame++
			if (frame == 60) {
				characterContainer.x = initX
				characterContainer.y = initY
				ticker.stop()
				resolve()
			}
		})
		ticker.start()
	})
}

function getImageURL(img) {
	return `${option.resource}/img/${option.theme}/${img}`
}

function restrictZoom() {
	const isSupportPassive = () => {
	let passiveSupported = false

		try {
			let options = Object.defineProperty({}, "passive", {
				get: function () {
					passiveSupported = true
				}
			})
			window.addEventListener("test", null, options)
			window.removeEventListener("test", null, options)
		} catch (err) {}

		return passiveSupported
	}

	document.body.addEventListener('touchmove', function listener(e) {
		e.preventDefault()
		}, isSupportPassive() ? {
		passive: false
	} : false)
}

function preloadImages() {
	const imgs = [
		'bg.jpg',
		'searchlight.png',
		'arrow.png',
		'btn_top.png',
		'btn_play.png',
		'case_all.png',
		'lever.png',
		'door_0default.png',
		'door_4full.png',
		'door1.png',
		'door2.png',
		'door3.png',
	]
	const capsuleColors = [
		'b',
		'gold',
		'l',
		'p',
		'r',
		'rainbow',
		'silver'
	]
	const capsuleTypes = [
		'',
		'_b',
		'_t'
	]
	for (let color of capsuleColors) {
		for (let type of capsuleTypes) {
			imgs.push(`capsule/capsule_${color}${type}.png`)
		}
	}
	return new Promise((resolve) => {
		PIXI.loader.add(imgs.map(getImageURL)).load(resolve)
	})
}

function theta(x1, y1, x2, y2) {
	const dot = x1 * x2 + y1 * y2
	return Math.acos(dot / Math.sqrt(x1 * x1 + y1 * y1) / Math.sqrt(x2 * x2 + y2 * y2))
}

function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
  }

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function randomChoice(array) {
	return array[getRandomInt(array.length)]
}

})()