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
    const client = await pool.connect();

    try {
      // Iniciar transacción
      await client.query('BEGIN');

      // Insertar receta
      const recetaResult = await client.query(
        `INSERT INTO recetas (usuario_id, nombre, descripcion) VALUES ($1, $2, $3) RETURNING id`,
        [
          idusuario,
          nombreReceta,
          descripcionReceta,
        ]
      );

      idReceta = recetaResult.rows[0].id;

      // Insertar pasos
      for (let i in pasosReceta) {
        try {
          const pasoResult = await client.query(
            `INSERT INTO pasos (receta_id, numero, descripcion) VALUES ($1, $2, $3) RETURNING id`,
            [
              idReceta,
              pasosReceta[i].numero,
              pasosReceta[i].descripcion,
            ]
          );

          console.log(`Paso ${i} insertado a la receta`);
        } catch (err) {
          console.log(err.message);
        }
      }

      // Insertar ingredientes
      for (let i in ingredientesReceta) {
        try {
          const ingredienteResult = await client.query(
            `INSERT INTO ingredientes (receta_id ,nombre) VALUES ($1,$2) RETURNING id`,
            [
              idReceta,
              ingredientesReceta[i],
            ]
          );
          console.log(`Ingrediente ${ingredientesReceta[i]} insertado a la receta`);
        } catch (err) {
          console.log(err.message);
        }
      }

      // Insertar categorías
      for (let i in categorias) {
        try {
          const categoriaResult = await client.query(
            `SELECT id FROM categorias WHERE nombre = $1`,
            [categorias[i]]
          );

          if (categoriaResult.rowCount > 0) {
            const categoriaId = categoriaResult.rows[0].id;

            await client.query(`INSERT INTO recetas_categorias (receta_id, categoria_id) VALUES ($1, $2)`, [
              idReceta,
              categoriaId,
            ]);

            console.log(`Categoría ${categorias[i]} insertada a la receta`);
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
          await client.query(`INSERT INTO recetas_imagenes (receta_id, imagen_url) VALUES ($1, $2)`, [
            idReceta,
            imagenes[i],
          ]);

        } catch (err) {
          console.log(err.message);
        }
      }

      // Finalizar transacción
      await client.query('COMMIT');

      res.status(201).json({ res: 'Inserción exitosa' });
    } catch (err) {
      // Deshacer cambios en caso de error
      await client.query('ROLLBACK');
      next(err);
    } finally {
      // Liberar cliente de la pool
      client.release();
    }
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

const getPopularRecipes = async (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  try {
    const popularRecipesResult = await pool.query(
      `SELECT id, nombre, descripcion, visitas, likes 
      FROM recetas 
      WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 
      ORDER BY visitas DESC LIMIT 3`,
      [currentMonth, currentYear]
    );

    let popularRecipes = popularRecipesResult.rows;

    if (popularRecipes.length < 3) {
      const allTimePopularRecipesResult = await pool.query(
        `SELECT id, nombre, descripcion, visitas, likes 
        FROM recetas 
        WHERE id NOT IN (${popularRecipes.map(r => r.id).join(', ')})
        ORDER BY visitas DESC LIMIT ${3 - popularRecipes.length}`
      );

      popularRecipes = [...popularRecipes, ...allTimePopularRecipesResult.rows];
    }
    res.status(200).json({ popularRecipes });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener las recetas populares' });
  }
};

module.exports = {
  getAllRecipes,
  getRecipesByUserId,
  crearNuevaReceta,
  eliminarReceta,
  editarReceta,
  buscarReceta,
  getPopularRecipes
}