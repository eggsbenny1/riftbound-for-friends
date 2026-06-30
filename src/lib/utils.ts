import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, resolving Tailwind conflicts sensibly
 * (e.g. cn('px-2', 'px-4') => 'px-4', not both).
 * Used throughout for conditional styling, especially active-route
 * highlighting in NavBar/BottomNav.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
