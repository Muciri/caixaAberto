import type {
  //CreateOrganizationData,
  UpdateOrganizationData,
} from '../repositories/organizationRepository.js';
import { formatCivilDate, todayCivilDate } from '../domain/civil-date.js';
import { AppError } from '../errors/app-error.js';
import * as organizationRepository from '../repositories/organizationRepository.js';

const INVALID_DATE = 'Data inválida. Utilize o formato YYYY-MM-DD.';
const INVALID_PERIOD = 'A data inicial da gestão deve ser anterior ou igual à data final.';
const ORGANIZATION_NOT_FOUND = 'Organização não encontrada.';
const INACTIVE_CREATOR = 'Somente um usuário ativo pode criar uma organização.';

type CreateOrganizationInput = {
  name: string;
  description: string;
  managementStart: string;
  managementEnd: string;
  creatorUserId: bigint;
};

export type UpdateOrganizationInput = {
  name?: string;
  description?: string;
  managementStart?: string;
  managementEnd?: string;
};

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AppError(400, INVALID_DATE);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(400, INVALID_DATE);
  }

  return date;
}

function formatOrganization(organization: {
  id: bigint;
  name: string;
  description: string | null;
  managementStart: Date;
  managementEnd: Date;
  transparencyActive: boolean;
  publicLink: string | null;
}) {
  return {
    id: organization.id.toString(),
    name: organization.name,
    description: organization.description,
    managementStart: formatCivilDate(organization.managementStart),
    managementEnd: formatCivilDate(organization.managementEnd),
    transparencyActive: organization.transparencyActive,
    publicLink: organization.publicLink,
  };
}

function validatePeriod(start: Date, end: Date): void {
  if (start > end) {
    throw new AppError(400, INVALID_PERIOD);
  }
}

export async function createOrganization(input: CreateOrganizationInput) {
  const creator = await organizationRepository.findActiveUserById(input.creatorUserId);

  if (!creator) {
    throw new AppError(401, INACTIVE_CREATOR);
  }

  const managementStart = parseDateOnly(input.managementStart);
  const managementEnd = parseDateOnly(input.managementEnd);

  validatePeriod(managementStart, managementEnd);

  const created = await organizationRepository.createWithTreasurer({
    name: input.name,
    description: input.description,
    managementStart,
    managementEnd,
    creatorUserId: input.creatorUserId,
    linkedAt: todayCivilDate(),
  });

  return {
    organizacao: formatOrganization(created.organization),
    vinculoCriador: {
      id: created.membership.id.toString(),
      papel: created.membership.role,
      dataVinculo: formatCivilDate(created.membership.linkedAt),
      ativo: created.membership.active,
    },
  };
}

export async function updateOrganization(organizationId: bigint, input: UpdateOrganizationInput) {
  const current = await organizationRepository.findById(organizationId);

  if (!current) {
    throw new AppError(404, ORGANIZATION_NOT_FOUND);
  }

  const managementStart =
    input.managementStart !== undefined
      ? parseDateOnly(input.managementStart)
      : current.managementStart;

  const managementEnd =
    input.managementEnd !== undefined ? parseDateOnly(input.managementEnd) : current.managementEnd;

  validatePeriod(managementStart, managementEnd);

  const data: UpdateOrganizationData = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.managementStart !== undefined) {
    data.managementStart = managementStart;
  }

  if (input.managementEnd !== undefined) {
    data.managementEnd = managementEnd;
  }

  const updated = await organizationRepository.updateById(organizationId, data);

  return formatOrganization(updated);
}
