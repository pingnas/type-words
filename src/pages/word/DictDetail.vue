<script setup lang="tsx">
import { DictId } from "@/types/types.ts";

import BasePage from "@/components/BasePage.vue";
import { computed, onMounted, reactive, ref, shallowReactive } from "vue";
import { useRuntimeStore } from "@/stores/runtime.ts";
import { _getDictDataByUrl, _nextTick, convertToWord, loadJsLib, useNav } from "@/utils";
import { nanoid } from "nanoid";
import BaseIcon from "@/components/BaseIcon.vue";
import BaseTable from "@/components/BaseTable.vue";
import WordItem from "@/components/WordItem.vue";
import Toast from '@/components/base/toast/Toast.ts'
import PopConfirm from "@/components/PopConfirm.vue";
import BackIcon from "@/components/BackIcon.vue";
import BaseButton from "@/components/BaseButton.vue";
import { useRoute, useRouter } from "vue-router";
import { useBaseStore } from "@/stores/base.ts";
import EditBook from "@/pages/article/components/EditBook.vue";
import { getDefaultDict } from "@/types/func.ts";
import BaseInput from "@/components/base/BaseInput.vue";
import Textarea from "@/components/base/Textarea.vue";
import FormItem from "@/components/base/form/FormItem.vue";
import Form from "@/components/base/form/Form.vue";
import DeleteIcon from "@/components/icon/DeleteIcon.vue";
import { getCurrentStudyWord } from "@/hooks/dict.ts";
import PracticeSettingDialog from "@/pages/word/components/PracticeSettingDialog.vue";
import { useSettingStore } from "@/stores/setting.ts";
import { MessageBox } from "@/utils/MessageBox.tsx";
import { CAN_REQUEST, PracticeSaveWordKey } from "@/config/env.ts";
import { detail } from "@/apis";

const runtimeStore = useRuntimeStore()
const base = useBaseStore()
const router = useRouter()
const route = useRoute()

let loading = $ref(false)

let list = $computed({
  get() {
    return runtimeStore.editDict.words
  },
  set(v) {
    runtimeStore.editDict.words = shallowReactive(v)
  }
})

const getDefaultFormWord = () => {
  return {
    id: '',
    word: '',
    phonetic0: '',
    phonetic1: '',
    trans: '',
    sentences: '',
    phrases: '',
    synos: '',
    relWords: '',
    etymology: '',
  }
}
let isOperate = $ref(false)
let wordForm = $ref(getDefaultFormWord())
let wordFormRef = $ref()
const wordRules = reactive({
  word: [
    { required: true, message: '请输入单词', trigger: 'blur' },
    { max: 100, message: '名称不能超过100个字符', trigger: 'blur' },
  ],
})
let studyLoading = $ref(false)

function syncDictInMyStudyList(study = false) {
  _nextTick(() => {
    let rIndex = base.word.bookList.findIndex(v => v.id === runtimeStore.editDict.id)
    let temp = runtimeStore.editDict;
    if (!temp.custom && ![DictId.wordKnown, DictId.wordWrong, DictId.wordCollect].includes(temp.id)) {
      temp.custom = true
      temp.id += '_custom'
    }
    temp.length = temp.words.length
    if (rIndex > -1) {
      base.word.bookList[rIndex] = temp
      if (study) base.word.studyIndex = rIndex
    } else {
      base.word.bookList.push(temp)
      if (study) base.word.studyIndex = base.word.bookList.length - 1
    }
  }, 100)
}

async function onSubmitWord() {
  // return console.log('wordFormRef',wordFormRef,wordFormRef.validate)
  await wordFormRef.validate((valid) => {
    if (valid) {
      let data: any = convertToWord(wordForm)
      //todo 可以检查的更准确些，比如json对比
      if (data.id) {
        let r = list.find(v => v.id === data.id)
        if (r) {
          Object.assign(r, data)
          Toast.success('修改成功')
        } else {
          Toast.success('修改失败，未找到单词')
          return
        }
      } else {
        data.id = nanoid(6)
        data.checked = false
        let r = list.find(v => v.word === wordForm.word)
        if (r) {
          Toast.warning('已有相同名称单词！')
          return
        } else list.push(data)
        Toast.success('添加成功')
        wordForm = getDefaultFormWord()
      }
      syncDictInMyStudyList()
    } else {
      Toast.warning('请填写完整')
    }
  })
}

function delWord(id: string, isBatch = false) {
  let rIndex2 = list.findIndex(v => v.id === id)
  if (rIndex2 > -1) {
    if (id === wordForm.id) {
      wordForm = getDefaultFormWord()
    }
    list.splice(rIndex2, 1)
  }
  if (!isBatch) syncDictInMyStudyList()
}

