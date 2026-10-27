export type Recurrence = 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

/** Unit of a `custom` recurrence ("every N days / weeks / months"). */
export type RecurrenceUnit = 'day' | 'week' | 'month';
