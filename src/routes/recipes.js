const {Router} = require ('express');
const recipes = Router();
const userExtractor = require('../middlewares/userExtractor')

const {getAllRecipes,getRecipesByUserId,crearNuevaReceta,eliminarReceta,editarReceta,buscarReceta,getPopularRecipes,getAllCategorias,search,searchByCategory} = require('../controllers/recipe-controller/recipe-controller');
const { likesByRecipeId } = require('../controllers/like-controller/like-controller');


recipes.route('/')
    .get(getAllRecipes)
    .post(crearNuevaReceta)
// recipes.route('/:id')
//     .get(getRecipesByUserId);
recipes.route("/recetasPopulares/")
    .get(getPopularRecipes)
recipes.route("/categorias/")
    .get(getAllCategorias)
recipes.route("/buscar/")
    .post(search)
recipes.route('/searchByCategory/:palabraclave')
    .get(searchByCategory)

// Gestion recetas
recipes.delete('/eliminarreceta/:id',userExtractor ,eliminarReceta)
recipes.put('/editreceta/',userExtractor ,editarReceta)
recipes.get('/buscarRecetas/:palabraclave',buscarReceta)
recipes.get('/likes/', likesByRecipeId); // Obtener cantidad de likes

module.exports = recipes;

// recipes.post('/',userExtractor ,crearNuevaReceta)