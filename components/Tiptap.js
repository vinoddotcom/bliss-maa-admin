"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TypographyExtension from "@tiptap/extension-typography";
import UnderlineExtension from "@tiptap/extension-underline";
// import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Dropcursor from "@tiptap/extension-dropcursor";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import Code from "@tiptap/extension-code";
import TextAlign from "@tiptap/extension-text-align";
import Focus from "@tiptap/extension-focus";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import MenuBar from "./MenuBar";

const Tiptap = ({ content, onContentChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Subscript,
      Superscript,
      Highlight,
      TypographyExtension,
      UnderlineExtension,
      Document,
      Paragraph,
      Text,
      Dropcursor,
      Code,
      Link,
      CharacterCount,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Focus.configure({
        className: "has-focus",
        mode: "all",
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const data = editor.getHTML();
      onContentChange(data);
    },
  });

  return (
    <div>
      {editor && <MenuBar editor={editor} />}
      <EditorContent className="border border-gray-300" editor={editor} />
    </div>
  );
};

export default Tiptap;
