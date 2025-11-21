import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatRelativeTime(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: ko,
    });
  } catch (error) {
    return '';
  }
}
