import React from 'react';

import Editor from '@monaco-editor/react';

import styles from './CodeBlock.module.css';

export default function CodeBlock({ children, sourceOnly, code }: React.PropsWithChildren<any>) {
    const [editorHeight, setEditorHeight] = React.useState(0);
    return (
        <div className={styles.wrapper}>
            {!sourceOnly && (
                <>
                    <h4>Example</h4>
                    <div className={styles.demo}>{children}</div>
                </>
            )}
            <h4>Source</h4>
            <Editor
                height={editorHeight}
                defaultLanguage="typescript"
                defaultValue={code}
                options={{
                    minimap: {
                        enabled: false
                    },
                    scrollbar: {
                        vertical: 'hidden',
                        handleMouseWheel: false
                    },
                    scrollBeyondLastLine: false
                }}
                onMount={(editor, monaco) => {
                    const scrollHeight = editor.getScrollHeight();
                    setEditorHeight(scrollHeight);
                    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                        noSemanticValidation: true,
                        noSyntaxValidation: true
                    });
                }}
            />
        </div>
    );
}
