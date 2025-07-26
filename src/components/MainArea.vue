<template>
  <div class="main-area">
    <div class="drop-area"></div>
  </div>
</template>

<script>
export default {
  name: 'MainArea'
}
</script>

<style scoped>
.main-area {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  background-color: #f5f5f5;
}

.drop-area {
  position: relative;
  margin-top: 400px;
  width: 100%;
  height: 50px;
}
</style>
