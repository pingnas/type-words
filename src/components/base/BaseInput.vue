<script setup lang="ts">
import { ref, useAttrs, watch } from 'vue';
import Close from "@/components/icon/Close.vue";
import { useDisableEventListener } from "@/hooks/event.ts";

const props = defineProps({
  modelValue: [String, Number],
  placeholder: String,
  disabled: Boolean,
  autofocus: Boolean,
  type: {
    type: String,
    default: 'text',
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  maxLength: Number,
});

const emit = defineEmits(['update:modelValue', 'input', 'change', 'focus', 'blur', 'validation']);
const attrs = useAttrs();

const inputValue = ref(props.modelValue);
const errorMsg = ref('');
let focus = $ref(false)
let inputEl = $ref<HTMLDivElement>()

watch(() => props.modelValue, (val) => {
  inputValue.value = val;
  validate(val);
});

const validate = (val: string | number | null | undefined) => {
  let err = '';
  const strVal = val == null ? '' : String(val);
  if (props.required && !strVal.trim()) {
    err = '不能为空';
  } else if (props.maxLength && strVal.length > props.maxLength) {
    err = `长度不能超过 ${props.maxLength} 个字符`;
  }
  errorMsg.value = err;
  emit('validation', err === '', err);
  return err === '';
};

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  inputValue.value = target.value;
  validate(target.value);
  emit('update:modelValue', target.value);
  emit('input', e);
};

const onChange = (e: Event) => {
  emit('change', e);
};

const onFocus = (e: FocusEvent) => {
  focus = true
  emit('focus', e);
};

const onBlur = (e: FocusEvent) => {
  focus = false
  validate(inputValue.value);
  emit('blur', e);
};

const clearInput = () => {

  inputValue.value = '';
  validate('');
  emit('update:modelValue', '');
};

//当聚焦时，禁用输入监听
useDisableEventListener(() => focus)

const vFocus = {
  mounted: (el, bind) => {
    if (bind.value) {
      el.focus()
      setTimeout(() => focus = true)
    }
  }
}

</script>

<template>
  <div class="base-input2"
       ref="inputEl"
       :class="{ 'is-disabled': disabled, 'has-error': errorMsg,focus }">
    <slot name="subfix"></slot>
    <input
        v-bind="attrs"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :value="inputValue"
        @input="onInput"
        @change="onChange"
        @focus="onFocus"
        @blur="onBlur"
        class="inner"
        v-focus="autofocus"
        :maxlength="maxLength"
    />
    <slot name="prefix"></slot>
    <Close
        v-if="clearable && inputValue && !disabled"
        @click="clearInput"/>
    <div v-if="errorMsg" class="base-input2__error">{{ errorMsg }}</div>
  </div>
</template>

<style scoped lang="scss">
.base-input2 {
  position: relative;
  display: inline-flex;
  box-sizing: border-box;
  width: 100%;
  background: var(--color-input-bg);
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  overflow: hidden;
  padding: .2rem .3rem;
  transition: all .3s;
  align-items: center;
  background: var(--color-input-bg);

  &.is-disabled {
    opacity: 0.6;
  }

  &.has-error {
    .base-input2__inner {
      border-color: #f56c6c;
    }

    .base-input2__error {
      color: #f56c6c;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }
  }

  &.focus {
    border: 1px solid var(--color-select-bg);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  &__error {
    padding-left: 0.5rem;
  }

  .inner {
    flex: 1;
    font-size: 1rem;
    outline: none;
    border: none;
    box-sizing: border-box;
    transition: all .3s;
    height: 1.5rem;
    color: var(--color-input-color);
  }
}
</style>
