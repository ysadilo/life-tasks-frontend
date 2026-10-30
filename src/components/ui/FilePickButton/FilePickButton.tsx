import { useRef, type ReactNode } from 'react';
import { Button } from '../Button';

interface FilePickButtonProps {
  children: ReactNode;
  accept?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
}

/** A button that opens the file picker and hands back the chosen file. */
export function FilePickButton({ children, accept = 'image/*', disabled, onFile }: FilePickButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button type="button" disabled={disabled} onClick={() => input.current?.click()}>
        {children}
      </Button>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
    </>
  );
}
