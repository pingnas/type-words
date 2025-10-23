import http, { axiosInstance } from "@/utils/http.ts";
import { Dict } from "@/types/types.ts";
import { cloneDeep } from "@/utils";

function remove(data?: any) {
  if (data) {
    let s = cloneDeep(data)
    delete s.words
    delete s.articles
    delete s.statistics
    return s;
  }
}

export function dictListVersion() {
  return http<number>('dict/dictListVersion', null, null, 'get')
}

export function myDictList(params?) {
  return http('dict/myDictList', null, params, 'get')
}

export function add2MyDict(data) {
  return http('dict/add2MyDict', remove(data), null, 'post')
}

export function addStat(data) {
  return http('dict/addStat', data, null, 'post')
}

export function detail(params?, data?) {
  return http<Dict>('dict/detail', data, params, 'get')
}

export function setDictProp(params?, data?) {
  return http<Dict>('dict/setDictProp', remove(data), remove(params), 'post')
}

export function syncSetting(params?, data?) {
  return http<Dict>('dict/syncSetting', remove(data), remove(params), 'post')
}

export function getSetting(params?, data?) {
  return http<Dict>('dict/getSetting', remove(data), remove(params), 'get')
}

export function addDict(params?, data?) {
  return http<Dict>('dict/addDict', remove(data), remove(params), 'post')
}

export function uploadImportData(data,onUploadProgress) {
  return axiosInstance({
    url: 'dict/uploadImportData',
    method: 'post',
    headers: {
      contentType: 'formdata',
    },
    data,
    onUploadProgress
  })
}
