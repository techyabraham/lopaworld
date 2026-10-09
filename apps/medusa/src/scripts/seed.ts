/** Demo seed data belongs here only. Keep out of production workflows. */
export default async function seedDemoData(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seed data cannot be loaded in production.');
  }
}
