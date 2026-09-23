-- Data migration: "daily" and "twice_weekly" were removed as newsletter
-- frequency options (replaced by weekly / biweekly / monthly, spaced
-- further apart to reduce load on the daily content-sync pipeline).
-- Existing subscribers on either removed option move to "weekly", the
-- closest remaining equivalent.
UPDATE "UserPreference"
SET "newsletterFrequency" = 'weekly'
WHERE "newsletterFrequency" IN ('daily', 'twice_weekly');
