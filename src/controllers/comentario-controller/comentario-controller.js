const pool = require('../../configs/db.config')

const getComentarioByRecipeId =async (req,res,next) => {
    const idReceta = req.params.id;

    try{
        await pool
            .query(`select idcomentario, comentario, nombreusuario from comentarios WHERE idreceta = ${idReceta}`)
            .then(results => {
                if(results.rows.length > 0){
                    res.status(200).json(results.rows)
                }
                else{
                    res.status(200).json([])
                }})
            .catch(err => next(err)) 
    }
    catch(err){
        next(err);
    }
      
}



const guardarComentario = async(req,res,next)=>{
    const {descripcion,usuario_id, receta_id} = req.body;
    try {
        await pool
            .query (`INSERT INTO comentarios (descripcion,usuario_id,receta_id)VALUES ($1,$2,$3) `,[descripcion,usuario_id,receta_id])
            .then(async results => {
                //const newComment = results.rows[0];
                const userResult = await pool.query(`SELECT username FROM usuarios WHERE id = $1`, [usuario_id]);
                const username = userResult.rows[0].username;
        
                res.status(201).json({
                  //idComment: newComment.id,
                  descripcion: descripcion,
                  usuarioId:usuario_id,
                  user: {username: username}
                });
              })
            .catch(err=> console.log(err.message))
    } catch (error) {
        next (error)
    }
}

const getCommentsByRecipeId = async (req, res, next) => {
    const id = req.params.id;
    try {
      await pool
        .query(`select * from comentarios where receta_id = ${id}`)
        .then(results => res.status(200).json(results.rows))
        .catch(err => next(err))
    } catch (error) {
      next(error);
    }
  }

  const eliminarComentario = async (req, res, next) => {
    const id = req.params.id;
    console.log(id)
    try {
      await pool
        .query('DELETE FROM comentarios WHERE id = $1 RETURNING descripcion', [id])
        .then(results => res.status(200).json(results.rows))
        .catch(err => next(err))
    } catch (error) {
      next(error);
    }
  }

module.exports = {
    guardarComentario,
    getComentarioByRecipeId,
    getCommentsByRecipeId,
    eliminarComentario
}