# nowtask - プロジェクト設定

## プロジェクト概要

**nowtask（ナウタスク）** - 24時間から差し引いて空き時間を可視化するタスク管理アプリ

- 開発者: TOMIさん（プログラミング初心者）
- 開発期間: 2025年11月〜12月（2ヶ月）
- 対象デバイス: スマホ（375px幅）で開発、PCでも動作

---

## 技術スタック

### 使用可能
- HTML
- CSS  
- JavaScript（バニラJSのみ）

### ❌ 絶対禁止
- jQuery、React、Vue等の外部ライブラリ
- フレームワーク全般
- npm パッケージ（開発時のみOK）

### データベース
- **現在**: localStorage（ブラウザ内保存）
- **将来**: Firebase（UI完成後に移行予定）← 今は実装しない

---

## 必読ドキュメント

開発前に必ず以下を読むこと：

1. **nowtask_confirmed_specifications_v1.1.md** - 確定仕様書
2. **nowtask_technical_specifications_v1.1.md** - 技術仕様書

**⚠️ 仕様書に書かれていない機能は勝手に追加しない**

---

## ファイル構成

```
nowtask/
├── index.html
├── css/
│   ├── base.css       # 共通スタイル（300-400行）
│   ├── gauge.css      # 24時間ゲージ（400-600行）
│   ├── task.css       # タスク関連（400-600行）
│   ├── calendar.css   # カレンダー（400-600行）
│   └── stats.css      # 統計・分析（300-500行）
└── js/
    ├── main.js        # 初期化・画面切り替え（300-500行）
    ├── task.js        # タスク管理（600-800行）
    ├── calendar.js    # カレンダー（500-700行）
    ├── gauge.js       # 24時間ゲージ（400-600行）
    ├── storage.js     # localStorage管理（400-600行）
    ├── routine.js     # ルーティン（500-700行）
    ├── shift.js       # シフト登録（400-600行）
    └── stats.js       # 統計・分析（400-600行）
```

**注意**: この構成は柔軟に変更可能。必要に応じてファイルを追加・変更してOK。

### ファイル分割ルール
- 理想: 500-800行/ファイル
- 許容: 1000行まで
- 超えたら: 機能ごとに分割を提案し、承認を得てから実施

---

## コーディング規約

### 変数名・関数名
```javascript
// 変数名: キャメルケース
let taskList = [];
let currentDate = new Date();

// 関数名: 動詞から始める
function addTask() {}
function deleteTask() {}
function updateTask() {}
```

### 定数
```javascript
// 大文字+アンダースコア
const MAX_SUBTASK_LEVEL = 5;
const STORAGE_KEY_TASKS = 'nowtask_tasks';
const HOURS_PER_DAY = 24;
```

### コメント
**基本方針: コメントは最小限**
- コード自体が読みやすくなるように書く
- 変数名・関数名で内容がわかるようにする
- 必要な場合のみコメント:
  - 複雑なロジックでどうしても説明が必要な時
  - 一時的な修正や注意点がある時

```javascript
// ❌ 悪い例（不要なコメント）
// タスクを追加する
function addTask() {}

// ✅ 良い例（必要最小限）
// サブタスクの合計時間がメインタスクを超える場合のみ警告
function validateSubtaskDuration(mainTask, subtasks) {}
```

### インデント・整形
- インデント: スペース2個
- セミコロン: 必ず付ける
- 文字列: シングルクォート推奨
- 1行の長さ: 80文字程度を推奨

---

## データ構造

### タスク
```javascript
{
  id: "task_20251024_001",
  name: "プロジェクト資料作成",
  startTime: "2025-10-24T09:00",  // 任意
  endTime: "2025-10-24T12:00",     // 任意
  duration: 180,                    // 任意（分）
  priority: "high",                 // high/medium/low
  tags: ["仕事", "重要"],
  completed: false,
  completedAt: null,
  createdAt: "2025-10-24T08:00",
  updatedAt: "2025-10-24T08:30",
  subtasks: []                      // 5階層まで
}
```

