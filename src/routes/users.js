const {Router} = require ('express');
const user = Router();
const userExtractor = require('../middlewares/userExtractor')
const {getUsersById,logearUsuario,registrarUsuario,editarPerfil} = require('../controllers/user-controller/user-controller')

user.route('/')
    .post(registrarUsuario)
user.route('/:id')
    .get(getUsersById)
    .put(userExtractor,editarPerfil)
user.post('/login/', logearUsuario);


// user.put('/editusuario/',userExtractor,editarPerfil)


module.exports = user;