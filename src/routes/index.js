const {Router} = require ('express');
const handleError = require('../middlewares/handleError');
const router = Router();
const userExtractor = require('../middlewares/userExtractor')



const {getUsersById,logearUsuario,registrarUsuario,editarPerfil} = require('../controllers/user-controller/user-controller')
const {getAllRecipes,getRecipesByUserId,crearNuevaReceta,eliminarReceta,editarReceta,buscarReceta} = require('../controllers/recipe-controller/recipe-controller')
const {getTagsByRecipeID,getAllTags,agregarTag,eliminarTag,editarTag} = require('../controllers/tag-controller/tag-controller')
const {getComentarioByRecipeId,guardarComentario} = require('../controllers/comentario-controller/comentario-controller')


//Ruta usuario
router.get('/usuarios/:id/',getUsersById);
router.post('/login/', logearUsuario);
router.post('/usuarios/', registrarUsuario)
router.put('/editusuario/',userExtractor,editarPerfil)
//Ruta Receta
router.get('/recetas/',getAllRecipes);
router.get('/recetas/:id',getRecipesByUserId);
router.post('/recetas/',userExtractor ,crearNuevaReceta)
router.delete('/eliminarreceta/:id',userExtractor ,eliminarReceta)
router.put('/editreceta/',userExtractor ,editarReceta)
router.get('/buscarRecetas/:palabraclave',buscarReceta)
//Ruta Tag
router.get('/tags/',getAllTags);
router.get('/tags/:id',getTagsByRecipeID);
router.post('/tags/',userExtractor,agregarTag);
router.delete('/tags/:id',userExtractor,eliminarTag);
router.put('/tags/',userExtractor,editarTag);

// Ruta comentario
router.get('/comentarios/:id',getComentarioByRecipeId)
router.post('/comentarios/',userExtractor,guardarComentario)

//Not found middleware
router.use((req,res,next)=>{
    res.status(404).send({error:'Not found'})
})

router.use(handleError);


module.exports = router;