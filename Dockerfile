# Use Node.js LTS (Long Term Support) image as base
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy app source code
COPY . .

# Expose port (matches your index.js PORT)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]