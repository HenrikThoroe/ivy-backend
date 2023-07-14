import express from 'express'
import { analysisScope, dataScope } from './db'
import { Replay, analyseReplay } from '@ivy-chess/model'

export const router = express.Router()

router.get('/', async (req, res) => {
  const replays = await dataScope.list()
  res.json(replays)
})

router.get('/:id', async (req, res) => {
  const id = req.params.id
  const exists = await dataScope.has(id)

  if (exists) {
    const replay: Replay = await dataScope.fetch(id)
    res.json(replay)
  } else {
    res.status(404).json({ reason: `Replay with id ${id} does not exist.` })
  }
})

router.get('/:id/analysis', async (req, res) => {
  const id = req.params.id
  const exists = await analysisScope.has(id)

  if (exists) {
    const analysis = await analysisScope.fetch(id)
    res.json(analysis)
  } else {
    const replay: Replay = await dataScope.fetch(id)

    if (replay) {
      const analysis = analyseReplay(replay)
      await analysisScope.save(id, analysis)
      res.json(analysis)
    } else {
      res.status(404).json({ reason: `Replay with id ${id} does not exist.` })
    }
  }
})
