"use client";

import { MDXEditor, MDXEditorMethods, MDXEditorProps, headingsPlugin } from "@mdxeditor/editor";
import { FC } from "react";

interface EditorProps extends MDXEditorProps {
    markdown: string;
    editorRef?: React.MutableRefObject<MDXEditorMethods | null>;
}

/**
 * Extend this Component further with the necessary plugins or props you need.
 * proxying the ref is necessary. Next.js dynamically imported components don't support refs.
 */
const Editor: FC<EditorProps> = (props: EditorProps) => {
    const { markdown, editorRef, ...extra } = props;
    return (
        <MDXEditor
            onChange={(e) => console.log(e)}
            ref={editorRef}
            markdown={markdown}
            plugins={[headingsPlugin()]}
            {...extra}
        />
    );
};

export default Editor;
