import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { Input } from '../Input';
import { Button } from '../Button';
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

const LINK_PATH = (
  <>
    <path d="M10 13a5 5 0 0 0 7.07 0l1.93-1.93a5 5 0 0 0-7.07-7.07l-1.1 1.1" />
    <path d="M14 11a5 5 0 0 0-7.07 0L5 12.93a5 5 0 0 0 7.07 7.07l1.1-1.1" />
  </>
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
  link: icon(LINK_PATH),
  unlink: icon(
    <>
      {LINK_PATH}
      <line x1="3" y1="3" x2="21" y2="21" />
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

type Command = { key: keyof typeof ICONS; title: string; divider?: boolean; disabled?: boolean; onClick: () => void };

// ponytail: document.execCommand — deprecated but works in every current browser for
// this small command set. Swap for TipTap if we ever need tables/mentions/collab.
function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

/** Walks up from `node` to find an enclosing `<a>`, stopping at `root`. */
function closestLink(node: Node | null, root: HTMLElement): HTMLAnchorElement | null {
  let n = node;
  while (n && n !== root) {
    if (n instanceof HTMLAnchorElement) return n;
    n = n.parentNode;
  }
  return null;
}

export function RichTextEditor({ value, onChange, placeholder, ariaLabel }: RichTextEditorProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  // Uncontrolled: seed once, then let the browser own the DOM. Callers remount (key=) to reset.
  const initial = useRef(value);
  const savedRange = useRef<Range | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  // Drives the Link/Unlink disabled split below — recomputed on every selection change.
  const [inLink, setInLink] = useState(false);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      const sel = window.getSelection();
      if (!el || !sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
        setInLink(false);
        return;
      }
      setInLink(!!closestLink(sel.anchorNode, el));
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, []);

  const emit = () => onChange(sanitizeHtml(ref.current?.innerHTML ?? ''));

  // Only reachable while the cursor isn't already inside a link (the Link button is disabled
  // otherwise), so this always creates a new link rather than editing one.
  const openLinkModal = () => {
    const el = ref.current;
    if (!el) return;
    if (!el.contains(document.activeElement)) el.focus();
    const sel = window.getSelection();
    savedRange.current =
      sel && sel.rangeCount > 0 && el.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : null;
    setLinkUrl('');
    setLinkModalOpen(true);
  };

  const confirmLink = (url: string) => {
    setLinkModalOpen(false);
    const range = savedRange.current;
    if (!range) return;
    // The link dialog is still modal (browsers block focusing anything outside an open <dialog>)
    // until its close() effect commits — defer the restore until after that happens.
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      exec('createLink', url);
      emit();
    }, 0);
  };

  const unlink = () => {
    const el = ref.current;
    const sel = window.getSelection();
    const link = el && sel ? closestLink(sel.anchorNode, el) : null;
    if (!link) return;
    const parent = link.parentNode;
    while (link.firstChild) parent?.insertBefore(link.firstChild, link);
    parent?.removeChild(link);
  };

  const commands: Command[] = [
    { key: 'bold', title: t('richText.bold'), onClick: () => run(() => exec('bold')) },
    { key: 'italic', title: t('richText.italic'), onClick: () => run(() => exec('italic')) },
    { key: 'underline', title: t('richText.underline'), onClick: () => run(() => exec('underline')) },
    {
      key: 'bulletList',
      title: t('richText.bulletList'),
      divider: true,
      onClick: () => run(() => exec('insertUnorderedList')),
    },
    { key: 'orderedList', title: t('richText.orderedList'), onClick: () => run(() => exec('insertOrderedList')) },
    { key: 'link', title: t('richText.link'), divider: true, disabled: inLink, onClick: openLinkModal },
    { key: 'unlink', title: t('richText.unlink'), disabled: !inLink, onClick: () => run(unlink) },
  ];

  function run(action: () => void) {
    ref.current?.focus();
    action();
    emit();
  }

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
              disabled={c.disabled}
              // Keep the editor selection while clicking the toolbar.
              onMouseDown={(e) => e.preventDefault()}
              onClick={c.onClick}
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
      <LinkModal
        open={linkModalOpen}
        url={linkUrl}
        onUrlChange={setLinkUrl}
        onCancel={() => setLinkModalOpen(false)}
        onSubmit={confirmLink}
      />
    </div>
  );
}

interface LinkModalProps {
  open: boolean;
  url: string;
  onUrlChange: (url: string) => void;
  onCancel: () => void;
  onSubmit: (url: string) => void;
}

function LinkModal({ open, url, onUrlChange, onCancel, onSubmit }: LinkModalProps) {
  const { t } = useTranslation();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) onSubmit(trimmed);
  };

  return (
    <Modal open={open} onClose={onCancel} closeLabel={t('richText.linkCancel')} title={t('richText.linkModalTitle')}>
      <form className={styles.linkForm} onSubmit={submit}>
        <Input
          autoFocus
          type="url"
          placeholder={t('richText.linkPlaceholder')}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
        />
        <div className={styles.linkFooter}>
          <Button type="submit" variant="primary" disabled={!url.trim()}>
            {t('richText.linkApply')}
          </Button>
          <button type="button" className={styles.linkCancel} onClick={onCancel}>
            {t('richText.linkCancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
