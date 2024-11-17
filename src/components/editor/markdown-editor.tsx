"use client";

import { BlockTypeSelect, BoldItalicUnderlineToggles, DiffSourceToggleWrapper, MDXEditor, MDXEditorMethods, MDXEditorProps, UndoRedo, codeBlockPlugin, codeMirrorPlugin, diffSourcePlugin, directivesPlugin, frontmatterPlugin, headingsPlugin, imagePlugin, jsxPlugin, linkDialogPlugin, linkPlugin, listsPlugin, markdownShortcutPlugin, quotePlugin, realmPlugin, tablePlugin, thematicBreakPlugin, toolbarPlugin } from "@mdxeditor/editor";
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
    const { markdown, editorRef, readOnly, ...extra } = props;
    const allPlugins = [
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        linkPlugin(),
        imagePlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'python' }),
        linkDialogPlugin(),
        frontmatterPlugin(),
        directivesPlugin(),
        diffSourcePlugin(),
        jsxPlugin(),
        tablePlugin(),
        toolbarPlugin({
            toolbarContents: () => (
                <>
                    {' '}
                    <BlockTypeSelect />
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <DiffSourceToggleWrapper />
                </>
            )
        }),
        codeMirrorPlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin()
    ];
    const readOnlyPlugins = [
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        linkPlugin(),
        imagePlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'python' }),
        linkDialogPlugin(),
        frontmatterPlugin(),
        directivesPlugin(),
        diffSourcePlugin(),
        jsxPlugin(),
        tablePlugin(),
        codeMirrorPlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
    ];
    return (
        <MDXEditor
            // onChange={(e) => console.log(e)}
            ref={editorRef}
            markdown={markdown}
            plugins={readOnly ? readOnlyPlugins : allPlugins}
            readOnly={readOnly}
            {...extra}
        />
    );
};

export default Editor;
