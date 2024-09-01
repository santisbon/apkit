import { Sequelize } from 'sequelize' // ORM tool for Postgres, MySQL, MariaDB, SQLite, DB2, Microsoft SQL Server, and Snowflake
import express from 'express'
import { ActivityDistributor } from './activitydistributor.js'
import { ActivityPubClient } from './activitypubclient.js'
import { ActorStorage } from './actorstorage.js'
import { BotDataStorage } from './botdatastorage.js'
import { KeyStorage } from './keystorage.js'
import { ObjectStorage } from './objectstorage.js'
import { UrlFormatter } from './urlformatter.js'
import { HTTPSignature } from './signaturevalidator.js'
import serverRouter from './routes/server.js'
import inboxRouter from './routes/inbox.js'
import { RemoteKeyStorage } from './remotekeystorage.js'
import Logger from 'pino' // Very low overhead Node.js logger
import HTTPLogger from 'pino-http' // High-speed HTTP logger for Node.js

export async function makeApp (databaseUrl, origin, bots) {
  const app = express()
  const connection = new Sequelize(databaseUrl, { logging: false })
  const formatter = new UrlFormatter(origin)
  const actorStorage = new ActorStorage(connection, formatter)
  await actorStorage.initialize()
  const botDataStorage = new BotDataStorage(connection)
  await botDataStorage.initialize()
  const keyStorage = new KeyStorage(connection)
  await keyStorage.initialize()
  const objectStorage = new ObjectStorage(connection)
  await objectStorage.initialize()
  const client = new ActivityPubClient(keyStorage, formatter)
  const remoteKeyStorage = new RemoteKeyStorage(client, connection)
  await remoteKeyStorage.initialize()
  const signature = new HTTPSignature(remoteKeyStorage)
  const distributor = new ActivityDistributor(
    client,
    formatter,
    actorStorage
  )
  const logger = Logger()
  app.locals = {
    connection,
    formatter,
    actorStorage,
    botDataStorage,
    keyStorage,
    objectStorage,
    remoteKeyStorage,
    client,
    distributor,
    signature,
    logger
  }

  app.use(HTTPLogger({ logger }))
  app.use(signature.authenticate.bind(signature))

  app.use('/', serverRouter)
  app.use('/', inboxRouter)

  app.use((err, req, res, next) => {
    console.error(err)
    res.status(500)
    res.type('text/plain')
    res.send(err.message)
  })
  return app
}
