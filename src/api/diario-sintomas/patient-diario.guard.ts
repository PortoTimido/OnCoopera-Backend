import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../usuario-autenticacao/auth.request.js';

@Injectable()
export class PatientDiarioGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.auth?.tipo !== 'PACIENTE')
      throw new ForbiddenException(
        'Esta funcionalidade é exclusiva de pacientes.',
      );
    return true;
  }
}
