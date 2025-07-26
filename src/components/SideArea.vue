<template>
  <div class="side-area">
    <div class="rect-item">
      <div class="rect-icon red"></div>
    </div>
    <div class="rect-item">
      <div class="rect-icon green"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SideArea'
}
</script>

<style scoped>
.side-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  background: #f0f0f0;
  border-right: 1px solid #ccc;
}
.rect-item {
  margin-top: 32px;
  width: 50px;
  height: 50px;
}
.rect-icon {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.rect-icon.red {
  background-color: #d32f2f;
}

.rect-icon.green {
  background-color: #388e3c;
}
</style>
