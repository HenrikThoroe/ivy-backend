type Service = 'replay'

type Worker<T extends Service> = T extends 'replay' ? 'save' : never

export function queueName<T extends Service>(service: T, worker: Worker<T>) {
  return `${service}-${worker}`
}
