"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Highlighter,
  Terminal
} from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';
import EditorInputModal from './EditorInputModal';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ToolbarButton = ({ 
  onClick, 
  active = false, 
  disabled = false, 
  children, 
  title 
}: { 
  onClick: () => void; 
  active?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${
      active 
        ? 'bg-accent text-on-accent shadow-lg shadow-accent/20' 
        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
    } disabled:opacity-30 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
);

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Use CodeBlockLowlight instead
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-accent hover:underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full border border-white/10',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-6 lesson-content',
      },
    },
  });

  // Synchronize editor content when external content changes (e.g. from AI)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'link' | 'image';
    title: string;
    placeholder: string;
    initialValue: string;
  }>({
    isOpen: false,
    type: 'link',
    title: '',
    placeholder: '',
    initialValue: '',
  });

  const handleOpenModal = (type: 'link' | 'image') => {
    if (type === 'link') {
      const previousUrl = editor?.getAttributes('link').href;
      setModalConfig({
        isOpen: true,
        type: 'link',
        title: 'Add Link',
        placeholder: 'https://example.com',
        initialValue: previousUrl || '',
      });
    } else {
      setModalConfig({
        isOpen: true,
        type: 'image',
        title: 'Add Image',
        placeholder: 'https://example.com/image.png',
        initialValue: '',
      });
    }
  };

  const handleModalConfirm = (value: string) => {
    if (modalConfig.type === 'link') {
      if (value === '') {
        editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor?.chain().focus().extendMarkRange('link').setLink({ href: value }).run();
      }
    } else if (modalConfig.type === 'image' && value) {
      editor?.chain().focus().setImage({ src: value }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col border border-white/5 rounded-2xl overflow-hidden bg-bg-surface/30 backdrop-blur-sm transition-all duration-300 hover:border-white/10">
      <EditorInputModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleModalConfirm}
        type={modalConfig.type}
        title={modalConfig.title}
        placeholder={modalConfig.placeholder}
        initialValue={modalConfig.initialValue}
      />
      {/* Toolbar */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-1 p-2 border-b border-white/5 bg-white/[0.02] backdrop-blur-md sticky top-0 z-10 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-white/5 shrink-0">
          <ToolbarButton
            title="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-white/5 shrink-0">
          <ToolbarButton
            title="Heading 1"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-white/5 shrink-0">
          <ToolbarButton
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Highlight"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-white/5 shrink-0">
          <ToolbarButton
            title="Align Left"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align Center"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Align Right"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 pr-2 mr-2 border-r border-white/5 shrink-0">
          <ToolbarButton
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Ordered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ToolbarButton
            title="Code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Code Block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
          >
            <Terminal className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Link"
            onClick={() => handleOpenModal('link')}
            active={editor.isActive('link')}
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Image"
            onClick={() => handleOpenModal('image')}
          >
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto bg-transparent min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror {
          min-height: 500px;
        }
        .ProseMirror h1 {
          font-size: 1.8em !important;
          margin-top: 1rem !important;
          margin-bottom: 1rem !important;
          border-bottom: 1px solid var(--border-strong);
          padding-bottom: 0.3em;
        }
        .ProseMirror h2 {
          font-size: 1.5em !important;
          margin-top: 0.8rem !important;
          margin-bottom: 0.8rem !important;
        }
        .ProseMirror h3 {
          font-size: 1.2em !important;
          margin-top: 0.6rem !important;
          margin-bottom: 0.6rem !important;
        }
        /* Custom styles for Code Block in Editor */
        .ProseMirror pre {
          background: #1e1e1e;
          border-radius: 0.5rem;
          color: #fff;
          font-family: 'JetBrainsMono', monospace;
          padding: 0.75rem 1rem;
        }
        .ProseMirror code {
          background: none;
          color: inherit;
          font-size: 0.8rem;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
