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
    const {comentario,nombreAutor, idReceta} = req.body;
    try {
        await pool
            .query (`INSERT INTO comentarios (comentario,nombreusuario, idreceta)VALUES ($1,$2,$3) `,[comentario,nombreAutor,idReceta])
            .then(results => {
                res.status(201).json({res:'Insersion exitosa'});
            })
            .catch(err=> console.log(err.message))
    } catch (error) {
        next (error)
    }
}

module.exports = {
    guardarComentario,
    getComentarioByRecipeId
}