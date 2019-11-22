
const config = {
	splitter: 	'-',
	rows: 		10,
	cols: 		10,
	traps: 		10
};

class Item {

	constructor (row, col, isTrap) {

		this.row 			= row;
		this.col 			= col;
		this.id 			= row + config.splitter + col;
		this.status 		= '';
		this.isMarked 		= false;
		this.isCleared 		= false;
		this.isTriggered 	= false;
		this.isTrap 		= isTrap;
		this.border = 0;

	}

}

class Game {

	constructor (rows = config.rows, cols = config.cols, traps = config.traps) {

		this.rows 		= rows;
		this.cols 		= cols;
		this.status 	= '';
		this.traps 		= traps;
		this.items 		= rows * cols;
		this.boardMap 	= this.getBoardMap();
		this.trapMap 	= this.getTrapMap();
		this.board 		= this.getBoard();
		this.flatBoard 	= this.board.flat();
		this.cleared 	= 0;
		this.marked		= 0;
		this.stopped 	= false;

		this.eachItem(item => {

			this.eachNeighbour(item, (neighbour) => {

				if (neighbour.isTrap) {

					item.border++;

				}

			});

		});

	}

	eachIndex (cb) {

		for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {

			for (let colIndex = 0; colIndex < this.cols; colIndex++) {

				cb(rowIndex, colIndex);

			}

		}

	}

	eachItem (cb) {

		this.flatBoard.forEach(item => {

			cb(item);

		});

	}

	eachRemainingTrap (cb) {

		if (this.status === 'completed') {

			this.trapMap.forEach(trapID => {

				const trap = this.getItemById(trapID);

				if (trap.isMarked === false) {

					this.marked++;
					trap.isMarked = true;
					trap.status = 'marked';

					cb(trap);

				}

			});

		}

	}

	eachNeighbour (item, cb) {

		const neighbours = [
			[-1,-1], 	// above before
			[-1,0], 	// above
			[-1,1], 	// above after
			[0,-1], 	// before
			[0,1], 		// after
			[1,-1], 	// below before
			[1,0], 		// below
			[1,1] 		// below after
		];

		neighbours.forEach(neighbour => {

			const row = item.row+neighbour[0];
			const col = item.col+neighbour[1];

			if (this.board[row] && this.board[row][col]) {

				cb(this.board[row][col]);

			}

		});

	}

	eachClearableNeighbour (item, cb) {

		const self 		= this;
		const processed = [];

		(function recursive (itm) {

			self.eachNeighbour(itm, neighbour => {

				if (!processed.includes(neighbour.id)) {

					cb(neighbour);

					processed.push(neighbour.id);

					if (neighbour.border === 0) {

						recursive(neighbour);

					}

				}

			});

		})(item);

	}

	getBoardMap () {

		const boardMap = [];

		this.eachIndex((rowIndex, colIndex) => {

			boardMap.push(rowIndex+config.splitter+colIndex);

		});

		return boardMap;

	}

	getTrapMap () {

		const trapMap = [];

		while (trapMap.length < this.traps) {

			const randomIndex 	= Math.floor((Math.random() * this.items));
			const mineIndex 	= this.boardMap[randomIndex];

			if (mineIndex && !trapMap.includes(mineIndex)) {

				trapMap.push(this.boardMap[randomIndex]);

			}

		}

		return trapMap;

	}

	getBoard () {

		const board = [];

		this.eachIndex((rowIndex, colIndex) => {

			const item = new Item(
				rowIndex,
				colIndex,
				this.trapMap.includes(rowIndex+config.splitter+colIndex)
			);

			if (!board[rowIndex]) {

				board[rowIndex] = [];

			}

			board[rowIndex].push(item);

		});

		return board;

	}

	getItemById (id) {

		if (typeof id === 'string') {

			const coordinates 	= id.split(config.splitter);
			const rowIndex 		= coordinates[0];
			const colIndex 		= coordinates[1];
			const item 			= this.board[rowIndex][colIndex];

			return item;

		} else {

			return {};

		}

	}

