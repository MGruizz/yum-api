const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

const uploadToAzure = async (fileString, fileName) => {

    if (!fileString) {
        throw new Error('fileString no puede ser undefined');
    }

    const connectionString = process.env.AZURE_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    try {

        // Convertir string base64 en buffer
        const buffer = Buffer.from(fileString, 'base64');

        // Obtener el container que creamos
        const containerClient = blobServiceClient.getContainerClient("imagenes2");

        // Crear cliente de blob (ubicado en el container que creamos)
        const blockBlobClient = containerClient.getBlockBlobClient(fileName + ".jpg");

        // Se sube la imagen mediant e el buffer
        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: {
                blobContentType: "image/jpg",
            },
        });

        console.log("Imagen subida con éxito a Azure blob storage!!");

        return blockBlobClient.url;

    } catch (error) {
        throw new Error(`Error al subir la imagen a Azure desde la función uploadToAzure :(, Error: ${error.message}`);
    }
};

module.exports = {
    uploadToAzure,
};
