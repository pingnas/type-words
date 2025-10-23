import * as VueRouter from 'vue-router'
import {RouteRecordRaw} from 'vue-router'
import WordsPage from "@/pages/word/WordsPage.vue";
import PC from "@/pages/index.vue";
import ArticlesPage from "@/pages/article/ArticlesPage.vue";
import PracticeArticles from "@/pages/article/PracticeArticles.vue";
import DictDetail from "@/pages/word/DictDetail.vue";
import PracticeWords from "@/pages/word/PracticeWords.vue";
import BookDetail from "@/pages/article/BookDetail.vue";
import DictList from "@/pages/word/DictList.vue";
import BookList from "@/pages/article/BookList.vue";
import Setting from "@/pages/setting/Setting.vue";
import Home from "@/pages/home/index.vue";
import Login from "@/pages/user/login.vue";
import User from "@/pages/user/index.vue";

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PC,
    redirect: '/',
    children: [
      {path: '/', component: Home},
      {path: 'words', component: WordsPage},
      {path: 'word', redirect: '/words'},
      {path: 'practice-words/:id', component: PracticeWords},
      {path: 'study-word', redirect: '/words'},
      {path: 'dict-list', component: DictList},
      {path: 'dict-detail', component: DictDetail},

      {path: 'articles', component: ArticlesPage},
      {path: 'article', redirect: '/articles'},
      {path: 'practice-articles/:id', component: PracticeArticles},
      {path: 'study-article', redirect: '/articles'},
      {path: 'book-detail', component: BookDetail},
      {path: 'book-list', component: BookList},
      {path: 'setting', component: Setting},
      {path: 'login', component: Login},
      {path: 'user', component: User},
    ]
  },
  {path: '/batch-edit-article', component: () => import("@/pages/article/BatchEditArticlePage.vue")},
  {path: '/test', component: () => import("@/pages/test/test.vue")},
  {path: '/:pathMatch(.*)*', redirect: '/word'},
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(import.meta.env.VITE_ROUTE_BASE),
  // history: VueRouter.createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // console.log('savedPosition', savedPosition)
    if (savedPosition) {
      return savedPosition
    } else {
      return {top: 0}
    }
  },
})

router.beforeEach((to: any, from: any) => {
  return true
  // console.log('beforeEach-to',to.path)
  // console.log('beforeEach-from',from.path)
  // const runtimeStore = useRuntimeStore()
  //
  // //footer下面的5个按钮，对跳不要用动画
  // let noAnimation = [
  //   '/pc/practice',
  //   '/pc/dict',
  //   '/mobile',
  //   '/'
  // ]
  //
  // if (noAnimation.indexOf(from.path) !== -1 && noAnimation.indexOf(to.path) !== -1) {
  //   return true
  // }
  //
  // const toDepth = routes.findIndex(v => v.path === to.path)
  // const fromDepth = routes.findIndex(v => v.path === from.path)
  // // const fromDepth = routeDeep.indexOf(from.path)
  //
  // if (toDepth > fromDepth) {
  //   if (to.matched && to.matched.length) {
  //     let def = to.matched[0].components.default
  //     let toComponentName = def.name ?? def.__name
  //     runtimeStore.updateExcludeRoutes({type: 'remove', value: toComponentName})
  //     // console.log('删除', toComponentName)
  //     // console.log('前进')
  //     // console.log('删除', toComponentName)
  //   }
  // } else {
  //   if (from.matched && from.matched.length) {
  //     let def = from.matched[0].components.default
  //     let fromComponentName = def.name ?? def.__name
  //     runtimeStore.updateExcludeRoutes({type: 'add', value: fromComponentName})
  //     // console.log('添加', fromComponentName)
  //     // console.log('后退')
  //   }
  // }
  // ...
  // 返回 false 以取消导航
  // return true
})


export default router
