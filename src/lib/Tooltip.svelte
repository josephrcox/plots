<script lang="ts">
	export let text: string = '';
	export let classText: string = ''; // optional added styling.
	export let tone: Tone = 'standard';
	export let emoji: string = '👋';

	type Tone = 'happy' | 'standard' | 'alert';
</script>

<div class="overflow-visible animate-pulse">
	<span
		class="text-xs rounded-lg p-2 whitespace-normal text-center flex justify-center w-fit m-2 shadow shadow-black hover:rotate-6 overflow-visible hover:scale-110 z-10 transition-all duration-25 {classText}
        {tone === 'happy'
			? 'bg-green-300 text-green-900'
			: tone === 'standard'
				? 'bg-blue-300 text-blue-900'
				: tone === 'alert'
					? 'bg-red-900 text-red-200'
					: 'bg-gray-300 text-gray-900'}
    "
	>
		{emoji}
		{text}
	</span>
</div>

<style>
	/* empty */
</style>
