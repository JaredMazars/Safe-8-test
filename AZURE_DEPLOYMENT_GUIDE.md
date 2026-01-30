# Azure App Service Configuration Guide

## Required Application Settings (Environment Variables)

Configure these in Azure Portal > App Service > Configuration > Application settings:

### Node.js Configuration
- `WEBSITE_NODE_DEFAULT_VERSION`: `20-lts` or `18-lts`
- `NODE_ENV`: `production`

### Database Configuration
- `DB_DRIVER`: `ODBC Driver 17 for SQL Server`
- `DB_SERVER`: `safe-8.database.windows.net`
- `DB_PORT`: `1433`
- `DB_NAME`: `SAFE8`
- `DB_USER`: `admin1`
- `DB_PASSWORD`: `safe8123$`
- `DB_ENCRYPT`: `yes`
- `DB_TRUST_SERVER_CERTIFICATE`: `no`
- `DB_CONNECTION_TIMEOUT`: `30`

### Security Configuration
- `JWT_SECRET`: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- `JWT_EXPIRES_IN`: `1h`
- `CSRF_SECRET`: `a7f8e9d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9`

### Email Configuration (Gmail)
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `587`
- `SMTP_SECURE`: `false`
- `SMTP_USER`: `jaredmoodley1212@gmail.com`
- `SMTP_PASS`: `egwo becy ycxu apbn` (Google App Password)

### CORS Configuration
- `CORS_ORIGIN`: Your frontend URL (e.g., `https://yourapp.azurewebsites.net`)

## Deployment Configuration

### General Settings
- **Stack**: Node
- **Node Version**: 20 LTS
- **Startup Command**: `bash startup.sh`

### SCM Build Configuration
Set in Application Settings:
- `SCM_DO_BUILD_DURING_DEPLOYMENT`: `true`
- `PROJECT`: `server`

## Deployment Steps

1. Ensure all application settings are configured in Azure Portal
2. Push code to GitHub repository
3. Configure GitHub deployment in Azure Portal
4. Monitor deployment logs in Azure Portal > Deployment Center > Logs

## Troubleshooting

### If startup fails:
1. Check Application Logs in Azure Portal
2. Use SSH/Console to check file permissions: `ls -la /home/site/wwwroot`
3. Verify startup.sh has Unix line endings (LF, not CRLF)
4. Check that all environment variables are set

### Common Issues:
- **CRLF line endings**: Convert startup.sh to LF line endings
- **Missing dependencies**: Ensure `SCM_DO_BUILD_DURING_DEPLOYMENT=true`
- **Database connection**: Verify firewall rules allow Azure services
- **Port binding**: Azure automatically sets PORT variable
