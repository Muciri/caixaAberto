import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { AppError } from '../errors/app-error.js';
import * as organizationService from '../services/organizationService.js';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string | number | bigint;
  };
};

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    error: 'Informe uma data no formato YYYY-MM-DD.',
  });

const createOrganizationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    description: z.string().trim().min(1).max(5000),
    managementStart: dateOnlySchema,
    managementEnd: dateOnlySchema,
  })
  .strict();

const updateOrganizationParamsSchema = z.object({
  id: z.string().regex(/^[1-9]\d*$/, {
    error: 'ID de organização inválido.',
  }),
});

const updateOrganizationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
    managementStart: dateOnlySchema.optional(),
    managementEnd: dateOnlySchema.optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, {
    error: 'Informe pelo menos um campo para atualizar.',
  });

function getAuthenticatedUserId(request: Request): bigint {
  const rawId = (request as AuthenticatedRequest).user?.id;

  if (rawId === undefined || rawId === null) {
    throw new AppError(401, 'Usuário não autenticado.');
  }

  const value = String(rawId);

  if (!/^[1-9]\d*$/.test(value)) {
    throw new AppError(401, 'Identificador do usuário inválido.');
  }

  return BigInt(value);
}

export async function createOrganization(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createOrganizationBodySchema.parse(request.body);

    const result = await organizationService.createOrganization({
      ...body,
      creatorUserId: getAuthenticatedUserId(request),
    });

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateOrganization(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = updateOrganizationParamsSchema.parse(request.params);
    const body = updateOrganizationBodySchema.parse(request.body);

    const result = await organizationService.updateOrganization(
      BigInt(params.id),
      body,
    );

    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}