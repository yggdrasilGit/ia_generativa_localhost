#!/usr/bin/env bash
# =============================================================================
#  Yggdrasil AI — Para todos os serviços
#  Uso: ./stop.sh
# =============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

echo ""
echo -e "${BOLD}   🌳  Yggdrasil AI — Encerrando...${NC}"
echo -e "${BOLD}──────────────────────────────────────────${NC}"

stop_proc() {
  local name="$1"; local pattern="$2"
  if pkill -f "$pattern" 2>/dev/null; then
    echo -e "${GREEN}✔${NC}  $name encerrado"
  else
    echo -e "${CYAN}➜${NC}  $name já estava parado"
  fi
}

stop_proc "Backend FastAPI"  "uvicorn app.main"
stop_proc "Frontend Vite"    "vite"

echo ""
echo -e "${BOLD}   Serviços encerrados.${NC}"
echo -e "${BOLD}──────────────────────────────────────────${NC}"
echo ""
