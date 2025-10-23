<script setup lang="ts">
import {ShortcutKey, Word} from "@/types/types.ts";
import VolumeIcon from "@/components/icon/VolumeIcon.vue";
import {useSettingStore} from "@/stores/setting.ts";
import {usePlayBeep, usePlayCorrect, usePlayKeyboardAudio, usePlayWordAudio, useTTsPlayAudio} from "@/hooks/sound.ts";
import {emitter, EventKey} from "@/utils/eventBus.ts";
import {nextTick, onMounted, onUnmounted, watch} from "vue";
import Tooltip from "@/components/base/Tooltip.vue";
import SentenceHightLightWord from "@/pages/word/components/SentenceHightLightWord.vue";
import {usePracticeStore} from "@/stores/practice.ts";
import {getDefaultWord} from "@/types/func.ts";
import {_nextTick, sleep} from "@/utils";

interface IProps {
  word: Word,
}

const props = withDefaults(defineProps<IProps>(), {
  word: () => getDefaultWord(),
})

const emit = defineEmits<{
  complete: [],
  wrong: []
}>()

let input = $ref('')
let wrong = $ref('')
let showFullWord = $ref(false)
//输入锁定，因为跳转到下一个单词有延时，如果重复在延时期间内重复输入，导致会跳转N次
let inputLock = false
let wordRepeatCount = 0
let cursor = $ref({
  top: 0,
  left: 0,
})
const settingStore = useSettingStore()
const statStore = usePracticeStore()

const playBeep = usePlayBeep()
const playCorrect = usePlayCorrect()
const playKeyboardAudio = usePlayKeyboardAudio()
const playWordAudio = usePlayWordAudio()
// const ttsPlayAudio = useTTsPlayAudio()
const volumeIconRef: any = $ref()
const typingWordRef = $ref<HTMLDivElement>()
// const volumeTranslateIconRef: any = $ref()

let displayWord = $computed(() => {
  return props.word.word.slice(input.length + wrong.length)
})

// 在全局对象中存储当前单词信息，以便其他模块可以访问
function updateCurrentWordInfo() {
  window.__CURRENT_WORD_INFO__ = {
    word: props.word.word,
    input: input,
    inputLock: inputLock,
    containsSpace: props.word.word.includes(' ')
  };
}

watch(() => props.word, () => {
  wrong = input = ''
  wordRepeatCount = 0
  inputLock = false
  if (settingStore.wordSound) {
    volumeIconRef?.play(400, true)
  }
  // 更新当前单词信息
  updateCurrentWordInfo();
  checkCursorPosition()
}, {deep: true})

// 监听输入变化，更新当前单词信息
watch(() => input, () => {
  updateCurrentWordInfo();
})

onMounted(() => {
  // 初始化当前单词信息
  updateCurrentWordInfo();

  emitter.on(EventKey.resetWord, () => {
    wrong = input = ''
    updateCurrentWordInfo();
  })

  emitter.on(EventKey.onTyping, onTyping)
})

onUnmounted(() => {
  emitter.off(EventKey.resetWord)
  emitter.off(EventKey.onTyping, onTyping)
})

function repeat() {
  setTimeout(() => {
    wrong = input = ''
    wordRepeatCount++
    inputLock = false

    if (settingStore.wordSound) {
      volumeIconRef?.play()
    }
  }, settingStore.waitTimeForChangeWord)
}

async function onTyping(e: KeyboardEvent) {
  if (inputLock) {
    //如果是锁定状态，说明要么输入太快；要么就是设置了不自动跳转，然后输入完了
    //当单词全部输入完成后，空格键用于切换到下一个单词
    if (e.code === 'Space' && input.toLowerCase() === props.word.word.toLowerCase()) {
      return emit('complete')
    }
    return
  }
  let letter = e.key
  inputLock = true

  // 检查当前单词是否包含空格
  const wordContainsSpace = props.word.word.includes(' ')

  // 如果是空格键，需要判断是作为输入还是切换单词
  if (letter === ' ' || e.code === 'Space') {
    // 如果当前单词包含空格
    if (wordContainsSpace && props.word.word[input.length] === ' ') {
      letter = ' '
    }
    // 如果当前单词不包含空格，且已经输入完成，则视为切换单词的信号
    else if (!wordContainsSpace && input.toLowerCase() === props.word.word.toLowerCase()) {
      return emit('complete')
    }
  }

  let isTypingRight = false
  if (settingStore.ignoreCase) {
    isTypingRight = letter.toLowerCase() === props.word.word[input.length].toLowerCase()
  } else {
    isTypingRight = letter === props.word.word[input.length]
  }
  if (isTypingRight) {
    input += letter
    wrong = ''
    playKeyboardAudio()
    // 更新当前单词信息
    updateCurrentWordInfo();
  } else {
    emit('wrong')
    wrong = letter
    playBeep()
    volumeIconRef?.play()
    await sleep(500)
    if (settingStore.inputWrongClear) input = ''
    wrong = ''
    // 更新当前单词信息
    updateCurrentWordInfo();
  }

  if (input.toLowerCase() === props.word.word.toLowerCase()) {
    playCorrect()
    //不需要把inputLock设为false，输入完成不能再输入了，只能删除，删除会打开锁
    if (settingStore.autoNextWord) {
      if (settingStore.repeatCount == 100) {
        if (settingStore.repeatCustomCount <= wordRepeatCount + 1) {
          setTimeout(() => emit('complete'), settingStore.waitTimeForChangeWord)
        } else {
          repeat()
        }
      } else {
        if (settingStore.repeatCount <= wordRepeatCount + 1) {
          setTimeout(() => emit('complete'), settingStore.waitTimeForChangeWord)
        } else {
          repeat()
        }
      }
    }
  } else {
    inputLock = false
  }
}

