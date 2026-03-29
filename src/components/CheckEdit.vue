<template>
  <div class="check-edit">
    <label class="check-edit-label">{{ name }}</label>
    <input
      type="checkbox"
      class="check-edit-input"
      :checked="value"
      @change="$emit('update:value', $event.target.checked)"
    />
  </div>
</template>

<script>
export default {
  name: 'CheckEdit',

  props: {
    name:  { type: String, required: true },
    value: { type: Boolean, default: false }
  },

  emits: ['update:value']
}
</script>

<style scoped>
.check-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-edit-label {
  min-width: 60px;
  font-size: 13px;
  color: #333;
}

.check-edit-input {
  width: 16px;
  height: 16px;
}
</style>
