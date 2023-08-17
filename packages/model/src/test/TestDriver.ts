/**
 * Definitions of the system specs of a test driver.
 * All information is submitted voluntarily and fetching may no be supported.
 * Therefore all fields are optional.
 */
export interface TestDriverHardware {
  /**
   * CPU information.
   * A system may have multiple CPUs.
   */
  cpu?: {
    /**
     * The CPU model. Eg. Intel(R) Core(TM) i7-7700HQ CPU @ 2.80GHz
     */
    model?: string

    /**
     * The CPU vendor. Eg. Intel
     */
    vendor?: string

    /**
     * The number of physical cores.
     */
    cores?: number

    /**
     * The number of logical cores.
     */
    threads?: number

    /**
     * List of CPU capabilities.
     * Could contains values like: avx2, asimd, etc.
     */
    capabilities?: string[]
  }[]

  /**
   * Memory information.
   */
  memory?: number

  /**
   * GPU information.
   */
  gpu?: {
    model?: string
    vendor?: string
    memory?: number
  }[]

  /**
   * The vendor given model name
   */
  model?: string

  /**
   * The operating system of the system.
   */
  os?: string

  /**
   * The architecture of the system.
   */
  arch?: string
}

/**
 * A test driver is a system that can be used to run tests on.
 * It can be a physical system or a virtual machine.
 */
export interface TestDriver {
  /**
   * The name of the test driver.
   */
  name: string

  /**
   * The id of the test driver.
   */
  id: string

  /**
   * Hardware details of the test driver.
   */
  hardware: TestDriverHardware
}
