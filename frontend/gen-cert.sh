#!/bin/sh
# Generates a self-signed TLS certificate on first start; kept in the certs volume afterwards.
set -e
CERT_DIR=/etc/nginx/certs
if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
  mkdir -p "$CERT_DIR"
  openssl req -x509 -newkey rsa:2048 -nodes -sha256 -days 365 \
    -keyout "$CERT_DIR/server.key" -out "$CERT_DIR/server.crt" \
    -subj "/CN=oficina" \
    -addext "subjectAltName=${TLS_SAN:-DNS:localhost,IP:127.0.0.1}"
  chmod 600 "$CERT_DIR/server.key"
  echo "gen-cert: created self-signed certificate (SAN: ${TLS_SAN:-DNS:localhost,IP:127.0.0.1})"
fi
