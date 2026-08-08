# syntax=docker/dockerfile:1.7
FROM golang:alpine AS builder

ENV GOPROXY=https://proxy.golang.org,direct

WORKDIR /app

COPY go.mod go.sum* ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY main.go ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o streamer main.go

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/streamer /app/streamer

EXPOSE 8081
ENTRYPOINT ["/app/streamer"]