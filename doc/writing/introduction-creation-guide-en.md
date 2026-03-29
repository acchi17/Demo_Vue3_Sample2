# Vue.js Application Documentation Introduction Creation Guide

## Overview

This guide provides a standard procedure for efficiently creating the introduction section of Vue.js application documentation (title, application feature overview, and source code structure).

## Inputs

To create the introduction section of the documentation, the following inputs are required:

### 1. Document Basic Information
- **Document File Path**: Path to the target document file where the introduction will be added (e.g., doc/vue-js-study-part7.md)
- **Title**: Title specified by the user (e.g., "Vue.js Study Part 6: Implementing Container Functionality")
- **Source Code Link**: Reference URL such as GitHub

### 2. Application Feature Information
- **List of Main Features**: Main features of the application (3-5 items)
  - Identified by analyzing the project's source code
  - Described from the user operation perspective
  - Screenshots or demo videos if necessary

### 3. Project Structure Information
- **Project Structure**: Directory and file structure of the current project
  - Obtained with `list_files` or `ls -la` commands
  - Extract only important directories and files

### How to Obtain

1. **Document Basic Information**: Provided directly by the user
2. **Application Features**: Analyze using the following methods:
   - Examine main component files (.vue files)
   - Examine JavaScript files (.js files)
3. **Project Structure**: Obtained with command-line tools

By properly collecting and analyzing these inputs, you can create an introduction section that accurately represents the application's features and structure.

## 1. Creating the Title

- Use the title exactly as specified by the user
- Example: "Vue.js Study Part X: [Description of Main Features]"

## 2. Creating the "An application covered in this article" Section

This section briefly describes the main features of the application with 3-5 bullet points.

### Procedure

1. Check the project's main component files (.vue)
2. Understand the structure and roles of JavaScript files (.js) that handle application logic (models, services, composables, etc.)
3. List the main features observable from a user perspective in bullet points

### Example Description

```markdown
## An application covered in this article

- Dragging icons (white-gray, lime-green) from the left sidebar and dropping them into the main area places blocks and containers, respectively.
- Blocks and containers placed in the main area display unique IDs and delete buttons.
- Other blocks or containers can be placed inside containers via drag-and-drop.
- Each element's placement order and parent-child relationships can be changed through drag-and-drop.
- Clicking the delete button of an element removes that element and its child elements.

**Source code:** 
[https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2](https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2)
```

### Key Points for Description

- Focus on features that users can actually operate
- Explain behavior and visual changes rather than technical details
- End bullet points with expressions like "places", "can be", "displays", etc.

## 3. Creating the "Source code structure" Section

This section shows the source code structure of the application.

### Procedure

1. Use `list_files` command or `ls -la` command to check the project's file structure
2. Describe the directory structure with public and src directories at the top level

### Example Description

## Source code structure of the Vue application

The source code structure of the above application is as follows:

```
public/
├── favicon.ico
└── index.html
src/
├── App.vue
├── main.js
├── classes/
│   ├── Block.js
│   ├── Container.js
│   ├── Entry.js
│   └── EntryManager.js
├── components/
│   ├── BlockItem.vue
│   ├── ContainerItem.vue
│   ├── MainArea.vue
│   └── SideArea.vue
└── composables/
    ├── useDragDropState.js
    ├── useDraggable.js
    ├── useDroppable.js
    └── useObjectStyle.js
```

### Key Points for Description

- Use code blocks (```) to clearly display the hierarchical structure
- Use "/" for file path separators
- Add "/" after directory names
- Display file names in a tree structure (using symbols like "├──" and "└──")

## Execution Procedure

1. Check the project's directory structure and identify main files
2. Read the code of each component file and JavaScript file to understand the application's features
3. Summarize the main features from a user perspective with 3-5 bullet points
4. Create a code block that accurately represents the directory structure
5. Integrate the created sections into the markdown file

## 4. Adding the "Implementing the functionality" Heading

This section adds the "## Implementing the functionality" heading after the source code structure section.

### Procedure

1. Immediately after the source code structure section ("Source code structure"), add the following heading:
   ```
   ## Implementing the functionality
   ```

2. This heading is placed at the end of the introduction section and serves as a bridge to the implementation details section of the main content.

## Example Instructions for AI

Here are example instruction texts for requesting AI to create an introduction section following this guide:

### Basic Instruction Example

```
Please create the introduction section according to the guide in doc/writing/introduction-creation-guide.md.

- Document file: doc/vue-js-study-part5.md
- Title: "Vue.js Study Part 8: Implementing Script Execution Functionality"
- Source code link: https://github.com/acchi17/Demo_Vue3_Sample2/tree/step2
```

### Key Points for Instructions

- **Required Information**: Always include the document file path, title, and source code link
- **Guide Reference**: Including a reference to "doc/writing/introduction-creation-guide.md" makes it easier for AI to recognize the consistent format

## Checklist

- [ ] Title is correctly written
- [ ] "An application covered in this article" section describes 3-5 main features in bullet points
- [ ] Source code link is included
- [ ] "Source code structure" section accurately displays the directory structure
- [ ] "Implementing the functionality" heading is added
- [ ] Markdown format is correctly used
