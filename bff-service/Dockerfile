FROM node:lts-alpine
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4000
ENV products="https://i9m60vpkm1.execute-api.us-east-1.amazonaws.com"
ENV cart="http://antontrafimovich-cart-api-develop.us-east-1.elasticbeanstalk.com"
ENV import="https://n2vl42dcob.execute-api.us-east-1.amazonaws.com"
CMD [ "npm", "start"]