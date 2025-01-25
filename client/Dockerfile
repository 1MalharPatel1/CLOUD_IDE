# Use the official Node.js image for React app
FROM node:16

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React app for production
RUN npm run build

# Serve the React app using NGINX
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html

# Expose the port NGINX is listening on
EXPOSE 80

# Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
