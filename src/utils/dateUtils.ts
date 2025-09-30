// West African Time utilities
export const formatDateWAT = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Lagos', // West African Time
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return dateObj.toLocaleString('en-US', defaultOptions);
};

export const formatTimeWAT = (date: string | Date) => {
  return formatDateWAT(date, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

export const formatDateOnlyWAT = (date: string | Date) => {
  return formatDateWAT(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};