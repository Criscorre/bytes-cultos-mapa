FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . ./

# Build Next app
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
