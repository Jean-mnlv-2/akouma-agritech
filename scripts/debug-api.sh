#!/bin/bash
# Script de diagnostic pour l'API Render
echo "=== Diagnostic API Render ==="
echo "1. Test endpoint news:"
curl -s -w "\nStatus: %{http_code}\nContent-Type: %{content_type}\n" https://akouma.onrender.com/api/news | head -c 500

echo -e "\n\n2. Test endpoint health:"
curl -s -w "\nStatus: %{http_code}\n" https://akouma.onrender.com/health

echo -e "\n\n3. Test endpoint auth session:"
curl -s -w "\nStatus: %{http_code}\n" https://akouma.onrender.com/auth/session
