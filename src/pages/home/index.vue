<script setup lang="ts">
import { ProjectName } from "@/config/env.ts";
import BaseButton from "@/components/BaseButton.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import { defineAsyncComponent } from "vue";

const Dialog = defineAsyncComponent(() => import('@/components/dialog/Dialog.vue'))
let showWechatDialog = $ref(false)
let showXhsDialog = $ref(false)
</script>

<template>
  <div class="flex flex-col justify-between min-h-screen">
    <div class="center flex-col gap-8">
      <h1>{{ ProjectName }}</h1>
      <div class="text-center -mt-10">
        <h2>学习英语，一次敲击，一点进步</h2>
        <h2>记忆不再盲目，学习更高效，开源单词与文章练习工具</h2>
      </div>
      <div class="flex">
        <BaseButton size="large" @click="$router.push('/words')">单词练习</BaseButton>
        <BaseButton size="large" @click="$router.push('/articles')">文章练习</BaseButton>
      </div>


      <div class="w-60vw">
        <div class="flex mb-5 gap-space">
          <div class="card">
            <div class="emoji">📚</div>
            <div class="title">单词练习</div>
            <div class="desc">
              <ul>
                <li>三种输入模式：跟打 / 复习 / 默写</li>
                <li>智能模式：智能规划复习与默写</li>
                <li>自由模式：不受限制，自行规划</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="emoji">✍️</div>
            <div class="title">文章练习</div>
            <div class="desc">
              <ul>
                <li>内置常见书籍，也可自行添加文章</li>
                <li>跟打 + 默写双模式，让背诵更高效</li>
                <li>支持边听边默写，强化记忆</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="emoji">📕</div>
            <div class="title">收藏、错词本、已掌握</div>
            <div class="desc">
              <ul>
                <li>输入错误自动添加到错词本</li>
                <li>主动添加到已掌握，后续自动跳过</li>
                <li>主动添加到收藏中，以便巩固复习</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="emoji">🌐</div>
            <div class="title">海量词库</div>
            <div class="desc">
              内置小学、初中、高中、四六级、考研、雅思、托福、GRE、GMAT、SAT、BEC、专四、专八等词库
            </div>
          </div>

        </div>
        <div class="flex gap-space">
          <div class="card">
            <div class="emoji">🆓</div>
            <div class="title">免费开源</div>
            <div class="desc">
              <ul>
                <li>完全开源，可审查、可修改</li>
                <li>免费使用</li>
                <li>私有部署</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="emoji">⚙️</div>
            <div class="title">高度自由</div>
            <div class="desc">
              <ul>
                <li>丰富的键盘音效</li>
                <li>可自定义快捷键</li>
                <li>高度定制化的设置选项</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="emoji">🎨</div>
            <div class="title">简洁高效</div>
            <div class="desc">
              <ul>
                <li>简洁设计，现代化UI，无广告</li>
                <li>界面清爽，操作简单</li>
                <li>不强制关注任何平台</li>
              </ul>
            </div>
          </div>

          <div class="card">
            <div class="emoji">🎯</div>
            <div class="title">个性学习</div>
            <div class="desc">
              <ul>
                <li>自由添加词典与文章</li>
                <li>定制个性学习计划</li>
                <li>多种学习复习策略</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
<style scoped lang="scss">
h1 {
  font-size: 5rem;
  background: linear-gradient(120deg, #bd34fe 30%, #41d1ff);
  -webkit-text-fill-color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin: 2rem;
}

h2 {
  margin: 0;
}

h3:first-child {
  margin-top: 0;
}

.card {
  @apply flex flex-col items-start gap-2 mb-0 w-25%;

  .emoji {
    display: inline-block;
    background: var(--color-third);
    padding: .6rem;
    border-radius: 0.4rem;
    font-size: 1.5rem;
  }

  .title {
    font-weight: bold;
  }

  ul {
    margin: 0;
    padding-left: 1.2rem;
  }
}

.bottom {
  width: 100%;
  padding-top: 2rem;
  border-top: 1px solid #c4c4c4;
}

a {
  color: unset;
}
</style>
