<script setup lang="ts">

import { onMounted } from "vue";
import { IS_LOGIN } from "@/config/env.ts";
import router from "@/router.ts";

onMounted(() => {
  if (!IS_LOGIN) {
  }
  router.push({path: "/login"});

})
</script>

<template>
  <div class="flex flex-col justify-between min-h-screen">
    <div class="center flex-col gap-8">
      onMounted(() => {
      if (!IS_LOGIN) {
      router.push({path: "/login"});
      }
      })
    </div>
  </div>
</template>
<style scoped lang="scss">

</style>

