/**
 * The display choices offered when booking (Customize step) and when an
 * agency edits an order's display.
 */
export interface EventMessageConfig {
  message: string;
  supportsNumber: boolean;
  numberLabel?: string;
  numberPlaceholder?: string;
  numberType?: 'age' | 'year' | 'milestone' | 'general';
}

export const eventMessages: EventMessageConfig[] = [
  {
    message: 'Happy Birthday',
    supportsNumber: true,
    numberLabel: 'Age',
    numberPlaceholder: 'e.g., 25 for 25th birthday',
    numberType: 'age'
  },
  {
    message: 'Happy Anniversary',
    supportsNumber: true,
    numberLabel: 'Anniversary Year',
    numberPlaceholder: 'e.g., 25 for 25th anniversary',
    numberType: 'milestone'
  },
  {
    message: 'Graduation',
    supportsNumber: true,
    numberLabel: 'Graduation Year',
    numberPlaceholder: 'e.g., 2024',
    numberType: 'year'
  },
  {
    message: 'Congratulations',
    supportsNumber: true,
    numberLabel: 'Year/Number (Optional)',
    numberPlaceholder: 'e.g., 2024 or milestone number',
    numberType: 'general'
  },
  {
    message: 'Welcome Home',
    supportsNumber: false
  },
  {
    message: 'Get Well Soon',
    supportsNumber: false
  },
  {
    message: 'Custom Message',
    supportsNumber: true,
    numberLabel: 'Number (Optional)',
    numberPlaceholder: 'Enter any number if applicable',
    numberType: 'general'
  }
];

export const themes = [
  'Classic',
  'Colorful',
  'Sports',
  'Princess',
  'Superhero',
  'Animals',
  'Holiday'
];

export const hobbies = [
  'Soccer',
  'Basketball',
  'Baseball',
  'Dance',
  'Music',
  'Art',
  'Reading',
  'Gaming'
];
