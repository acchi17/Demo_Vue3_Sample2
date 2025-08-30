<template>
  <div id="app">
    <div class="left">
      <SideArea />
    </div>
    <MainArea class="right" />
  </div>
</template>

<script>
import MainArea from './components/MainArea.vue'
import SideArea from './components/SideArea.vue'

export default {
  name: 'App',
  components: {
    MainArea,
    SideArea
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
}

.left {
  width: 300px;
  height: 100vh;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
}

.right {
  flex: 1;
  background: #fff;
}
</style>
