type Service = 'replay' | 'replay-log'

type Worker<T extends Service> = T extends 'replay'
  ? 'save'
  : T extends 'replay-log'
  ? 'save'
  : never

export function queueName<T extends Service>(service: T, worker: Worker<T>) {
  return `${service}-${worker}`
}
