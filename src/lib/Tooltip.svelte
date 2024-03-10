<script>
	export let text = '';
	export let classText = '';
	export let happy = false;
</script>

<div class="overflow-visible">
	<span
		class="text-xs rounded-lg p-2 whitespace-normal text-center flex justify-center w-fit m-2 shadow shadow-black hover:rotate-6 overflow-visible hover:scale-110 z-50 transition-all duration-75 {classText}
        {happy ? 'bg-green-300 text-green-900' : 'bg-red-900 text-red-200'}
    "
	>
		👋 {text}
	</span>
</div>

<style>
</style>
