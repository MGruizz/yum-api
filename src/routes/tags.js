const {Router} = require ('express');
const tag = Router();
const userExtractor = require('../middlewares/userExtractor')
const {getTagsByRecipeID,getAllTags,agregarTag,eliminarTag,editarTag,getPopularTags} = require('../controllers/tag-controller/tag-controller')

tag.route('/')

tag.route('/popularTags/')
    .get(getPopularTags)

module.exports = tag;