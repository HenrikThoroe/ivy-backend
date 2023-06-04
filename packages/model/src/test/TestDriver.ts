export interface TestDriverHardware {
  cpu?: {
    model?: string
    vendor?: string
    cores?: number
    threads?: number
    capabilities?: string[]
  }[]
  memory?: number
  gpu?: {
    model?: string
    vendor?: string
    memory?: number
  }[]
  model?: string
  os?: string
  arch?: string
}

export interface TestDriver {
  name: string
  id: string
  hardware: TestDriverHardware
}
