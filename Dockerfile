# Use Node.js for Vite dev server
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite port
EXPOSE 5173

# Run Vite dev server with host flag for Docker access
CMD ["npm", "run", "dev", "--", "--host"]
