ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache python3 py3-aiohttp py3-numpy py3-scipy py3-pillow

COPY app /app
WORKDIR /app

CMD [ "python3", "/app/server.py" ]
