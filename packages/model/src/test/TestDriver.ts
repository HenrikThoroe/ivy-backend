export interface TestDriverHardware {
  cpu?: string
  cores?: number
  memory?: number
  gpu?: string
  frequency?: number
  model?: string
}

export interface TestDriver {
  name: string
  id: string
  hardware: TestDriverHardware
}
