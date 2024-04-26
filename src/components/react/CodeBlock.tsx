import { CopyBlock as ReactCopyBlock, tomorrow } from 'react-code-blocks';

import styles from './CodeBlock.module.css';

export default function CodeBlock({ children, sourceOnly, ...props }: React.PropsWithChildren<any>) {
    return (
        <div className={styles.wrapper}>
            {!sourceOnly && (
                <>
                    <h4>Example</h4>
                    <div className={styles.demo}>{children}</div>
                </>
            )}
            <h4>Source</h4>
            <ReactCopyBlock showLineNumbers={false} theme={tomorrow} codeBlock={true} {...props} />
        </div>
    );
}
