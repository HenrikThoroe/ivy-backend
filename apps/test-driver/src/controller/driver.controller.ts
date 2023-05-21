import { Request, Response } from 'express'
import { TestClient } from '../services/session.service'
import { TestDriver } from 'model'

export async function handleDriverList(req: Request, res: Response) {
  const clients = TestClient.store.list()
  const drivers: TestDriver[] = clients.map((c) => c.driver)

  res.json(drivers)
}

export async function handleDriverFetch(req: Request, res: Response) {
  const id = req.params.id

  try {
    const driver = TestClient.store.fetch(id)
    res.json(driver)
  } catch {
    res.status(404).json({ reason: `Test driver with id ${id} does not exist.` })
  }
}
