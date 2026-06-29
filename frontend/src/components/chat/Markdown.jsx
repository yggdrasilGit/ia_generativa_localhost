import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import CodeBlock from './CodeBlock'

export default function Markdown({ content }) {
    return (
        <div className="prose">
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline ? (
                            <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                        ) : (
                            <code className={className} {...props}>{children}</code>
                        )
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
