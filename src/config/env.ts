import { useBaseStore } from "@/stores/base.ts";

export const GITHUB = ''
export const ProjectName = 'Type Words'
export const Host = '2study.top'
export const Origin = `https://${Host}`
export const APP_NAME = 'Type Words'

const common = {
  word_dict_list_version: 1
}
const map = {
  DEV: {
    API: 'http://localhost/',
  }
}

export const ENV = Object.assign(map['DEV'], common)
// export const IS_OFFICIAL = import.meta.env.DEV
// export let IS_LOGIN = true
export const IS_OFFICIAL = false
export let IS_LOGIN = false
export const CAN_REQUEST = IS_LOGIN && IS_OFFICIAL
export const RESOURCE_PATH = ENV.API + 'static'

export const DICT_LIST = {
  WORD: {
    ALL: 'list/word.json',
    RECOMMENDED: 'list/recommend_word.json',
  },
  ARTICLE: {
    ALL: 'list/article.json',
    RECOMMENDED: 'list/article.json',
  }
}

export const SoundFileOptions = [
  { value: '机械键盘', label: '机械键盘' },
  { value: '机械键盘1', label: '机械键盘1' },
  { value: '机械键盘2', label: '机械键盘2' },
  { value: '老式机械键盘', label: '老式机械键盘' },
  { value: '笔记本键盘', label: '笔记本键盘' },
]
export const APP_VERSION = {
  key: 'type-words-app-version',
  version: 1
}
export const SAVE_DICT_KEY = {
  key: 'typing-word-dict',
  version: 4
}
export const SAVE_SETTING_KEY = {
  key: 'typing-word-setting',
  version: 15
}
export const EXPORT_DATA_KEY = {
  key: 'typing-word-export',
  version: 4
}
export const LOCAL_FILE_KEY = 'typing-word-files'
export const PracticeSaveWordKey = {
  key: 'PracticeSaveWord',
  version: 1
}
export const PracticeSaveArticleKey = {
  key: 'PracticeSaveArticle',
  version: 1
}