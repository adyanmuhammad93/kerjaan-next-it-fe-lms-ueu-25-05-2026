import React, { useState, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill';
import { cn } from '../../lib/utils';
import { FileCode, FileText, Image as ImageIcon } from 'lucide-react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { AssetSelectorModal } from '../AssetSelectorModal';

interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    ['link', 'image', 'video'],
    ['formula'],
    ['clean']
  ],
};

const readOnlyModules = {
  toolbar: false
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, readOnly = false, className, style }) => {
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [markdownValue, setMarkdownValue] = useState('');
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  const customModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        ['link', 'image', 'video'],
        ['formula'],
        ['clean']
      ],
      handlers: {
        image: function (this: any) {
          setIsAssetModalOpen(true);
        }
      }
    }
  }), []);

  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    // Custom rule to preserve formulas (basic attempt)
    service.addRule('formula', {
      filter: function (node) {
        return node.nodeName === 'SPAN' && node.classList.contains('ql-formula');
      },
      replacement: function (content, node) {
        const val = (node as Element).getAttribute('data-value');
        return val ? `$${val}$` : '';
      }
    });
    return service;
  }, []);

  const toggleMarkdownMode = () => {
    if (isMarkdownMode) {
      // Switching FROM Markdown TO Rich Text
      // Convert Markdown -> HTML
      try {
        const html = marked.parse(markdownValue);
        // marked returns a promise in some configs, but standard is string or promise depending on async.
        // For version 12 with default, it can be sync. Let's handle string result.
        if (typeof html === 'string' && onChange) {
          onChange(html);
        } else if (html instanceof Promise) {
          html.then(res => onChange && onChange(res));
        }
      } catch (e) {
        console.error("Markdown conversion failed", e);
      }
      setIsMarkdownMode(false);
    } else {
      // Switching FROM Rich Text TO Markdown
      // Convert HTML -> Markdown
      const md = turndownService.turndown(value || '');
      setMarkdownValue(md);
      setIsMarkdownMode(true);
    }
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setMarkdownValue(newVal);

    // Update parent with HTML equivalent in real-time or debounce? 
    // To keep it synced, let's update parent immediately.
    try {
      const html = marked.parse(newVal);
      if (typeof html === 'string' && onChange) {
        onChange(html);
      } else if (html instanceof Promise) {
        html.then(res => onChange && onChange(res));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={cn(`rich-text-editor relative ${readOnly ? 'read-only' : ''}`, className)} style={style}>
      {!readOnly && (
        <button
          type="button"
          onClick={toggleMarkdownMode}
          className="absolute top-[-36px] right-0 z-10 p-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-slate-100 rounded-t-md border border-b-0 border-slate-200 flex items-center gap-1.5 transition-colors"
          title={isMarkdownMode ? "Switch to Visual Editor" : "Switch to Markdown Editor"}
        >
          {isMarkdownMode ? <FileText className="h-3 w-3" /> : <FileCode className="h-3 w-3" />}
          {isMarkdownMode ? "Visual" : "Markdown"}
        </button>
      )}

      {isMarkdownMode && !readOnly ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAssetModalOpen(true)}
            className="absolute top-2 right-2 p-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 bg-white rounded border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors z-10"
            title="Insert Image from Assets"
          >
            <ImageIcon className="h-3 w-3" /> Image
          </button>
          <textarea
            value={markdownValue}
            onChange={handleMarkdownChange}
            placeholder="Type your markdown here..."
            className="w-full min-h-[150px] p-4 font-mono text-sm bg-slate-50 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            style={{ height: 'auto', minHeight: '200px' }}
          />
        </div>
      ) : (
        <ReactQuill
          ref={quillRef}
          theme={readOnly ? "bubble" : "snow"}
          value={value || ''}
          onChange={onChange}
          modules={readOnly ? readOnlyModules : customModules}
          readOnly={readOnly}
          placeholder={placeholder}
          className={readOnly ? "border-0" : "bg-white rounded-md"}
        />
      )}

      <AssetSelectorModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSelect={(asset) => {
          if (isMarkdownMode) {
            // Insert markdown image tag
            const imageTag = `![${asset.name}](${asset.fileUrl})`;
            const newVal = markdownValue + '\n' + imageTag;
            setMarkdownValue(newVal);

            // Update HTML
            try {
              const html = marked.parse(newVal);
              if (typeof html === 'string' && onChange) {
                onChange(html);
              } else if (html instanceof Promise) {
                html.then(res => onChange && onChange(res));
              }
            } catch (e) {
              console.error(e);
            }
          } else {
            // Insert image in Quill
            const quill = quillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', asset.fileUrl);
              quill.setSelection(range.index + 1, 0);
            }
          }
          setIsAssetModalOpen(false);
        }}
      />
    </div>
  );
};