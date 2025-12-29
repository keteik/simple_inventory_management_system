export interface ICommandHandler<Command, Result> {
  handle(command: Command): Promise<Result>;
}