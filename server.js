// server.js - Backend Node.js completo para captura segura de pagamentos PayPal
// Versão pronta para executar em produção (use variáveis de ambiente para credenciais LIVE)
// Dependências: npm install express @paypal/checkout-server-sdk dotenv cors

require('dotenv').config(); // Para carregar variáveis de ambiente de .env
const express = require('express');
const cors = require('cors');
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' })); // Ajuste para seu domínio em produção (ex: 'https://seuusuario.github.io')

// Configuração PayPal - Use SANDBOX para testes, LIVE para produção
const environment = process.env.PAYPAL_MODE === 'live' 
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET_ID)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET_ID);

const client = new paypal.core.PayPalHttpClient(environment);

// Endpoint para capturar pagamento (chamado do frontend após onApprove)
app.post('/capturar-pagamento', async (req, res) => {
    const { orderID } = req.body;

    if (!orderID) {
        return res.status(400).json({ error: 'orderID é obrigatório' });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    try {
        const capture = await client.execute(request);
        
        // Verifica se o pagamento foi aprovado
        if (capture.statusCode === 201) {
            console.log('Pagamento capturado com sucesso:', capture.result);
            res.json({
                success: true,
                details: capture.result,
                message: 'Pagamento realizado e capturado com sucesso!'
            });
        } else {
            res.status(400).json({ error: 'Falha na captura do pagamento', details: capture });
        }
    } catch (err) {
        console.error('Erro ao capturar pagamento:', err);
        res.status(500).json({ error: 'Erro interno no servidor', message: err.message });
    }
});

// Endpoint de saúde (opcional, para testes)
app.get('/health', (req, res) => {
    res.json({ status: 'Servidor rodando', timestamp: new Date().toISOString() });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Modo PayPal: ${process.env.PAYPAL_MODE || 'sandbox'}`);
    console.log(`Acesse: http://localhost:${PORT}/health para testar`);
});

module.exports = app;
