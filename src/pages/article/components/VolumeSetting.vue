<script setup lang="ts">

import MiniDialog from "@/components/dialog/MiniDialog.vue";
import { useWindowClick } from "@/hooks/event.ts";
import { useSettingStore } from "@/stores/setting.ts";
import BaseIcon from "@/components/BaseIcon.vue";
import Switch from "@/components/base/Switch.vue";

const settingStore = useSettingStore()
let show = $ref(false)
useWindowClick(() => show = false)

</script>

<template>
  <div class="relative"
       @click.stop="null"
  >
    <BaseIcon
        title="播放设置"
        @click="show = !show">
      <IconFluentSpeakerSettings20Regular/>
    </BaseIcon>
    <MiniDialog
        width="12rem"
        v-model="show">
      <div class="mini-row-title">
        播放设置
      </div>
      <div class="flex justify-between mb-3">
        <label class="">自动播放句子</label>
        <Switch v-model="settingStore.articleSound"/>
      </div>
      <div class="flex justify-between">
        <label class="">自动播放下一篇</label>
        <Switch v-model="settingStore.articleAutoPlayNext"/>
      </div>
    </MiniDialog>
  </div>
</template>

<style scoped lang="scss">
</style>
