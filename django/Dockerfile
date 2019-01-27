FROM node:8
RUN mkdir -p /usr/src/app
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied where available (npm@5+)
COPY package.json /usr/src/app/

RUN npm install
RUN npm install --save mongoose
RUN npm install express mongodb --save
#RUN npm help package-lock.json
RUN npm install dotenv --save
RUN npm install curl-request --save
#RUN npm install request --save
#RUN npm install --save-dev localtunnel
# If you are building your code for production
# RUN npm install --only=production
#RUN apt-get -y update; apt-get -y install curl

# Bundle app source
COPY . /usr/src/app

EXPOSE 1337
# Creates a mount point
#VOLUME [ "/usr/src/app" ]
CMD [ "npm", "start" ]