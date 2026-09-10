import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeHtml } from '../../../lib/richText';
import styles from './RichText.module.css';

const icon = (path: ReactNode) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const ICONS = {
  bold: <b className={styles.glyph}>B</b>,
  italic: <i className={styles.glyph}>I</i>,
  underline: <u className={styles.glyph}>U</u>,
  bulletList: icon(
    <>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
      <circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  orderedList: icon(
    <>
      <line x1="10" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
      <text x="2" y="9" fontSize="8" fill="currentColor" stroke="none">
        1
      </text>
      <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">
        2
      </text>
    </>
  ),
  link: icon(
    <>
      <path d="M10 13a5 5 0 0 0 7.07 0l1.93-1.93a5 5 0 0 0-7.07-7.07l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5 12.93a5 5 0 0 0 7.07 7.07l1.1-1.1" />
    </>
  ),
} as const;

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

type Command = { key: keyof typeof ICONS; title: string; divider?: boolean; run: () => void };

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
    { key: 'bold', title: t('richText.bold'), run: () => exec('bold') },
    { key: 'italic', title: t('richText.italic'), run: () => exec('italic') },
    { key: 'underline', title: t('richText.underline'), run: () => exec('underline') },
    { key: 'bulletList', title: t('richText.bulletList'), divider: true, run: () => exec('insertUnorderedList') },
    { key: 'orderedList', title: t('richText.orderedList'), run: () => exec('insertOrderedList') },
    {
      key: 'link',
      title: t('richText.link'),
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
          <span key={c.key} className={styles.toolItem}>
            {c.divider && <span className={styles.divider} aria-hidden="true" />}
            <button
              type="button"
              className={styles.toolBtn}
              title={c.title}
              aria-label={c.title}
              // Keep the editor selection while clicking the toolbar.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                ref.current?.focus();
                c.run();
                emit();
              }}
            >
              {ICONS[c.key]}
            </button>
          </span>
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