function batchDel(ids: string[]) {
  ids.map(v => delWord(v, true))
  syncDictInMyStudyList()
}

//把word对象的字段全转成字符串
function word2Str(word) {
  let res = getDefaultFormWord()
  res.id = word.id
  res.word = word.word
  res.phonetic1 = word.phonetic1
  res.phonetic0 = word.phonetic0
  res.trans = word.trans.map(v => (v.pos + v.cn).replaceAll('"', '')).join('\n')
  res.sentences = word.sentences.map(v => (v.c + "\n" + v.cn).replaceAll('"', '')).join('\n\n')
  res.phrases = word.phrases.map(v => (v.c + "\n" + v.cn).replaceAll('"', '')).join('\n\n')
  res.synos = word.synos.map(v => (v.pos + v.cn + "\n" + v.ws.join('/')).replaceAll('"', '')).join('\n\n')
  res.relWords = word.relWords.root ? ('词根:' + word.relWords.root + '\n\n' +
    word.relWords.rels.map(v => (v.pos + "\n" + v.words.map(v => (v.c + ':' + v.cn)).join('\n')).replaceAll('"', '')).join('\n\n')) : ''
  res.etymology = word.etymology.map(v => (v.t + '\n' + v.d).replaceAll('"', '')).join('\n\n')
  return res
}

function editWord(word) {
  isOperate = true
  wordForm = word2Str(word)
}

function addWord() {
  // setTimeout(wordListRef?.scrollToBottom, 100)
  isOperate = true
  wordForm = getDefaultFormWord()
}

function closeWordForm() {
  isOperate = false
  wordForm = getDefaultFormWord()
}

let isEdit = $ref(false)
let isAdd = $ref(false)

const showBookDetail = computed(() => {
  return !(isAdd || isEdit);
})

onMounted(async () => {
  if (route.query?.isAdd) {
    isAdd = true
    runtimeStore.editDict = getDefaultDict()
  } else {
    if (!runtimeStore.editDict.id) {
      router.push("/word")
    } else {
      if (!runtimeStore.editDict.words.length
        && !runtimeStore.editDict.custom
        && ![DictId.wordCollect, DictId.wordWrong, DictId.wordKnown].includes(runtimeStore.editDict.en_name || runtimeStore.editDict.id)
      ) {
        loading = true
        let r = await _getDictDataByUrl(runtimeStore.editDict)
        runtimeStore.editDict = r
      }

      if (base.word.bookList.find(book => book.id === runtimeStore.editDict.id)) {
        if (CAN_REQUEST) {
          let res = await detail({ id: runtimeStore.editDict.id })
          if (res.success) {
            runtimeStore.editDict.statistics = res.data.statistics
            if (res.data.words.length) {
              runtimeStore.editDict.words = res.data.words
            }
          }
        }
      }
      loading = false
    }
  }
})

function formClose() {
  if (isEdit) isEdit = false
  else router.back()
}

let showPracticeSettingDialog = $ref(false)

const store = useBaseStore()
const settingStore = useSettingStore()
const { nav } = useNav()

//todo 可以和首页合并
async function startPractice() {
  localStorage.removeItem(PracticeSaveWordKey.key)
  studyLoading = true
  await base.changeDict(runtimeStore.editDict)
  studyLoading = false
  window.umami?.track('startStudyWord', {
    name: store.sdict.name,
    index: store.sdict.lastLearnIndex,
    perDayStudyNumber: store.sdict.perDayStudyNumber,
    custom: store.sdict.custom,
    complete: store.sdict.complete,
    wordPracticeMode: settingStore.wordPracticeMode
  })
  let currentStudy = getCurrentStudyWord()
  nav('practice-words/' + store.sdict.id, {}, currentStudy)
}

async function addMyStudyList() {
  if (!runtimeStore.editDict.words.length) {
    return Toast.warning('没有单词可学习！')
  }
  if (!settingStore.disableShowPracticeSettingDialog) {
    showPracticeSettingDialog = true
    return
  }
  startPractice()
}

let exportLoading = $ref(false)
let importLoading = $ref(false)
let tableRef = ref()

