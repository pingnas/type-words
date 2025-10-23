import { Article, ArticleWord, Dict, DictType, PracticeArticleWordType, Word } from "@/types/types.ts";
import { shallowReactive } from "vue";
import { cloneDeep } from "@/utils";
import { nanoid } from "nanoid";

export function getDefaultWord(val: Partial<Word> = {}): Word {
  return {
    custom: false,
    id: nanoid(6),
    "word": "",
    "phonetic0": "",
    "phonetic1": "",
    "trans": [],
    "sentences": [],
    "phrases": [],
    "synos": [],
    "relWords": {
      "root": "",
      "rels": []
    },
    "etymology": [],
    ...val
  }
}

export function getDefaultArticleWord(val: Partial<ArticleWord> = {}): ArticleWord {
  return getDefaultWord({
    nextSpace: true,
    symbolPosition: '',
    input: '',
    type: PracticeArticleWordType.Word,
    ...val
  }) as ArticleWord
}

export function getDefaultArticle(val: Partial<Article> = {}): Article {
  return {
    id: null,
    title: '',
    titleTranslate: '',
    text: '',
    textTranslate: '',
    newWords: [],
    sections: [],
    audioSrc: '',
    audioFileId: '',
    lrcPosition: [],
    questions: [],
    ...cloneDeep(val)
  }
}

export function getDefaultDict(val: Partial<Dict> = {}): Dict {
  return {
    id: '',
    name: '',
    description: '',
    url: '',
    length: 0,
    category: '',
    tags: [],
    translateLanguage: '',
    type: DictType.word,
    language: 'en',
    lastLearnIndex: 0,
    perDayStudyNumber: 20,
    custom: false,
    complete: false,

    createdBy: '',
    en_name: '',
    category_id: null,
    is_default: false,

    ...val,
    words: shallowReactive(val.words ?? []),
    articles: shallowReactive(val.articles ?? []),
    statistics: shallowReactive(val.statistics ?? []),

  }
}
