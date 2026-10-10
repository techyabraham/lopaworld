import type { Access } from 'payload';

export const authenticatedWrite: Access = ({ req }) => Boolean(req.user);

export const publishedRead: Access = ({ req }) => req.user
  ? true
  : { _status: { equals: 'published' } };
