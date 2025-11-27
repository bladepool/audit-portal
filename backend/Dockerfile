FROM node:20-bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install minimal system packages required for headless Chromium (Puppeteer)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      libnss3 \
      libnspr4 \
      libatk1.0-0 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
      libasound2 \
      libc6 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libexpat1 \
      libfontconfig1 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libstdc++6 \
      wget \
      xdg-utils \
      xvfb && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy package files first to leverage caching
COPY package*.json ./

# Install dependencies (including dev if needed for puppeteer)
RUN npm ci --include=dev --no-audit --progress=false

# Copy app source
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
