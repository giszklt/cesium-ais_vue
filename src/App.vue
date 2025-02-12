<template>
	<div id="app">
<!--		<mapIndex/>-->
		<dkMap/>
	</div>
</template>

<script>
// import mapIndex from './components/mapIndex.vue'
import dkMap from "@/components/dkMap.vue";
// import mapIndex from './components/windFarms/index.vue'

export default {
	name: 'App',
	components: {
		// mapIndex
		dkMap
	}
}
</script>

<style lang="scss">
html,
body,
#app {
	width: 100%;
	height: 100%;
	margin: 0;
	box-sizing: border-box;
	font-family: Helvetica, Arial, sans-serif;
	overflow: hidden;

	* {
		box-sizing: border-box;
	}

}
</style>
