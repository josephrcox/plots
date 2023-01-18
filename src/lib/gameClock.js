export function mainGameThreadLoop() {
	// check town money
	// check for new visitors
	// check population happiness
	// check population health
}

export function startGameClock() {
	setInterval(mainGameThreadLoop, 1000);
}