	getItemsToClear (id) {

		const item 			= this.getItemById(id);
		const processed 	= [];
		const itemsToClear 	= [];
		const self 			= this;

		if (this.stopped || item.isCleared || item.isMarked) {

			return itemsToClear;

		}

		if (item.isTrap) {

			// Game over. Return all traps.

			item.isTriggered = true;
			item.isCleared = true;
			item.status = 'triggered';
			itemsToClear.push(item);

			this.stopped = true;

			this.eachItem(it => {

				if (it.status !== 'triggered') {

					if (it.isTrap && !it.isMarked) {

						it.isCleared = true;
						it.status = 'exposed';
						itemsToClear.push(it);

					} else if (!it.isTrap && it.isMarked) {

						it.isCleared = true;
						it.status = 'missmarked';
						itemsToClear.push(it);

					}

				}

			});

		} else if (item.border === 0) {

			// return all neighbour traps, stop at traps with border traps
			// if this.board.cleared === this.items - this.traps. Game done

			add(item);

			this.eachClearableNeighbour(item, itm => {

				if (!processed.includes(itm.id)) {

					add(itm);

				}

			});

		} else {

			add(item);

		}

		function add (it, cb) {

			processed.push(it.id);

			if (!it.isMarked && !it.isCleared && !it.isTrap) {

				it.isCleared = true;
				it.status = 'cleared';
				self.cleared++;

				itemsToClear.push(it);

				if (cb) {

					cb();

				}

			}

		}

		return itemsToClear;

	}

	updateGameStatus () {

		const gameCompleted = this.items - this.traps === this.cleared;

		if (gameCompleted) {

			this.status = 'completed';
			this.stopped = true;

		} else if (this.stopped) {

			this.status = 'gameover';

		}

		return gameCompleted;

	}

	clear (id) {

		const itemsToClear 	= this.getItemsToClear(id);

		return this.returnState(itemsToClear);

	}

	mark (id) {

		const itemToMark = [];
		const item = this.getItemById(id);

		if (!this.stopped) {

			if (item.isMarked) {

				item.isMarked = false;
				this.marked--;
				item.status = '';
				itemToMark.push(item);

			} else if (!item.isCleared && this.marked !== this.traps) {

				item.isMarked = true;
				this.marked++;
				item.status = 'marked';
				itemToMark.push(item);

			}

		}

		return this.returnState(itemToMark);

	}

	create (rows, cols, traps) {

		const argsArray = Array.isArray(rows) ? rows : [rows, cols, traps];
		const game 		= new Game(argsArray[0], argsArray[1], argsArray[2]);

		return game.returnState();

	}

	reset () {

		const game = new Game(this.rows, this.cols, this.traps);

		return game.returnState();

	}

	returnState (items) {

		items = items || [];

		this.updateGameStatus();

		this.eachRemainingTrap(trap => items.push(trap));

		items.map(item => ({
			id: item.id,
			status: item.status,
			border: item.border
		}));

		return {
			// Methods:
			clear: 			id => this.clear(id),
			mark: 			id => this.mark(id),
			eachItem: 		cb => this.eachItem(cb),
			create: 		this.create,
			reset: 			this.reset,
			// Game properties:
			status: 		this.status,
			rows: 			this.rows,
			cols: 			this.cols,
			traps: 			this.traps,
			items: 			items,
			itemsCleared: 	this.cleared,
			itemsRemain: 	this.items - this.traps - this.cleared,
			itemsTotal: 	this.items - this.traps,
			markersUsed: 	this.marked,
			markersRemain: 	this.traps - this.marked,
			markersTotal: 	this.traps
		};

	}

}

module.exports = (rows, cols, traps) => {

	const argsArray = Array.isArray(rows) ? rows : [rows, cols, traps];
	const game 		= new Game(argsArray[0], argsArray[1], argsArray[2]);

	return game.returnState();

};