function importData(e) {
  let file = e.target.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = async function (s) {
    let data = s.target.result;
    importLoading = true
    const XLSX = await loadJsLib('XLSX', `xlsx.full.min.js`);
    let workbook = XLSX.read(data, { type: 'binary' });
    let res: any[] = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']);
    if (res.length) {
      let words = res.map(v => {
        if (v['单词']) {
          let data = null
          try {
            data = convertToWord({
              id: nanoid(6),
              word: v['单词'],
              phonetic0: v['音标①'] ?? '',
              phonetic1: v['音标②'] ?? '',
              trans: v['翻译'] ?? '',
              sentences: v['例句'] ?? '',
              phrases: v['短语'] ?? '',
              synos: v['近义词'] ?? '',
              relWords: v['同根词'] ?? '',
              etymology: v['词源'] ?? '',
            });
          } catch (e) {
            console.error('导入单词报错' + v['单词'], e.message)
          }
          return data
        }
      }).filter(v => v);
      if (words.length) {
        let repeat = []
        let noRepeat = []
        words.map((v: any) => {
          let rIndex = runtimeStore.editDict.words.findIndex(s => s.word === v.word)
          if (rIndex > -1) {
            v.index = rIndex
            repeat.push(v)
          } else {
            noRepeat.push(v)
          }
        })

        runtimeStore.editDict.words = runtimeStore.editDict.words.concat(noRepeat)

        if (repeat.length) {
          MessageBox.confirm(
            '单词"' + repeat.map(v => v.word).join(', ') + '" 已存在，是否覆盖原单词？',
            '检测到重复单词',
            () => {
              repeat.map(v => {
                runtimeStore.editDict.words[v.index] = v
                delete runtimeStore.editDict.words[v.index]["index"]
              })
            },
            null,
            () => {
              tableRef.value.closeImportDialog()
              e.target.value = ''
              importLoading = false
              syncDictInMyStudyList()
              Toast.success('导入成功！')
            }
          )
        } else {
          tableRef.value.closeImportDialog()
          syncDictInMyStudyList()
          Toast.success('导入成功！')
        }
      } else {
        Toast.warning('导入失败！原因：没有数据/未认别到数据');
      }
    } else {
      Toast.warning('导入失败！原因：没有数据');
    }
    e.target.value = ''
    importLoading = false
  };
  reader.readAsBinaryString(file);
}

async function exportData() {
  exportLoading = true
  const XLSX = await loadJsLib('XLSX', `xlsx.full.min.js`);
  let list = runtimeStore.editDict.words
  let filename = runtimeStore.editDict.name
  let wb = XLSX.utils.book_new()
  let sheetData = list.map(v => {
    let t = word2Str(v)
    return {
      单词: t.word,
      '音标①': t.phonetic0,
      '音标②': t.phonetic1,
      '翻译': t.trans,
      '例句': t.sentences,
      '短语': t.phrases,
      '近义词': t.synos,
      '同根词': t.relWords,
      '词源': t.etymology,
    }
  })
  wb.Sheets['Sheet1'] = XLSX.utils.json_to_sheet(sheetData)
  wb.SheetNames = ['Sheet1']
  XLSX.writeFile(wb, `${filename}.xlsx`);
  Toast.success(filename + ' 导出成功！')
  exportLoading = false
}

function searchWord() {
  console.log('wordForm.word', wordForm.word)
}

