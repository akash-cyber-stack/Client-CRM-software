/** Hard caps — protect DB & serverless under many companies at once */

export const MAX_PAGE_SIZE = 100;
export const MAX_LIST_LEADS = 5000;
export const MAX_IMPORT_LEADS = 500;
export const MAX_IMPORT_EMPLOYEES = 200;
export const MAX_BULK_DELETE = 100;
export const MAX_LEADS_FOR_PHONE_SCAN = 25000;

export const REQUEST_TIMEOUT_MS = 28000;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_PER_IP = 300;
export const RATE_LIMIT_MAX_AUTH_PER_IP = 40;

export const DB_RETRY_ATTEMPTS = 3;
export const DB_RETRY_DELAY_MS = 400;
