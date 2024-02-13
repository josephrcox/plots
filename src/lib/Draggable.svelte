<script>
	export let left = 300;
	export let top = 300;

	let moving = false;

	function onMouseDown() {
		moving = true;
	}

	function onMouseMove(e) {
		if (moving) {
			left += e.movementX;
			top += e.movementY;
		}
	}

	function onMouseUp() {
		moving = false;
	}
</script>

<section
	on:mousedown={onMouseDown}
	style="left: {left}px; top: {top}px;"
	class="draggable"
>
	<slot />
</section>

<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} />

<style>
	.draggable {
		user-select: none;
		cursor: move;
		border: solid 1px gray;
		position: absolute;
	}
</style>
