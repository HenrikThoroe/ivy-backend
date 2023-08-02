type Service = 'replay' | 'replay-log' | 'stats'

type Worker<T extends Service> = T extends 'replay'
  ? 'save' | 'fetch'
  : T extends 'replay-log'
  ? 'save'
  : T extends 'stats'
  ? 'replay'
  : never

export function queueName<T extends Service>(service: T, worker: Worker<T>) {
  return `${service}-${worker}`
}
