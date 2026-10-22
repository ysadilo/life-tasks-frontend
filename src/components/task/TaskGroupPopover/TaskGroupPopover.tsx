import { useTranslation } from 'react-i18next';
import { GROUP_OPTIONS, type GroupBy } from '../../../lib/taskGrouping';
import { OptionPopover } from '../OptionPopover';

interface TaskGroupPopoverProps {
  groupBy: GroupBy;
  onChange: (groupBy: GroupBy) => void;
  onClose: () => void;
}

export function TaskGroupPopover({ groupBy, onChange, onClose }: TaskGroupPopoverProps) {
  const { t } = useTranslation();
  const options = GROUP_OPTIONS.map((value) => ({
    value,
    label: t(`backlog.group.${value}`),
    description: t(`backlog.group.${value}Description`),
  }));
  return (
    <OptionPopover
      options={options}
      value={groupBy}
      onChange={onChange}
      onClose={onClose}
      ariaLabel={t('backlog.group.title')}
    />
  );
}
