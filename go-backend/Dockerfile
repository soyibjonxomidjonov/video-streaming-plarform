FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY streamer /app/streamer
RUN chmod +x /app/streamer

EXPOSE 8081
ENTRYPOINT ["/app/streamer"]