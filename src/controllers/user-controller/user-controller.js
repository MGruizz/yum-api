const pool = require('../../configs/db.config')
const jwt = require('jsonwebtoken')
require('dotenv').config();

const bcryptjs = require("bcryptjs");


const getUsersById = (req, res, next) => {
    const id = req.params.id;
    try {
        pool
            .query(`SELECT id,username,email,foto_perfil,descripcion FROM usuarios where id = ${id}`)
            .then(response => {
                if (response.rows.length == 0) {
                    res.status(401).json({ Error: 'Id no existe' });
                }
                else {
                    res.status(200).json(response.rows[0]);
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    } catch (e) {
        next(e)
    }
}

const logearUsuario = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        await pool
            .query('SELECT id, username, email, password, descripcion, foto_perfil FROM usuarios where email = $1', [email])
            .then(results => {
                if (results.rows.length > 0) {
                    const user = results.rows[0];

                    const userToken = {
                        id: user.id,
                        email: user.email,
                    }
                    bcryptjs.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            res.status(401).send(console.log(err.stack));
                        }
                        if (isMatch) {
                            const token = jwt.sign(userToken, process.env.SECRET)
                            delete user.password;
                            res.status(200).send({ user, token });
                        }
                        else {
                            res.status(401).send('Password invalida');
                        }
                    });
                }
                else {
                    res.status(404).send('El correo no se encuentra registrado');
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    }
    catch (err) {
        console.log("No se que pasa")
        next(e);
    }
}



const registrarUsuario = async (req, res, next) => {
    const { nickname, email, password } = req.body;
    const imagen = 'https://i1.sndcdn.com/avatars-000416471418-8ll5py-t240x240.jpg';
    console.log({ email, password })
    let hashPassword = await bcryptjs.hash(password, 10);
    const admin = false;
    const deleted = false;
    try {
        await pool
            .query('SELECT * FROM usuarios where email = $1', [email])
            .then(results => {
                if (results.rows.length > 0) {
                    res.status(401).send('El mail ingresado ya se encuentra en uso');
                } else {
                    pool
                        .query(`INSERT INTO usuarios (username, email, password,foto_perfil)
                        VALUES ($1, $2, $3,$4)`, [nickname, email, hashPassword, imagen])
                        .then(results => res.status(200).send({ res: 'Usuario registrado correctamente' }))
                        .catch(err => res.status(401).json({ Error: err.message }))
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    }
    catch (e) {
        console.log(e)
        next(e)
    }
}

const editarPerfil = async (req, res, next) => {
    let {nombreUsuario, descripcion } = req.body;
    let  idUsuario  = req.id
    console.log(nombreUsuario, descripcion, idUsuario);
    // if(fotoPerfil == null || fotoPerfil == ''){
    //     fotoPerfil = 'https://i1.sndcdn.com/avatars-000416471418-8ll5py-t240x240.jpg';
    // }
    try {
        await pool
            .query('UPDATE usuarios SET username = $1, descripcion = $2 where id = $3 RETURNING *', [nombreUsuario, descripcion, idUsuario])
            .then(response => {
                console.log(response.rows);
                const updatedUser = response.rows[0];

                const userForToken = {
                    username: updatedUser.username,
                    id: updatedUser.id,
                    email: updatedUser.email,
                    descripcion: updatedUser.descripcion,
                }

                const newToken = jwt.sign(userForToken, process.env.SECRET);

                res.status(200).json({ token: newToken });
            })
            .catch(err => {
                console.log(err.message );
                res.status(401).json({ Error: err.message })
            })
    }
    catch (e) {
        next(e);
    }
}


module.exports = {
    getUsersById,
    logearUsuario,
    registrarUsuario,
    editarPerfil,

}
