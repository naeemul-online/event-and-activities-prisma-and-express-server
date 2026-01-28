set -o errexit
pnpm install
pnpm run build
npx prisma generate
npm prisma migrate deploy