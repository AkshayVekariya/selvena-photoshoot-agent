# SELVENA Photoshoot Agent

MVP for generating and quality-checking jewelry product photography from user-supplied reference images.

## MVP
- Manual product type and real metal selection
- 10-shot photoshoot selector
- Product Master Record
- Reference Check Engine
- Prompt Engine
- Generation-provider adapter interface
- Design Lock verification workflow
- PASS / REVIEW / REJECT statuses

## Local development
1. Install Node.js 20+.
2. Run npm install.
3. Copy .env.example to .env.local.
4. Run npm run dev.
5. Open http://localhost:3000.

The image generator is intentionally provider-agnostic. Connect a provider through lib/generation.ts.
