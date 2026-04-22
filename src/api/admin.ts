import client from './client'
import type {
  ExecutionResult,
  AdminLegalCustomer,
  AdminRealCustomer,
  AdminAddress,
  AdminContract,
  PaginationResult,
  MonthlyMarketRate,
  Tariff,
  TariffSlab,
  HourEntry,
  AdminBillReport,
} from '../types'

type PageParams = {
  pageNumber?: number
  pageSize?: number
  [key: string]: string | number | undefined
}

function buildParams(params: PageParams) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.append(k, String(v))
  }
  return p
}

export const adminApi = {
  // Legal customers
  getLegalCustomers: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminLegalCustomer>>>('/CustomerLegalManagement/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getLegalCustomerDetail: (id: number) =>
    client.get<ExecutionResult<AdminLegalCustomer>>(`/CustomerLegalManagement/Detail/${id}`).then((r) => r.data),

  createLegalCustomer: (data: AdminLegalCustomer) =>
    client.post<ExecutionResult>('/CustomerLegalManagement/Insert', data).then((r) => r.data),

  updateLegalCustomer: (data: AdminLegalCustomer) =>
    client.put<ExecutionResult>('/CustomerLegalManagement/Update', data).then((r) => r.data),

  deleteLegalCustomer: (id: number) =>
    client.delete<ExecutionResult>(`/CustomerLegalManagement/Delete/${id}`).then((r) => r.data),

  // Real customers
  getRealCustomers: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminRealCustomer>>>('/CustomerRealManagement/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getRealCustomerDetail: (id: number) =>
    client.get<ExecutionResult<AdminRealCustomer>>(`/CustomerRealManagement/Detail/${id}`).then((r) => r.data),

  createRealCustomer: (data: AdminRealCustomer) =>
    client.post<ExecutionResult>('/CustomerRealManagement/Insert', data).then((r) => r.data),

  updateRealCustomer: (data: AdminRealCustomer) =>
    client.put<ExecutionResult>('/CustomerRealManagement/Update', data).then((r) => r.data),

  deleteRealCustomer: (id: number) =>
    client.delete<ExecutionResult>(`/CustomerRealManagement/Delete/${id}`).then((r) => r.data),

  // Addresses
  getAddresses: (parentId?: number, params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminAddress>>>('/CustomerAddress/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, parentId, ...params }),
      })
      .then((r) => r.data),

  // Contracts
  getContracts: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminContract>>>('/AdminContract/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getContractDetail: (id: number) =>
    client.get<ExecutionResult<AdminContract>>(`/AdminContract/Detail/${id}`).then((r) => r.data),

  createContract: (data: AdminContract) =>
    client.post<ExecutionResult>('/AdminContract/Insert', data).then((r) => r.data),

  updateContract: (data: AdminContract) =>
    client.put<ExecutionResult>('/AdminContract/Update', data).then((r) => r.data),

  deleteContract: (id: number) =>
    client.delete<ExecutionResult>(`/AdminContract/Delete/${id}`).then((r) => r.data),

  // Monthly Market Rates
  getMarketRates: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<MonthlyMarketRate>>>('/MonthlyMarketRate/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getMarketRateDetail: (id: number) =>
    client.get<ExecutionResult<MonthlyMarketRate>>(`/MonthlyMarketRate/Detail/${id}`).then((r) => r.data),

  createMarketRate: (data: MonthlyMarketRate) =>
    client.post<ExecutionResult>('/MonthlyMarketRate/Insert', data).then((r) => r.data),

  updateMarketRate: (data: MonthlyMarketRate) =>
    client.put<ExecutionResult>('/MonthlyMarketRate/Update', data).then((r) => r.data),

  deleteMarketRate: (id: number) =>
    client.delete<ExecutionResult>(`/MonthlyMarketRate/Delete/${id}`).then((r) => r.data),

  // Tariffs
  getTariffs: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<Tariff>>>('/Tariff/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getTariffDetail: (id: number) =>
    client.get<ExecutionResult<Tariff>>(`/Tariff/Detail/${id}`).then((r) => r.data),

  createTariff: (data: Tariff) =>
    client.post<ExecutionResult>('/Tariff/Insert', data).then((r) => r.data),

  updateTariff: (data: Tariff) =>
    client.put<ExecutionResult>('/Tariff/Update', data).then((r) => r.data),

  deleteTariff: (id: number) =>
    client.delete<ExecutionResult>(`/Tariff/Delete/${id}`).then((r) => r.data),

  // Tariff Slabs
  getTariffSlabs: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<TariffSlab>>>('/TariffSlab/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getTariffSlabDetail: (id: number) =>
    client.get<ExecutionResult<TariffSlab>>(`/TariffSlab/Detail/${id}`).then((r) => r.data),

  createTariffSlab: (data: TariffSlab) =>
    client.post<ExecutionResult>('/TariffSlab/Insert', data).then((r) => r.data),

  updateTariffSlab: (data: TariffSlab) =>
    client.put<ExecutionResult>('/TariffSlab/Update', data).then((r) => r.data),

  deleteTariffSlab: (id: number) =>
    client.delete<ExecutionResult>(`/TariffSlab/Delete/${id}`).then((r) => r.data),

  // TOU Schedule
  getPowerEntities: () =>
    client.get<ExecutionResult<{ id: number; name: string }[]>>('/TouSchedule/GetPowerEntities').then((r) => r.data),

  getTouTypes: () =>
    client.get<ExecutionResult<{ id: number; title: string }[]>>('/TouSchedule/GetTouTypes').then((r) => r.data),

  getMonthSchedule: (powerEntityId: number, month: number) =>
    client
      .get<ExecutionResult<HourEntry[]>>('/TouSchedule/GetMonthSchedule', {
        params: { powerEntityId, month },
      })
      .then((r) => r.data),

  saveSchedule: (powerEntityId: number, month: number, hours: HourEntry[]) =>
    client
      .post<ExecutionResult>('/TouSchedule/SaveSchedule', { powerEntityId, month, hours })
      .then((r) => r.data),

  // Bill Reports (admin)
  getBillReports: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminBillReport>>>('/BillAdmin/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  deleteBillReport: (id: number) =>
    client.delete<ExecutionResult>(`/BillAdmin/Delete/${id}`).then((r) => r.data),

  adminBillAnalysis: (data: {
    subscriptionId: number
    year: number
    month: number
    peakKwh: number
    midKwh: number
    lowKwh: number
    fridayPeakKwh: number
  }) =>
    client.post<ExecutionResult>('/BillCalculation/ManualAnalysis', data).then((r) => r.data),
}
