const pool = require('../../configs/db.config')
const jwt = require('jsonwebtoken')
require('dotenv').config();

const bcryptjs = require("bcryptjs");
const { uploadToAzure } = require('../../Services/storage');


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
            .query('SELECT id, username, email, password, descripcion, foto_perfil, is_admin FROM usuarios where email = $1', [email])
            .then(results => {
                if (results.rows.length > 0) {
                    const user = results.rows[0];

                    const userToken = {
                        id: user.id,
                        email: user.email,
                        is_admin: user.is_admin,
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
        next(e);
    }
}

const registrarUsuario = async (req, res, next) => {
    const { username, email, password } = req.body;
    const imagen = 'https://i1.sndcdn.com/avatars-000416471418-8ll5py-t240x240.jpg';
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
                        VALUES ($1, $2, $3,$4)`, [username, email, hashPassword, imagen])
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
    let { nombreUsuario, descripcion, fotoBase64 } = req.body;
    let idUsuario = req.id;

    const client = await pool.connect();

    try {

        await client.query('BEGIN');
        let values;

        const updateQuery = `
            UPDATE usuarios
            SET username = $1,
                descripcion = $2
                ${fotoBase64 ? ', foto_perfil = $4' : ''}
            WHERE id = $3
            RETURNING *;
        `;

        if (fotoBase64) {
            console.log("hola")
            const fotoPerfilUrl = await uploadToAzure(fotoBase64, 'profile_image_' + nombreUsuario);
            values = [nombreUsuario, descripcion, idUsuario, fotoPerfilUrl]
        } else {
            values = [nombreUsuario, descripcion, idUsuario];
        }

        const response = await client.query(updateQuery, values);
        const updatedUser = response.rows[0];

        const userForToken = {
            username: updatedUser.username,
            id: updatedUser.id,
            email: updatedUser.email,
            descripcion: updatedUser.descripcion,
            is_admin: updatedUser.is_admin
        };

        const newToken = jwt.sign(userForToken, process.env.SECRET);

        await client.query('COMMIT');

        res.status(200).json({ token: newToken, user: userForToken });
    } catch (e) {
        await client.query('ROLLBACK');
        console.log(e.message);
        res.status(401).json({ Error: e.message });
    } finally {
        client.release();
    }
};

const seguirUsuario = async (req, res, next) => {
    const { id_usuario_seguido, id_usuario_seguidor } = req.body;
    try {
        await pool
            .query('INSERT INTO seguidores (id_usuario_seguido, id_usuario_seguidor) VALUES ($1, $2)',
                [id_usuario_seguido, id_usuario_seguidor])
            .then(results => res.status(200).send({ res: 'Usuario seguido con éxito' }))
            .catch(err => res.status(401).json({ Error: err.message }))
    }
    catch (err) {
        next(e);
    }
}

const verificarSeguidor = async (req, res, next) => {
    const { id_usuario_seguido, id_usuario_seguidor } = req.body;
    try {
        await pool
            .query('SELECT * FROM seguidores WHERE id_usuario_seguido = $1 AND id_usuario_seguidor = $2',
                [id_usuario_seguido, id_usuario_seguidor])
            .then(results => {
                if (results.rowCount > 0) {
                    res.status(200).json({ isFollowing: true });
                } else {
                    res.status(200).json({ isFollowing: false });
                }
            })
            .catch(err => res.status(401).json({ Error: err.message }))
    }
    catch (err) {
        next(e);
    }
}

const dejarDeSeguir = async (req, res, next) => {
    const { id_usuario_seguido, id_usuario_seguidor } = req.body;

    try {
        await pool
            .query('DELETE FROM seguidores WHERE id_usuario_seguido = $1 AND id_usuario_seguidor = $2',
                [id_usuario_seguido, id_usuario_seguidor])
            .then(results => res.status(200).send({ res: 'Usuario seguido con éxito' }))
            .catch(err => res.status(401).json({ Error: err.message }))
    }
    catch (err) {

        next(e);
    }
}

const obtenerInformacionUsuario = async (req, res, next) => {
    const { id } = req.params;
    try {
        const seguidoresCount = await pool
            .query('SELECT COUNT(id_usuario_seguidor) FROM seguidores WHERE id_usuario_seguido = $1',
                [id]);

        const seguidosCount = await pool
            .query('SELECT COUNT(id_usuario_seguido) FROM seguidores WHERE id_usuario_seguidor = $1',
                [id]);

        const publicaciones = await pool
            .query('SELECT COUNT(id) FROM recetas WHERE recetas.usuario_id = $1 and recetas.deleted is false',
                [id]);

        const seguidoresList = await pool
            .query('SELECT usuarios.id, usuarios.username FROM usuarios INNER JOIN seguidores ON usuarios.id = seguidores.id_usuario_seguidor WHERE seguidores.id_usuario_seguido = $1', 
                [id]);

        const seguidosList = await pool
            .query('SELECT usuarios.id, usuarios.username FROM usuarios INNER JOIN seguidores ON usuarios.id = seguidores.id_usuario_seguido WHERE seguidores.id_usuario_seguidor = $1', 
                [id]);

        res.status(200).send({
            seguidores: {
                count: seguidoresCount.rows[0].count,
                list: seguidoresList.rows
            },
            seguidos: {
                count: seguidosCount.rows[0].count,
                list: seguidosList.rows
            },
            publicaciones: publicaciones.rows[0].count
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ Error: err.message })
    }
}



module.exports = {
    getUsersById,
    logearUsuario,
    registrarUsuario,
    editarPerfil,
    seguirUsuario,
    verificarSeguidor,
    dejarDeSeguir,
    obtenerInformacionUsuario
}
