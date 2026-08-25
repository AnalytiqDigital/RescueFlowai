# RescueFlow AI Command Center

Vercel-ready React/Vite frontend for the BuildFest prototype.

## Your existing n8n hosting
`https://www.econuniversal.name.ng` is treated as the n8n host.
Do NOT paste the n8n editor URL into the frontend.

## Install
npm install

## Local run
npm run dev

## Production build
npm run build

## Vercel
Import this folder/repository into Vercel.
Framework: Vite
Build command: npm run build
Output directory: dist

Set these Environment Variables:
VITE_N8N_BASE_URL=https://www.econuniversal.name.ng
VITE_N8N_SIMULATE_PATH=/webhook/rescueflow/simulate
VITE_N8N_APPROVE_PATH=/webhook/rescueflow/approve
VITE_N8N_REJECT_PATH=/webhook/rescueflow/reject
VITE_N8N_ASK_PATH=/webhook/rescueflow/ask

The UI has local fallback behavior so it can be demonstrated before the n8n webhooks are connected.
