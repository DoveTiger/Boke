<script setup lang="ts">
type StateType = 'loading' | 'error' | 'empty';

withDefaults(
  defineProps<{
    type?: StateType;
    title?: string;
    message: string;
    actionText?: string;
    compact?: boolean;
  }>(),
  {
    type: 'empty',
    title: '',
    actionText: '',
    compact: false,
  },
);

const emit = defineEmits<{
  (e: 'action'): void;
}>();

function onAction() {
  emit('action');
}
</script>

<template>
  <div class="state-card" :class="[`is-${type}`, { compact }]">
    <p v-if="title" class="state-title">{{ title }}</p>
    <p class="state-message">{{ message }}</p>
    <button v-if="actionText" type="button" class="state-action" @click="onAction">
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.state-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  padding: 1rem 1.05rem;
  display: grid;
  gap: 0.55rem;
}

.state-card.compact {
  padding: 0.72rem 0.84rem;
  gap: 0.42rem;
}

.state-card.is-loading {
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
}

.state-card.is-error {
  border-color: rgba(196, 95, 80, 0.35);
  background: #fff8f6;
}

.state-title {
  margin: 0;
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 600;
}

.state-message {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.6;
}

.state-action {
  width: fit-content;
  height: 2rem;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  padding: 0 0.82rem;
  cursor: pointer;
}
</style>
