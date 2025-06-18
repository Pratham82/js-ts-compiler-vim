// File: src/App.tsx
import { useState, useRef, useEffect, useCallback } from "react"
import Editor from "@monaco-editor/react"
import * as monaco from "monaco-editor"
// @ts-expect-error
import { initVimMode, VimMode } from "monaco-vim"
import Title from "./components/Title"

const App = () => {
  const [code, setCode] = useState<string>("console.log('Hello, World!')")
  const [output, setOutput] = useState<string>("")
  const [isVimMode, setIsVimMode] = useState<boolean>(false)
  const [language, setLanguage] = useState<string>("javascript")

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const statusBarRef = useRef<HTMLDivElement | null>(null)
  const vimModeRef = useRef<VimMode | null>(null)

  useEffect(() => {
    const editor = editorRef.current
    const statusBar = statusBarRef.current

    if (!editor || !statusBar) return

    if (vimModeRef.current) {
      vimModeRef.current.dispose()
      vimModeRef.current = null
    }

    if (isVimMode) {
      setTimeout(() => {
        if (editorRef.current && statusBarRef.current) {
          vimModeRef.current = initVimMode(editorRef.current, statusBarRef.current)
          statusBarRef.current.style.display = "block"
        }
      }, 0)
    } else {
      statusBar.style.display = "block"
    }
  }, [isVimMode])

  const runCode = useCallback(() => {
    let logs: string[] = []
    const originalLog = console.log

    console.log = (...args: any[]) => {
      logs.push(
        args
          .map(arg => {
            if (typeof arg === "object" && arg !== null) {
              try {
                const json = JSON.stringify(arg)
                return json
              } catch {
                return String(arg)
              }
            }
            return String(arg)
          })
          .join(" ")
      )
    }

    try {
      if (language === "javascript" || language === "typescript") {
        // eslint-disable-next-line no-new-func
        new Function(code)()
      } else {
        logs.push("Execution for this language is not supported yet.")
      }
    } catch (e: any) {
      logs.push("Error: " + e.message)
    }

    console.log = originalLog
    setOutput(logs.join("\n"))
  }, [code, language])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        runCode()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault()
        setIsVimMode(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [runCode])

  const handleEditorMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    editor.focus()
    editor.layout()
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Title */}
      <div className="flex-shrink-0">
        <Title />
      </div>
      {/* Editor & Output */}
      <div className="flex flex-1 min-h-0">
        {/* Editor Panel */}
        <div className="flex flex-col w-1/2 border-r h-full min-h-0">
          {/* Toolbar */}
          <div className="flex-shrink-0 flex justify-between items-center p-2 bg-gray-900 text-white px-4">
            <div className="flex gap-2 items-center">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="text-white bg-gray-800 px-2 py-1 rounded border border-gray-600"
              >
                <option value="javascript" className="text-black">
                  JavaScript
                </option>
                <option value="typescript" className="text-black">
                  TypeScript
                </option>
                <option value="python" className="text-black">
                  Python
                </option>
                <option value="java" className="text-black">
                  Java
                </option>
              </select>
              <button
                onClick={() => setIsVimMode(!isVimMode)}
                className="bg-blue-600 px-3 py-1 rounded"
              >
                {isVimMode ? "Disable Vim" : "Enable Vim"}
              </button>
              <span className="text-sm text-gray-400">Ctrl + M</span>
            </div>
            <div className="flex items-center">
              <button onClick={runCode} className="bg-green-600 px-3 py-1 rounded">
                Run ▶
              </button>

              <span className="text-sm text-gray-400">Ctrl + Enter</span>
            </div>
          </div>
          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language}
              value={code}
              theme="vs-dark"
              onMount={handleEditorMount}
              onChange={value => setCode(value ?? "")}
              options={{
                fontSize: 16,
                minimap: { enabled: false },
                fontFamily: "Fira Code",
                lineNumbers: "on",
                padding: { top: 10, bottom: 10 },
              }}
            />
          </div>
          {/* Vim Status Bar */}
          <div
            ref={statusBarRef}
            className="text-sm bg-gray-800 text-yellow-400 px-2 py-1 h-6"
          ></div>
        </div>
        {/* Output Panel */}
        <div className="w-1/2 bg-black text-green-400 p-4 overflow-auto h-full min-h-0">
          <pre className="whitespace-pre-wrap">{output}</pre>
        </div>
      </div>
    </div>
  )
}

export default App
