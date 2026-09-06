import { ApoioApplicationError } from '../errors/apoio-application.error.js';
import type {
  ApoioRepository,
  ApoioWriteInput,
  ListApoiosInput,
  PaginatedApoios,
} from '../ports/apoio.repository.js';
import {
  validateHorarios,
  type PublicApoio,
} from '../../../domain/radar-apoio/entities/apoio.entity.js';
export class ListApoiosUseCase {
  constructor(private readonly repo: ApoioRepository) {}
  execute(input: ListApoiosInput): Promise<PaginatedApoios> {
    return this.repo.list(input);
  }
}
export class GetApoioUseCase {
  constructor(private readonly repo: ApoioRepository) {}
  async execute(id: string, onlyActive = false): Promise<PublicApoio> {
    const item = await this.repo.findById(id, onlyActive);
    if (!item)
      throw new ApoioApplicationError('NOT_FOUND', 'Apoio nao encontrado.');
    return item;
  }
}
export class CreateApoioUseCase {
  constructor(private readonly repo: ApoioRepository) {}
  execute(input: ApoioWriteInput): Promise<PublicApoio> {
    validateHorarios(input.horarios);
    return this.repo.create(input);
  }
}
export class UpdateApoioUseCase {
  constructor(private readonly repo: ApoioRepository) {}
  async execute(
    id: string,
    input: Partial<ApoioWriteInput>,
  ): Promise<PublicApoio> {
    if (!(await this.repo.findById(id)))
      throw new ApoioApplicationError('NOT_FOUND', 'Apoio nao encontrado.');
    if (input.horarios) validateHorarios(input.horarios);
    return this.repo.update(id, input);
  }
}
export class DeactivateApoioUseCase {
  constructor(private readonly repo: ApoioRepository) {}
  async execute(id: string): Promise<void> {
    if (!(await this.repo.findById(id)))
      throw new ApoioApplicationError('NOT_FOUND', 'Apoio nao encontrado.');
    await this.repo.deactivate(id);
  }
}
