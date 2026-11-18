export function medicationReferenceIds(currentIds: string[], reviewIds: string[], enteredIds: string[]) {
  // Dose and safety views must use the same explicitly displayed/entered drugs.
  return [...new Set([...currentIds, ...reviewIds, ...enteredIds])];
}
