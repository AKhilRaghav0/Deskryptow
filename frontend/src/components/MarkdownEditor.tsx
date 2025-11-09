import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your description in Markdown...',
  rows = 10,
  className = '',
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-3 bg-[#EEEEEE] rounded-xl border-2 border-[#1D1616]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#1D1616]">Markdown Editor</span>
          <span className="text-xs text-[#8E1616]">Supports: **bold**, *italic*, lists, links, code blocks</span>
        </div>
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#1D1616] bg-white hover:bg-[#EEEEEE] transition-all border-2 border-[#1D1616] hover:border-[#D84040]"
        >
          {isPreview ? (
            <>
              <PencilIcon className="h-4 w-4" />
              Edit
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4" />
              Preview
            </>
          )}
        </button>
      </div>

      {/* Editor/Preview */}
      {isPreview ? (
        <div className="min-h-[200px] max-h-[600px] p-6 border-2 border-[#1D1616] rounded-2xl bg-white overflow-y-auto scrollbar-hide">
          <div className="prose prose-sm max-w-none text-[#1D1616]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-[#1D1616] mb-4 mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-bold text-[#1D1616] mb-3 mt-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-bold text-[#1D1616] mb-2 mt-4">{children}</h3>,
                h4: ({ children }) => <h4 className="text-lg font-bold text-[#1D1616] mb-2 mt-3">{children}</h4>,
                p: ({ children }) => <p className="text-[#1D1616] mb-4 leading-relaxed text-base">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-4 text-[#1D1616] space-y-2 ml-6">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-4 text-[#1D1616] space-y-2 ml-6">{children}</ol>,
                li: ({ children }) => <li className="text-[#1D1616] leading-relaxed">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className || !className.includes('language-')
                  if (isInline) {
                    return (
                      <code className="px-2 py-1 bg-[#EEEEEE] rounded text-[#D84040] font-mono text-sm border border-[#1D1616]">
                        {String(children).replace(/\n$/, '')}
                      </code>
                    )
                  }
                  return (
                    <pre className="block p-4 bg-[#EEEEEE] rounded-xl text-[#1D1616] font-mono text-sm border-2 border-[#1D1616] overflow-x-auto mb-4">
                      <code className="text-[#1D1616]">{String(children).replace(/\n$/, '')}</code>
                    </pre>
                  )
                },
                pre: ({ children }) => {
                  // If code block is already wrapped, just return it
                  if (children && typeof children === 'object' && 'props' in children && children.props.className?.includes('language-')) {
                    return <>{children}</>
                  }
                  return (
                    <pre className="block p-4 bg-[#EEEEEE] rounded-xl text-[#1D1616] font-mono text-sm border-2 border-[#1D1616] overflow-x-auto mb-4">
                      {children}
                    </pre>
                  )
                },
                a: ({ children, href }) => (
                  <a 
                    href={href} 
                    className="text-[#D84040] hover:text-[#8E1616] underline font-semibold" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="font-bold text-[#1D1616]">{children}</strong>,
                em: ({ children }) => <em className="italic text-[#1D1616]">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-[#D84040] pl-4 my-4 italic text-[#1D1616] bg-[#EEEEEE] py-2 rounded-r-xl">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-6 border-[#1D1616] border-t-2" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-2 border-[#1D1616]">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => <thead className="bg-[#1D1616] text-white">{children}</thead>,
                tbody: ({ children }) => <tbody className="bg-white">{children}</tbody>,
                tr: ({ children }) => <tr className="border-b border-[#1D1616]">{children}</tr>,
                th: ({ children }) => <th className="px-4 py-2 text-left font-bold">{children}</th>,
                td: ({ children }) => <td className="px-4 py-2 text-[#1D1616]">{children}</td>,
              }}
            >
              {value || '*No content yet. Start typing to see preview.*'}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="block w-full px-6 py-4 border-2 border-[#1D1616] rounded-2xl bg-[#EEEEEE] focus:outline-none focus:ring-2 focus:ring-[#D84040] focus:border-transparent text-[#1D1616] resize-none font-mono text-base"
        />
      )}

      {/* Markdown Help */}
      {!isPreview && (
        <div className="mt-3 p-4 bg-[#EEEEEE] rounded-xl border border-[#1D1616]">
          <p className="text-xs font-semibold text-[#1D1616] mb-2">Markdown Tips:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#1D1616] font-mono">
            <div><strong>**bold**</strong> → <strong>bold</strong></div>
            <div><em>*italic*</em> → <em>italic</em></div>
            <div><code>`code`</code> → <code>code</code></div>
            <div>- list → • list</div>
          </div>
        </div>
      )}
    </div>
  )
}

