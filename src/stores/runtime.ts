import {defineStore} from "pinia"
import {Dict} from "@/types/types.ts";
import {getDefaultDict} from "@/types/func.ts";

export interface RuntimeState {
  disableEventListener: boolean,
  modalList: Array<{ id: string | number, close: Function }>
  editDict: Dict
  showDictModal: boolean
  excludeRoutes: any[]
  routeData: any,
  isNew: boolean,
}

export const useRuntimeStore = defineStore('runtime', {
  state: (): RuntimeState => {
    return {
      routeData: null,
      disableEventListener: false,
      modalList: [],
      editDict: getDefaultDict(),
      showDictModal: false,
      excludeRoutes: [],
      isNew: false,
    }
  },
  actions: {
    updateExcludeRoutes(val: any) {
      // console.log('val', val)
      if (val.type === 'add') {
        if (!this.excludeRoutes.find(v => v === val.value)) {
          this.excludeRoutes.push(val.value)
        }
      } else {
        let resIndex = this.excludeRoutes.findIndex(v => v === val.value)
        if (resIndex !== -1) {
          this.excludeRoutes.splice(resIndex, 1)
        }
      }
      // console.log('store.excludeRoutes', this.excludeRoutes)
    },
  }
})
