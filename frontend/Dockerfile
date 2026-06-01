FROM node:20-alpine

WORKDIR /app

# Copy package descriptors first to cache layers
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose port 5173 (Vite's default dev server port)
EXPOSE 5173

# Start development server binding to host address
CMD ["npm", "run", "dev"]
