const pool = require('../../configs/db.config')
require('dotenv').config();

const darLike = async (req, res, next) => {
    const { usuarioId, recetaId } = req.body;

    try {
        pool
            .query('INSERT INTO likes(usuario_id, receta_id) VALUES ($1, $2)', [usuarioId, recetaId])
            .then(response => {
                if (response.rowCount > 0) {
                    res.status(200).json({ res: 'Like registrado exitosamente' });
                }
                else {
                    res.status(400).json({ res: 'Error al registrar el like.' })
                }
            })
            .catch(err => res.status(500).json({ Error: err.message }));
    } catch (e) {
        next(e);
    }
}

const darUnLike = async (req, res, next) => {
    const { usuarioId, recetaId } = req.body;

    try {
        pool
            .query('DELETE FROM likes WHERE usuario_id = $1 AND receta_id = $2', [usuarioId, recetaId])
            .then(response => {
                if (response.rowCount > 0) {
                    res.status(200).json({ res: 'Like eliminado exitosamente' });
                }
                else {
                    res.status(400).json({ res: 'Error al eliminar like.' })
                }
            })
            .catch(err => res.status(500).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

const isLiked = async (req, res, next) => {
    const { usuarioId, recetaId } = req.body;

    try {
        pool
            .query('SELECT * FROM likes WHERE usuario_id = $1 AND receta_id = $2', [usuarioId, recetaId])
            .then(response => {
                if (response.rowCount > 0) {
                    res.status(200).json({ isLiked: true });
                }
                else {
                    res.status(200).json({ isLiked: false})
                }
            })
            .catch(err => res.status(500).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

const likesByRecipeId = async (req, res, next) => {
    const recetaId = req.query.recetaId;

    try {
        pool
            .query('SELECT count(id) FROM likes WHERE receta_id = $1', [recetaId])
            .then(response => {
                if (response.rowCount > 0) {
                    res.status(200).json({ cantidadLikes: response.rows[0].count });
                }
                else {
                    res.status(404).json({ Error: "No se encontró receta con dicha id."});
                }
            })
            .catch(err => res.status(500).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

module.exports = {
    darLike,
    darUnLike,
    isLiked,
    likesByRecipeId
}

