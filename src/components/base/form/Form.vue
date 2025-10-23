<template>
  <form @submit.prevent>
    <slot/>
  </form>
</template>

<script setup lang="ts">
import {ref, provide, watch, toRef} from 'vue'

interface Field {
  prop: string
  modelValue: any
  validate: (rules: any[]) => boolean
}

const props = defineProps({
  model: Object,
  rules: Object // { word: [{required:true,...}, ...], name: [...] }
})

const fields = ref<Field[]>([])

const registerField = (field: Field) => {
  fields.value.push(field)
}

// 校验整个表单
const validate = (cb): boolean => {
  let valid = true
  fields.value.forEach(f => {
    const fieldRules = props.rules?.[f.prop] || []
    const res = f.validate(fieldRules)
    if (!res) valid = false
  })
  cb(valid)
}

provide('registerField', registerField)
provide('formModel', toRef(props, 'model'))
provide('formValidate', validate)
provide('formRules', props.rules)

defineExpose({validate})
</script>
