const pool = require('../../configs/db.config')

const getAllRecipes = async (req, res, next) => {
    try {
        await pool
            .query(`SELECT recetas.idautor,recetas.idreceta,recetas.nombrereceta,recetas.descripcionreceta,recetas.ingredientes,recetas.pasosreceta,recetas.imagenes,usuarios.nombrepersona
             FROM recetas join usuarios on idautor = idusuario`)
            .then(response => {
                res.status(200).json(response.rows)
            })
            .catch(err => console.log(err.message))
    }
    catch (e) {
        next(e);
    }

}
const getRecipesByUserId = async (req, res, next) => {
  const idUser = req.params.id;
  try {
    await pool
      .query(`select * from recetas where usuario_id= ${idUser}`)
      .then(results => res.status(200).json(results.rows))
      .catch(err => next(err))
  } catch (error) {
    next(error);
  }
  
}

// const getRecipesByUserId = (req, res, next) => {
//     const idUser = req.params.id;

//     pool
//         .query(`select re.idreceta,re.descripcionreceta,re.idautor,re.imagenes,re.ingredientes,re.nombrereceta,re.pasosreceta,us.nombrepersona from usuarios us JOIN recetas re on re.idautor = us.idusuario  where us.idusuario= ${idUser}`)
//         .then(results => res.status(200).json(results.rows))
//         .catch(err => next(err))
// }

const crearNuevaReceta = async (req, res, next) => {
  const {
    nombreReceta,
    descripcionReceta,
    ingredientesReceta,
    pasosReceta,
    
    tags,
  } = req.body;
  const categorias = ['General'];
  const imagenes = ['https://i.imgur.com/2nCt3Sbl.jpg']
  let idReceta = 0;
  const { idusuario } = req;
  try {
    await pool
      .query(
        `INSERT INTO recetas (usuario_id, nombre, descripcion, ingredientes, pasos) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          idusuario,
          nombreReceta,
          descripcionReceta,
          ingredientesReceta,
          pasosReceta,
        ]
      )
      .then(async (results) => {
        idReceta = results.rows[0].id;

        for (let i in categorias) {
          // Insertar categorías
          try {
            const categoriaResult = await pool.query(
              `SELECT id FROM categorias WHERE nombre = $1`,
              [categorias[i]]
            );

            if (categoriaResult.rowCount > 0) {
              const categoriaId = categoriaResult.rows[0].id;

              await pool
                .query(`INSERT INTO recetas_categorias (receta_id, categoria_id) VALUES ($1, $2)`, [
                  idReceta,
                  categoriaId,
                ])
                .then((results) => {
                  console.log(
                    `Categoría ${categorias[i]} insertada a la receta`
                  );
                })
                .catch((err) => {
                  console.log(err.message);
                });
            } else {
              console.log(`Categoría ${categorias[i]} no encontrada`);
            }
          } catch (err) {
            console.log(err.message);
          }
        }

        // Insertar imágenes
        for (let i in imagenes) {
          try {
            await pool
              .query(`INSERT INTO recetas_imagenes (receta_id, imagen_url) VALUES ($1, $2)`, [
                idReceta,
                imagenes[i],
              ])
              .then((results) => {
                console.log(`Imagen ${i}: ${imagenes[i]} insertada a la receta`);
              })
              .catch((err) => {
                console.log(err.message);
              });
          } catch (err) {
            console.log(err.message);
          }
        }

        res.status(201).json({ res: 'Inserción exitosa' });
      })
      .catch((err) => {
        next(err);
      });
  } catch (err) {
    next(err);
  }
};


const eliminarReceta = (req, res) => {
    const { id } = req.params;
    try {
        pool
            .query('DELETE FROM recetas WHERE id = $1 RETURNING nombrereceta', [id])
            .then(response => {
                console.log(response.rows)
                if (response.rows.length > 0) {
                    res.status(200).json({ res: 'Receta eliminada exitosamente' });
                }
                else {
                    res.status(401).json({ res: 'No se encuentra la receta' })
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

const editarReceta = (req, res) => {
    const { idReceta, nombreReceta, descripcionReceta, ingredientes, pasosReceta, tags, imagenes } = req.body;
    try {
        pool
            .query('SELECT * FROM recetas WHERE idreceta = $1', [idReceta])
            .then(response => {
                if (response.rows.length > 0) {
                    pool
                        .query(`UPDATE recetas SET nombrereceta = $1,descripcionreceta = $2,ingredientes = $3,pasosreceta = $4,imagenes = $5
                                WHERE idreceta = $6`, [nombreReceta, descripcionReceta, ingredientes, pasosReceta, imagenes, idReceta])
                        .then(response => {


                            pool
                                .query(`DELETE FROM tag_receta WHERE idreceta = $1`, [idReceta])
                                .then(results => {
                                    for (let i in tags) {
                                        pool
                                            .query(`
                                            INSERT INTO tag_receta(idreceta,idtag) VALUES($1,$2)`, [idReceta, tags[i].idTag])
                                            .then(results => {
                                                console.log(`tag ${i}: ${tags[i]} insertado a la receta`);
                                            })
                                            .catch(err => {
                                                console.log(err.message)
                                            })
                                    }
                                })
                                .catch(err => {
                                    console.log(err.message)
                                })
                            res.status(200).json({ Res: 'Receta actualizado exitosamente', Receta: response.rows[0] })
                        })
                        .catch(err => res.status(401).json({ Error: err.message }))
                }
                else {
                    res.status(401).json({ Error: 'La receta buscada no existe' });
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    } catch (e) {
        next(e);
    }
}

const buscarReceta = async (req, res) => {
    const { palabraclave } = req.params;
    try {
        await pool
            .query(`SELECT recetas.idautor,recetas.idreceta,recetas.nombrereceta,recetas.descripcionreceta,recetas.ingredientes,recetas.pasosreceta,recetas.imagenes,usuarios.nombrepersona FROM recetas join tag_receta tr on tr.idreceta = recetas.idreceta join tags on tags.idtag = tr.idtag 
                    join usuarios on idautor = idusuario where nombrereceta ilike $1 or descripcionreceta ilike $1 or ingredientes ilike $1 or tags.nombre ilike $1`, ['%' + palabraclave + '%'])
            .then(response => {
                console.log(response)
                if (response.rows.length > 0) {
                    res.status(200).json(response.rows)
                }
                else {
                    res.status(400).json({ Error: 'No se encuentra informacion' })
                }
            })
            .catch(err => res.status(400).json({ Err: err.message }))
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getAllRecipes,
    getRecipesByUserId,
    crearNuevaReceta,
    eliminarReceta,
    editarReceta,
    buscarReceta
}