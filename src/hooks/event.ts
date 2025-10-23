import { onMounted, onUnmounted, watch, onDeactivated } from "vue";
import { emitter, EventKey } from "@/utils/eventBus.ts";
import { useRuntimeStore } from "@/stores/runtime.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { ShortcutKey } from "@/types/types.ts";
import { isMobile } from "@/utils";

export function useWindowClick(cb: (e: PointerEvent) => void) {
  onMounted(() => {
    emitter.on(EventKey.closeOther, cb)
    window.addEventListener('click', cb)
  })
  onUnmounted(() => {
    window.removeEventListener('click', cb)
  })
}

export function useEventListener(type: string, listener: EventListenerOrEventListenerObject) {
  onMounted(() => {
    if (isMobile()) {
      let tx: HTMLInputElement = document.querySelector('#typing-listener')
      if (!tx) {
        tx = document.createElement('input')
        tx.id = 'typing-listener'
        tx.type = 'text'
      }
      tx.addEventListener('input', (e: any) => {
        if (e.data === ' ') e.code = 'Space'
        if (e.data === null) {
          e.key = 'Backspace'
          e.keyCode = 1
        } else {
          e.keyCode = 66
          e.key = e.data
        }

        e.ctrlKey = false
        e.altKey = false
        e.shiftKey = false
        //@ts-ignore
        listener(e)
        e.target.value = '1'
      })
      const ss = () => {
        setTimeout(() => tx.focus(), 100)
      }
      window.removeEventListener('click', ss)
      window.addEventListener('click', ss)
      window.addEventListener(type, listener)
      document.body.appendChild(tx)
      tx.focus()
    } else {
      window.addEventListener(type, listener)
    }
  })
  const remove = () => {
    if (isMobile()) {
      let s = document.querySelector('#typing-listener')
      if (s) {
        s.removeEventListener(type, listener)
        s.parentNode.removeChild(s)
      }
      window.removeEventListener(type, listener)
    } else {
      window.removeEventListener(type, listener)
    }
  }
  onUnmounted(remove)
  onDeactivated(remove)
}

export function getShortcutKey(e: KeyboardEvent) {
  let shortcutKey = ''
  if (e.ctrlKey) shortcutKey += 'Ctrl+'
  if (e.altKey) shortcutKey += 'Alt+'
  if (e.shiftKey) shortcutKey += 'Shift+'
  if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift') {
    if (e.keyCode >= 65 && e.keyCode <= 90) {
      shortcutKey += e.key.toUpperCase()
    } else {
      if (e.key === 'ArrowRight') {
        shortcutKey += '➡'
      } else if (e.key === 'ArrowLeft') {
        shortcutKey += '⬅'
      } else if (e.key === 'ArrowUp') {
        shortcutKey += '⬆'
      } else if (e.key === 'ArrowDown') {
        shortcutKey += '⬇'
      } else {
        shortcutKey += e.key
      }
    }
  }
  shortcutKey = shortcutKey.trim()

  // console.log('key', shortcutKey)
  return shortcutKey
}

export function useStartKeyboardEventListener() {
  const runtimeStore = useRuntimeStore()
  const settingStore = useSettingStore()

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (!runtimeStore.disableEventListener) {

      // 检查当前单词是否包含空格，如果包含，则空格键应该被视为输入
      if (e.code === 'Space') {
        // 获取当前正在输入的单词信息
        const currentWord = window.__CURRENT_WORD_INFO__;

        // 如果当前单词包含空格，且下一个字符应该是空格，则将空格键视为输入
        // 或者如果当前处于输入锁定状态（等待空格输入），也将空格键视为输入
        if (currentWord &&
          ((currentWord.word &&
              currentWord.word.includes(' ') &&
              currentWord.word[currentWord.input.length] === ' ') ||
            currentWord.inputLock === true)) {
          e.preventDefault();
          return emitter.emit(EventKey.onTyping, e);
        }
      }

      let shortcutKey = getShortcutKey(e)
      // console.log('shortcutKey', shortcutKey)

      let list = Object.entries(settingStore.shortcutKeyMap)
      let shortcutEvent = ''
      for (let i = 0; i < list.length; i++) {
        let [k, v] = list[i]
        if (v === shortcutKey) {
          // console.log('快捷键', k)
          shortcutEvent = k
          break
        }
      }
      if (shortcutEvent) {
        e.preventDefault()
        emitter.emit(shortcutEvent, e)
      } else {
        //非英文模式下，输入区域的 keyCode 均为 229时，
        // 空格键始终应该被转发到onTyping函数，由它来决定是作为输入还是切换单词
        if (e.code === 'Space') {
          e.preventDefault();
          return emitter.emit(EventKey.onTyping, e);
        }

        if (((e.keyCode >= 65 && e.keyCode <= 90)
          || (e.keyCode >= 48 && e.keyCode <= 57)
          // 空格键已经在上面处理过了
          || e.code === 'Slash'
          || e.code === 'Quote'
          || e.code === 'Comma'
          || e.code === 'BracketLeft'
          || e.code === 'BracketRight'
          || e.code === 'Period'
          || e.code === 'Minus'
          || e.code === 'Equal'
          || e.code === 'Semicolon'
          // || e.code === 'Backquote'
          || e.keyCode === 229
          //当按下功能键时，不阻止事件传播
        ) && (!e.ctrlKey && !e.altKey)) {
          e.preventDefault()
          emitter.emit(EventKey.onTyping, e)
        } else {
          emitter.emit(EventKey.keydown, e)
        }
      }

    }
  })
  useEventListener('keyup', (e: KeyboardEvent) => {
    if (!runtimeStore.disableEventListener) {
      emitter.emit(EventKey.keyup, e)
    }
  })
}

export function useOnKeyboardEventListener(onKeyDown: (e: KeyboardEvent) => void, onKeyUp: (e: KeyboardEvent) => void) {
  onMounted(() => {
    emitter.on(EventKey.keydown, onKeyDown)
    emitter.on(EventKey.keyup, onKeyUp)
  })
  onUnmounted(() => {
    emitter.off(EventKey.keydown, onKeyDown)
    emitter.off(EventKey.keyup, onKeyUp)
  })
}

//因为如果用useStartKeyboardEventListener局部变量控制，当出现多个hooks时就不行了，所以用全局变量来控制
export function useDisableEventListener(watchVal: any) {
  const runtimeStore = useRuntimeStore()
  watch(watchVal, (n: any) => {
    runtimeStore.disableEventListener = n
  })
}
