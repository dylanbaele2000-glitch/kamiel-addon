ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache python3 py3-aiohttp py3-numpy py3-scipy py3-pillow

COPY app /app
COPY run.sh /run.sh
RUN chmod a+x /run.sh
WORKDIR /app

CMD [ "/run.sh" ]
