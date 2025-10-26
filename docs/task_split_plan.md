# task.js ファイル分割計画

## 現状
- **合計行数**: 1234行（上限1000行を超過）
- **分割目標**: 3ファイルに分割（各400行程度）

## 分割方針

TaskManagerオブジェクトを3つのファイルに分割し、読み込み順序で統合します。

### 1. task-core.js（基本・CRUD・フィルタ）
**行数目安**: 約450行

**含まれる内容**:
- データプロパティ（tasks, filters）
- init()
- setupEventListeners()
- addTaskFromQuickInput()
- createTask()
- deleteTask()
- toggleTaskComplete()
- getTodayTasks()
- getEffectiveDuration()
- showTaskMenu()
- toggleCompletedTasks()
- フィルタ関連全て:
  - openFilterModal()
  - closeFilterModal()
  - populateTagFilters()
  - populateCurrentFilters()
  - applyFilters()
  - clearFilters()
  - filterTask()
- サブタスク操作:
  - toggleSubtaskComplete()
  - showSubtaskDetail()
  - addSubtaskInline()
- ユーティリティ:
  - formatDuration()
  - formatTimeLabel()
  - escapeHtml()

### 2. task-render.js（レンダリング・UI表示）
**行数目安**: 約450行

**含まれる内容**:
- renderTasks()
- groupTasksByDate()
- renderDateGroup()
- renderTaskCard()
- renderTaskGauge()
- renderSubtasks()
- 時間重複検出:
  - renderTasksWithOverlapDetection()
  - detectOverlaps()
  - tasksOverlap()
  - renderOverlapGroup()
- attachTaskEventListeners()
- サブタスククイック入力:
  - showSubtaskQuickInput()
  - hideSubtaskQuickInput()

### 3. task-gestures.js（ドラッグ・スワイプ・マルチセレクト）
**行数目安**: 約350行

**含まれる内容**:
- ジェスチャー関連プロパティ:
  - draggedElement, draggedTaskId
  - swipeStartX, swipeStartY, swipeElement
  - multiSelectMode, selectedTasks
  - longPressTimer, longPressDelay
- setupDragAndDrop()
- reorderTasks()
- setupSwipeGestures()
- addSwipeListeners()
- setupMultiSelect()
- マルチセレクト関連全て:
  - enterMultiSelectMode()
  - exitMultiSelectMode()
  - toggleTaskSelection()
  - updateMultiSelectUI()
  - multiSelectComplete()
  - multiSelectDelete()

## 統合方法

```javascript
// task-core.js
const TaskManager = {
  tasks: [],
  filters: {},
  // CRUDメソッド...
};

// task-render.js
Object.assign(TaskManager, {
  renderTasks() {...},
  // レンダリングメソッド...
});

// task-gestures.js
Object.assign(TaskManager, {
  setupDragAndDrop() {...},
  // ジェスチャーメソッド...
});
```

## index.html 読み込み順

```html
<script src="js/task-core.js"></script>
<script src="js/task-render.js"></script>
<script src="js/task-gestures.js"></script>
```

## 実装手順

1. ✅ 分割計画作成
2. task-core.js 作成
3. task-render.js 作成
4. task-gestures.js 作成
5. 元のtask.jsをバックアップ
6. index.html のscript読み込み修正
7. 動作確認
8. 問題なければtask.jsを削除

## 注意事項

- 各ファイルは TaskManager を参照・拡張する
- 読み込み順序が重要（core → render → gestures）
- 各メソッド間の依存関係を保持
- this参照はTaskManagerオブジェクト内で機能
