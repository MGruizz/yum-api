const ERROR_HANDLERS = {
    CastError: (res) =>
        res.status(400).send({ error: 'Id ingresada es invalida' }),

    JsonWebTokenError: (res) =>
        res.status(401).json({ error: 'Token perdido o invalido' }),

    TokenExpiredError: (res) =>
        res.status(401).json({ error: 'Token expirado' }),

    defaultError: (res) => res.status(500).end()
}

module.exports = (error, req, res, next) => {
    console.error(error.name);
    const handler =
        ERROR_HANDLERS[error.name] || ERROR_HANDLERS.defaultError;
    handler(res, error)
}