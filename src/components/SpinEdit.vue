<template>
  <div class="spin-edit">
    <label class="spin-edit-label">{{ name }}</label>
    <input
      type="number"
      class="spin-edit-input"
      :min="min"
      :max="max"
      :step="effectiveStep"
      :value="value"
      :disabled="disabled"
      @change="onChange($event.target)"
    />
  </div>
</template>

<script>
export default {
  name: 'SpinEdit',

  props: {
    name:       { type: String, required: true },
    numberType: { type: String, default: 'integer' }, // 'integer' or 'real'
    min:        { type: [Number, String], default: null },
    max:        { type: [Number, String], default: null },
    step:       { type: [Number, String], default: null },
    value:      { type: Number, default: 0 },
    disabled:   { type: Boolean, default: false }
  },

  computed: {
    effectiveStep() {
      if (this.step !== null) return this.step;
      return this.numberType === 'real' ? 0.1 : 1;
    }
  },

  methods: {
    onChange(target) {
      let val = this.numberType === 'integer' ? parseInt(target.value, 10) : parseFloat(target.value);
      if (this.min !== null) val = Math.max(Number(this.min), val);
      if (this.max !== null) val = Math.min(Number(this.max), val);
      target.value = val;
      this.$emit('update:value', val);
    }
  },

  emits: ['update:value']
}
</script>

<style scoped>
.spin-edit {
  display: flex;
  align-items: center;
  gap: 20px;
}

.spin-edit-label {
  min-width: 60px;
  font-size: 14px;
  color: #333;
}

.spin-edit-input {
  width: 90px;
  padding: 4px 4px;
  font-size: 16px;
  border: 1px solid #bbb;
  border-radius: 3px;
}
</style>
