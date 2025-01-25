# Use the official Node.js image from Docker Hub
FROM node:16

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install && npm rebuild

# Copy the rest of the application
COPY . .

# Expose the port your app will run on
EXPOSE 9000

# Start the server
CMD ["node", "index.js"]
