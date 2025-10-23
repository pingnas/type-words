<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { useSettingStore } from "@/stores/setting.ts";
import { getAudioFileUrl, usePlayAudio } from "@/hooks/sound.ts";
import { getShortcutKey, useEventListener } from "@/hooks/event.ts";
import { checkAndUpgradeSaveDict, checkAndUpgradeSaveSetting, cloneDeep, loadJsLib, shakeCommonDict } from "@/utils";
import { DefaultShortcutKeyMap, ShortcutKey } from "@/types/types.ts";
import BaseButton from "@/components/BaseButton.vue";
import VolumeIcon from "@/components/icon/VolumeIcon.vue";
import { useBaseStore } from "@/stores/base.ts";
import { saveAs } from "file-saver";
import {
  APP_NAME, APP_VERSION,
  EXPORT_DATA_KEY,
  LOCAL_FILE_KEY,
  Origin,
  PracticeSaveArticleKey,
  PracticeSaveWordKey, SAVE_DICT_KEY, SAVE_SETTING_KEY, SoundFileOptions
} from "@/config/env.ts";
import dayjs from "dayjs";
import BasePage from "@/components/BasePage.vue";
import Toast from '@/components/base/toast/Toast.ts'
import { Option, Select } from "@/components/base/select";
import Switch from "@/components/base/Switch.vue";
import Slider from "@/components/base/Slider.vue";
import RadioGroup from "@/components/base/radio/RadioGroup.vue";
import Radio from "@/components/base/radio/Radio.vue";
import InputNumber from "@/components/base/InputNumber.vue";
import PopConfirm from "@/components/PopConfirm.vue";
import Textarea from "@/components/base/Textarea.vue";
import SettingItem from "@/pages/setting/SettingItem.vue";
import { get, set } from "idb-keyval";
import { useRuntimeStore } from "@/stores/runtime.ts";

const emit = defineEmits<{
  toggleDisabledDialogEscKey: [val: boolean]
}>()

const tabIndex = $ref(0)
const settingStore = useSettingStore()
const runtimeStore = useRuntimeStore()
const store = useBaseStore()
//@ts-ignore
const gitLastCommitHash = ref(LATEST_COMMIT_HASH);
const simpleWords = $computed({
  get: () => store.simpleWords.join(','),
  set: v => {
    try {
      store.simpleWords = v.split(',');
    } catch (e) {

    }
  }
})

let editShortcutKey = $ref('')

const disabledDefaultKeyboardEvent = $computed(() => {
  return editShortcutKey && tabIndex === 3
})

watch(() => disabledDefaultKeyboardEvent, v => {
  emit('toggleDisabledDialogEscKey', !!v)
})

// 监听编辑快捷键状态变化，自动聚焦输入框
watch(() => editShortcutKey, (newVal) => {
  if (newVal) {
    // 使用nextTick确保DOM已更新
    nextTick(() => {
      focusShortcutInput()
    })
  }
})

useEventListener('keydown', (e: KeyboardEvent) => {
  if (!disabledDefaultKeyboardEvent) return

  // 确保阻止浏览器默认行为
  e.preventDefault()
  e.stopPropagation()

  let shortcutKey = getShortcutKey(e)
  // console.log('e', e, e.keyCode, e.ctrlKey, e.altKey, e.shiftKey)
  // console.log('key', shortcutKey)

  // if (shortcutKey[shortcutKey.length-1] === '+') {
  //   settingStore.shortcutKeyMap[editShortcutKey] = DefaultShortcutKeyMap[editShortcutKey]
  //   return ElMessage.warning('设备失败！')
  // }

  if (editShortcutKey) {
    if (shortcutKey === 'Delete') {
      settingStore.shortcutKeyMap[editShortcutKey] = ''
    } else {
      // 忽略单独的修饰键
      if (shortcutKey === 'Ctrl+' || shortcutKey === 'Alt+' || shortcutKey === 'Shift+' ||
        e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift') {
        return;
      }

      for (const [k, v] of Object.entries(settingStore.shortcutKeyMap)) {
        if (v === shortcutKey && k !== editShortcutKey) {
          settingStore.shortcutKeyMap[editShortcutKey] = DefaultShortcutKeyMap[editShortcutKey]
          return Toast.warning('快捷键重复！')
        }
      }
      settingStore.shortcutKeyMap[editShortcutKey] = shortcutKey
    }
  }
})

function handleInputBlur() {
  // 输入框失焦时结束编辑状态
  editShortcutKey = ''
}

