# Solian Wolves WMS — FastAPI Backend Service

Production-ready, auditable REST API for the **Solian Wolves Welfare Management System (WMS)**.

Built with **FastAPI**, **Pydantic v2**, and **Uvicorn**.

---

## 🚀 Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | System status, version info, and endpoint index |
| `GET` | `/health` | Healthcheck probe for hosting load balancers |
| `GET` | `/docs` | Interactive Swagger OpenAPI documentation |
| `GET` | `/redoc` | ReDoc API specifications |
| `GET` | `/api/stats` | Real-time aggregated organizational KPIs & cash balances |
| `GET` | `/api/finance/reconciliation` | Reconciled treasury audit breakdown (Opening fund + Inflows - Outflows) |
| `GET` | `/api/members` | Filterable members register with search and category tags |
| `POST` | `/api/members` | Register new member with duplicate detection (National ID, Phone, Email) |
| `GET` | `/api/contributions` | Filterable contribution records |
| `POST` | `/api/contributions` | Record external payment (unverified until approved) |
| `POST` | `/api/contributions/{id}/verify` | Finance officer verification with automatic ledger entry |
| `POST` | `/api/contributions/{id}/reverse` | Non-destructive reversal with mandatory reason |
| `GET` | `/api/welfare` | Welfare claims listing with urgency and status filters |
| `POST` | `/api/welfare` | Submit assistance claim with supporting documentation |
| `POST` | `/api/welfare/{id}/status` | Officer claim adjudication (under review, approve, reject) |
| `POST` | `/api/welfare/{id}/disburse` | Financial disbursement with transaction reference |
| `GET` | `/api/audit-logs` | Tamper-evident audit trail of all sensitive operations |

---

## 🌐 Deploy to Python Hosts

### Option 1: Render (Recommended & Fastest)
The repository includes a ready-to-use [`render.yaml`](../render.yaml) blueprint.

1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint** (or **Web Service**).
3. Select your GitHub repository: `https://github.com/solomon476/welfare-management-system`.
4. Render will automatically detect `render.yaml`:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
5. Click **Apply**. Within ~2 minutes, your live backend URL (e.g., `https://solian-wolves-wms-backend.onrender.com`) will be active with automatic HTTPS!

---

### Option 2: Railway
1. Go to [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `welfare-management-system`.
4. Under **Settings** → **Service**:
   - Set **Root Directory** to `backend`.
   - Build using the included `Dockerfile` or `Procfile`.
5. Railway assigns a public domain with HTTPS automatically.

---

### Option 3: Fly.io
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Navigate to `backend/`:
   ```bash
   cd backend
   fly launch --no-deploy
   fly deploy
   ```

---

### Option 4: Docker Container (Any Cloud Host / Cloud Run / AWS ECS / VPS)
```bash
cd backend
docker build -t solian-wolves-wms-backend .
docker run -d -p 8000:8000 -e PORT=8000 solian-wolves-wms-backend
```

---

## 💻 Local Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive documentation will be available at: `http://localhost:8000/docs`.
