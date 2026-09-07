const service = require('./reportes.service');
const resumen = async (req, res, next) => {
    try { res.json({ resumen: await service.resumen() }); } catch (error) { next(error); }
};
module.exports = { resumen };
