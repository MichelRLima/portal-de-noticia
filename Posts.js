// Importando o módulo 'mongoose'
var mongoose = require('mongoose');

// Criando uma instância do esquema do MongoDB
var Schema = mongoose.Schema;

// Definindo o esquema para os posts
var postSchema = new Schema(
  {
    titulo: String,
    image: String,
    categoria: String,
    conteudo: String,
    slug: String,
    autor: String,
    views: Number,
  },
  { collection: 'posts' } // Nome da coleção no banco de dados
);

// Criando o modelo para os posts usando o esquema definido acima
var Posts = mongoose.model('Posts', postSchema);

// Exportando o modelo para uso em outros arquivos
module.exports = Posts;

// Fim do código