// Generic command handler interface
export interface ICommandHandler<Command, Result> {
  handle(command: Command): Promise<Result>;
}
