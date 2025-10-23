<script setup lang="tsx">
import {inject, onMounted, ref, useSlots} from 'vue'

const props = defineProps({
  prop: String,
  label: String,
})

const value = ref('')
let error = $ref('')

// 拿到 form 的 model 和注册函数
const formModel = inject<ref>('formModel')
const registerField = inject('registerField')
const formRules = inject('formRules', {})

const myRules = $computed(() => {
  return formRules?.[props.prop] || []
})

// 校验函数
const validate = (rules) => {
  error = ''
  const val = formModel.value[props.prop]
  for (const rule of rules) {
    if (rule.required && (!val || !val.toString().trim())) {
      error = rule.message
      return false
    }
    if (rule.max && val && val.toString().length > rule.max) {
      error = rule.message
      return false
    }
  }
  return true
}

// 自动触发 blur 校验
const handleBlur = () => {
  const blurRules = myRules.filter((r) => r.trigger === 'blur')
  if (blurRules.length) validate(blurRules)
}

// 注册到 Form
onMounted(() => {
  registerField && registerField({prop: props.prop, modelValue: value, validate})
})
let slot = useSlots()

defineRender(() => {
  let DefaultNode = slot.default()[0]
  return <div class="form-item mb-6 flex gap-space">
    {props.label &&
        <label class="w-20 flex items-start mt-1 justify-end">
          {myRules.length ? <span class="form-error">*</span> : null} {props.label}
        </label>}
    <div class="flex-1 relative">
      <DefaultNode onBlur={handleBlur}/>
      <div class="form-error absolute top-[100%] anim" style={{opacity: error ? 1 : 0}}>{error}</div>
    </div>
  </div>
})
</script>

<style scoped lang="scss">
.form-item {

  .form-error {
    color: #f56c6c;
    font-size: 0.8rem;
  }
}
</style>
