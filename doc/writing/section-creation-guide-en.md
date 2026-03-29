# Vue.js Application Documentation Section Creation Guide

## Overview

This guide provides a standard procedure for creating sections in Vue.js application documentation. It is particularly a guideline for efficiently creating sections that include feature descriptions and source code explanations.

## Inputs

- **Document File Path**: Path to the existing document file where the section will be added (e.g., doc/vue-js-study-part5.md)
- **Section Title**: Title of the section to be created (e.g., "2. Drag-and-drop functionality for moving icons from the left sidebar to the main area")
- **Target File Names**: Source code files that compose the functionality described in the section (e.g., SideArea.vue, MainArea.vue)

## Outputs

Section content with source code explanations about the target functionality mentioned in the section title:
- Overview of the target functionality
- Related source code (only parts relevant to the target functionality)
- Supplementary explanations (bullet points) for each target file's source code

## 1. Preparation

### 1.1 Verify Required Files

- [ ] Check the project's directory structure
- [ ] Verify that target files exist

```bash
# Example of checking file structure
ls -la src/components/
ls -la src/composables/
```

### 1.2 Review Existing Documentation

- [ ] Review the document file (e.g., doc/vue-js-study-part5.md)
- [ ] Understand the overall structure of the documentation
- [ ] Understand the context before and after the section to be created

```bash
# Example of reviewing existing documentation
cat doc/vue-js-study-part5.md
```

## 2. Analysis Phase

### 2.1 Read Source Code of Target Files

- [ ] Read the source code of target files
- [ ] Identify important parts related to the target functionality

```bash
# Example of checking file contents
cat src/components/SideArea.vue
cat src/components/MainArea.vue
```

### 2.2 Review Related Files

- [ ] Check component files (.vue) and JavaScript files (.js) referenced by target files

```bash
# Example of checking related files
cat src/composables/useDraggable.js
cat src/components/./BlockItem.vue
cat src/classes/Block.js
```

### 2.3 Understand the Operation Flow of Target Functionality

- [ ] Understand the overall flow of the target functionality
- [ ] Understand interactions between components
- [ ] Track data flow

## 3. Documentation Creation Phase

### 3.1 Create Section Overview

- [ ] Write an overview of the target functionality at the beginning of the section
- [ ] Briefly explain the purpose and implementation method of the target functionality
- [ ] Mention main Vue.js features and patterns used

### 3.2 Extract Source Code from Each File

- [ ] Extract only parts related to the target functionality from target files
- [ ] Omit parts not directly related to the target functionality (html tags, functions, CSS selectors, etc.)
- [ ] Write code blocks in Markdown format

```markdown
# Example of source code description
BlockItem.vue

```vue
<template>
  <!-- Related template parts -->
</template>

<script>
  // Related script parts
</script>

<style>
  /* Related style parts */
</style>
```

### 3.3 Create Supplementary Explanations

- [ ] Write supplementary explanations (up to about 5 items) in bullet points immediately after each file's source code
  - Use up to 2 levels of bullet point depth
  - Use "-" for the first level
  - Use "-" for the second level with appropriate indentation
- [ ] Explain the functions and roles of important code parts
- [ ] Describe implementation considerations and cautions

Example:
```markdown
- The template section defines draggable elements using the draggable attribute.
  - The dragstart event hooks processing when dragging starts.
  - Data is set in the dataTransfer object to transmit drag information.
- The script section utilizes the Composition API.
  - The useDraggable composable is used to implement drag functionality.
  - Custom callbacks are set to customize drag behavior.
