const {Router} = require ('express');
const handleError = require('../middlewares/handleError');
const router = Router();
const userExtractor = require('../middlewares/userExtractor')


const {getTagsByRecipeID,getAllTags,agregarTag,eliminarTag,editarTag} = require('../controllers/tag-controller/tag-controller')
const {getComentarioByRecipeId,guardarComentario, getCommentsByRecipeId} = require('../controllers/comentario-controller/comentario-controller')
const {getRecipesByUserId, getRecipeById, getStepsByRecipeId, getIngredientsByRecipeId,getRecipesFullByUserId} = require('../controllers/recipe-controller/recipe-controller');
const { darLike, darUnLike, verificarLike, isLiked } = require('../controllers/like-controller/like-controller');

//Ruta usuario
router.use('/usuarios',require('./users'))
//Ruta Receta
router.use('/recetas',require('./recipes'))
router.use('/recetas/:id',getRecipesByUserId)
router.get('/receta/:id',getRecipeById)
router.get('/pasos/receta/:id',getStepsByRecipeId)
router.get('/ingredientes/receta/:id',getIngredientsByRecipeId)
router.get('/imagenes/receta/:id',getRecipesFullByUserId)

//Ruta Tag
router.get('/tags/',getAllTags);
router.get('/tags/:id',getTagsByRecipeID);
router.post('/tags/',userExtractor,agregarTag);
router.delete('/tags/:id',userExtractor,eliminarTag);
router.put('/tags/',userExtractor,editarTag);

// Ruta comentario
router.get('/comentarios/:id',getComentarioByRecipeId)
router.post('/comentarios/',userExtractor,guardarComentario)
router.get('/comentarios/receta/:id',getCommentsByRecipeId)

//Not found middleware
router.use((req,res,next)=>{
    res.status(404).send({error:'Not found'})
})

router.use(handleError);


module.exports = router;