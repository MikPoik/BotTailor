-- Delete your existing dev user to test fresh login flow
-- Run this in your database console or via psql

DELETE FROM users WHERE id = '9656e744-0678-4ecf-9dab-b95655718371';

-- After running this, log in again and the app will create a fresh user with your real email
