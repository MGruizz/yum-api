const pool = require('../../configs/db.config')

const getAllTags = async (req, res) => {
    const response = await pool.query(`SELECT * FROM tags`);
    res.status(200).json(response.rows);
    pool.end;
}

const getTagsByRecipeID = (req, res) => {
    const idReceta = req.params.id;
    console.log(idReceta);
    try {
        pool
            .query(`SELECT id,nombre FROM recetas_categorias reca join categorias cate on cate.id=reca.categoria_id where receta_id=${idReceta}`)
            .then(results => res.status(200).json(results.rows))
      .catch(err => next(err))
  } catch (error) {
    next(error);
  }
}

const agregarTag = async (req, res) => {
    let tag = req.body.nombre.nombreCategoria.toLowerCase();
    
    tag = (tag).charAt(0).toUpperCase() + ((tag).slice(1));

    try {
        await pool
            .query('SELECT nombre FROM categorias WHERE nombre = $1', [tag])
            .then(response => {
                if (response.rows.length > 0) {
                    res.status(400).json({ Error: 'La categoria ingresada ya se encuentra ingresada' });
                }
                else {
                    pool
                        .query('INSERT INTO categorias (nombre) VALUES ($1)', [tag])
                        .then(response => {
                            res.status(201).json({ Res: 'Tag ingresado exitosamente' })
                        })
                        .catch(err => res.status(401).json({ Error: err.message }))
                }
            })
            .catch(err => res.status(400).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

// Problema al eliminar con clave foranea en tabla NUB
const eliminarTag = (req, res) => {
    const idTag = req.params.id;
    console.log(idTag)
    try {
        pool
            .query('DELETE FROM tags WHERE idtag = $1 RETURNING nombre', [idTag])
            .then(response => {
                console.log(response.rows)
                if (response.rows.length > 0) {
                    res.status(200).json({ res: 'Tag eliminado exitosamente' });
                }
                else {
                    res.status(401).json({ res: 'No se encuentra el tag' })
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

// Mismo problema que eliminar
const editarTag = (req, res) => {

    let { id, nombre } = req.body;
    console.log(nombre);
    nombre = nombre.toLowerCase();
    console.log(nombre);
    nombre = (nombre).charAt(0).toUpperCase() + ((nombre).slice(1));

    try {
        pool
            .query('SELECT * FROM tags WHERE idtag = $1', [id])
            .then(response => {
                if (response.rows.length > 0) {
                    pool
                        .query('UPDATE TAGS set nombre = $1 where idtag = $2 RETURNING *', [nombre, id])
                        .then(response => {
                            res.status(200).json({ Res: 'Tag actualizado exitosamente', Tag: response.rows[0] })
                        })
                        .catch(err => res.status(401).json({ Error: err.message }))

                }
                else {
                    res.status(401).json({ Error: 'El tag buscado no existe' });
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

const getPopularTags = async (req, res) => {
    try {
        const popularCategoriesResult = await pool.query(
            `SELECT categorias.id, categorias.nombre, count(*) as recetas_count, categorias.imagen
            FROM categorias 
            JOIN recetas_categorias ON categorias.id = recetas_categorias.categoria_id
            GROUP BY categorias.id, categorias.nombre
            ORDER BY recetas_count DESC LIMIT 3`
        );

        let popularCategories = popularCategoriesResult.rows;

        if (popularCategories.length < 3) {
            const allTimePopularCategoriesResult = await pool.query(
                `SELECT categorias.id, categorias.nombre, count(*) as recetas_count
                FROM categorias 
                JOIN recetas_categorias ON categorias.id = recetas_categorias.categoria_id
                WHERE categorias.id NOT IN (${popularCategories.map(r => r.id).join(', ')})
                GROUP BY categorias.id, categorias.nombre
                ORDER BY recetas_count DESC LIMIT ${3 - popularCategories.length}`
            );

            popularCategories = [...popularCategories, ...allTimePopularCategoriesResult.rows];
        }
        res.status(200).json({ popularCategories });
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener las categorías populares' });
    }
}

module.exports = {
    getAllTags,
    getTagsByRecipeID,
    agregarTag,
    eliminarTag,
    editarTag,
    getPopularTags
}