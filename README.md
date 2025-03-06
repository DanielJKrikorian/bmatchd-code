# WeddingHub

A modern wedding marketplace platform connecting couples with wedding vendors.

## Features

- Vendor profiles and management
- Couple accounts and wedding planning tools
- Subscription plans for vendors
- Secure payment processing with Stripe
- Real-time messaging system
- Review and rating system
- Admin dashboard for platform management

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- Supabase for backend and authentication
- Stripe for payment processing
- Netlify for hosting and serverless functions

## Development

1. Clone the repository:
```bash
git clone https://github.com/DanielJKrikorian/manual.git
cd manual
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## License

MIT