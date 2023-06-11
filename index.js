const express = require ('express') // Importando o módulo 'express'

const path = require('path') // Importando o módulo 'path' para manipulação de caminhos de arquivo e diretório
const app = express() // Criando uma instância do aplicativo Express

const mongoose = require ('mongoose') // Importando o módulo 'mongoose' para interagir com o MongoDB
var bodyParser = require('body-parser') // Importando o módulo 'body-parser' para analisar corpos de solicitações HTTP

const Posts = require('./Posts.js') // Requerendo o arquivo 'Posts.js' que contém o modelo dos dados

mongoose.connect('mongodb+srv://michelrocha502:root@cluster0.ozgxq3o.mongodb.net/dankicode?retryWrites=true&w=majority',{ useNewUrlParser: true, useUnifiedTopology: true })
// Estabelecendo a conexão com o banco de dados MongoDB

.then(() => { // Caso a conexão seja estabelecida com sucesso
    console.log("conectado com sucesso") // Exibindo uma mensagem de sucesso no console
})
.catch((err) => { // Caso ocorra algum erro durante a conexão
    console.log(err.message) // Exibindo a mensagem de erro no console
})


// Configuração do mecanismo de renderização do EJS para arquivos HTML
app.engine('ejs', require('ejs').renderFile);
// Definição do mecanismo de visualização como HTML
app.set('view engine', 'ejs');
// Configuração do middleware para servir arquivos estáticos da pasta 'public'
app.use('/public', express.static(path.join(__dirname, 'public')));
// Definição do diretório de visualizações como '/views'
app.set('views', path.join(__dirname, '/pages'));
// Configuração do middleware 'body-parser' para analisar corpos de solicitações JSON
app.use(bodyParser.json());
// Configuração do middleware 'body-parser' para analisar corpos de solicitações codificadas na URL
app.use(bodyParser.urlencoded({
    extended: true
}));


// Rota para a página inicial
app.get('/', (req, res) => {
  if (req.query.buscar == null) {
      // Consulta todos os posts ordenados pelo campo '_id' em ordem decrescente
      Posts.find().sort({_id: -1}).exec()
      .then(posts => {
          // Mapeia os dados dos posts para um novo formato
          posts = posts.map((val) => {
              return {
                  titulo: val.titulo,
                  conteudo: val.conteudo,
                  descricaoCurta: val.conteudo.substring(0, 100),
                  image: val.image,
                  slug: val.slug,
                  categoria: val.categoria,
                  views: val.views
              }
          })
          res.render('home', {posts: posts}) // Renderiza o template 'home' passando os posts como dados
      })
      .catch(err => {
          console.error(err)
      })
  } else {
      // Consulta os posts que possuem o título correspondendo à busca do usuário
      Posts.find({titulo: {$regex: req.query.buscar, $options: 'i'}})
      .then((posts) => {
          if (posts && posts.length > 0) {
              res.render('busca', {posts: posts}) // Renderiza o template 'busca' passando os posts encontrados como dados
          } else {
              res.render('busca', {posts: []}) // Renderiza o template 'busca' com um array vazio caso não haja posts encontrados
          }
      })
      .catch((error) => {
          console.error(error)
          res.status(500).send('Erro ao buscar os posts')
      })
  }
})

// Rota para exibir um post individual com base no slug
app.get("/:slug", (req, res) => {
  // Utiliza o método findOneAndUpdate() do Mongoose para atualizar o campo 'views' do documento encontrado
  Posts.findOneAndUpdate(
      {slug: req.params.slug}, // Busca o post com base no slug fornecido
      {$inc: {views: 1}}, // Incrementa o valor do campo 'views' em 1
      {new: true} // Retorna o documento atualizado
  )
  .then((resposta) => {
      if (resposta) {
          // Consulta todos os posts ordenados pelo campo '_id' em ordem decrescente
          Posts.find().sort({_id: -1}).exec()
          .then((posts) => {
              posts = posts.map((val) => {
                  return {
                      titulo: val.titulo,
                      conteudo: val.conteudo,
                      descricaoCurta: val.conteudo.substring(0, 100),
                      image: val.image,
                      slug: val.slug,
                      categoria: val.categoria,
                      views: val.views
                  }
              })
              res.render('single', {noticia: resposta, posts: posts}) // Renderiza o template 'single' passando a notícia e a lista de posts como dados
          })
          .catch((err) => {
              console.error(err)
          })
      } else {
          // Lida com o caso em que nenhum documento foi encontrado com o slug fornecido
          // Por exemplo, redirecionando o usuário para uma página de erro ou exibindo uma mensagem adequada.
      }
  })
  .catch((err) => {
      console.error(err)
  })
})

const port = process.env.PORT || 3000; // Utiliza a porta fornecida pelo Heroku ou a porta 3000 como padrão
app.listen(port, () => {
  console.log(`SERVIDOR LIGADO na porta ${port}`);
})

