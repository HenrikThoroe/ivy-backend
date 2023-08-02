import express from 'express'
import { analysisScope, dataScope, logScope } from './db'
import { Replay, ReplayLog, analyseReplay } from '@ivy-chess/model'
import { FilterOptionsBody, fetch } from './service'

export const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const options = FilterOptionsBody.check(req.query)
    const replays = await fetch(options)

    res.json(replays)
  } catch (e) {
    res.status(400).send()
  }
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

router.get('/:id/logs', async (req, res) => {
  const id = req.params.id
  const exists = await logScope.has(id)

  if (exists) {
    const logs: ReplayLog = await logScope.fetch(id)
    res.json(logs)
  } else {
    res.status(404).json({ reason: `Replay with id ${id} has no logs.` })
  }
})