function handleBodyClick() {
  if (editShortcutKey) {
    editShortcutKey = ''
  }
}

function focusShortcutInput() {
  // 找到当前正在编辑的快捷键输入框
  const inputElements = document.querySelectorAll('.set-key input')
  if (inputElements && inputElements.length > 0) {
    // 聚焦第一个找到的输入框
    const inputElement = inputElements[0] as HTMLInputElement
    inputElement.focus()
  }
}

// 快捷键中文名称映射
function getShortcutKeyName(key: string): string {
  const shortcutKeyNameMap = {
    'ShowWord': '显示单词',
    'EditArticle': '编辑文章',
    'Next': '下一个',
    'Previous': '上一个',
    'ToggleSimple': '切换已掌握状态',
    'ToggleCollect': '切换收藏状态',
    'NextChapter': '下一组',
    'PreviousChapter': '上一组',
    'RepeatChapter': '重复本组',
    'DictationChapter': '默写本组',
    'PlayWordPronunciation': '播放发音',
    'ToggleShowTranslate': '切换显示翻译',
    'ToggleDictation': '切换默写模式',
    'ToggleTheme': '切换主题',
    'ToggleConciseMode': '切换简洁模式',
    'TogglePanel': '切换面板',
    'RandomWrite': '随机默写',
    'NextRandomWrite': '继续随机默写'
  }

  return shortcutKeyNameMap[key] || key
}

function resetShortcutKeyMap() {
  editShortcutKey = ''
  settingStore.shortcutKeyMap = cloneDeep(DefaultShortcutKeyMap)
  Toast.success('恢复成功')
}

let exportLoading = $ref(false)
let importLoading = $ref(false)

async function exportData(notice = '导出成功！') {
  exportLoading = true
  const JSZip = await loadJsLib('JSZip', `${Origin}/libs/jszip.min.js`);
  let data = {
    version: EXPORT_DATA_KEY.version,
    val: {
      setting: {
        version: SAVE_SETTING_KEY.version,
        val: settingStore.$state
      },
      dict: {
        version: SAVE_DICT_KEY.version,
        val: shakeCommonDict(store.$state)
      },
      [PracticeSaveWordKey.key]: {
        version: PracticeSaveWordKey.version,
        val: {}
      },
      [PracticeSaveArticleKey.key]: {
        version: PracticeSaveArticleKey.version,
        val: {}
      },
      [APP_VERSION.key]: -1
    }
  }
  let d = localStorage.getItem(PracticeSaveWordKey.key)
  if (d) {
    try {
      data.val[PracticeSaveWordKey.key] = JSON.parse(d)
    } catch (e) {
    }
  }
  let d1 = localStorage.getItem(PracticeSaveArticleKey.key)
  if (d1) {
    try {
      data.val[PracticeSaveArticleKey.key] = JSON.parse(d1)
    } catch (e) {
    }
  }
  let r = await get(APP_VERSION.key)
  data.val[APP_VERSION.key] = r

  const zip = new JSZip();
  zip.file("data.json", JSON.stringify(data));

  const mp3 = zip.folder("mp3");
  const allRecords = await get(LOCAL_FILE_KEY);
  for (const rec of allRecords ?? []) {
    mp3.file(rec.id + ".mp3", rec.file);
  }
  exportLoading = false
  zip.generateAsync({ type: "blob" }).then(function (content) {
    saveAs(content, `${APP_NAME}-User-Data-${dayjs().format('YYYY-MM-DD HH-mm-ss')}.zip`);
  });
  Toast.success(notice)
}

function importJson(str: string, notice: boolean = true) {
  let obj = {
    version: -1,
    val: {
      setting: {},
      dict: {},
      [PracticeSaveWordKey.key]: {},
      [PracticeSaveArticleKey.key]: {},
      [APP_VERSION.key]: {},
    }
  }
  try {
    obj = JSON.parse(str)
    let data = obj.val
    let settingState = checkAndUpgradeSaveSetting(data.setting)
    settingState.load = true
    settingStore.setState(settingState)
    let baseState = checkAndUpgradeSaveDict(data.dict)
    baseState.load = true
    store.setState(baseState)
    if (obj.version >= 3) {
      try {
        let save: any = obj.val[PracticeSaveWordKey.key] || {}
        if (save.val && Object.keys(save.val).length > 0) {
          localStorage.setItem(PracticeSaveWordKey.key, JSON.stringify(obj.val[PracticeSaveWordKey.key]))
        }
      } catch (e) {
        //todo 上报
      }
    }
    if (obj.version >= 4) {
      try {
        let save: any = obj.val[PracticeSaveArticleKey.key] || {}
        if (save.val && Object.keys(save.val).length > 0) {
          localStorage.setItem(PracticeSaveArticleKey.key, JSON.stringify(obj.val[PracticeSaveArticleKey.key]))
        }
      } catch (e) {
        //todo 上报
      }
      try {
        let r: any = obj.val[APP_VERSION.key] || -1
        set(APP_VERSION.key, r)
        runtimeStore.isNew = r ? (APP_VERSION.version > Number(r)) : true
      } catch (e) {
        //todo 上报
      }
    }
    notice && Toast.success('导入成功！')
  } catch (err) {
    return Toast.error('导入失败！')
  }
}