### ルーティン
```javascript
{
  id: "routine_001",
  name: "睡眠",
  duration: 480,
  startTime: "23:00",               // 任意
  repeatPattern: "daily",           // daily/weekly/monthly
  repeatDays: [0,1,2,3,4,5,6],     // 0=日曜
  excludeDates: ["2025-11-01"],
  createdAt: "2025-10-24T08:00"
}
```

### localStorage キー
```javascript
localStorage.setItem('nowtask_tasks', JSON.stringify(tasks));
localStorage.setItem('nowtask_routines', JSON.stringify(routines));
localStorage.setItem('nowtask_shifts', JSON.stringify(shifts));
localStorage.setItem('nowtask_settings', JSON.stringify(settings));
```

**⚠️ データ構造は柔軟に変更可能。必要に応じて項目を追加・削除してOK。**

---

## デザイン方針

### カラー
- **基本**: 白・黒・グレー（モノトーン）
- **優先度の色のみ例外**:
  - 高: `#FF4444` (赤)
  - 中: `#FFD700` (黄)
  - 低: `#4A90E2` (青)

### その他
- シンプル・ミニマル
- ❌ 絵文字は使わない
- ✅ SVGアイコンを使用
- 直感的に使える

---

## 実装優先順位

### フェーズ1: 基本機能（11月前半）
1. タスクの追加・削除・完了
2. 24時間ゲージ（ドット型）
3. 空き時間の計算・表示
4. クイック入力（画面下部固定）
5. localStorage保存

### フェーズ2: 拡張機能（11月後半）
1. サブタスク（5階層）
2. カレンダー表示
3. タスクの並び替え
4. ルーティン機能
5. シフト登録

### フェーズ3: 詳細機能（12月前半）
1. 統計・分析画面
2. タグ機能
3. 優先度
4. 検索・絞り込み
5. 円形プログレスバー

### フェーズ4: 仕上げ（12月前半）
1. UIの細かい調整
2. アニメーション
3. Firebase移行準備

**⚠️ 必ず優先順位に従って実装する**

---

## 重要な仕様

### 24時間ゲージ（最重要）
**ドット型タイムライン（メイン画面用）**
- 24個のドットで24時間を表現
- 現在時刻: 大きな黒ドット（scale: 1.5）
- 予定が入っている時刻: 濃いグレーのドット
- 経過した時刻: 薄いグレーのドット
- 空き時間: 枠だけのドット

**円形プログレスバー（統計画面用）**
- 24時間を時計のように円で表現
- 中央に現在時刻+経過時間+残り時間を全て表示
- ❌ 現在時刻の線は削除（ユーザーの強い要望）

### 空き時間の計算
```javascript
// 疑似コード
総時間 = 24時間
経過時間 = 現在時刻
予定時間 = タスクの合計時間
空き時間 = 総時間 - 経過時間 - 予定時間
```

### クイック入力
- 画面下部に常時表示（LINEのメッセージ入力欄風）
- タスク名を入力してEnterで即座に追加
- 詳細設定は後から編集可能

### サブタスク
- 5階層まで対応
- メインタスクの時間 = サブタスクの合計時間の上限
- 超えたら警告を表示
- メインタスクカード内に空き時間ゲージを表示

---

## 禁止事項

### ❌ 絶対にやってはいけないこと
1. 外部ライブラリの使用（jQuery、React等）
2. 仕様書にない機能を勝手に追加（提案はOK）
3. モノトーン以外の色を使う（優先度の色は例外）
4. 勝手にファイル構成を大きく変更（提案してから変更）
5. TOMIさんに確認せずに重要な判断をする

---

## 質問が必要な場面

以下の場合は**必ず質問**してください：