defineRender(() => {
  return (
    <BasePage>
      {
        showBookDetail.value ? <div className="card mb-0 h-[95vh] flex flex-col">
          <div class="flex justify-between items-center relative">
            <BackIcon class="z-2" />
            <div class="absolute page-title text-align-center w-full">{runtimeStore.editDict.name}</div>
            <div class="flex">
              <BaseButton loading={studyLoading || loading} type="info"
                onClick={() => isEdit = true}>编辑</BaseButton>
              <BaseButton loading={studyLoading || loading} onClick={addMyStudyList}>学习</BaseButton>
            </div>
          </div>
          <div class="text-lg  ">介绍：{runtimeStore.editDict.description}</div>
          <div class="line my-3"></div>

          <div class="flex flex-1 overflow-hidden">
            <div class="w-4/10">
              <BaseTable
                ref={tableRef}
                class="h-full"
                list={list}
                loading={loading}
                onUpdate:list={e => list = e}
                del={delWord}
                batchDel={batchDel}
                add={addWord}
                onImportData={importData}
                onExportData={exportData}
                exportLoading={exportLoading}
                importLoading={importLoading}
              >
                {
                  (val) =>
                    <WordItem
                      showTransPop={false}
                      item={val.item}>
                      {{
                        prefix: () => val.checkbox(val.item),
                        suffix: () => (
                          <div class='flex flex-col'>
                            <BaseIcon
                              class="option-icon"
                              onClick={() => editWord(val.item)}
                              title="编辑">
                              <IconFluentTextEditStyle20Regular />
                            </BaseIcon>
                            <PopConfirm title="确认删除？"
                              onConfirm={() => delWord(val.item.id)}
                            >
                              <BaseIcon
                                class="option-icon"
                                title="删除">
                                <DeleteIcon />
                              </BaseIcon>
                            </PopConfirm>

                          </div>
                        )
                      }}
                    </WordItem>
                }
              </BaseTable>
            </div>
            {
              isOperate ? (
                <div class="flex-1 flex flex-col ml-4">
                  <div class="common-title">
                    {wordForm.id ? '修改' : '添加'}单词
                  </div>
                  <Form
                    class="flex-1 overflow-auto pr-2"
                    ref={e => wordFormRef = e}
                    rules={wordRules}
                    model={wordForm}
                    label-width="7rem">
                    <FormItem label="单词" prop="word">
                      <BaseInput
                        modelValue={wordForm.word}
                        onUpdate:modelValue={e => wordForm.word = e}
                      >

                      </BaseInput>
                    </FormItem>
                    <FormItem label="英音音标">
                      <BaseInput
                        modelValue={wordForm.phonetic0}
                        onUpdate:modelValue={e => wordForm.phonetic0 = e}
                      />
                    </FormItem>
                    <FormItem label="美音音标">
                      <BaseInput
                        modelValue={wordForm.phonetic1}
                        onUpdate:modelValue={e => wordForm.phonetic1 = e} />
                    </FormItem>
                    <FormItem label="翻译">
                      <Textarea
                        modelValue={wordForm.trans}
                        onUpdate:modelValue={e => wordForm.trans = e}
                        placeholder="一行一个翻译，前面词性，后面内容（如n.取消）；多个翻译请换行"
                        autosize={{ minRows: 6, maxRows: 10 }} />
                    </FormItem>
                    <FormItem label="例句">
                      <Textarea
                        modelValue={wordForm.sentences}
                        onUpdate:modelValue={e => wordForm.sentences = e}
                        placeholder="一行原文，一行译文；多个请换两行"
                        autosize={{ minRows: 6, maxRows: 10 }} />
                    </FormItem>
                    <FormItem label="短语">
                      <Textarea
                        modelValue={wordForm.phrases}
                        onUpdate:modelValue={e => wordForm.phrases = e}
                        placeholder="一行原文，一行译文；多个请换两行"
                        autosize={{ minRows: 6, maxRows: 10 }} />
                    </FormItem>
                    <FormItem label="同义词">
                      <Textarea
                        modelValue={wordForm.synos}
                        onUpdate:modelValue={e => wordForm.synos = e}
                        placeholder="请参考已有单词格式"
                        autosize={{ minRows: 6, maxRows: 20 }} />
                    </FormItem>
                    <FormItem label="同根词">
                      <Textarea
                        modelValue={wordForm.relWords}
                        onUpdate:modelValue={e => wordForm.relWords = e}
                        placeholder="请参考已有单词格式"
                        autosize={{ minRows: 6, maxRows: 20 }} />
                    </FormItem>
                    <FormItem label="词源">
                      <Textarea
                        modelValue={wordForm.etymology}
                        onUpdate:modelValue={e => wordForm.etymology = e}
                        placeholder="请参考已有单词格式"
                        autosize={{ minRows: 6, maxRows: 10 }} />
                    </FormItem>
                  </Form>
                  <div class="center">
                    <BaseButton
                      type="info"
                      onClick={closeWordForm}>关闭
                    </BaseButton>
                    <BaseButton type="primary"
                      onClick={onSubmitWord}>保存
                    </BaseButton>
                  </div>
                </div>
              ) : null
            }
          </div>
        </div> :
          <div class="card mb-0 h-[95vh]">
            <div class="flex justify-between items-center relative">
              <BackIcon class="z-2" onClick={() => {
                if (isAdd) {
                  router.back()
                } else {
                  isEdit = false
                }
              }} />
              <div class="absolute page-title text-align-center w-full">
                {runtimeStore.editDict.id ? '修改' : '创建'}词典
              </div>
            </div>
            <div class="center">
              <EditBook
                isAdd={isAdd}
                isBook={false}
                onClose={formClose}
                onSubmit={() => isEdit = isAdd = false}
              />
            </div>
          </div>
      }

      <PracticeSettingDialog
        showLeftOption
        modelValue={showPracticeSettingDialog}
        onUpdate:modelValue={val => (showPracticeSettingDialog = val)}
        onOk={startPractice} />
    </BasePage>
  )
})
</script>

<style scoped lang="scss"></style>
