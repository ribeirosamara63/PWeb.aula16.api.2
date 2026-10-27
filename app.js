const express = require('express');
const axios = require('axios'); 
const app = express();


app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.set('view engine', 'ejs'); 

const logMiddleware = (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function (body) {
        const dataHora = new Date().toLocaleString('pt-BR');
        console.log(`[LOG] ${dataHora}, ${req.originalUrl}, ${JSON.stringify(body)}`);
        return originalJson.call(this, body); 
    };
    next();
};

app.get('/v1/hello', logMiddleware, (req, res) => {
    res.json({ mensagem: "Hello World da v1!" });
});

const mensagensV2 = {
    'pt-br': "Olá Mundo!",
    'en': "Hello World!",
    'es': "¡Hola Mundo!"
};

app.get('/v2/hello/:idioma', (req, res) => {
    const idioma = req.params.idioma.toLowerCase();
    const mensagem = mensagensV2[idioma] || mensagensV2['en'];
    res.json({ idioma: idioma, mensagem: mensagem });
});

app.post('/v2/hello', (req, res) => {
    const idioma = req.body.idioma.toLowerCase();
    const mensagem = mensagensV2[idioma] || mensagensV2['en'];
    res.json({ idioma: idioma, mensagem: mensagem });
});

app.get('/v2/formulario', (req, res) => {
    res.send(`
        <h2>Testar V2 por Formulário</h2>
        <form action="/v2/hello" method="POST">
            <select name="idioma">
                <option value="pt-br">Português</option>
                <option value="en">Inglês</option>
                <option value="es">Espanhol</option>
            </select>
            <button type="submit">Enviar</button>
        </form>
    `);
});

app.get('/mensagem-do-dia', async (req, res) => {
    try {
        const resposta = await axios.get('https://ron-swanson-quotes.herokuapp.com/v2/quotes');
        const frase = resposta.data[0]; 
        // Renderiza o arquivo views/quote.ejs passando a frase
        res.render('quote', { frase: frase });
    } catch (erro) {
        res.render('quote', { frase: "Erro ao buscar a mensagem." });
    }
});

app.get('/nasa', async (req, res) => {
    const astro = req.query.astro;
    if (!astro) {
        return res.send('<form><input name="astro" placeholder="Digite o astro (ex: Mars)"/><button>Buscar</button></form>');
    }

    try {
        const resposta = await axios.get(`https://images-api.nasa.gov/search?q=${astro}&media_type=image`);
        const itens = resposta.data.collection.items;
        
        if(itens.length > 0) {
            const linkImagem = itens[0].links[0].href;
            const titulo = itens[0].data[0].title;
            res.send(`<h3>${titulo}</h3><img src="${linkImagem}" width="500" /> <br> <a href="/nasa">Nova Busca</a>`);
        } else {
            res.send('Nenhuma imagem encontrada para este astro. <a href="/nasa">Voltar</a>');
        }
    } catch (erro) {
        res.send('Erro ao buscar imagem.');
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});