async function importData(e) {
  let file = e.target.files[0]
  if (!file) return
  if (file.name.endsWith(".json")) {
    let reader = new FileReader();
    reader.onload = function (v) {
      let str: any = v.target.result;
      if (str) {
        importJson(str)
      }
    }
    reader.readAsText(file);
  } else if (file.name.endsWith(".zip")) {
    try {
      importLoading = true
      const JSZip = await loadJsLib('JSZip', `${Origin}/libs/jszip.min.js`);
      const zip = await JSZip.loadAsync(file);

      const dataFile = zip.file("data.json");
      if (!dataFile) {
        return Toast.error("缺少 data.json，导入失败");
      }

      const mp3Folder = zip.folder("mp3");
      if (mp3Folder) {
        const records: { id: string; file: Blob }[] = [];
        for (const filename in zip.files) {
          if (filename.startsWith("mp3/") && filename.endsWith(".mp3")) {
            const entry = zip.file(filename);
            if (!entry) continue;
            const blob = await entry.async("blob");
            const id = filename.replace(/^mp3\//, "").replace(/\.mp3$/, "");
            records.push({ id, file: blob });
          }
        }
        await set(LOCAL_FILE_KEY, records);
      }

      const str = await dataFile.async("string");
      importJson(str, false)

      Toast.success("导入成功！");
    } catch (e) {
      Toast.error("导入失败！");
    } finally {
      importLoading = false
    }
  } else {
    Toast.error("不支持的文件类型");
  }
}

function importOldData() {
  exportData('已为您自动保存当前数据！稍后将进行老数据导入操作')
  setTimeout(() => {
    let oldDataStr = localStorage.getItem('type-word-dict-v3')
    if (oldDataStr) {
      try {
        let obj = JSON.parse(oldDataStr)
        let data = {
          version: 3,
          val: obj
        }
        let baseState = checkAndUpgradeSaveDict(data)
        store.setState(baseState)
        Toast.success('导入成功')
      } catch (err) {
        Toast.error('导入失败')
      }
    } else {
      Toast.error('导入失败！原因：本地无老数据备份')
    }
  }, 1000)
}
</script>

<template>
  <BasePage>
    <div class="setting text-md">
      <div class="left mt-10">
        <div class="tabs">
          <div class="tab" :class="tabIndex === 0 && 'active'" @click="tabIndex = 0">
            <IconFluentSettings20Regular width="20" />
            <span>通用练习设置</span>
          </div>
          <div class="tab" :class="tabIndex === 1 && 'active'" @click="tabIndex = 1">
            <IconFluentTextUnderlineDouble20Regular width="20" />
            <span>单词练习设置</span>
          </div>
          <div class="tab" :class="tabIndex === 2 && 'active'" @click="tabIndex = 2">
            <IconFluentBookLetter20Regular width="20" />
            <span>文章练习设置</span>
          </div>
          <div class="tab" :class="tabIndex === 3 && 'active'" @click="tabIndex = 3">
            <IconFluentKeyboardLayoutFloat20Regular width="20" />
            <span>快捷键设置</span>
          </div>
          <div class="tab" :class="tabIndex === 4 && 'active'" @click="tabIndex = 4">
            <IconFluentDatabasePerson20Regular width="20" />
            <span>数据管理</span>
          </div>
          <div class="tab" :class="tabIndex === 5 && 'active'" @click="() => {
            tabIndex = 5
            runtimeStore.isNew = false
            set(APP_VERSION.key, APP_VERSION.version)
          }">
            <IconFluentTextBulletListSquare20Regular width="20" />
            <span>更新日志</span>
            <div class="red-point" v-if="runtimeStore.isNew"></div>
          </div>
          <div class="tab" :class="tabIndex === 6 && 'active'" @click="tabIndex = 6">
            <IconFluentPerson20Regular width="20" />
            <span>关于</span>
          </div>
        </div>
      </div>
      <div class="content">
        <div class="page-title text-align-center">设置</div>
        <!--        通用练习设置-->
        <!--        通用练习设置-->
        <!--        通用练习设置-->
        <div v-if="tabIndex === 0">
          <SettingItem title="忽略大小写" desc="开启后，输入时不区分大小写，如输入“hello”和“Hello”都会被认为是正确的">
            <Switch v-model="settingStore.ignoreCase" />
          </SettingItem>

          <SettingItem title="允许默写模式下显示提示"
            :desc="`开启后，可以通过将鼠标移动到单词上或者按快捷键 ${settingStore.shortcutKeyMap[ShortcutKey.ShowWord]} 显示正确答案`">
            <Switch v-model="settingStore.allowWordTip" />
          </SettingItem>

          <div class="line"></div>
          <SettingItem title="简单词过滤" desc="开启后，练习的单词中不会包含简单词；文章统计的总词数中不会包含简单词">
            <Switch v-model="settingStore.ignoreSimpleWord" />
          </SettingItem>

          <SettingItem title="简单词列表" class="items-start!" v-if="settingStore.ignoreSimpleWord">
            <Textarea placeholder="多个单词用英文逗号隔号" v-model="simpleWords" :autosize="{ minRows: 6, maxRows: 10 }" />
          </SettingItem>

          <!--          音效-->
          <!--          音效-->
          <!--          音效-->
          <div class="line"></div>
          <SettingItem main-title="音效" />
          <SettingItem title="单词/句子发音口音">
            <Select v-model="settingStore.soundType" placeholder="请选择" class="w-50!">
              <Option label="美音" value="us" />
              <Option label="英音" value="uk" />
            </Select>
          </SettingItem>

          <div class="line"></div>
          <SettingItem title="按键音">
            <Switch v-model="settingStore.keyboardSound" />
          </SettingItem>
          <SettingItem title="按键音效">
            <Select v-model="settingStore.keyboardSoundFile" placeholder="请选择" class="w-50!">
              <Option v-for="item in SoundFileOptions" :key="item.value" :label="item.label" :value="item.value">
                <div class="flex justify-between items-center w-full">
                  <span>{{ item.label }}</span>
                  <VolumeIcon :time="100" @click="usePlayAudio(getAudioFileUrl(item.value)[0])" />
                </div>
              </Option>
            </Select>
          </SettingItem>
          <SettingItem title="音量">
            <Slider v-model="settingStore.keyboardSoundVolume" />
            <span class="w-10 pl-5">{{ settingStore.keyboardSoundVolume }}%</span>
          </SettingItem>

          <div class="line"></div>
          <SettingItem title="效果音（输入错误、完成时的音效）">
            <Switch v-model="settingStore.effectSound" />
          </SettingItem>
          <SettingItem title="音量">
            <Slider v-model="settingStore.effectSoundVolume" />
            <span class="w-10 pl-5">{{ settingStore.effectSoundVolume }}%</span>
          </SettingItem>
        </div>


        <!--        单词练习设置-->
        <!--        单词练习设置-->
        <!--        单词练习设置-->
        <div v-if="tabIndex === 1">
          <SettingItem title="练习模式">
            <RadioGroup v-model="settingStore.wordPracticeMode" class="flex-col gap-0!">
              <Radio :value="0" label="智能模式，系统自动计算复习单词与默写单词" />
              <Radio :value="1" label="自由模式，系统不强制复习与默写" />
            </RadioGroup>
          </SettingItem>

          <SettingItem title="显示上一个/下一个单词" desc="开启后，练习中会在上方显示上一个/下一个单词">
            <Switch v-model="settingStore.showNearWord" />
          </SettingItem>

          <SettingItem title="不默认显示练习设置弹框" desc="在词典详情页面，点击学习按钮后，是否显示练习设置弹框">
            <Switch v-model="settingStore.disableShowPracticeSettingDialog" />
          </SettingItem>

          <SettingItem title="输入错误时，清空已输入内容">
            <Switch v-model="settingStore.inputWrongClear" />
          </SettingItem>

          <SettingItem title="单词循环设置" class="gap-0!">
            <RadioGroup v-model="settingStore.repeatCount">
              <Radio :value="1" size="default">1</Radio>
              <Radio :value="2" size="default">2</Radio>
              <Radio :value="3" size="default">3</Radio>
              <Radio :value="5" size="default">5</Radio>
              <Radio :value="100" size="default">自定义</Radio>
            </RadioGroup>
            <div class="ml-2 center gap-space" v-if="settingStore.repeatCount === 100">
              <span>循环次数</span>
              <InputNumber v-model="settingStore.repeatCustomCount" :min="6" :max="15" type="number" />
            </div>
          </SettingItem>


          <!--          发音-->
          <!--          发音-->
          <!--          发音-->
          <div class="line"></div>
          <SettingItem mainTitle="音效" />
          <SettingItem title="自动发音">
            <Switch v-model="settingStore.wordSound" />
          </SettingItem>
          <SettingItem title="音量">
            <Slider v-model="settingStore.wordSoundVolume" />
            <span class="w-10 pl-5">{{ settingStore.wordSoundVolume }}%</span>
          </SettingItem>
          <SettingItem title="倍速">
            <Slider v-model="settingStore.wordSoundSpeed" :step="0.1" :min="0.5" :max="3" />
            <span class="w-10 pl-5">{{ settingStore.wordSoundSpeed }}</span>
          </SettingItem>


          <!--          自动切换-->
          <!--          自动切换-->
          <!--          自动切换-->
          <div class="line"></div>
          <SettingItem mainTitle="自动切换" />
          <SettingItem title="自动切换下一个单词" desc="未开启自动切换时，当输入完成后请使用空格键切换下一个">
            <Switch v-model="settingStore.autoNextWord" />
          </SettingItem>

          <SettingItem title="自动切换下一个单词时间" desc="正确输入单词后，自动跳转下一个单词的时间">
            <InputNumber v-model="settingStore.waitTimeForChangeWord" :disabled="!settingStore.autoNextWord" :min="0"
              :max="10000" :step="100" type="number" />
            <span class="ml-4">毫秒</span>
          </SettingItem>


          <!--          字体设置-->
          <!--          字体设置-->
          <!--          字体设置-->
          <div class="line"></div>
          <SettingItem mainTitle="字体设置" />
          <SettingItem title="外语字体">
            <Slider :min="10" :max="100" v-model="settingStore.fontSize.wordForeignFontSize" />
            <span class="w-10 pl-5">{{ settingStore.fontSize.wordForeignFontSize }}px</span>
          </SettingItem>
          <SettingItem title="中文字体">
            <Slider :min="10" :max="100" v-model="settingStore.fontSize.wordTranslateFontSize" />
            <span class="w-10 pl-5">{{ settingStore.fontSize.wordTranslateFontSize }}px</span>
          </SettingItem>
        </div>


        <!--        文章练习设置-->
        <!--        文章练习设置-->
        <!--        文章练习设置-->
        <div v-if="tabIndex === 2">
          <!--          发音-->
          <!--          发音-->
          <!--          发音-->
          <div class="line"></div>
          <SettingItem mainTitle="音效" />
          <SettingItem title="自动播放句子">
            <Switch v-model="settingStore.articleSound" />
          </SettingItem>
          <SettingItem title="自动播放下一篇">
            <Switch v-model="settingStore.articleAutoPlayNext" />
          </SettingItem>
          <SettingItem title="音量">
            <Slider v-model="settingStore.articleSoundVolume" />
            <span class="w-10 pl-5">{{ settingStore.articleSoundVolume }}%</span>
          </SettingItem>
          <SettingItem title="倍速">
            <Slider v-model="settingStore.articleSoundSpeed" :step="0.1" :min="0.5" :max="3" />
            <span class="w-10 pl-5">{{ settingStore.articleSoundSpeed }}</span>
          </SettingItem>
        </div>


        <div class="body" v-if="tabIndex === 3">
          <div class="row">
            <label class="main-title">功能</label>
            <div class="wrapper">快捷键(点击可修改)</div>
          </div>
          <div class="scroll">
            <div class="row" v-for="item of Object.entries(settingStore.shortcutKeyMap)">
              <label class="item-title">{{ getShortcutKeyName(item[0]) }}</label>
              <div class="wrapper" @click="editShortcutKey = item[0]">
                <div class="set-key" v-if="editShortcutKey === item[0]">
                  <input ref="shortcutInput" :value="item[1] ? item[1] : '未设置快捷键'" readonly type="text"
                    @blur="handleInputBlur">
                  <span @click.stop="editShortcutKey = ''">按键盘进行设置，<span class="text-red!">设置完成点击这里</span></span>
                </div>
                <div v-else>
                  <div v-if="item[1]">{{ item[1] }}</div>
                  <span v-else>未设置快捷键</span>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <label class="item-title"></label>
            <div class="wrapper">
              <BaseButton @click="resetShortcutKeyMap">恢复默认</BaseButton>
            </div>
          </div>
        </div>

        <div v-if="tabIndex === 4">
          <div>
            目前用户的所有数据
            <b class="text-red">仅保存在本地</b>。如果您需要在不同的设备、浏览器或者其他非官方部署上使用 {{ APP_NAME }}，
            您需要手动进行数据同步和保存。
          </div>
          <BaseButton :loading="exportLoading" class="mt-3" @click="exportData()">导出数据</BaseButton>

          <div class="line my-3"></div>

          <div>请注意，导入数据后将<b class="text-red"> 完全覆盖 </b>当前所有数据，请谨慎操作。
          </div>
          <div class="flex gap-space mt-3">
            <div class="import hvr-grow">
              <BaseButton :loading="importLoading">导入数据</BaseButton>
              <input type="file" accept="application/json,.zip,application/zip" @change="importData">
            </div>
            <PopConfirm title="导入老版本数据前，请先备份当前数据，确定要导入老版本数据吗？" @confirm="importOldData">
              <BaseButton>老版本数据导入</BaseButton>
            </PopConfirm>
          </div>
        </div>

        <div v-if="tabIndex === 5">
          <div class="item p-2">
            <!-- <div class="mb-2">
              <div>
                <span>2025/9/14：</span>
                <span>完善文章编辑、导入、导出等功能</span>
              </div>
              <div class="text-base mt-1">
                <div>1、文章的音频管理功能，目前已可添加音频、设置句子与音频的对应位置</div>
                <div>2、文章可导入、导出</div>
                <div>3、单词可导入、导出</div>
              </div>
            </div> -->
            <div class="line"></div>
          </div>
        </div>

        <div v-if="tabIndex === 6" class="center flex-col">
          <h1>Type Words</h1>
          <p class=" text-xl">
            基于 https://github.com/zyronon/TypeWords 修改,删了一些收集隐私数据内容
          </p>
          <p>
            GitHub地址：<a href="https://github.com/pingnas/type-words"
              target="_blank">https://github.com/pingnas/type-words</a>
          </p>
          <div class="text-md color-gray mt-10">
            Build {{ gitLastCommitHash }}
          </div>
        </div>

      </div>
    </div>
  </BasePage>
