# Pick For Me - AI-Powered Decision Engine

An AI-powered decision engine that eliminates choice paralysis for dining and local experiences using Yelp's AI API.

## Features

- Natural language conversation interface
- Autonomous decision-making for restaurant selection
- Automated booking through Yelp Reservations API
- Location-aware recommendations
- Complete restaurant information display

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: Bun
- **APIs**: Yelp AI API, Yelp Places API, Yelp Reservations API

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine
- Yelp API credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Yelp API credentials:
   ```
   YELP_API_KEY=your_yelp_api_key_here
   YELP_CLIENT_ID=your_yelp_client_id_here
   ```

### Development

Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build the application for production:

```bash
bun run build
```

### Lint

Run ESLint:

```bash
bun run lint
```

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes for Yelp integration
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout component
│   └── page.tsx      # Home page
├── components/       # React components
└── lib/             # Utility functions and types
    └── types.ts     # TypeScript type definitions
```

## Environment Variables

- `YELP_API_KEY`: Your Yelp API key
- `YELP_CLIENT_ID`: Your Yelp client ID
- `NEXT_PUBLIC_APP_URL`: Application URL (default: http://localhost:3000)

## License

This project is licensed under the MIT License.