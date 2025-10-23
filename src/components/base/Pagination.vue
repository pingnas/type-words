<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';

interface IProps {
  currentPage?: number;
  pageSize?: number;
  pageSizes?: number[];
  layout?: string;
  total: number;
  hideOnSinglePage?: boolean;
  // background property removed as per requirements
}

const props = withDefaults(defineProps<IProps>(), {
  currentPage: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 30, 40, 50, 100],
  layout: 'prev, pager, next',
  hideOnSinglePage: false,
});

const emit = defineEmits<{
  'update:currentPage': [val: number];
  'update:pageSize': [val: number];
  'size-change': [val: number];
  'current-change': [val: number];
}>();

const internalCurrentPage = ref(props.currentPage);
const internalPageSize = ref(props.pageSize);

// 计算总页数
const pageCount = computed(() => {
  return Math.max(1, Math.ceil(props.total / internalPageSize.value));
});

// 可用于显示的页码数量，会根据容器宽度动态计算
const availablePagerCount = ref(5); // 默认值

// 计算显示的页码
const pagers = computed(() => {
  const pagerCount = availablePagerCount.value; // 动态计算的页码数量
  const halfPagerCount = Math.floor(pagerCount / 2);
  const currentPage = internalCurrentPage.value;
  const pageCountValue = pageCount.value;

  let showPrevMore = false;
  let showNextMore = false;

  if (pageCountValue > pagerCount) {
    if (currentPage > pagerCount - halfPagerCount) {
      showPrevMore = true;
    }
    if (currentPage < pageCountValue - halfPagerCount) {
      showNextMore = true;
    }
  }

  const array = [];
  if (showPrevMore && !showNextMore) {
    const startPage = pageCountValue - (pagerCount - 2);
    for (let i = startPage; i < pageCountValue; i++) {
      array.push(i);
    }
  } else if (!showPrevMore && showNextMore) {
    for (let i = 2; i < pagerCount; i++) {
      array.push(i);
    }
  } else if (showPrevMore && showNextMore) {
    const offset = Math.floor(pagerCount / 2) - 1;
    for (let i = currentPage - offset; i <= currentPage + offset; i++) {
      array.push(i);
    }
  } else {
    for (let i = 2; i < pageCountValue; i++) {
      array.push(i);
    }
  }

  return array;
});

// 是否显示分页
const shouldShow = computed(() => {
  return props.hideOnSinglePage ? pageCount.value > 1 : true;
});

// 处理页码变化
function handleCurrentChange(val: number) {
  internalCurrentPage.value = val;
  emit('update:currentPage', val);
  emit('current-change', val);
}

// 处理每页条数变化
function handleSizeChange(val: number) {
  internalPageSize.value = val;
  emit('update:pageSize', val);
  emit('size-change', val);

  // 重新计算可用页码数量
  calculateAvailablePagerCount();

  // 重新计算当前页，确保当前页在有效范围内
  const newPageCount = Math.ceil(props.total / val);
  if (internalCurrentPage.value > newPageCount) {
    internalCurrentPage.value = newPageCount;
    emit('update:currentPage', newPageCount);
    emit('current-change', newPageCount);
  }
}

// 计算可用宽度并更新页码数量
function calculateAvailablePagerCount() {
  // 在下一个渲染周期执行，确保DOM已更新
  setTimeout(() => {
    const paginationEl = document.querySelector('.pagination') as HTMLElement;
    if (!paginationEl) return;

    const containerWidth = paginationEl.offsetWidth;
    const buttonWidth = 38; // 按钮宽度（包括margin）
    const availableWidth = containerWidth - 120; // 减去其他元素占用的空间（前后按钮等）

    // 计算可以显示多少个页码按钮
    const maxPagers = Math.max(3, Math.floor(availableWidth / buttonWidth) - 2); // 减2是因为第一页和最后一页始终显示
    availablePagerCount.value = maxPagers;
  }, 0);
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', calculateAvailablePagerCount);
  // 初始计算
  calculateAvailablePagerCount();
});

// 组件卸载时移除监听器
onUnmounted(() => {
  window.removeEventListener('resize', calculateAvailablePagerCount);
})

// 上一页
function prev() {
  const newPage = internalCurrentPage.value - 1;
  if (newPage >= 1) {
    handleCurrentChange(newPage);
  }
}

// 下一页
function next() {
  const newPage = internalCurrentPage.value + 1;
  if (newPage <= pageCount.value) {
    handleCurrentChange(newPage);
  }
}

// 跳转到指定页
function jumpPage(page: number) {
  if (page !== internalCurrentPage.value) {
    handleCurrentChange(page);
  }
}

