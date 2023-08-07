import { Request, Response } from 'express'
import { Verifier } from '../services/verification/Verifier'
import { AddNodeBody, DeleteNodeBody, GroupCreateBody } from './api.types'
import { v4 as uuidv4 } from 'uuid'

export async function handleGroupCreation(req: Request, res: Response) {
  const body = GroupCreateBody.check(req.body)
  const verifier = await Verifier.new({
    id: uuidv4(),
    ...body,
  })

  await verifier.requestReplays()
  res.json(verifier.verificationGroup)
}

export async function handleGroupsFetch(req: Request, res: Response) {
  const verifier = await Verifier.all()
  const groups = verifier.map((v) => v.verificationGroup)

  res.json(groups)
}

export async function handleGroupFetch(req: Request, res: Response) {
  const verifier = await Verifier.for(req.params.id)
  res.json(verifier.verificationGroup)
}

export async function handleGroupStateFetch(req: Request, res: Response) {
  const verifier = await Verifier.for(req.params.id)
  await verifier.requestReplays()
  res.json(await verifier.getState())
}

export async function handleGroupResultFetch(req: Request, res: Response) {
  const verifier = await Verifier.for(req.params.id)
  await verifier.requestReplays()
  res.json(await verifier.getResult())
}

export async function handleGroupNodeAdd(req: Request, res: Response) {
  const body = AddNodeBody.check(req.body)
  const verifier = await Verifier.for(req.params.id)

  await verifier.addNode(body.node)
  await verifier.requestReplays()
  res.json(verifier.verificationGroup)
}

export async function handleGroupNodeDelete(req: Request, res: Response) {
  const body = DeleteNodeBody.check(req.body)
  const verifier = await Verifier.for(req.params.id)

  await verifier.deleteNode(body.node)
  res.json(verifier.verificationGroup)
}
