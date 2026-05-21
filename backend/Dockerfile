FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node -e \"const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(async n=>{if(n===0){console.log('Seeding...');await require('./prisma/seed.js').run();await p.\\$disconnect();process.exit(0);}else{await p.\\$disconnect();process.exit(0);}}).catch(e=>{console.error(e);process.exit(1);})\" && node server.js"]
