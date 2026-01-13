# Documentation for client/src/pages/add-data.tsx

Redirect to dashboard if not authenticated
Get chatbot details
Get website sources for this chatbot with polling for active scans
Poll every 3 seconds if there are any sources still scanning
If there was an error (like 401), stop polling to prevent spam
Add content source mutation
Upload file mutation
Delete website source mutation
Rescan website mutation
Check file type
Check file size (5MB limit)