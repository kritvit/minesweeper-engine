# Minesweeper Engine

## Install

	$ npm install @kritvit/minesweeper-engine --save

## Getting Started

	import minesweeperEngine from 'minesweeper-engine';

	const gameState = {};

	// 16 rows, 16 columns, 50 traps
	gameState.minesweeperEngine = minesweeperEngine(16, 16, 50);

	gameState.eachItem(item => {

		// Handle each item

	});

	// clear, mark, create and reset methods return a new state, use that to overwrite the previous state.
	gameState.minesweeperEngine = gameState.minesweeperEngine.reset();


## API

### Game methods

	eachItem(cb = function)
	clear(id = string)
	mark(id = string)
	create(rows, cols, traps) or ([rows, cols, traps])
	reset()

### Game properties

	status 			// string
	rows 			// number
	cols 			// number
	items 			// array
	markersUsed 	// number
	markersRemain 	// number
	markersTotal 	// number
	itemsCleared 	// number
	itemsRemain 	// number
	itemsTotal 		// number
	status 			// string

### Game status strings

	gameover
	completed

### Item status strings

	cleared
	marked
	triggered
	exposed
	missmarked