</template>

<style scoped lang="scss">
.setting {
  @apply text-lg;
  display: flex;
  color: var(--color-font-1);

  .left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    border-right: 2px solid gainsboro;

    .tabs {
      padding: .6rem 1.6rem;
      display: flex;
      flex-direction: column;
      gap: .6rem;
      //color: #0C8CE9;

      .tab {
        @apply cursor-pointer flex items-center relative;
        padding: .6rem .9rem;
        border-radius: .5rem;
        gap: .6rem;
        transition: all .5s;

        &:hover {
          background: var(--color-select-bg);
          color: var(--color-select-text);
        }

        &.active {
          background: var(--color-select-bg);
          color: var(--color-select-text);
        }
      }
    }
  }

  .content {
    flex: 1;
    height: 100%;
    overflow: auto;
    padding: 0 1.6rem;

    .row {
      min-height: 2.6rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: calc(var(--space) * 5);

      .wrapper {
        height: 2rem;
        flex: 1;
        display: flex;
        justify-content: flex-end;
        gap: var(--space);

        span {
          text-align: right;
          //width: 30rem;
          font-size: .7rem;
          color: gray;
        }

        .set-key {
          align-items: center;

          input {
            width: 9rem;
            box-sizing: border-box;
            margin-right: .6rem;
            height: 1.8rem;
            outline: none;
            font-size: 1rem;
            border: 1px solid gray;
            border-radius: .2rem;
            padding: 0 .3rem;
            background: var(--color-second);
            color: var(--color-font-1);
          }

        }
      }

      .main-title {
        font-size: 1.1rem;
        font-weight: bold;
      }

      .item-title {
        font-size: 1rem;
      }

      .sub-title {
        font-size: .9rem;
      }
    }

    .body {
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .scroll {
      flex: 1;
      padding-right: .6rem;
      overflow: auto;
    }

    .line {
      border-bottom: 1px solid #c4c3c3;
    }
  }
}

.import {
  display: inline-flex;
  position: relative;

  input {
    position: absolute;
    height: 100%;
    width: 100%;
    opacity: 0;
  }
}
</style>
