 const pool = require('../../configs/db.config');
const {uploadToAzure} = require('../../Services/storage');

const getAllRecipes = async (req, res, next) => {
  try {
    await pool
      .query(`SELECT recetas.usuario_id,recetas.id,recetas.nombre,recetas.descripcion,usuarios.username
             FROM recetas join usuarios on recetas.usuario_id = usuarios.id`)
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

const getAllCategorias = async (req, res, next) => {
  try {
    await pool
      .query(`select * from categorias`)
      .then(results => res.status(200).json(results.rows))
      .catch(err => next(err))
  } catch (error) {
    next(error);
  }
}


const crearNuevaReceta = async (req, res, next) => {
  const {
    nombreReceta,
    descripcionReceta,
    ingredientesReceta,
    pasosReceta,
    categoriasReceta,
    imagenesReceta
  } = req.body;

  let  idUsuario  = req.id

  try {
    const client = await pool.connect();

    try {
      // Iniciar transacción
      await client.query('BEGIN');

      // Insertar receta
      const recetaResult = await client.query(
        `INSERT INTO recetas (usuario_id, nombre, descripcion) VALUES ($1, $2, $3) RETURNING id`,
        [
          idUsuario,
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
      for (let i in categoriasReceta) {
        try {
          const categoriaResult = await client.query(
            `SELECT id FROM categorias WHERE id = $1`,
            [categoriasReceta[i]]
          );

          if (categoriaResult.rowCount > 0) {
            const categoriaId = categoriaResult.rows[0].id;

            await client.query(`INSERT INTO recetas_categorias (receta_id, categoria_id) VALUES ($1, $2)`, [
              idReceta,
              categoriaId,
            ]);

            console.log(`Categoría ${categoriasReceta[i]} insertada a la receta`);
          } else {
            console.log(`Categoría ${categoriasReceta[i]} no encontrada`);
          }
        } catch (err) {
          console.log(err.message);
        }
      }

      let j = 1;
      // Insertar imágenes
      for (let i in imagenesReceta) {

        try {

          const imagenUrl = await uploadToAzure(imagenesReceta[i], 'imagen_' + j + '_' + idReceta);

          if(imagenUrl) {

            await client.query(`INSERT INTO recetas_imagenes (receta_id, imagen_url) VALUES ($1, $2)`, [
              idReceta,
              imagenUrl,
            ]);
          } else {
            console.log("Error guardando imagen en azure :(");
          }

          j++;

        } catch (err) {
          console.log("Error en las imagenes:(");
          console.log(err.message);
          res.status(400).json({ res: 'Error al manejar las imagenes.' });
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


const eliminarReceta = (req, res, next) => {
  const { id } = req.params;
  try {
    pool
      .query('UPDATE recetas SET deleted = true WHERE id = $1 RETURNING nombre', [id])
      .then(response => {
        console.log(response.rows)
        if (response.rows.length > 0) {
          res.status(200).json({ res: 'Receta eliminada exitosamente' });
        }
        else {
          res.status(401).json({ res: 'No se encuentra la receta' })
        }
      })
      .catch(err => res.status(401).json({ Error: err.message }));
  } catch (e) {
    next(e);
  }
}

const editarReceta = async (req, res) => {
  const {
    idReceta,
    nombreReceta,
    descripcionReceta,
    ingredientesReceta,
    pasosReceta,
    categoriasReceta,
    imagenesReceta,
  } = req.body;
  try {
      try {
        pool.query(
          `UPDATE public.recetas
        SET  descripcion=$1, nombre=$2
        WHERE id= $3 `,
          [descripcionReceta, nombreReceta, idReceta]
        );
        console.log(`Receta actulizada exitosamente`);
      } catch (error) {
        console.log(err.message);
      }
      // Eliminar categorias anteriores
      try {
        pool.query(
          `DELETE FROM public.recetas_categorias WHERE receta_id = $1`,
          [idReceta]
        );
        console.log(`Categorias antiguas eliminada exitosamente`);
      } catch (error) {
        console.log(err.message);
      }
       // Eliminar Pasos anteriores
      try {
        pool.query(`DELETE FROM public.pasos WHERE receta_id = $1`, [idReceta]);
        console.log(`Pasos antiguos eliminados exitosamente`);
      } catch (error) {
        console.log(err.message);
      }
      // Eliminar Ingredientes anteriores
      try {
        pool.query(`DELETE FROM public.ingredientes WHERE receta_id = $1`, [
          idReceta,
        ]);
        console.log(`Ingredientes antiguos eliminados exitosamente`);
      } catch (error) {
        console.log(err.message);
      }
      console.log(`paso fase de eliminacion`)
      // Insertar nuevos pasos
      for (let i in pasosReceta) {
        try {
          const pasoResult = await pool.query(
            `INSERT INTO pasos (receta_id, numero, descripcion) VALUES ($1, $2, $3) RETURNING id`,
            [idReceta, pasosReceta[i].numero, pasosReceta[i].descripcion]
          );

          console.log(`Paso ${i} insertado a la receta`);
        } catch (err) {
          console.log(err.message);
        }
      }

      // Insertar nuevos ingredientes
      for (let i in ingredientesReceta) {
        try {
          const ingredienteResult = await pool.query(
            `INSERT INTO ingredientes (receta_id ,nombre) VALUES ($1,$2) RETURNING id`,
            [idReceta, ingredientesReceta[i]]
          );
          console.log(
            `Ingrediente ${ingredientesReceta[i]} insertado a la receta`
          );
        } catch (err) {
          console.log(err.message);
        }
      }
      // Insertar nuevas categorías
      for (let i in categoriasReceta) {
        try {
          const categoriaResult = await pool.query(
            `SELECT id FROM categorias WHERE id = $1`,
            [categoriasReceta[i]]
          );

          if (categoriaResult.rowCount > 0) {
            const categoriaId = categoriaResult.rows[0].id;

            await pool.query(
              `INSERT INTO recetas_categorias (receta_id, categoria_id) VALUES ($1, $2)`,
              [idReceta, categoriaId]
            );

            console.log(
              `Categoría ${categoriasReceta[i]} insertada a la receta`
            );
          } else {
            console.log(`Categoría ${categoriasReceta[i]} no encontrada`);
          }
        } catch (err) {
          console.log(err.message);
        }
      }
      res.status(201).json({ res: "Inserción exitosa" });
  } catch (e) {
    next(e);
  }
};

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
      `SELECT id, nombre, descripcion, visitas,
        (SELECT COUNT(*) FROM likes WHERE likes.receta_id = recetas.id) AS likes 
      FROM recetas 
      WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
      ORDER BY likes DESC LIMIT 3`,
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

const getRecipeById = async (req, res, next) => {
  const id = req.params.id;
  try {
    const { rows: [recipe] } = await pool.query('SELECT *, (SELECT COUNT(*) FROM likes WHERE receta_id = $1) as likes FROM recetas WHERE id = $1', [id]);
    const { rows: imagenes } = await pool.query('SELECT * FROM recetas_imagenes WHERE receta_id = $1', [id]);

    if (recipe) {
      recipe.imagenes = imagenes.map(image => image.imagen_url);
      res.status(200).json(recipe);
    } else {
      res.status(404).json({ error: 'Receta no encontrada' });
    }
  } catch (error) {
    next(error);
  }
};

const getStepsByRecipeId = async (req, res, next) => {
  const id = req.params.id;
  try {
    await pool
      .query(`select * from pasos where receta_id = ${id} order by numero`)
      .then(results => res.status(200).json(results.rows))
      .catch(err => next(err))
  } catch (error) {
    next(error);
  }
}

const getIngredientsByRecipeId = async (req, res, next) => {
  const id = req.params.id;
  try {
    await pool
      .query(`select * from ingredientes where receta_id = ${id}`)
      .then(results => res.status(200).json(results.rows))
      .catch(err => next(err))
  } catch (error) {
    next(error);
  }
}

const getImagesRecipe = async (req, res, next) => {
  const id = req.params.id;
  try {
    await pool
      .query(`select imagen_url from recetas_imagenes where receta_id = ${id}`)
      .then(results => res.status(200).json(results.rows))
      .catch(err => next(err))
  } catch (error) {
    next(error);
  }
}

const getRecipesFullByUserId = async (req, res, next) => {
  try {
    const results = await pool.query(`
    SELECT recetas.id, recetas.descripcion, recetas.usuario_id, recetas.created_at, recetas.updated_at, recetas.deleted, recetas.nombre, recetas.likes, recetas.visitas, recetas_imagenes.imagen_url
    FROM recetas
    LEFT JOIN recetas_imagenes ON recetas.id = recetas_imagenes.receta_id
    WHERE recetas.usuario_id = ${req.params.id} AND deleted = false;
    `);

    const recipes = {};

    for (let row of results.rows) {
      if (!recipes[row.id]) {
        // Si no hemos visto esta receta antes, la agregamos a nuestro objeto de recetas.
        recipes[row.id] = {
          id: row.id,
          descripcion: row.descripcion,
          usuario_id: row.usuario_id,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted: row.deleted,
          nombre: row.nombre,
          likes: row.likes,
          visitas: row.visitas,
          imagenes: []
        };
      }

      if (row.imagen_url) {
        recipes[row.id].imagenes.push(row.imagen_url);
      }
    }

    const recipesArray = Object.values(recipes);

    res.status(200).json(recipesArray);
  } catch (error) {
    next(error);
  }
}

const search = async (req, res, next) => {
  const { palabraclave } = req.body;
  try {
    await pool
      .query(`SELECT DISTINCT recetas.*, usuarios.username,
          (SELECT COUNT(*) FROM likes WHERE likes.receta_id = recetas.id) AS likes
        FROM recetas 
        LEFT JOIN recetas_categorias rc ON rc.receta_id = recetas.id 
        LEFT JOIN categorias ON categorias.id = rc.categoria_id 
        LEFT JOIN ingredientes ON ingredientes.receta_id = recetas.id
        JOIN usuarios ON usuarios.id = recetas.usuario_id
        WHERE recetas.deleted = false AND
        (recetas.nombre ILIKE $1 
        OR recetas.descripcion ILIKE $1 
        OR ingredientes.nombre ILIKE $1 
        OR categorias.nombre ILIKE $1);`, ['%' + palabraclave + '%'])
      .then(response => {
        if (response.rows.length > 0) {
          console.log(response.rows);
          res.status(200).json(response.rows)
        }
        else {
          res.status(404).json({ Error: 'No se encuentra informacion' })
        }
      })
      .catch(err => res.status(400).json({ Err: err.message }))
  } catch (e) {
    next(e);
  }
}

const searchByCategory = async (req, res, next) => {
  const { palabraclave } = req.params;
  console.log(palabraclave);
  try {
    await pool
      .query(`SELECT distinct recetas.usuario_id,recetas.id,recetas.nombre,recetas.descripcion,usuarios.username 
            FROM recetas 
            JOIN recetas_categorias rc on rc.receta_id = recetas.id 
            JOIN categorias on categorias.id = rc.categoria_id 
            JOIN ingredientes on ingredientes.receta_id = recetas.id
            JOIN usuarios on usuarios.id = recetas.usuario_id
            WHERE categorias.nombre = $1`, [palabraclave])
      .then(response => {
        if (response.rows.length > 0) {
          res.status(200).json(response.rows)
        }
        else {
          res.status(404).json({ Error: 'No se encuentra informacion' })
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
  buscarReceta,
  getPopularRecipes,
  getAllCategorias,
  getRecipeById,
  getStepsByRecipeId,
  getIngredientsByRecipeId,
  getRecipesFullByUserId,
  search,
  searchByCategory
}