# Stage 0
FROM node:18-alpine as build-stage
WORKDIR /ms-file-transfer-api
COPY . /ms-file-transfer-api
RUN npm install
RUN npm run build

# Stage 1
FROM node:18-alpine

LABEL APP_NAME="ms-file-transfer-api"
LABEL APP_VERSION="1.0.0"

# Definir las variables de entorno por defecto
ENV GOOGLE_CREDENTIALS=<GOOGLE_CREDENTIALS>
ENV S3_BUCKET_NAME=<S3_BUCKET_NAME>
ENV AWS_REGION=<AWS_REGION>
ENV AWS_ACCESS_KEY_ID=<AWS_ACCESS_KEY_ID>
ENV AWS_SECRET_ACCESS_KEY=<AWS_SECRET_ACCESS_KEY>
ENV URL_GDRIVE_TO_S3=<CALLBACK_URL>
ENV URL_S3_TO_GDRIVE=<CALLBACK_URL>
ENV TOKEN_GDRIVE_TO_S3=<TOKEN>
ENV TOKEN_S3_TO_GDRIVE=<TOKEN>
ENV PORT=80

WORKDIR /ms-file-transfer-api
COPY --from=build-stage /ms-file-transfer-api/build /ms-file-transfer-api

EXPOSE 80
CMD node server.js
