# 🚗 Sistema de Agendamento Particular — Motorista Uber

App que o passageiro abre pelo QR Code no banco do carro e agenda corridas diretamente com o motorista.

---

## 📁 Estrutura do projeto

```
uber-agendamento/
├── backend/           # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/    # Conexão com banco
│   │   ├── models/    # Motorista, Agendamento
│   │   ├── routes/    # /api/agendamentos, /api/motoristas
│   │   ├── services/  # WhatsApp, E-mail, QR Code
│   │   └── server.js  # Entrada principal
│   └── .env.example
└── frontend/          # React (PWA mobile-first)
    ├── src/
    │   ├── pages/     # AppCliente (QR Code) + Painel (motorista)
    │   ├── hooks/     # useAPI.js — chamadas à API
    │   └── App.js
    └── .env.example
```

---

## 🚀 Passo a passo de deploy (gratuito)

### 1. Banco de dados — MongoDB Atlas (gratuito)

1. Acesse https://cloud.mongodb.com e crie uma conta
2. Crie um cluster **Free (M0)**
3. Em **Database Access**: crie usuário e senha
4. Em **Network Access**: adicione `0.0.0.0/0` (permite acesso de qualquer IP)
5. Em **Connect > Drivers**: copie a URI (formato `mongodb+srv://...`)

---

### 2. WhatsApp — Evolution API

**Opção A — Deploy próprio no Railway (recomendado):**
1. Acesse https://railway.app
2. Deploy do repositório oficial: https://github.com/EvolutionAPI/evolution-api
3. Configure as variáveis de ambiente conforme documentação
4. Copie a URL gerada pelo Railway

**Opção B — Provedor pago (mais fácil):**
- Acesse https://evolution-api.com para instâncias gerenciadas

Após configurar, anote:
- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE` (nome da instância criada)

---

### 3. Backend — Render (gratuito)

1. Crie conta em https://render.com
2. **New > Web Service** > conecte seu repositório GitHub
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Em **Environment Variables**, adicione todas as variáveis do `.env.example`
5. Copie a URL do serviço (ex: `https://uber-agendamento.onrender.com`)

---

### 4. Frontend — Netlify (gratuito)

1. Crie conta em https://netlify.com
2. **Add new site > Import from Git** > conecte seu repositório
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
4. Em **Site settings > Environment variables**, adicione:
   ```
   REACT_APP_API_URL=https://sua-url.onrender.com
   REACT_APP_MOTORISTA_SLUG=ricardo-souza
   ```
5. Copie a URL do site (ex: `https://agendamento-ricardo.netlify.app`)

---

### 5. Cadastrar o motorista no banco

Após o backend estar no ar, faça uma requisição POST:

```bash
curl -X POST https://sua-url.onrender.com/api/motoristas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Ricardo Souza",
    "slug": "ricardo-souza",
    "telefone": "11999998888",
    "email": "ricardo@gmail.com",
    "totalViagens": 3200,
    "anosAtuando": 5,
    "horariosDisponiveis": ["08:00","10:30","14:00","17:00","19:30","21:00"]
  }'
```

---

### 6. Gerar e imprimir o QR Code

```bash
curl https://sua-url.onrender.com/api/motoristas/ricardo-souza/qrcode
```

A resposta inclui uma imagem base64 pronta para salvar e imprimir.

---

## 📱 Como o passageiro usa

1. Escaneia o QR Code com a câmera do celular
2. Abre `https://agendamento-ricardo.netlify.app/ricardo-souza`
3. Escolhe o dia e horário disponível
4. Preenche nome, WhatsApp e rota
5. Confirma — motorista recebe notificação em 3 canais

---

## 🔔 Notificações

| Canal | Quando dispara | O que envia |
|-------|---------------|-------------|
| WhatsApp | Na hora do agendamento | Nome, data, rota, telefone do cliente |
| E-mail | Na hora do agendamento | Todos os dados + botões aceitar/recusar |
| Painel | Tempo real | Card na aba "Agendamentos" |
| WhatsApp cliente | Após aceitar | Confirmação da corrida |

---

## 🛠️ Executar localmente

```bash
# Backend
cd backend
cp .env.example .env   # preencha as variáveis
npm install
npm run dev            # inicia na porta 3001

# Frontend (outro terminal)
cd frontend
cp .env.example .env
npm install
npm start              # abre em localhost:3000
```

---

## 📈 Próximos passos sugeridos

- [ ] Login simples para o motorista (JWT)
- [ ] Múltiplos motoristas com painéis independentes
- [ ] Histórico de clientes com re-agendamento fácil
- [ ] Integração com Pix para pagamento antecipado
- [ ] Push notifications via PWA
- [ ] Avaliações dos passageiros
