<template>
  <div id="app">
    <mapIndex/>
  </div>
</template>

<script>
import mapIndex from './components/mapIndex.vue'

export default {
  name: 'App',
  components: {
    mapIndex
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
