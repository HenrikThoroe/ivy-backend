export class CRUDStore<T extends CRUD> {
  private instances: T[] = []
  private map = new Map<string, T>()

  public save(instance: T) {
    if (this.instances.includes(instance)) {
      return
    }

    this.instances.push(instance)

    if (instance.id) {
      this.map.set(instance.id, instance)
    }
  }

  public delete(instance: T) {
    const index = this.instances.indexOf(instance)

    if (index !== -1) {
      this.instances.splice(index, 1)
    }

    if (instance.id) {
      this.map.delete(instance.id)
    }
  }

  public fetch(id: string): T | undefined {
    return this.map.get(id)
  }

  public list(): T[] {
    return this.instances
  }

  public clear() {
    this.instances = []
    this.map.clear()
  }

  public count(): number {
    return this.instances.length
  }

  public countBy(filter: (instance: T) => boolean): number {
    return this.instances.filter(filter).length
  }

  public filter(filter: (instance: T) => boolean): T[] {
    return this.instances.filter(filter)
  }

  public find(filter: (instance: T) => boolean): T | undefined {
    return this.instances.find(filter)
  }
}

export abstract class CRUD {
  public store: CRUDStore<this>

  constructor(store: CRUDStore<any>) {
    this.store = store
  }

  public get id(): string | undefined {
    return undefined
  }

  public delete() {
    this.store.delete(this)
  }

  public save() {
    this.store.save(this)
  }
}