```

## 4. Quality Assurance Phase

### 4.1 Format Requirements Verification

- [ ] Verify that the section title is correctly written
- [ ] Verify that the overview is concise and easy to understand
- [ ] Verify that source code displays correctly
- [ ] Verify that supplementary explanations are placed immediately after each file

### 4.2 Content Validity Check

- [ ] Verify that explanations are technically accurate
- [ ] Verify that important functions and concepts are explained without omission
- [ ] Verify that explanations are easy for readers to understand

### 4.3 Reflect in Document File

- [ ] After confirming the created section content, reflect it in the document file

## 5. Execution Example: Creating the "2. Drag-and-drop functionality for moving icons from the left sidebar to the main area" Section

### Step 1: Preparation

1. Check project structure
   ```bash
   ls -la src/components/
   ls -la src/composables/
   ```

2. Review existing documentation
   ```bash
   cat doc/vue-js-study-part5.md
   ```

### Step 2: Analysis Phase

1. Check target files
   ```bash
   cat src/components/SideArea.vue
   cat src/components/MainArea.vue
   ```

2. Check related files
   ```bash
   cat src/composables/useDraggable.js
   cat src/components/./BlockItem.vue
   cat src/classes/Block.js
   ```

### Step 3: Documentation Creation Phase

1. Create section content
   ```markdown
   ### 2. Drag-and-drop functionality for moving icons from the left sidebar to the main area

   左サイドバーのアイコンをドラッグ可能にし、メインエリアにドロップすると新しいブロックが作成される機能を実装します。SideArea.vueではuseDraggable composableを使用してドラッグ機能を実装し、MainArea.vueではuseDroppable composableを使用してドロップ機能を実装します。ドラッグ開始時にDataTransferオブジェクトにデータを設定し、ドロップ時にそのデータを取得して新しいブロックを作成します。

   **SideArea.vue**

   ```vue
   <template>
     <div class="side-area">
       <div class="rect-item">
         <div 
           class="rect-icon whitegray"
           draggable="true"
           @dragstart="onDragStartBlock"
         ></div>
       </div>
     </div>
   </template>

   <script>
   import { useDraggable } from '../composables/useDraggable';

   export default {
     name: 'SideArea',
     
     setup() {
       // Get composition API
       const { 
         onDragStart: onDragStartBlock, 
         setOnDragStartCallBack: setBlockDragStartCallback 
       } = useDraggable();

       // Set custom callbacks for drag start events
       setBlockDragStartCallback((event) => {
         event.dataTransfer.setData('entryType', 'block');
       });
       
       // Return values and methods to use in <template>
       return {
         onDragStartBlock
       };
     }
   }
   </script>

   <style scoped>
   .side-area {
     width: 300px;
     height: 100vh;
     background: #f0f0f0;
     display: flex;
     flex-direction: column;
     align-items: center;
   }
   
   /* 関連しない部分は省略 */
   </style>>
   ```

   - SideArea.vueでは、`draggable="true"`属性を設定することでアイコンをドラッグ可能にし、`@dragstart`イベントでドラッグ開始時の処理を行います。
   - ドラッグ開始時に`event.dataTransfer.setData('entryType', 'block')`を実行し、ドラッグしているのがブロック型であることを示すデータを設定します。

   **MainArea.vue**

   ```vue
   <template>
     <div 
       class="main-area"
       @dragenter="onDragEnter"
       @dragleave="onDragLeave"
     >
       <div class="main-container">
         <!-- First drop area (always displayed) -->
         <div class="drop-area" 
             :class="{'is-dragEntering': isDragEntering}"
             @drop="(event) => onDrop(event, 0)"
             @dragover="onDragOver"
         />
         <!-- Each block and its drop area below -->
         <template v-for="(entry, index) in entries" :key="entry.id">
           <BlockItem :entry="entry" @remove="removeEntry" />
           <div class="drop-area" 
               :class="{'is-dragEntering': isDragEntering}"
               @drop="(event) => onDrop(event, index + 1)"
               @dragover="onDragOver"
           />
         </template>
       </div>
     </div>
   </template>

   <script>
   import { ref } from 'vue'
   import { useDroppable } from '../composables/useDroppable'
   import BlockItem from './BlockItem.vue'
   import Block from '../classes/Block'

   export default {
     name: 'MainArea',
     components: {
       BlockItem
     },
     
     setup() {  
       // Get composition API
       const { 
         isDragEntering,
         onDragEnter, 
         onDragLeave, 
         onDragOver, 
         onDrop, 
         setOnDropCallBack 
       } = useDroppable()

       // Array of entries
       const entries = ref([])
       
       // Relocate an entry
       const relocateEntry = (entryId, dropIndex) => {
         // 実装詳細は省略
       }
       
       // Remove an entry
       const removeEntry = (id) => {
         // 実装詳細は省略
       }
       
       // Set custom callbacks for drop event
       setOnDropCallBack((event, index) => {
         // Get data directly from event.dataTransfer
         const entryId = event.dataTransfer.getData('entryId')
         const entryType = event.dataTransfer.getData('entryType')
         
         if (entryType === 'block' && !entryId) {
           // Create and insert a new block
           if (index !== null) {
             const newBlock = new Block()
             entries.value.splice(index, 0, newBlock)
           }
         } else if (entryId) {
           // Relocate existing block
           relocateEntry(entryId, index)
         }
       })

       /* 関連しない部分は省略 */
     }
   }
   </script>

   <style scoped>
   .main-area {
     min-width: 800px;
     height: 100vh;
     padding: 0px 100px;
     box-sizing: border-box;
     background-color: #f5f5f5;
     overflow: auto;
   }

   .main-container {
     width: 100%;
     position: relative;
     display: flex;
     flex-direction: column;
     align-items: left;
   }

   /* 関連しない部分は省略 */
   </style>>
   ```

   - MainArea.vueでは、複数のドロップエリア（`.drop-area`）を配置し、各ドロップエリアに`@drop`イベントハンドラを設定します。
   - ドロップ時には`event.dataTransfer.getData('entryType')`でドラッグされたアイテムの種類を取得し、'block'の場合は新しいBlockインスタンスを作成してentriesに追加します。
   - ドラッグ中は`isDragEntering`の値に応じてドロップエリアのスタイルを変更し、視覚的フィードバックを提供します。
   - 各ブロックの間にドロップエリアを配置することで、ブロックの任意の位置に新しいブロックを挿入できるようにしています。
   ```

### Step 4: Quality Assurance Phase

1. Format requirements verification
   - Verify that the section title is correctly written
   - Verify that the overview is concise and easy to understand
   - Verify that source code displays correctly
   - Verify that supplementary explanations are placed immediately after each file

2. Content validity check
   - Verify that explanations are technically accurate
   - Verify that important functions and concepts are explained without omission
   - Verify that explanations are easy for readers to understand

3. Reflect in documentation
   - After confirming the created section content, reflect it in the document file

## Example Instructions for AI

Here are example instruction texts for requesting AI to create a documentation section following this guide:

### Basic Instruction Example

```
Please create the following section according to the guide in doc/writing/section-creation-guide.md.

- Document file: doc/vue-js-study-part5.md
- Section title: "2. Drag-and-drop functionality for moving icons from the left sidebar to the main area"
- Target file names: SideArea.vue, MainArea.vue
```

### Key Points for Instructions

- **Required Information**: Always include the document file, section title, and target file names (source code)
- **Guide Reference**: Including a reference to "doc/writing/section-creation-guide.md" makes it easier for AI to recognize consistent format and procedures

## Checklist

### Preparation Checklist
- [ ] Confirmed project structure
- [ ] Verified existence of target files
- [ ] Identified related composables and classes
- [ ] Reviewed existing documentation

### Analysis Phase Checklist
- [ ] Read source code of target files
- [ ] Identified important parts related to functionality
- [ ] Checked related composables and classes
- [ ] Understood overall flow of functionality

### Documentation Creation Phase Checklist
- [ ] Created section overview
- [ ] Extracted source code from each file (only functionality-related parts)
- [ ] Created supplementary explanations for each file

### Quality Assurance Phase Checklist
- [ ] Verified format requirements
- [ ] Checked content validity
- [ ] Reflected in existing documentation