function del() {
  playKeyboardAudio()
  inputLock = false

  if (wrong) {
    wrong = ''
  } else {
    input = input.slice(0, -1)
  }

  // 更新当前单词信息
  updateCurrentWordInfo();
}


function showWord() {
  if (settingStore.allowWordTip) {
    showFullWord = true
  }
  //系统设定的默认模式情况下，如果看了单词统计到错词里面去
  switch (statStore.step) {
    case 1:
    case 3:
    case 4:
      emit('wrong')
      break
  }
}

function hideWord() {
  showFullWord = false
}

function play() {
  volumeIconRef?.play()
}

defineExpose({del, showWord, hideWord, play})

function mouseleave() {
  setTimeout(() => {
    showFullWord = false
  }, 50)
}

// 在释义中隐藏单词本身及其变形
function hideWordInTranslation(text: string, word: string): string {
  if (!text || !word) {
    return text
  }

  // 创建正则表达式，匹配单词本身及其常见变形（如复数、过去式等）
  const wordBase = word.toLowerCase()
  const patterns = [
    `\\b${escapeRegExp(wordBase)}\\b`,  // 单词本身
    `\\b${escapeRegExp(wordBase)}s\\b`, // 复数形式
    `\\b${escapeRegExp(wordBase)}es\\b`, // 复数形式
    `\\b${escapeRegExp(wordBase)}ed\\b`, // 过去式
    `\\b${escapeRegExp(wordBase)}ing\\b`, // 进行时
  ]

  let result = text
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi')
    result = result.replace(regex, match => `<span class="word-shadow">${match}</span>`)
  })

  return result
}

// 转义正则表达式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

watch([() => input, () => showFullWord, () => settingStore.dictation], checkCursorPosition)

//检测光标位置
function checkCursorPosition() {
  _nextTick(() => {
    // 选中目标元素
    const cursorEl = document.querySelector(`.cursor`);
    const input = document.querySelector(`.input`);
    const typingWordRect = typingWordRef.getBoundingClientRect();

    if (input) {
      let inputRect = input.getBoundingClientRect();
      cursor = {
        top: inputRect.top + inputRect.height - cursorEl.clientHeight - typingWordRect.top,
        left: inputRect.right - typingWordRect.left - 3,
      };
    } else {
      const letter = document.querySelector(`.letter`);
      let letterRect = letter.getBoundingClientRect();
      cursor = {
        top: letterRect.top + letterRect.height - cursorEl.clientHeight - typingWordRect.top,
        left: letterRect.left - typingWordRect.left - 3,
      };
    }
  },)
}

</script>

