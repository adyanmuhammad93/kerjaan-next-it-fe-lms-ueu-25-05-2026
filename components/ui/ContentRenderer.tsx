import React, { useMemo } from 'react';
import { marked } from 'marked';
import { cn } from '../../lib/utils';

interface ContentRendererProps {
    content: string;
    className?: string;
}

/**
 * Smart content renderer that supports both HTML and Markdown.
 * - If content starts with an HTML tag, renders it as raw HTML.
 * - Otherwise, parses it as Markdown first, then renders as HTML.
 */
export const ContentRenderer: React.FC<ContentRendererProps> = ({ content, className }) => {
    const html = useMemo(() => {
        if (!content) return '';

        const trimmed = content.trim();

        // If the content looks like HTML (starts with a tag), render it directly
        if (trimmed.startsWith('<')) {
            return trimmed;
        }

        // Otherwise parse as Markdown
        const result = marked.parse(trimmed);
        return typeof result === 'string' ? result : '';
    }, [content]);

    return (
        <div
            className={cn(
                'prose prose-slate prose-lg max-w-none',
                // Ensure prose styles apply to common HTML elements
                'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
                'prose-p:leading-relaxed prose-li:leading-relaxed',
                'prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
                'prose-pre:bg-slate-900 prose-pre:text-slate-100',
                'prose-blockquote:border-l-indigo-400 prose-blockquote:bg-indigo-50/50 prose-blockquote:rounded-r',
                className
            )}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};
