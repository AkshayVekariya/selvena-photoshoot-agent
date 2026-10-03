# SELVENA Photoshoot Agent

MVP for generating and quality-checking jewelry product photography from user-supplied reference images.

## Included
- Manual Product Type selection
- Manual Real Metal selection
- Ten-shot photoshoot selector
- Shot-specific reference checks
- SELVENA prompt engine with exact Design Lock
- OpenAI image generation endpoint
- OpenAI visual Design Lock verification endpoint
- PASS / REVIEW / REJECT output statuses

## Local development
1. Install Node.js 20+.
2. Run npm install.
3. Copy .env.example to .env.local.
4. Put your OpenAI API key in OPENAI_API_KEY.
5. Run npm run dev.
6. Open http://localhost:3000.

## Deployment
Deploy as a Next.js application. Keep OPENAI_API_KEY server-side only and configure it as a deployment secret.

The generation and verification layers are isolated behind API routes so another provider can be added later without changing the photoshoot rules.
