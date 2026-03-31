# Le Continent Web

A web application dedicated to celebrating and preserving African cultures, languages, and traditions.

## Features

- **Village Section**: Explore African alphabets, history, lexiques, traditional dishes, phrases, and proverbs
- **Cultures**: Discover African inventions, cultures, and traditions
- **User Authentication**: Sign up and login with email or phone number
- **Premium Content**: Access premium culture content
- **Referral System**: Invite friends and earn benefits
- **Admin Dashboard**: Manage users, villages, promo codes, and view analytics

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: Shadcn UI
- **Authentication**: Firebase Auth
- **Database**: Supabase
- **Payment**: MTN and Orange Mobile Money integration
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── home/           # Home page components
│   ├── layout/         # Layout components (Navbar, Footer)
│   ├── payment/        # Payment components
│   ├── premium/        # Premium content components
│   └── ui/             # Base UI components
├── data/               # Static data files
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (Firebase, Supabase)
├── pages/              # Page components
│   ├── admin/         # Admin dashboard pages
│   └── village/       # Village section pages
├── store/              # State management
└── types/              # TypeScript type definitions
```

## License

This project is for educational and cultural preservation purposes.
