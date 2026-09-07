const repository = require('./emisores.repository');
const listar = () => repository.listar();
module.exports = { listar };
