# Flowance SaaS Platform

A comprehensive Next.js 14 SaaS application for managing invoices, clients, and business operations.

## Features

- 🧾 **Invoice Management** - Create, send, and track invoices
- 👥 **Client Management** - Organize and manage client information
- 📊 **Dashboard** - Overview of business metrics and analytics
- 🔐 **Authentication** - Secure user authentication with Supabase
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS
- ⚡ **Modern Stack** - Built with Next.js 14, TypeScript, and App Router

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd flowance-saas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase project:
   - Create a new Supabase project
   - Get your project URL and anon key
   - Update `.env.local` with your Supabase credentials

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Dashboard routes
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   └── clients/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   └── invoices/
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── layout/           # Layout components
│   └── invoices/          # Invoice-specific components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase configuration
│   └── utils.ts          # Utility functions
└── types/                 # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The application uses Supabase with the following main tables:

- `users` - User accounts
- `clients` - Client information
- `invoices` - Invoice data
- `invoice_items` - Invoice line items

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@flowance.com or create an issue in the repository.