'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Link as LinkIcon, Heading1, Heading2, Heading3,
  Undo, Redo, Code, Quote,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { uploadFile } from '@/lib/admin/api'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none',
      },
    },
  })

  if (!editor) return null

  const fileInputRef = useRef<HTMLInputElement>(null)

  const addImage = async () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadFile(file)
      editor.chain().focus().setImage({ src: result.url }).run()
    } catch (err) {
      console.error('Image upload failed', err)
      // Optionally show a toast/error
    } finally {
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (!editor) return
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      let file: File | null = null
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          file = items[i].getAsFile()
          break
        }
      }
      if (file) {
        e.preventDefault() // prevent default paste (text)
        ;(async () => {
          try {
            const result = await uploadFile(file)
            editor.chain().focus().setImage({ src: result.url }).run()
          } catch (err) {
            console.error('Image upload from paste failed', err)
          }
        })()
      }
    }
    const dom = editor.view?.dom as HTMLElement | null
    if (dom) {
      dom.addEventListener('paste', handlePaste as EventListener)
      return () => {
        dom.removeEventListener('paste', handlePaste as EventListener)
      }
    }
  }, [editor])

  const addLink = () => {
    const url = window.prompt('Link URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const ToolButton = ({ onClick, active, disabled, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded text-xs transition-colors ${
        active
          ? 'bg-[#0b3c5d] text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#0b3c5d] focus-within:border-[#0b3c5d]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        {/* Text formatting */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <Code className="size-3.5" />
        </ToolButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Headings */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="size-3.5" />
        </ToolButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Lists */}
        <ToolButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="size-3.5" />
        </ToolButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Alignment */}
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="size-3.5" />
        </ToolButton>
        <ToolButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="size-3.5" />
        </ToolButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Media */}
        <ToolButton onClick={addImage} title="Insert Image">
          <ImageIcon className="size-3.5" />
        </ToolButton>
        <ToolButton onClick={addLink} active={editor.isActive('link')} title="Insert Link">
          <LinkIcon className="size-3.5" />
        </ToolButton>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <ToolButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="size-3.5" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="size-3.5" />
        </ToolButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="bg-white min-h-[200px] max-h-[500px] overflow-y-auto" />
      
      {/* Hidden file input for image upload */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />
    </div>
  )
}