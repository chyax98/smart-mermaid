import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

const MAX_HISTORY_SIZE = 50

export const useAppStore = create(
  persist(
    subscribeWithSelector((set, get) => ({
      // ========== 编辑器状态 ==========
      editor: {
        inputText: '',
        mermaidCode: '',
        diagramType: 'auto',
        streamingContent: '',
        isStreaming: false,
        errorMessage: null,
        hasError: false,
      },

      // ========== UI状态 ==========
      ui: {
        isLeftPanelCollapsed: false,
        renderMode: 'excalidraw',
        isGenerating: false,
        isFixing: false,
        showSettingsDialog: false,
        showLimitDialog: false,
      },

      // ========== 用户配置 ==========
      config: {
        aiConfig: null,
        selectedModel: null,
        passwordVerified: false,
        hasCustomConfig: false,
      },

      // ========== 使用统计 ==========
      usage: {
        remainingUsage: 5,
      },

      // ========== 历史记录管理 ==========
      history: {
        records: [],
        currentIndex: -1,
      },

      // ========== Actions: 编辑器操作 ==========
      setInputText: (text) => set((state) => ({
        editor: { ...state.editor, inputText: text }
      })),

      setMermaidCode: (code) => {
        const state = get()
        const { history } = state
        
        // 添加到历史记录
        const newRecords = [
          ...history.records.slice(0, history.currentIndex + 1),
          { code, timestamp: Date.now() }
        ]
        
        // 限制历史记录大小
        if (newRecords.length > MAX_HISTORY_SIZE) {
          newRecords.shift()
        }
        
        set({
          editor: { ...state.editor, mermaidCode: code },
          history: {
            records: newRecords,
            currentIndex: newRecords.length - 1
          }
        })
      },

      setDiagramType: (type) => set((state) => ({
        editor: { ...state.editor, diagramType: type }
      })),

      setStreamingContent: (content) => set((state) => ({
        editor: { ...state.editor, streamingContent: content }
      })),

      setIsStreaming: (isStreaming) => set((state) => ({
        editor: { ...state.editor, isStreaming }
      })),

      setError: (errorMessage, hasError) => set((state) => ({
        editor: { ...state.editor, errorMessage, hasError }
      })),

      // ========== Actions: UI操作 ==========
      toggleLeftPanel: () => set((state) => ({
        ui: { ...state.ui, isLeftPanelCollapsed: !state.ui.isLeftPanelCollapsed }
      })),

      setRenderMode: (mode) => set((state) => ({
        ui: { ...state.ui, renderMode: mode }
      })),

      toggleRenderMode: () => set((state) => ({
        ui: { ...state.ui, renderMode: state.ui.renderMode === 'excalidraw' ? 'mermaid' : 'excalidraw' }
      })),

      setIsGenerating: (isGenerating) => set((state) => ({
        ui: { ...state.ui, isGenerating }
      })),

      setIsFixing: (isFixing) => set((state) => ({
        ui: { ...state.ui, isFixing }
      })),

      setShowSettingsDialog: (show) => set((state) => ({
        ui: { ...state.ui, showSettingsDialog: show }
      })),

      setShowLimitDialog: (show) => set((state) => ({
        ui: { ...state.ui, showLimitDialog: show }
      })),

      // ========== Actions: 配置操作 ==========
      setAIConfig: (config) => set((state) => ({
        config: { ...state.config, aiConfig: config, hasCustomConfig: !!config }
      })),

      setSelectedModel: (model) => set((state) => ({
        config: { ...state.config, selectedModel: model }
      })),

      setPasswordVerified: (verified) => set((state) => ({
        config: { ...state.config, passwordVerified: verified }
      })),

      // ========== Actions: 使用统计 ==========
      setRemainingUsage: (count) => set((state) => ({
        usage: { ...state.usage, remainingUsage: count }
      })),

      decrementUsage: () => set((state) => ({
        usage: { ...state.usage, remainingUsage: Math.max(0, state.usage.remainingUsage - 1) }
      })),

      // ========== Actions: 历史记录 ==========
      undo: () => {
        const { history, editor } = get()
        if (history.currentIndex > 0) {
          const newIndex = history.currentIndex - 1
          const record = history.records[newIndex]
          set({
            editor: { ...editor, mermaidCode: record.code },
            history: { ...history, currentIndex: newIndex }
          })
        }
      },

      redo: () => {
        const { history, editor } = get()
        if (history.currentIndex < history.records.length - 1) {
          const newIndex = history.currentIndex + 1
          const record = history.records[newIndex]
          set({
            editor: { ...editor, mermaidCode: record.code },
            history: { ...history, currentIndex: newIndex }
          })
        }
      },

      canUndo: () => {
        const { history } = get()
        return history.currentIndex > 0
      },

      canRedo: () => {
        const { history } = get()
        return history.currentIndex < history.records.length - 1
      },

      clearHistory: () => set({
        history: { records: [], currentIndex: -1 }
      }),

      // ========== Actions: 重置状态 ==========
      resetEditor: () => set((state) => ({
        editor: {
          ...state.editor,
          inputText: '',
          mermaidCode: '',
          streamingContent: '',
          isStreaming: false,
          errorMessage: null,
          hasError: false,
        }
      })),

      resetAll: () => set((state) => ({
        editor: {
          inputText: '',
          mermaidCode: '',
          diagramType: 'auto',
          streamingContent: '',
          isStreaming: false,
          errorMessage: null,
          hasError: false,
        },
        ui: {
          ...state.ui,
          isGenerating: false,
          isFixing: false,
        },
        history: {
          records: [],
          currentIndex: -1,
        }
      })),
    })),
    {
      name: 'smart-mermaid-storage',
      // 只持久化必要的数据
      partialize: (state) => ({
        editor: {
          inputText: state.editor.inputText,
          mermaidCode: state.editor.mermaidCode,
          diagramType: state.editor.diagramType,
        },
        ui: {
          isLeftPanelCollapsed: state.ui.isLeftPanelCollapsed,
          renderMode: state.ui.renderMode,
        },
        config: state.config,
      }),
    }
  )
)

// 导出选择器钩子，用于优化组件订阅
export const useEditorState = () => useAppStore((state) => state.editor)
export const useUIState = () => useAppStore((state) => state.ui)
export const useConfigState = () => useAppStore((state) => state.config)
export const useUsageState = () => useAppStore((state) => state.usage)
export const useHistoryState = () => useAppStore((state) => state.history)

// 导出actions选择器
export const useEditorActions = () => useAppStore((state) => ({
  setInputText: state.setInputText,
  setMermaidCode: state.setMermaidCode,
  setDiagramType: state.setDiagramType,
  setStreamingContent: state.setStreamingContent,
  setIsStreaming: state.setIsStreaming,
  setError: state.setError,
  resetEditor: state.resetEditor,
}))

export const useUIActions = () => useAppStore((state) => ({
  toggleLeftPanel: state.toggleLeftPanel,
  setRenderMode: state.setRenderMode,
  toggleRenderMode: state.toggleRenderMode,
  setIsGenerating: state.setIsGenerating,
  setIsFixing: state.setIsFixing,
  setShowSettingsDialog: state.setShowSettingsDialog,
  setShowLimitDialog: state.setShowLimitDialog,
}))

export const useHistoryActions = () => useAppStore((state) => ({
  undo: state.undo,
  redo: state.redo,
  canUndo: state.canUndo,
  canRedo: state.canRedo,
  clearHistory: state.clearHistory,
}))