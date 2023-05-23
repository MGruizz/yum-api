const {Router} = require ('express');
const user = Router();
const userExtractor = require('../middlewares/userExtractor')
const {getUsersById,logearUsuario,registrarUsuario,editarPerfil,seguirUsuario,verificarSeguidor,dejarDeSeguir} = require('../controllers/user-controller/user-controller');
const { darLike, darUnLike, isLiked, likesByRecipeId } = require('../controllers/like-controller/like-controller');

user.route('/')
    .post(registrarUsuario)
user.route('/:id')
    .get(getUsersById)
    .put(userExtractor,editarPerfil)
user.post('/login/', logearUsuario);

// user.put('/editusuario/',userExtractor,editarPerfil)
user.put('/editusuario/',userExtractor,editarPerfil);
user.post('/follow/', seguirUsuario);
user.post('/follow/check/', verificarSeguidor);
user.post('/unfollow/', dejarDeSeguir);

// Likes
user.post('/receta/like/', darLike);
user.post('/receta/unlike/', darUnLike);
user.post('/receta/isliked/', isLiked); // Verificar si ya tiene like por parte del usuario logueado

module.exports = user;