1. 仕様書に書かれていない挙動に遭遇した
2. 複数の実装方法があり、どれが良いか判断できない
3. パフォーマンスとシンプルさのトレードオフが発生
4. ファイルを分割すべきか迷う
5. ファイルが800行を超えそう
6. データ構造を変更する必要がある
7. 新しいファイルを追加する必要がある

### 質問の例
```
task.jsにタスク追加機能を実装します。
以下の流れで実装する予定です：
1. クイック入力欄からタスク名を取得
2. タスクオブジェクトを生成（ID、作成日時など）
3. tasksListに追加
4. localStorageに保存
5. 画面に表示

この流れで問題ありませんか？
```

---

## 開発スタイル

### TOMIさんのスキルレベルに合わせる
- プログラミング初心者向けのコード
- 複雑な処理は避け、シンプルに実装
- 説明を求められたら、専門用語を避けて説明

### デバッグしやすいコード
- `console.log`で動作を確認できるようにする
- エラーメッセージは日本語で分かりやすく

### 例
```javascript
// ❌ 悪い例
function addTask(t) {
  const data = JSON.parse(localStorage.getItem('nt_t')) || [];
  data.push({...t, id: Date.now()});
  localStorage.setItem('nt_t', JSON.stringify(data));
}

// ✅ 良い例
function addTask(taskName) {
  console.log('タスクを追加:', taskName);
  
  // 既存のタスク一覧を取得
  const tasks = loadTasks();
  
  // 新しいタスクを作成
  const newTask = {
    id: `task_${Date.now()}`,
    name: taskName,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  // タスクを追加
  tasks.push(newTask);
  
  // 保存
  saveTasks(tasks);
  
  console.log('タスク追加完了:', newTask);
  return newTask;
}
```

---

## 進捗報告

以下のタイミングで報告してください：

1. 機能が完成したとき
2. 予想より時間がかかりそうなとき
3. 詰まったとき
4. ファイルが800行を超えそうなとき

### 報告の例
```
✅ 完了報告:
タスク追加機能を実装しました。
- クイック入力欄からタスクを追加可能
- localStorageに保存
- 画面に即座に反映

次は削除機能を実装します。
```

---

## 実装前の確認

大きな変更の前には必ず確認を取る：
- 新しいファイルを追加する時
- データ構造を変更する時
- 100行以上のコードを書く時

### 確認の例
```
今から以下のファイルを作成します：
1. css/base.css - 共通スタイル
2. css/gauge.css - 24時間ゲージのスタイル

base.cssには以下を含めます：
- CSSリセット
- カラー変数
- フォント設定
- 共通のボタンスタイル

この内容で進めてよろしいですか？
```

---

## テスト方針

### 動作確認
1. Chrome（PC）で開発
2. スマホサイズ（375px）で確認
3. 実機（Android）でも確認（後日）

### 確認項目
- タスクの追加・削除・完了が正常に動く
- 24時間ゲージが正しく表示される
- localStorageに正しく保存される
- ページをリロードしてもデータが残る

---

## よく使う処理のテンプレート

### 現在時刻の取得
```javascript
const now = new Date();
const hours = now.getHours();
const minutes = now.getMinutes();
```

### タスクのフィルター
```javascript
// 今日のタスクだけ取得
const todayTasks = tasks.filter(task => {
  const taskDate = new Date(task.startTime);
  return taskDate.toDateString() === now.toDateString();
});
```

### 時間の計算
```javascript
// 分を時間に変換（例: 90分 → 1.5時間）
function minutesToHours(minutes) {
  return (minutes / 60).toFixed(1);
}
```

---

## 最終チェックリスト

実装前に確認すること：
- [ ] 確定仕様書を読んだ
- [ ] 技術仕様書を読んだ
- [ ] 実装計画を立てた
- [ ] 不明点を質問した
- [ ] TOMIさんの承認を得た

---

**開発を始める準備はできましたか？**

まず、確定仕様書と技術仕様書を読んでから、実装計画を提示してください。