// 快速向前跳转
function quickPrevPage() {
  const newPage = Math.max(1, internalCurrentPage.value - 5);
  if (newPage !== internalCurrentPage.value) {
    handleCurrentChange(newPage);
  }
}

// 快速向后跳转
function quickNextPage() {
  const newPage = Math.min(pageCount.value, internalCurrentPage.value + 5);
  if (newPage !== internalCurrentPage.value) {
    handleCurrentChange(newPage);
  }
}
</script>

<template>
  <div class="pagination" v-if="shouldShow">
    <div class="pagination-container">
      <!-- 上一页 -->
      <button
          v-if="layout.includes('prev')"
          class="btn-prev"
          :disabled="internalCurrentPage <= 1"
          @click="prev"
      >
        <IconFluentChevronLeft20Filled/>
      </button>

      <!-- 页码 -->
      <ul v-if="layout.includes('pager')" class="pager">
        <!-- 第一页 -->
        <li
            class="number"
            :class="{ active: internalCurrentPage === 1 }"
            @click="jumpPage(1)"
        >
          1
        </li>

        <!-- 快速向前 -->
        <li
            v-if="pageCount > availablePagerCount && internalCurrentPage > (availablePagerCount - Math.floor(availablePagerCount / 2))"
            class="more btn-quickprev"
            @click="quickPrevPage"
        >
          ...
        </li>

        <!-- 中间页码 -->
        <li
            v-for="pager in pagers"
            :key="pager"
            class="number"
            :class="{ active: internalCurrentPage === pager }"
            @click="jumpPage(pager)"
        >
          {{ pager }}
        </li>

        <!-- 快速向后 -->
        <li
            v-if="pageCount > availablePagerCount && internalCurrentPage < pageCount - Math.floor(availablePagerCount / 2)"
            class="more btn-quicknext"
            @click="quickNextPage"
        >
          ...
        </li>

        <!-- 最后一页 -->
        <li
            v-if="pageCount > 1"
            class="number"
            :class="{ active: internalCurrentPage === pageCount }"
            @click="jumpPage(pageCount)"
        >
          {{ pageCount }}
        </li>
      </ul>

      <!-- 下一页 -->
      <button
          v-if="layout.includes('next')"
          class="btn-next"
          :disabled="internalCurrentPage >= pageCount"
          @click="next"
      >
        <IconFluentChevronLeft20Filled class="transform-rotate-180"/>
      </button>

      <!-- 每页条数选择器 -->
      <div v-if="layout.includes('sizes')" class="sizes">
        <select
            :value="internalPageSize"
            @change="handleSizeChange(Number($event.target.value))"
        >
          <option v-for="item in pageSizes" :key="item" :value="item">
            {{ item }} 条/页
          </option>
        </select>
      </div>

      <!-- 总数 -->
      <span v-if="layout.includes('total')" class="total">
        共 {{ total }} 条
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pagination {
  white-space: normal;
  color: var(--color-main-text);
  font-weight: normal;
  display: flex;
  justify-content: center;
  width: 100%;

  .pagination-container {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
    max-width: 100%;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .btn-prev, .btn-next {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    font-size: 1rem;
    min-width: 1.9375rem;
    height: 1.9375rem;
    border-radius: 0.125rem;
    cursor: pointer;
    background-color: var(--color-third);
    color: #606266;
    border: none;
    padding: 0 0.375rem;
    margin: 0.25rem 0.25rem;

    &:disabled {
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      color: var(--color-select-bg);
    }
  }

  .pager {
    display: inline-flex;
    list-style: none;
    margin: 0;
    padding: 0;
    flex-wrap: wrap;

    li {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      font-size: 0.875rem;
      min-width: 1.9375rem;
      height: 1.9375rem;
      line-height: 1.9375rem;
      border-radius: 0.125rem;
      margin: 0.25rem 0.25rem;
      cursor: pointer;
      background-color: var(--color-third);
      border: none;

      &.active {
        background-color: var(--el-color-primary, #409eff);
        color: #fff;
      }

      &.more {
        color: #606266;
      }

      &:hover:not(.active) {
        color: var(--el-color-primary, #409eff);
      }
    }
  }

  .sizes {
    margin: 0.25rem 0.5rem;

    select {
      height: 1.9375rem;
      padding: 0 0.5rem;
      font-size: 0.875rem;
      border-radius: 0.125rem;
      border: 1px solid #dcdfe6;
      background-color: #fff;

      &:focus {
        outline: none;
        border-color: var(--el-color-primary, #409eff);
      }

      &:disabled {
        background-color: #f5f7fa;
        color: #c0c4cc;
        cursor: not-allowed;
      }
    }
  }

  .total {
    margin: 0.25rem 0.5rem;
    font-weight: normal;
    color: #606266;
  }
}
</style>
