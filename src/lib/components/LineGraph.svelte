<script>
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let data = []; // assuming this is an array of numbers

	let svg;
	let xScale, yScale;
	const margin = { top: 10, right: 30, bottom: 10, left: 20 };
	const width = 500 - margin.left - margin.right;
	const height = 400 - margin.top - margin.bottom; // increased height for better visibility
	const daysSupported = 365; // Use only the last 365 data points

	const lineGenerator = d3
		.line()
		.x((_, i) => xScale(i)) // Use index for x position
		.y((d) => yScale(d)); // Use the data value for y position

	onMount(() => {
		svg = d3
			.select('#line-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		xScale = d3.scaleLinear().range([0, width]);
		yScale = d3.scaleLinear().range([height, 0]);

		if (data.length) {
			drawGraph();
		}
	});

	$: if (data && svg) {
		drawGraph();
	}

	function drawGraph() {
		const displayData =
			data.length > daysSupported ? data.slice(-daysSupported) : data;

		drawPositiveNegativeLines(displayData);
		updateScales(displayData);
		drawAxes(displayData);
	}

	function drawPositiveNegativeLines(data) {
		svg.selectAll('.line').remove(); // Remove previous lines

		const positiveLine = d3
			.line()
			.defined((d) => d > -5) // Only include positive values
			.x((_, i) => xScale(i))
			.y((d) => yScale(d));

		const negativeLine = d3
			.line()
			.defined((d) => d < 0) // Only include negative values
			.x((_, i) => xScale(i))
			.y((d) => yScale(d));

		// Draw positive line
		svg
			.append('path')
			.datum(data)
			.attr('class', 'line positive')
			.attr('d', positiveLine)
			.attr('transform', `translate(${margin.left},${margin.top})`)
			.attr('fill', 'none')
			.attr('stroke', 'green')
			.attr('stroke-width', 2);

		// Draw negative line
		svg
			.append('path')
			.datum(data)
			.attr('class', 'line negative')
			.attr('d', negativeLine)
			.attr('transform', `translate(${margin.left},${margin.top})`)
			.attr('fill', 'none')
			.attr('stroke', 'red')
			.attr('stroke-width', 2);
	}

	function updateScales(data) {
		const maxVal = Math.max(0, ...data);
		const minVal = Math.min(0, ...data);

		xScale.domain([0, data.length - 1]);
		yScale.domain([minVal, maxVal]).nice();
	}

	function drawAxes(data) {
		const xAxis = d3.axisBottom(xScale).ticks(0);
		const yAxis = d3.axisLeft(yScale).ticks(10);

		svg.selectAll('.axis').remove(); // Remove previous axes

		svg
			.append('g')
			.attr('class', 'axis x-axis')
			.attr('transform', `translate(${margin.left},${height + margin.top})`)
			.call(xAxis);

		svg
			.append('g')
			.attr('class', 'axis y-axis')
			.attr('transform', `translate(${margin.left},${margin.top})`)
			.call(yAxis);
	}
</script>

<svg id="line-chart"></svg>
