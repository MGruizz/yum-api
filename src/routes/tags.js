const {Router} = require ('express');
const tag = Router();
const userExtractor = require('../middlewares/userExtractor')
const {getTagsByRecipeID,getAllTags,agregarTag,eliminarTag,editarTag,getPopularTags} = require('../controllers/tag-controller/tag-controller')

tag.route('/')
    .post(agregarTag)

tag.route('/popularTags/')
    .get(getPopularTags)

tag.route('/tagsPorReceta/:id')
    .get(getTagsByRecipeID)

module.exports = tag;