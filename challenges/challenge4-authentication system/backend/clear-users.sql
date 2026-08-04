-- Clear all user data for testing
-- Run this with: psql -U postgres -d identity_db -f clear-users.sql

TRUNCATE TABLE "EmailVerificationToken" CASCADE;
TRUNCATE TABLE "PasswordResetToken" CASCADE;
TRUNCATE TABLE "Session" CASCADE;
TRUNCATE TABLE "LoginHistory" CASCADE;
TRUNCATE TABLE "SecurityEvent" CASCADE;
TRUNCATE TABLE "LoginAttempt" CASCADE;
TRUNCATE TABLE "Comment" CASCADE;
TRUNCATE TABLE "DocumentVersion" CASCADE;
TRUNCATE TABLE "DocumentPermission" CASCADE;
TRUNCATE TABLE "Document" CASCADE;
TRUNCATE TABLE "User" CASCADE;

-- Reset sequences
ALTER SEQUENCE IF EXISTS "User_id_seq" RESTART WITH 1;

SELECT 'All user data cleared successfully!' as message;