<template>
  <div class="typing-word" ref="typingWordRef" v-if="props.word.word.length">
    <div class="flex flex-col items-center">
      <div class="flex gap-1 mt-26">
        <div class="phonetic" v-if="settingStore.soundType === 'us' && word.phonetic0">[{{
            (settingStore.dictation && !showFullWord) ? '_'.repeat(word.phonetic0.length) : word.phonetic0
          }}]
        </div>
        <div class="phonetic" v-if="settingStore.soundType === 'uk' && word.phonetic1">[{{
            (settingStore.dictation && !showFullWord) ? '_'.repeat(word.phonetic1.length) : word.phonetic1
          }}]
        </div>
        <VolumeIcon
          :title="`发音(${settingStore.shortcutKeyMap[ShortcutKey.PlayWordPronunciation]})`"
          ref="volumeIconRef" :simple="true" :cb="() => playWordAudio(word.word)"/>
      </div>

      <div class="word my-1"
           :class="wrong && 'is-wrong'"
           :style="{fontSize: settingStore.fontSize.wordForeignFontSize +'px'}"
           @mouseenter="showWord"
           @mouseleave="mouseleave"
      >
        <span class="input" v-if="input">{{ input }}</span>
        <span class="wrong" v-if="wrong">{{ wrong }}</span>
        <template v-if="settingStore.dictation">
          <span class="letter" v-if="!showFullWord">{{ displayWord.split('').map(() => '_').join('') }}</span>
          <span class="letter" v-else>{{ displayWord }}</span>
        </template>
        <span class="letter" v-else>{{ displayWord }}</span>
      </div>

      <div class="translate anim flex flex-col gap-2 my-3"
           v-opacity="settingStore.translate || showFullWord"
           :style="{
      fontSize: settingStore.fontSize.wordTranslateFontSize +'px',
    }"
      >
        <div class="flex" v-for="(v,i) in word.trans">
          <div class="shrink-0" :class="v.pos ? 'w-12 en-article-family' : '-ml-3'">{{ v.pos }}</div>
          <span v-if="settingStore.dictation && !showFullWord" v-html="hideWordInTranslation(v.cn, word.word)"></span>
          <span v-else>{{ v.cn }}</span>
        </div>
      </div>
    </div>
    <div class="other">
      <div class="line-white my-2"></div>

      <template v-if="word?.sentences?.length">
        <div class="flex flex-col gap-3">
          <div class="sentence" v-for="item in word.sentences">
            <SentenceHightLightWord class="text-xl" :text="item.c" :word="word.word"
                                    :dictation="(settingStore.dictation && !showFullWord)"/>
            <div class="text-base anim" v-opacity="settingStore.translate  || showFullWord">{{ item.cn }}</div>
          </div>
        </div>
        <div class="line-white my-2 mb-5 anim" v-opacity="settingStore.translate  || showFullWord"></div>
      </template>


      <div class="anim" v-opacity="settingStore.translate || showFullWord">
        <template v-if="word?.phrases?.length">
          <div class="flex">
            <div class="label">短语</div>
            <div class="flex flex-col">
              <div class="flex items-center gap-4" v-for="item in word.phrases">
                <SentenceHightLightWord class="en" :text="item.c" :word="word.word"
                                        :dictation="(settingStore.dictation && !showFullWord)"/>
                <div class="cn anim" v-opacity="settingStore.translate">{{ item.cn }}</div>
              </div>
            </div>
          </div>
          <div class="line-white mt-3 mb-2"></div>
        </template>

        <template v-if="word?.synos?.length">
          <div class="flex">
            <div class='label'>同近义词</div>
            <div class="flex flex-col gap-3">
              <div class="flex" v-for="item in word.synos">
                <div class="pos line-height-1.4rem!">{{ item.pos }}</div>
                <div>
                  <div class="cn">{{ item.cn }}</div>
                  <div>
                    <span class="en" v-for="(i,j) in item.ws">{{ i }} {{
                        j !== item.ws.length - 1 ? ' / ' : ''
                      }} </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="line-white my-2"></div>
        </template>

        <template v-if="word?.etymology?.length">
          <div class="flex">
            <div class="label">词源</div>
            <div class="text-base">
              <div class="mb-2" v-for="item in word.etymology">
                <div class="">{{ item.t }}</div>
                <div class="">{{ item.d }}</div>
              </div>
            </div>
          </div>
          <!--        <div class="line-white my-2"></div>-->
        </template>

        <template v-if="word?.relWords?.root && false">
          <div class="flex">
            <div class="label">同根词</div>
            <div class="flex flex-col gap-3">
              <div v-if="word.relWords.root" class=" ">
                词根：<span class="en">{{ word.relWords.root }}</span>
              </div>
              <div class="flex" v-for="item in word.relWords.rels">
                <div class="pos">{{ item.pos }}</div>
                <div>
                  <div class="flex items-center gap-4" v-for="itemj in item.words">
                    <div class="en">{{ itemj.c }}</div>
                    <div class="cn">{{ itemj.cn }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="cursor"
         :style="{top:cursor.top+'px',left:cursor.left+'px',height: settingStore.fontSize.wordForeignFontSize +'px'}"></div>
  </div>
</template>

<style scoped lang="scss">
.typing-word {
  width: 100%;
  flex: 1;
  overflow: auto;
  word-break: break-word;
  position: relative;
  color: var(--color-font-2);

  .phonetic, .translate {
    font-size: 1.2rem;
  }

  .phonetic {
    color: var(--color-font-1);
    font-family: var(--word-font-family);
  }

  .word {
    font-size: 3rem;
    line-height: 1;
    font-family: var(--en-article-family);
    letter-spacing: .3rem;

    .input {
      color: rgb(22, 163, 74);
    }

    .wrong {
      color: rgba(red, 0.6);
    }

    &.is-wrong {
      animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }
  }

  .tabs {
    @apply: text-lg font-medium;
    display: flex;
    gap: 2rem;

    .tab {
      cursor: pointer;

      &.active {
        border-bottom: 2px solid var(--color-font-2);
      }
    }
  }

  .label {
    width: 6rem;
    padding-top: 0.2rem;
    flex-shrink: 0;
  }

  .cn {
    @apply text-base;
  }

  .en {
    @apply text-lg;
  }

  .pos {
    font-family: var(--en-article-family);
    @apply text-lg w-12;
  }

}
</style>
