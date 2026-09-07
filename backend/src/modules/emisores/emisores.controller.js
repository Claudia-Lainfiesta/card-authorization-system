const service = require('./emisores.service');
const listar = async (req, res, next) => {
    try { res.json({ emisores: await service.listar() }); } catch (error) { next(error); }
};
module.exports = { listar };
