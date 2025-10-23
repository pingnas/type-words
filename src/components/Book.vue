<script setup lang="ts">
import { Dict } from "@/types/types.ts";
import Progress from '@/components/base/Progress.vue'
import Checkbox from "@/components/base/checkbox/Checkbox.vue";

interface IProps {
  item?: Partial<Dict>;
  quantifier?: string
  isAdd: boolean
  showCheckbox?: boolean
  checked?: boolean
  showProgress?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  showProgress: true
})

defineEmits<{
  check: []
}>()

const progress = $computed(() => {
  if (props.item?.complete) return 100
  return Number(((props.item?.lastLearnIndex / props.item?.length) * 100).toFixed())
})

const studyProgress = $computed(() => {
  if (!props.showProgress) return
  if (props.item.complete) return props.item?.length + '/'
  return props.item?.lastLearnIndex ? props.item?.lastLearnIndex + '/' : ''
})
</script>

<template>
  <div class="book relative overflow-hidden">
    <template v-if="!isAdd">
      <div>
        <div class="text-base">{{ item?.name }}</div>
        <div class="text-sm line-clamp-3" v-opacity="item.name !== item.description">{{ item?.description }}</div>
      </div>
      <div class="absolute bottom-4 right-3">
        <div>{{ studyProgress }}{{ item?.length }}{{ quantifier }}</div>
      </div>
      <div class="absolute bottom-2 left-3 right-3">
        <Progress v-if="(item?.lastLearnIndex || item.complete) && showProgress" class="mt-1"
                  :percentage="progress"
                  :show-text="false"></Progress>
      </div>
      <Checkbox v-if="showCheckbox"
                :model-value="checked"
                @change="$emit('check')"
                class="absolute left-3 bottom-3"/>
      <div class="custom" v-if="item.custom">自定义</div>
    </template>
    <div v-else class="center h-full text-2xl">
      <IconFluentAdd16Regular/>
    </div>
  </div>
</template>

<style scoped lang="scss">
.custom {
  position: absolute;
  top: 4px;
  right: -22px;
  padding: 1px 20px;
  background: whitesmoke;
  font-size: 11px;
  transform: rotate(45deg);
}
</style>
