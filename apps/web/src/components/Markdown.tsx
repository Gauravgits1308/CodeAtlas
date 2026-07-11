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
    <div className="space-y-4 text-xs text-foreground/90 leading-relaxed font-sans select-text">
      {parts.map((part, index) => {
        // Odd indexes are code blocks
        if (index % 2 === 1) {
          const lines = part.split("\n")
          const firstLine = lines[0] || ""
          const language = firstLine.trim() || "code"
          const codeContent = lines.slice(1).join("\n").trim()

          const codeLines = codeContent.split("\n")

          return (
            <div key={index} className="border border-border/30 rounded-xl overflow-hidden bg-[#0A0D14]/90 font-mono text-[11px] my-3">
              {/* Header block */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#111622] border-b border-border/20 text-muted-foreground text-[9px] uppercase font-bold tracking-wider select-none">
                <span className="flex items-center gap-1.5 font-mono">
                  <FileCode className="size-3.5 text-primary" />
                  {language}
                </span>
                <button
                  onClick={() => handleCopy(codeContent)}
                  className="flex items-center gap-1 hover:text-foreground transition-all cursor-pointer font-mono"
                >
                  {copiedText === codeContent ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400 text-[8px]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span className="text-[8px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code lines grid */}
              <div className="overflow-x-auto p-3 flex">
                <div className="text-muted-foreground/35 text-right select-none font-mono pr-3 border-r border-border/10 min-w-8">
                  {codeLines.map((_, idx) => (
                    <div key={idx}>{idx + 1}</div>
                  ))}
                </div>
                <div className="pl-3 pr-2 font-mono whitespace-pre flex-1 text-[#E2E8F0]">
                  {codeLines.map((line, idx) => (
                    <div key={idx} className="min-h-5 flex items-center font-mono">
                      {highlightCode(line)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        // Even indexes are text blocks with markdown formatting
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
        <ul key={`list-${listKey++}`} className="list-disc pl-6 space-y-1.5 my-3 text-foreground/80 leading-relaxed font-sans">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  let tableLines: string[] = []
  let tableKey = 0

  const pushTable = () => {
    if (tableLines.length > 0) {
      const rows = tableLines.map(line => {
        const parts = line.split("|").map(p => p.trim())
        if (parts[0] === "") parts.shift()
        if (parts[parts.length - 1] === "") parts.pop()
        return parts
      })

      const hasSeparator = rows[1] && rows[1].every(cell => cell.startsWith("-") || cell === "")
      const headers = hasSeparator ? rows[0] : null
      const dataRows = hasSeparator ? rows.slice(2) : rows

      elements.push(
        <div key={`table-${tableKey++}`} className="overflow-x-auto my-3 border border-border/20 rounded-xl">
          <table className="min-w-full divide-y divide-border/20 text-xs font-mono text-foreground bg-[#0E1322]">
            {headers && (
              <thead className="bg-[#161D30]">
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} className="px-4 py-2 text-left font-bold border-r border-border/10 last:border-0 text-muted-foreground uppercase tracking-wider text-[9px]">
                      {parseInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-border/10">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#1A233C]/20 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-1.5 border-r border-border/10 last:border-0 leading-relaxed">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      tableLines = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined) continue
    const trimmed = line.trim()

    // 1. Divider lines
    if (trimmed === "---" || trimmed.startsWith("━━━━") || trimmed === "━━━━━━━━━━━━━━━━━━━━━━━━━━━━") {
      pushList()
      pushTable()
      elements.push(<hr key={`hr-${i}`} className="border-t border-border/15 my-3.5" />)
      continue
    }

    // 2. Callout Box (Note, Tip, Warning)
    if (trimmed.startsWith("> [!")) {
      pushList()
      pushTable()
      const typeMatch = trimmed.match(/^>\s*\[!(NOTE|WARNING|CAUTION|TIP|IMPORTANT)\]/i)
      const type = typeMatch ? typeMatch[1].toUpperCase() : "NOTE"

      let calloutText = ""
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith(">")) {
        i++
        calloutText += lines[i].trim().replace(/^>\s*/, "") + "\n"
      }

      let calloutStyle = "bg-blue-500/5 border-blue-500/20 text-blue-100"
      let calloutTitle = "🤖 Info Callout"
      if (type === "WARNING" || type === "CAUTION") {
        calloutStyle = "bg-rose-500/5 border-rose-500/20 text-rose-100"
        calloutTitle = "⚠️ Warning"
      } else if (type === "TIP" || type === "IMPORTANT") {
        calloutStyle = "bg-emerald-500/5 border-emerald-500/20 text-emerald-100"
        calloutTitle = "💡 Tip"
      }

      elements.push(
        <div key={`callout-${i}`} className={`p-4 border rounded-xl my-4 text-xs font-sans ${calloutStyle}`}>
          <div className="font-bold uppercase tracking-wider text-[9px] mb-1.5 font-mono">{calloutTitle}</div>
          <div className="leading-relaxed opacity-90">{parseInline(calloutText.trim())}</div>
        </div>
      )
      continue
    }

    // 3. Blockquotes
    if (trimmed.startsWith(">")) {
      pushList()
      pushTable()
      let blockText = trimmed.replace(/^>\s*/, "")
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith(">")) {
        i++
        blockText += "\n" + lines[i].trim().replace(/^>\s*/, "")
      }
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-2 border-primary pl-4 italic text-muted-foreground my-3 leading-relaxed">
          {parseInline(blockText)}
        </blockquote>
      )
      continue
    }

    // 4. Tables matching
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      pushList()
      tableLines.push(trimmed)
      continue
    } else {
      pushTable()
    }

    // 5. Headings hierarchy
    if (trimmed.startsWith("### ")) {
      pushList()
      elements.push(
        <h4 key={i} className="text-xs font-bold text-foreground mt-4 mb-1.5 font-mono select-none uppercase tracking-wider text-muted-foreground">
          {parseInline(trimmed.substring(4))}
        </h4>
      )
    } else if (trimmed.startsWith("## ")) {
      pushList()
      elements.push(
        <h3 key={i} className="text-sm font-bold text-foreground mt-5 mb-2 border-b border-border/10 pb-1 select-none">
          {parseInline(trimmed.substring(3))}
        </h3>
      )
    } else if (trimmed.startsWith("# ")) {
      pushList()
      elements.push(
        <h2 key={i} className="text-base font-bold text-foreground mt-6 mb-2.5 select-none">
          {parseInline(trimmed.substring(2))}
        </h2>
      )
    }
    // 6. Lists parsing
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(
        <li key={i} className="text-xs text-foreground/80 pl-1 leading-relaxed">
          {parseInline(trimmed.substring(2))}
        </li>
      )
    }
    // 7. Empty line spacer
    else if (trimmed === "") {
      pushList()
    }
    // 8. Standard paragraph
    else {
      pushList()
      elements.push(
        <p key={i} className="text-xs leading-relaxed text-foreground/80 mb-2 font-sans">
          {parseInline(trimmed)}
        </p>
      )
    }
  }

  pushList()
  pushTable()
  return elements
}

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="bg-[#111622] text-amber-300 font-mono text-[10px] px-1.5 py-0.5 rounded border border-border/10">
          {part.slice(1, -1)}
        </code>
      )
    }
    return part
  })
}
