// Canonical category taxonomy for Training Image Library entries. Kept in
// one place so every place that assigns or filters a library image's type -
// the library's own filter dropdown and the interactive tactical board's
// save dialog - agrees on the same set of values, keeping the library
// uniform regardless of where an image came from.
export const TRAINING_IMAGE_TYPES = [
  { value: 'formation', label: 'Formation' },
  { value: 'drill', label: 'Drill' },
  { value: 'tactical', label: 'Tactical' },
  { value: 'set_piece', label: 'Set Piece' },
  { value: 'gk_training', label: 'GK Training' },
  { value: 'fitness', label: 'Fitness' },
] as const;

export type TrainingImageType = typeof TRAINING_IMAGE_TYPES[number]['value'];
