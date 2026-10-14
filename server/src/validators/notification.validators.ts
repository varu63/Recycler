import { boolish, createListQuery } from './common.js';

export const notificationListQuerySchema = createListQuery({
  unread: boolish.optional(),
});
