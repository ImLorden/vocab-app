# Design tag-interaction

## Requirements

- 在主页 WordCard 组件中，单词的标签应该是可点击的
- 点击标签时，应该跳转到相应的标签筛选视图，就像在左侧 TagSidebar 中点击标签一样的效果
- 标签应该有视觉反馈，表明它们是可交互的（如悬停效果、光标变化等）
- 点击标签后，应该：
  - 设置当前选中的标签
  - 加载该标签下的所有单词
  - 更新 UI 状态以反映当前筛选状态
- 保持与现有 TagSidebar 交互逻辑的一致性

## Solution

1. **修改 WordCard 组件中的标签渲染**：
   - 将标签从静态的 `<span>` 元素改为可点击的 `<button>` 元素
   - 添加悬停效果和光标变化样式，表明标签可交互
   - 使用 framer-motion 添加点击动画效果

2. **实现标签点击处理逻辑**：
   - 从 `useVocabStore` 中获取 `setSelectedTag` 和 `loadWordsByTag` 方法
   - 创建 `handleTagClick` 函数，复用 TagSidebar 中的相同逻辑
   - 点击标签时调用相应的 store 方法来筛选单词

3. **样式调整**：
   - 为标签按钮添加交互状态样式（hover, active）
   - 保持现有的视觉设计风格
   - 确保与 TagSidebar 中标签的交互体验保持一致

4. **代码位置**：
   - 主要修改文件：`src/renderer/components/WordCard.tsx` 第145-152行
   - 利用现有的 store 方法，无需修改 vocab-store.ts

## Tests

- **功能测试**：
  - 点击 WordCard 中的标签能够正确筛选对应标签的单词
  - 点击已选中的标签能够取消筛选，显示所有单词
  - 标签点击后左侧 TagSidebar 中对应标签的选中状态正确更新
  
- **UI测试**：
  - 标签悬停时显示正确的视觉反馈
  - 光标在标签上时变为 pointer
  - 点击动画效果正常播放
  
- **兼容性测试**：
  - 确保与现有搜索功能的兼容性
  - 验证与 TagSidebar 交互的一致性