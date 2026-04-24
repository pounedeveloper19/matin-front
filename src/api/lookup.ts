import client from './client'
import type { ExecutionResult } from '../types'

export type IdTitle      = { id: number; title: string }
export type IdName       = { id: number; name: string; province?: string }
export type TariffOption = { tariffId: number; tariffTypeId: number; customerTypeId: number; powerEntitiesId: number }
export type SubOption    = { id: number; billIdentifier: string; address: string; customerName?: string }

export const lookupApi = {
  getCities:           () => client.get<ExecutionResult<IdTitle[]>>('/Lookup/GetCities').then(r => r.data),
  getPowerEntities:    () => client.get<ExecutionResult<IdName[]>>('/Lookup/GetPowerEntities').then(r => r.data),
  getCustomerTypes:    () => client.get<ExecutionResult<IdTitle[]>>('/Lookup/GetCustomerTypes').then(r => r.data),
  getTariffTypes:      () => client.get<ExecutionResult<IdTitle[]>>('/Lookup/GetTariffTypes').then(r => r.data),
  getContractStatuses: () => client.get<ExecutionResult<IdTitle[]>>('/Lookup/GetContractStatuses').then(r => r.data),
  getGuaranteeTypes:   () => client.get<ExecutionResult<IdTitle[]>>('/Lookup/GetGuaranteeTypes').then(r => r.data),
  getAllTariffs:        () => client.get<ExecutionResult<TariffOption[]>>('/Lookup/GetAllTariffs').then(r => r.data),
  getAllSubscriptions:  () => client.get<ExecutionResult<SubOption[]>>('/Lookup/GetAllSubscriptions').then(r => r.data),
}
