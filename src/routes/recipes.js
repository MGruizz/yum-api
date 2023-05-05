const {Router} = require ('express');
const recipes = Router();
const userExtractor = require('../middlewares/userExtractor')

const {getAllRecipes,getRecipesByUserId,crearNuevaReceta,eliminarReceta,editarReceta,buscarReceta} = require('../controllers/recipe-controller/recipe-controller')


recipes.route('/')
    .get(getAllRecipes)
    .post(crearNuevaReceta)
recipes.route('/:id')
    .get(getRecipesByUserId);

recipes.delete('/eliminarreceta/:id',userExtractor ,eliminarReceta)
recipes.put('/editreceta/',userExtractor ,editarReceta)
recipes.get('/buscarRecetas/:palabraclave',buscarReceta)

module.exports = recipes;

// recipes.post('/',userExtractor ,crearNuevaReceta)