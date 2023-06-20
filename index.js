// Importando os módulos necessários
const express = require('express');
const fileupload = require('express-fileupload');
const path = require('path');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs');
const Posts = require('./Posts.js');

// Conectando ao banco de dados MongoDB
mongoose.connect(
    'mongodb+srv://michelrocha502:root@cluster0.ozgxq3o.mongodb.net/dankicode?retryWrites=true&w=majority',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log('Conectado ao banco de dados com sucesso');
  })
  .catch((err) => {
    console.log(err.message);
  });

// Configurações e middlewares
app.use(
  session({
    secret: 'teste',
    cookie: { maxAge: 3600000 },
  })
);

app.use(
  fileupload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, 'temp'),
  })
);

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rota para a página inicial
app.get('/', (req, res) => {
  if (req.query.buscar == null) {
    // Consulta todos os posts ordenados pelo campo '_id' em ordem decrescente
    Posts.find()
      .sort({ _id: -1 })
      .exec()
      .then((posts) => {
        // Mapeia os dados dos posts para um novo formato
        posts = posts.map((val) => {
          return {
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substring(0, 100),
            image: val.image,
            slug: val.slug,
            categoria: val.categoria,
            views: val.views,
          };
        });
        res.render('home', { posts: posts }); // Renderiza o template 'home' passando os posts como dados
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    // Consulta os posts que possuem o título correspondendo à busca do usuário
    Posts.find({ titulo: { $regex: req.query.buscar, $options: 'i' } })
      .then((posts) => {
        if (posts && posts.length > 0) {
          res.render('busca', { posts: posts }); // Renderiza o template 'busca' passando os posts encontrados como dados
        } else {
          res.render('busca', { posts: [] }); // Renderiza o template 'busca' com um array vazio caso não haja posts encontrados
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Erro ao buscar os posts');
      });
  }
});

// Rota para exibir um post individual com base no slug
app.get('/:slug', (req, res) => {
  // Utiliza o método findOneAndUpdate() do Mongoose para atualizar o campo 'views' do documento encontrado
  Posts.findOneAndUpdate(
    { slug: req.params.slug }, // Busca o post com base no slug fornecido
    { $inc: { views: 1 } }, // Incrementa o valor do campo 'views' em 1
    { new: true } // Retorna o documento atualizado
  )
    .then((resposta) => {
      if (resposta) {
        // Consulta todos os posts ordenados pelo campo '_id' em ordem decrescente
        Posts.find()
          .sort({ _id: -1 })
          .exec()
          .then((posts) => {
            posts = posts.map((val) => {
              return {
                titulo: val.titulo,
                conteudo: val.conteudo,
                descricaoCurta: val.conteudo.substring(0, 100),
                image: val.image,
                slug: val.slug,
                categoria: val.categoria,
                views: val.views,
              };
            });
            res.render('single', { noticia: resposta, posts: posts }); // Renderiza o template 'single' passando a notícia e a lista de posts como dados
          })
          .catch((err) => {
            console.error(err);
          });
      } else {
        // Lida com o caso em que nenhum documento foi encontrado com o slug fornecido
        // Por exemplo, redirecionando o usuário para uma página de erro ou exibindo uma mensagem adequada.
      }
    })
    .catch((err) => {
      console.error(err);
    });
});

// Rota para o login do administrador
app.post('/admin/login', (req, res) => {
  usuario.map((val) => {
    if (val.login === req.body.login && val.senha === req.body.senha) {
      req.session.login = 'Michel';
    }
  });
  res.redirect('/admin/login');
});

// Rota para o cadastro de um novo post
app.post('/admin/cadastro', (req, res) => {
  let formato = req.files.arquivo.name.split('.');
  var imagem = '';
  if (formato[formato.length - 1] == 'jpg') {
    imagem = new Date().getTime() + '.jpg';
    req.files.arquivo.mv(__dirname + '/public/images/' + imagem);
  } else {
    fs.unlinkSync(req.files.arquivo.tempFilePath);
  }


  Posts.create({
    titulo: req.body.titulo_noticia,
    image: 'http://localhost:3000/public/images/' + imagem,
    categoria: req.body.categoria,
    conteudo: req.body.noticia,
    slug: req.body.slug,
    autor: req.body.autor,
    views: 0,
  });

  res.redirect('/admin/login');
});

// Rota para exclusão de um post
app.get('/admin/delete/:id', (req, res) => {
  Posts.deleteOne({ _id: req.params.id })
    .then(() => {
      res.redirect('/admin/login');
    })
    .catch(() => {
      // Lida com o erro, se necessário
    });
});
//usuario administrador
var usuario = [
    {
        login:'administrador',
        senha:'@pwdy2k3'
    }
]


// Rota para a página de login do administrador
app.get('/admin/login', (req, res) => {
  if (req.session.login == null) {
    res.render('admin-login');
  } else {
    Posts.find()
      .sort({ _id: -1 })
      .exec()
      .then((posts) => {
        posts = posts.map((val) => {
          return {
            id: val._id,
            titulo: val.titulo,
            conteudo: val.conteudo,
            descricaoCurta: val.conteudo.substring(0, 100),
            image: val.image,
            slug: val.slug,
            categoria: val.categoria,
            autor: val.autor,
            views: val.views,
          };
        });
        res.render('admin-painel', { posts: posts }); // Renderiza o template 'admin-painel' passando os posts como dados
      })
      .catch((err) => {
        console.error(err);
      });
  }
});

const port = process.env.PORT || 3000; // Utiliza a porta fornecida pelo Heroku ou a porta 3000 como padrão
app.listen(port, () => {
  console.log(`SERVIDOR LIGADO na porta ${port}`);
});

// Fim do código
