const express = require('express')
const app = express()
const { MongoClient } = require('mongodb')
const https = require('https')

const uri = "mongodb://localhost:27017"
const client = new MongoClient(uri)

app.get('/parkings', async (req, res) => {
    await client.connect()

    try {
        const data = await client.db('villeNancy').collection('ville').find().toArray()
        res.send(data)
    } catch (e) {
        console.log(e)
    } finally {
        await client.close()
    }
})

app.get('/refreshdata', async (req, res) => {
    const url = "https://geoservices.grand-nancy.org/arcgis/rest/services/public/VOIRIE_Parking/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=nom%2Cadresse%2Cplaces%2Ccapacite&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson"

    https.get(url, (resp) => {
        let data = ''
        let toInsert = []

        resp.on('data', (chunk) => {
            data += chunk
        })

        resp.on('end', async () => {
            data = JSON.parse(data).features
            data.forEach(value => {
                toInsert.push({
                    x: value.geometry.x,
                    y: value.geometry.y,
                    infos: {
                        nom: value.attributes.NOM,
                        adresse: value.attributes.ADRESSE,
                        places: value.attributes.PLACES,
                        capacite: value.attributes.CAPACITE
                    }
                })
            });

            await client.connect()

            try {
                toInsert.forEach(async (value) => {
                    await client.db('villeNancy').collection('ville').insertOne(value)
                })
                res.send({ success: true })
            } catch (e) {
                console.log(e)
            }

        })
    }).on("error", (err) => {
        console.log("Error: " + err.message)
    })
    await client.close()
})

app.listen(8795, () => {
    console.log('Server started')
})