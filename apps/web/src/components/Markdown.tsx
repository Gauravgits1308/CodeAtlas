import * as React from "react"
import { Check, Copy, FileCode } from "lucide-react"

interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  const parts = content.split(/```/)

  const [copiedText, setCopiedText] = React.useState<string | null>(null)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedText(code)
    setTimeout(() => setCopiedText(null), 2000)
  }

  return (
    <div className="space-y-3.5 text-sm text-foreground/90 leading-relaxed font-sans select-text">
      {parts.map((part, index) => {
        // Odd indexes are code blocks
        if (index % 2 === 1) {
          const lines = part.split("\n")
          const firstLine = lines[0] || ""
          const language = firstLine.trim() || "code"
          const codeContent = lines.slice(1).join("\n").trim()

          const codeLines = codeContent.split("\n")

          return (
            <div key={index} className="border border-border/30 rounded-xl overflow-hidden bg-[#0A0D14]/90 font-mono text-xs my-3">
              {/* Header block */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#111622] border-b border-border/20 text-muted-foreground text-[10px] uppercase font-bold tracking-wider select-none">
                <span className="flex items-center gap-1.5 font-mono">
                  <FileCode className="size-3.5 text-primary" />
                  {language}
                </span>
                <button
                  onClick={() => handleCopy(codeContent)}
                  className="flex items-center gap-1 hover:text-foreground transition-all cursor-pointer"
                >
                  {copiedText === codeContent ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400 text-[9px]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span className="text-[9px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code lines list grid */}
              <div className="overflow-x-auto p-4 flex">
                {/* Line Numbers */}
                <div className="text-muted-foreground/35 text-right select-none font-mono pr-4 border-r border-border/10 min-w-8">
                  {codeLines.map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>
                {/* Code Body */}
                <div className="pl-4 pr-2 font-mono whitespace-pre flex-1 text-[#E2E8F0]">
                  {codeLines.map((line, idx) => (
                    <div key={idx} className="min-h-5 flex items-center">
                      {highlightCode(line)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        // Even indexes are text blocks with possible inline markdown
        return (
          <div key={index} className="space-y-2">
            {parseTextParagraphs(part)}
          </div>
        )
      })}
    </div>
  )
}

function highlightCode(line: string): React.ReactNode {
  if (!line.trim()) return <span>&nbsp;</span>

  let escaped = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Keywords
  escaped = escaped.replace(
    /\b(const|let|var|function|return|class|import|export|from|if|else|for|while|async|await|try|catch|new|this|typeof|instanceof|interface|type|extends|implements|public|private|protected|static|readonly|async|await|default|export|import|as|from|switch|case|break)\b/g,
    '<span class="text-purple-400 font-bold">$1</span>'
  )

  // Types & builtins
  escaped = escaped.replace(
    /\b(string|number|boolean|any|void|unknown|never|Record|Partial|Promise|Array|Map|Set|Response|Request|Headers|console|log|error|warn|info|debug)\b/g,
    '<span class="text-amber-300 font-semibold">$1</span>'
  )

  // Strings
  escaped = escaped.replace(
    /("[^"]*"|'[^']*'|`[^`]*`)/g,
    '<span class="text-emerald-400">$1</span>'
  )

  // Comments
  escaped = escaped.replace(
    /(\/\/.*)/g,
    '<span class="text-slate-500 italic">$1</span>'
  )

  return <code dangerouslySetInnerHTML={{ __html: escaped }} />
}

function parseTextParagraphs(text: string): React.ReactNode[] {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  
  let listItems: React.ReactNode[] = []
  let listKey = 0

  const pushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-6 space-y-1.5 my-2">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue;
    const trimmed = line.trim()

    // Match Headings
    if (trimmed.startsWith("### ")) {
      pushList()
      elements.push(
        <h4 key={i} className="text-sm font-bold text-foreground mt-4 mb-2">
          {parseInline(trimmed.substring(4))}
        </h4>
      )
    } else if (trimmed.startsWith("## ")) {
      pushList()
      elements.push(
        <h3 key={i} className="text-base font-bold text-foreground mt-4 mb-2">
          {parseInline(trimmed.substring(3))}
        </h3>
      )
    } else if (trimmed.startsWith("# ")) {
      pushList()
      elements.push(
        <h2 key={i} className="text-lg font-bold text-foreground mt-5 mb-2.5">
          {parseInline(trimmed.substring(2))}
        </h2>
      )
    }
    // Match Bullet Lists
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(
        <li key={i} className="text-sm text-foreground/80">
          {parseInline(trimmed.substring(2))}
        </li>
      )
    }
    // Empty line
    else if (trimmed === "") {
      pushList()
    }
    // Plain paragraphs
    else {
      pushList()
      elements.push(
        <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-2">
          {parseInline(trimmed)}
        </p>
      )
    }
  }

  pushList()
  return elements
}

function parseInline(text: string): React.ReactNode[] {
  // Simple parser for **bold** and `code`
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="bg-[#111622] text-amber-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-border/10">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
