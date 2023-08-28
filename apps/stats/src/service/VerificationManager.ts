import { VerificationGroup } from '@ivy-chess/model'
import { store } from 'kv-store'
import { v4 as uuidv4 } from 'uuid'
import { Verification } from './Verification'

/**
 * Manager for {@link Verification} instances.
 * Provides methods to create and retrieve verifications.
 */
export class VerificationManager {
  /**
   * Creates a {@link Verification} instance for the given group.
   *
   * @param groupId The id of the group to create a verification for.
   * @returns The created verification.
   * @throws If no verification group for the given id exists.
   */
  public async verify(groupId: string): Promise<Verification> {
    const group = await store.take('stats').take('verification').take(groupId).take('config').read()

    if (!group) {
      throw new Error('No verification group for given id.')
    }

    return new Verification(group)
  }

  /**
   * Creates a new {@link Verification} instance for the given group
   * and saves it to the database.
   *
   * @param group The group to create a verification for.
   * @returns The created verification.
   */
  public async create(group: Omit<VerificationGroup, 'id'>): Promise<Verification> {
    const verification = new Verification({ ...group, id: uuidv4() })

    await verification.save()
    return verification
  }

  /**
   * Returns all {@link Verification} instances.
   *
   * @returns All verifications.
   */
  public async all(): Promise<Verification[]> {
    const keys = await store.take('stats').take('verification').keys()
    return await Promise.all(keys.map((key) => this.verify(key)))
  }
}
