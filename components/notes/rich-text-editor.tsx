"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { 
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, 
  List, ListOrdered, Quote, Undo, Redo, Highlighter, Image as ImageIcon,
  Table as TableIcon
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onOpenDrawing: () => void;
  editorRef?: React.MutableRefObject<any>;
}

export function RichTextEditor({ content, onChange, onOpenDrawing, editorRef }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] text-[var(--ui-text)] dark:prose-invert max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // External content sync removed to fix typing cursor jumps and freezes.

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive = false, disabled = false, icon: Icon, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
        isActive 
          ? "bg-teal-500/20 text-teal-500" 
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--ui-border)", background: "var(--ui-surface-2)" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--ui-border)", background: "var(--ui-bg)" }}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} icon={Bold} title="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} icon={Italic} title="Italic" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} icon={Strikethrough} title="Strikethrough" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} icon={Code} title="Code" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffc078' }).run()} isActive={editor.isActive("highlight")} icon={Highlighter} title="Highlight" />
        
        <div className="h-5 w-px bg-gray-700 mx-1 flex-shrink-0" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} icon={Heading1} title="Heading 1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} icon={Heading2} title="Heading 2" />
        
        <div className="h-5 w-px bg-gray-700 mx-1 flex-shrink-0" />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} icon={ListOrdered} title="Ordered List" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} icon={Quote} title="Blockquote" />
        
        <div className="h-5 w-px bg-gray-700 mx-1 flex-shrink-0" />
        
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} icon={TableIcon} title="Insert Table" />
        <ToolbarButton onClick={onOpenDrawing} icon={ImageIcon} title="Insert Drawing/Image" />
        
        <div className="h-5 w-px bg-gray-700 mx-1 flex-shrink-0" />
        
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} title="Undo" />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} title="Redo" />
      </div>

      {/* Editor Content */}
      <div className="p-4 bg-white dark:bg-[#1a181a] max-h-[60vh] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
