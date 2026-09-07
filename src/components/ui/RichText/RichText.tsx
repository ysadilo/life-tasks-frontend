import { useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '../../../lib/richText';
import styles from './RichText.module.css';

interface RichTextProps {
  html: string;
  className?: string;
  style?: CSSProperties;
}

/** Renders stored task-description HTML. Sanitizes on every render — the field also comes from the API. */
export function RichText({ html, className, style }: RichTextProps) {
  return (
    <div
      className={[styles.rendered, className].filter(Boolean).join(' ')}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

type Command = { key: string; label: string; run: () => void };

// ponytail: document.execCommand — deprecated but works in every current browser for
// this small command set. Swap for TipTap if we ever need tables/mentions/collab.
function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function RichTextEditor({ value, onChange, placeholder, ariaLabel }: RichTextEditorProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  // Uncontrolled: seed once, then let the browser own the DOM. Callers remount (key=) to reset.
  const initial = useRef(value);

  const emit = () => onChange(sanitizeHtml(ref.current?.innerHTML ?? ''));

  const commands: Command[] = [
    { key: 'bold', label: t('richText.bold'), run: () => exec('bold') },
    { key: 'italic', label: t('richText.italic'), run: () => exec('italic') },
    { key: 'bulletList', label: t('richText.bulletList'), run: () => exec('insertUnorderedList') },
    {
      key: 'link',
      label: t('richText.link'),
      run: () => {
        const url = window.prompt(t('richText.linkPrompt'));
        if (url) exec('createLink', url);
      },
    },
  ];

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        {commands.map((c) => (
          <button
            key={c.key}
            type="button"
            className={styles.toolBtn}
            // Keep the editor selection while clicking the toolbar.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              ref.current?.focus();
              c.run();
              emit();
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        className={styles.surface}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(initial.current) }}
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
