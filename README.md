# Gestão OS

Origem OS is a full-stack SaaS ERP for coffee shops, roasteries, and wholesale/retail operations.

## Environment setup in AI Studio 

- **AI Studio Preview**: By default, the application runs in `mock` mode to avoid blocking the preview with database credentials prompts. To connect a real backend locally, configure your `DATABASE_URL` and change `DATA_MODE` to `api`. 
- **Production**: Make sure to set all required environment variables, including `DATABASE_URL`, `JWT_SECRET`, and `PAYMENTS_ENCRYPTION_KEY`. Use `.env.example` as a guide.

## Starting the Application

```bash
npm install
npm run dev
```
