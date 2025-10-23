<script setup lang="ts">
import { inject, computed, watch } from 'vue';

const props = defineProps<{
  label: string;
  value: any;
  disabled?: boolean;
}>();

// 通过inject获取ElSelect提供的数据和方法
const selectValue = inject('selectValue', null);
const selectHandler = inject('selectHandler', null);

// 计算当前选项是否被选中
const isSelected = computed(() => {
  return selectValue === props.value;
});

// 点击选项时调用ElSelect提供的方法
const handleClick = () => {
  if (props.disabled) return;
  if (selectHandler) {
    selectHandler(props.value, props.label);
  }
};

// 监听props变化，确保在props更新时重新计算isSelected
watch(() => props.value, () => {}, { immediate: true });
</script>

<template>
  <li
    class="option"
    :class="{
      'is-selected': isSelected,
      'is-disabled': disabled
    }"
    @click="handleClick"
  >
    <slot>
      <span class="option__label">{{ label }}</span>
    </slot>
  </li>
</template>

<style scoped lang="scss">
.option {
  display: flex;
  align-items: center;
  padding: 0.2rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--color-third);
  }

  &.is-selected {
    color: var(--color-select-bg);
    font-weight: bold;
    background-color: var(--color-third);
  }

  &.is-disabled {
    color: #c0c4cc;
    cursor: not-allowed;
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
