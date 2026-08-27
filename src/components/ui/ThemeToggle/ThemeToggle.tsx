import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isGlamour = theme === 'glamour';
  const nextTheme = t(isGlamour ? 'theme.powder' : 'theme.glamour');
  const switchLabel = t('sidebar.switchTheme', { theme: nextTheme });

  return (
    <button type="button" className={styles.toggle} onClick={toggleTheme} aria-label={switchLabel} title={switchLabel}>
      <span className={styles.icon}>{isGlamour ? '✦' : '☾'}</span>
      <span>{t(isGlamour ? 'theme.glamour' : 'theme.powder')}</span>
    </button>
  );
}
