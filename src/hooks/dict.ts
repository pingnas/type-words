import { Article, TaskWords, Word } from "@/types/types.ts";
import { useBaseStore } from "@/stores/base.ts";
import { useSettingStore } from "@/stores/setting.ts";
import { getDefaultWord } from "@/types/func.ts";
import { getRandomN, splitIntoN } from "@/utils";

export function useWordOptions() {
  const store = useBaseStore()

  function isWordCollect(val: Word) {
    return !!store.collectWord.words.find(v => v.word.toLowerCase() === val.word.toLowerCase())
  }

  function toggleWordCollect(val: Word) {
    let rIndex = store.collectWord.words.findIndex(v => v.word.toLowerCase() === val.word.toLowerCase())
    if (rIndex > -1) {
      store.collectWord.words.splice(rIndex, 1)
    } else {
      store.collectWord.words.push(val)
    }
    store.collectWord.length = store.collectWord.words.length
  }

  function isWordSimple(val: Word) {
    return !!store.knownWords.includes(val.word.toLowerCase())
  }

  function toggleWordSimple(val: Word) {
    let rIndex = store.knownWords.findIndex(v => v === val.word.toLowerCase())
    if (rIndex > -1) {
      store.known.words.splice(rIndex, 1)
    } else {
      store.known.words.push(val)
    }
    store.known.length = store.known.words.length
  }

  function delWrongWord(val: Word) {
    let rIndex = store.wrong.words.findIndex(v => v.word.toLowerCase() === val.word.toLowerCase())
    if (rIndex > -1) {
      store.wrong.words.splice(rIndex, 1)
    }
    store.wrong.length = store.wrong.words.length
  }

  function delSimpleWord(val: Word) {
    let rIndex = store.known.words.findIndex(v => v.word.toLowerCase() === val.word.toLowerCase())
    if (rIndex > -1) {
      store.known.words.splice(rIndex, 1)
    }
    store.known.length = store.known.words.length
  }

  return {
    isWordCollect,
    toggleWordCollect,
    isWordSimple,
    toggleWordSimple,
    delWrongWord,
    delSimpleWord
  }
}

export function useArticleOptions() {
  const store = useBaseStore()

  function isArticleCollect(val: Article) {
    return !!store.collectArticle?.articles?.find(v => v.id === val.id)
  }

  //todo 这里先收藏，再修改。收藏里面的未同步。单词也是一样的
  function toggleArticleCollect(val: Article) {
    let rIndex = store.collectArticle.articles.findIndex(v => v.id === val.id)
    if (rIndex > -1) {
      store.collectArticle.articles.splice(rIndex, 1)
    } else {
      store.collectArticle.articles.push(val)
    }
    store.collectArticle.length = store.collectArticle.articles.length
  }

  return {
    isArticleCollect,
    toggleArticleCollect,
  }
}

export function getCurrentStudyWord(): TaskWords {
  const store = useBaseStore()
  let data = {new: [], review: [], write: []}
  let dict = store.sdict;
  let isTest = false
  let words = dict.words.slice()
  if (isTest) {
    words = Array.from({length: 10}).map((v, i) => {
      return getDefaultWord({word: String(i)})
    })
  }
  if (words?.length) {
    const settingStore = useSettingStore()
    //忽略时是否加上自定义的简单词
    let ignoreList = [store.allIgnoreWords, store.knownWords][settingStore.ignoreSimpleWord ? 0 : 1]
    const perDay = dict.perDayStudyNumber;
    let start = dict.lastLearnIndex;
    let complete = dict.complete;
    if (isTest) {
      start = 1
      complete = true
    }
    let end = start
    let list = dict.words.slice(start)
    if (complete) {
      //如果是已完成，那么把应该学的新词放到复习词组里面
      for (let item of list) {
        if (!ignoreList.includes(item.word.toLowerCase())) {
          if (data.review.length < perDay) {
            data.review.push(item)
          } else break
        }
        end++
      }

    } else {
      //从start往后取perDay个单词，作为当前练习单词
      for (let item of list) {
        if (!ignoreList.includes(item.word.toLowerCase())) {
          if (data.new.length < perDay) {
            data.new.push(item)
          } else break
        }
        end++
      }

      //从start往前取perDay个单词，作为当前复习单词，取到0为止
      list = dict.words.slice(0, start).reverse()
      for (let item of list) {
        if (!ignoreList.includes(item.word.toLowerCase())) {
          if (data.review.length < perDay) {
            data.review.push(item)
          } else break
        }
        start--
      }
    }

    //如果是自由模式，那么统统设置到new字段里面去
    if (settingStore.wordPracticeMode === 1) {
      data.new = data.new.length ? data.new : data.review
      data.review = []
      return data
    }

    // 上上次更早的单词
    //默认只取start之前的单词
    let candidateWords = dict.words.slice(0, start).reverse()
    //但如果已完成，则滚动取值
    if (complete) candidateWords = candidateWords.concat(dict.words.slice(end).reverse())
    candidateWords = candidateWords.filter(w => !ignoreList.includes(w.word.toLowerCase()));
    // console.log(candidateWords.map(v => v.word))
    //最终要获取的单词数量
    const totalNeed = perDay * 3;
    if (candidateWords.length <= totalNeed) {
      data.write = candidateWords
    } else {
      //write数组放的是上上次之前的单词，总的数量为perDayStudyNumber * 3，取单词的规则为：从后往前取6个perDayStudyNumber的，越靠前的取的单词越多。
      let days = 6
      // 分6组，每组最多 perDay 个
      const groups: Word[][] = splitIntoN(candidateWords.slice(0, days * perDay), 6)
      // console.log('groups', groups)

      // 分配数量，靠前组多，靠后组少，例如分配比例 [6,5,4,3,2,1]
      const ratio = Array.from({length: days}, (_, i) => i + 1).reverse();
      const ratioSum = ratio.reduce((a, b) => a + b, 0);
      const realRatio = ratio.map(r => Math.round(r / ratioSum * totalNeed));
      // console.log(ratio, ratioSum, realRatio, realRatio.reduce((a, b) => a + b, 0))

      // 按比例从每组随机取单词
      let writeWords: Word[] = [];
      groups.map((v, i) => {
        writeWords = writeWords.concat(getRandomN(v, realRatio[i]))
      })
      // console.log('writeWords', writeWords)
      data.write = writeWords;
    }
  }
  // console.log('data-new', data.new.map(v => v.word))
  // console.log('data-review', data.review.map(v => v.word))
  // console.log('data-write', data.write.map(v => v.word))
  return data
}
