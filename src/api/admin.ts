import client from './client'
import type {
  ExecutionResult,
  AdminLegalCustomer,
  AdminRealCustomer,
  AdminAddress,
  AdminContract,
  AdminPowerEntity,
  PaginationResult,
  MonthlyMarketRate,
  Tariff,
  TariffSlab,
  TariffCode,
  TariffCodeOption,
  TariffCodeOptionRate,
  HourEntry,
  AdminBillReport,
  BillAnalysisResult,
  PendingUser,
  AdminAnnouncement,
  AdminSubscription,
  AddTicketMessageRequest,
  UpdateTicketStatusRequest,
  AdminUser,
  AdminRole,
  SetUserRoleRequest,
  UpdateUserRequest,
  CreateAdminUserRequest,
  SetPermissionsRequest,
  AdminOrderResult,
  UpdateOrderStatusRequest,
  ConfirmPaymentRequest,
  SubmitPaymentRequest,
  ContractReportResult,
  OrderReportResult,
  PaymentReportResult,
  DashboardSummary,
  ContractByStatus,
  MonthCount,
  CustomerGrowthRow,
  DashboardMarketRate,
  ActivityRow,
  OptimizationResult,
  PortfolioOptimizationResult,
  ProfitReportResult,
  BillProfitRow,
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

  getContractPrintData: (contractId: number) =>
    client.get<ExecutionResult<any>>('/AdminContract/GetContractPrintData', { params: { contractId } }).then((r) => r.data),

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

  rejectContract: (contractId: number, reason: string | null) =>
    client.post<ExecutionResult>('/AdminContract/RejectContract', { contractId, reason }).then((r) => r.data),

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

  getBillReportsByProfile: (profileId: number) =>
    client.get<ExecutionResult<AdminBillReport[]>>(`/BillAdmin/GetByProfile/${profileId}`).then((r) => r.data),

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
    client.post<ExecutionResult<BillAnalysisResult>>('/BillCalculation/ManualAnalysis', data).then((r) => r.data),

  // Customer full detail (addresses, subscriptions, identity doc)
  getCustomerFullDetail: (profileId: number) =>
    client.get<ExecutionResult>('/Lookup/GetCustomerFullDetail', { params: { profileId } }).then((r) => r.data),

  // Admin address CRUD (parentId = customerProfileId)
  getAdminAddresses: (parentId: number, params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminAddress>>>('/CustomerAddress/List', {
        params: buildParams({ pageNumber: 1, pageSize: 50, parentId, ...params }),
      })
      .then((r) => r.data),

  getAdminAddressDetail: (id: number) =>
    client.get<ExecutionResult<AdminAddress>>(`/CustomerAddress/Detail/${id}`).then((r) => r.data),

  createAdminAddress: (parentId: number, data: Omit<AdminAddress, 'id' | 'city' | 'province'> & Record<string, unknown>) =>
    client.post<ExecutionResult>('/CustomerAddress/Insert',
      { id: 0, customerProfileId: parentId, ...data },
      { params: { parentId } }
    ).then((r) => r.data),

  updateAdminAddress: (data: AdminAddress) =>
    client.put<ExecutionResult>('/CustomerAddress/Update', data).then((r) => r.data),

  deleteAdminAddress: (id: number) =>
    client.delete<ExecutionResult>(`/CustomerAddress/Delete/${id}`).then((r) => r.data),

  // Admin subscription CRUD (parentId = customerProfileId)
  getAdminSubscriptions: (parentId: number, params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminSubscription>>>('/AdminSubscription/List', {
        params: buildParams({ pageNumber: 1, pageSize: 50, parentId, ...params }),
      })
      .then((r) => r.data),

  getAdminSubscriptionDetail: (id: number) =>
    client.get<ExecutionResult<AdminSubscription>>(`/AdminSubscription/Detail/${id}`).then((r) => r.data),

  createAdminSubscription: (data: AdminSubscription) =>
    client.post<ExecutionResult>('/AdminSubscription/Insert', data).then((r) => r.data),

  updateAdminSubscription: (data: AdminSubscription) =>
    client.put<ExecutionResult>('/AdminSubscription/Update', data).then((r) => r.data),

  deleteAdminSubscription: (id: number) =>
    client.delete<ExecutionResult>(`/AdminSubscription/Delete/${id}`).then((r) => r.data),

  // Announcements
  getAnnouncements: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminAnnouncement>>>('/Announcement/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getAnnouncementDetail: (id: number) =>
    client.get<ExecutionResult<AdminAnnouncement>>(`/Announcement/Detail/${id}`).then((r) => r.data),

  createAnnouncement: (data: AdminAnnouncement) =>
    client.post<ExecutionResult>('/Announcement/Insert', data).then((r) => r.data),

  updateAnnouncement: (data: AdminAnnouncement) =>
    client.put<ExecutionResult>('/Announcement/Update', data).then((r) => r.data),

  deleteAnnouncement: (id: number) =>
    client.delete<ExecutionResult>(`/Announcement/Delete/${id}`).then((r) => r.data),

  // Admin Tickets
  getAdminTickets: () =>
    client.get<ExecutionResult>('/AdminTicket/GetAll').then((r) => r.data),

  getAdminTicketMessages: (ticketId: number) =>
    client.get<ExecutionResult>('/AdminTicket/GetMessages', { params: { ticketId } }).then((r) => r.data),

  replyTicket: (data: AddTicketMessageRequest) =>
    client.post<ExecutionResult>('/AdminTicket/Reply', data).then((r) => r.data),

  setTicketStatus: (data: UpdateTicketStatusRequest) =>
    client.put<ExecutionResult>('/AdminTicket/SetStatus', data).then((r) => r.data),

  // TOU copy
  copyTouFromMonth: (powerEntityId: number, sourceMonth: number, targetMonth: number) =>
    client.post<ExecutionResult>('/TouSchedule/CopyFromMonth', { powerEntityId, sourceMonth, targetMonth }).then((r) => r.data),

  // Power Entities
  getPowerEntitiesAdmin: (params: PageParams = {}) =>
    client
      .get<ExecutionResult<PaginationResult<AdminPowerEntity>>>('/PowerEntity/List', {
        params: buildParams({ pageNumber: 1, pageSize: 10, ...params }),
      })
      .then((r) => r.data),

  getPowerEntityDetail: (id: number) =>
    client.get<ExecutionResult<AdminPowerEntity>>(`/PowerEntity/Detail/${id}`).then((r) => r.data),

  createPowerEntity: (data: AdminPowerEntity) =>
    client.post<ExecutionResult>('/PowerEntity/Insert', data).then((r) => r.data),

  updatePowerEntity: (data: AdminPowerEntity) =>
    client.put<ExecutionResult>('/PowerEntity/Update', data).then((r) => r.data),

  deletePowerEntity: (id: number) =>
    client.delete<ExecutionResult>(`/PowerEntity/Delete/${id}`).then((r) => r.data),

  // TariffCode CRUD
  getTariffCodes: (params: PageParams = {}) =>
    client.get<ExecutionResult<PaginationResult<TariffCode>>>('/TariffCode/List', {
      params: buildParams({ pageNumber: 1, pageSize: 50, ...params }),
    }).then(r => r.data),

  getTariffCodeDetail: (id: number) =>
    client.get<ExecutionResult<TariffCode>>(`/TariffCode/Detail/${id}`).then(r => r.data),

  createTariffCode: (data: TariffCode) =>
    client.post<ExecutionResult>('/TariffCode/Insert', data).then(r => r.data),

  updateTariffCode: (data: TariffCode) =>
    client.put<ExecutionResult>('/TariffCode/Update', data).then(r => r.data),

  deleteTariffCode: (id: number) =>
    client.delete<ExecutionResult>(`/TariffCode/Delete/${id}`).then(r => r.data),

  // TariffCodeOption CRUD
  getTariffCodeOptions: (params: PageParams = {}) =>
    client.get<ExecutionResult<PaginationResult<TariffCodeOption>>>('/TariffCodeOption/List', {
      params: buildParams({ pageNumber: 1, pageSize: 100, ...params }),
    }).then(r => r.data),

  getTariffCodeOptionDetail: (id: number) =>
    client.get<ExecutionResult<TariffCodeOption>>(`/TariffCodeOption/Detail/${id}`).then(r => r.data),

  createTariffCodeOption: (data: TariffCodeOption) =>
    client.post<ExecutionResult>('/TariffCodeOption/Insert', data).then(r => r.data),

  updateTariffCodeOption: (data: TariffCodeOption) =>
    client.put<ExecutionResult>('/TariffCodeOption/Update', data).then(r => r.data),

  deleteTariffCodeOption: (id: number) =>
    client.delete<ExecutionResult>(`/TariffCodeOption/Delete/${id}`).then(r => r.data),

  // TariffCodeOptionRate CRUD
  getTariffCodeOptionRates: (params: PageParams = {}) =>
    client.get<ExecutionResult<PaginationResult<TariffCodeOptionRate>>>('/TariffCodeOptionRate/List', {
      params }).then(r => r.data),

  getTariffCodeOptionRateDetail: (id: number) =>
    client.get<ExecutionResult<TariffCodeOptionRate>>(`/TariffCodeOptionRate/Detail/${id}`).then(r => r.data),

  createTariffCodeOptionRate: (data: TariffCodeOptionRate) =>
    client.post<ExecutionResult>('/TariffCodeOptionRate/Insert', data).then(r => r.data),

  updateTariffCodeOptionRate: (data: TariffCodeOptionRate) =>
    client.put<ExecutionResult>('/TariffCodeOptionRate/Update', data).then(r => r.data),

  deleteTariffCodeOptionRate: (id: number) =>
    client.delete<ExecutionResult>(`/TariffCodeOptionRate/Delete/${id}`).then(r => r.data),

  // User Management
  getUsers: (params: PageParams = {}) =>
    client.get<ExecutionResult<PaginationResult<AdminUser>>>('/AdminUserManagement/List', {
      params: buildParams({ pageNumber: 1, pageSize: 20, ...params }),
    }).then(r => r.data),

  updateUser: (data: UpdateUserRequest) =>
    client.put<ExecutionResult>('/AdminUserManagement/UpdateUser', data).then(r => r.data),

  setUserRole: (data: SetUserRoleRequest) =>
    client.put<ExecutionResult>('/AdminUserManagement/SetRole', data).then(r => r.data),

  toggleUserActive: (userId: number) =>
    client.put<ExecutionResult>(`/AdminUserManagement/ToggleActive/${userId}`, {}).then(r => r.data),

  createAdminUser: (data: CreateAdminUserRequest) =>
    client.post<ExecutionResult>('/AdminUserManagement/CreateAdmin', data).then(r => r.data),

  // Role Management
  getRoles: () =>
    client.get<ExecutionResult<AdminRole[]>>('/AdminRole/List').then(r => r.data),

  createRole: (data: { title: string; description?: string }) =>
    client.post<ExecutionResult>('/AdminRole/Create', data).then(r => r.data),

  updateRole: (data: { id: number; title: string; description?: string }) =>
    client.put<ExecutionResult>('/AdminRole/Update', data).then(r => r.data),

  deleteRole: (id: number) =>
    client.delete<ExecutionResult>(`/AdminRole/Delete/${id}`).then(r => r.data),

  getRolePermissions: (roleId: number) =>
    client.get<ExecutionResult<number[]>>(`/AdminRole/GetPermissions/${roleId}`).then(r => r.data),

  setRolePermissions: (data: SetPermissionsRequest) =>
    client.put<ExecutionResult>('/AdminRole/SetPermissions', data).then(r => r.data),

  // Orders (Admin)
  getAdminOrders: (params: PageParams = {}) =>
    client.get<ExecutionResult<PaginationResult<AdminOrderResult>>>(
      '/AdminOrder/GetList',
      { params: buildParams({ pageNumber: 1, pageSize: 20, ...params }) }
    ).then(r => r.data),

  getAdminOrderDetail: (id: number) =>
    client.get<ExecutionResult<AdminOrderResult>>(`/AdminOrder/GetDetail/${id}`).then(r => r.data),

  updateOrderStatus: (data: UpdateOrderStatusRequest) =>
    client.put<ExecutionResult>('/AdminOrder/UpdateStatus', data).then(r => r.data),

  confirmPayment: (data: ConfirmPaymentRequest) =>
    client.put<ExecutionResult>('/AdminOrder/ConfirmPayment', data).then(r => r.data),

  submitPaymentForOrder: (data: SubmitPaymentRequest) =>
    client.post<ExecutionResult>('/AdminOrder/SubmitPaymentForOrder', data).then(r => r.data),

  getProformaInvoice: (orderId: number) =>
    client.get<ExecutionResult>('/AdminOrder/GetProformaInvoice', { params: { orderId } }).then(r => r.data),

  // Pending registrations
  getPendingUsers: () =>
    client.get<ExecutionResult<PendingUser[]>>('/PendingUsers/List').then((r) => r.data),

  activateUser: (userId: number) =>
    client.put<ExecutionResult>(`/PendingUsers/Activate/${userId}`, {}).then((r) => r.data),

  rejectUser: (userId: number) =>
    client.delete<ExecutionResult>(`/PendingUsers/Reject/${userId}`).then((r) => r.data),

  // Reports
  getContractReport: (params?: { search?: string; statusId?: number; fromDate?: string; toDate?: string }) =>
    client.get<ExecutionResult<ContractReportResult>>('/AdminReport/ContractReport', { params }).then(r => r.data),

  getOrderReport: (params?: { statusId?: number; energyTypeId?: number; isPriceRequest?: boolean; fromDate?: string; toDate?: string }) =>
    client.get<ExecutionResult<OrderReportResult>>('/AdminReport/OrderReport', { params }).then(r => r.data),

  getPaymentReport: (params?: { statusId?: number; methodId?: number; fromDate?: string; toDate?: string }) =>
    client.get<ExecutionResult<PaymentReportResult>>('/AdminReport/PaymentReport', { params }).then(r => r.data),

  // Bill analysis (admin-side)
  getBillAnalysisSubscriptions: (profileId: number) =>
    client.get<ExecutionResult<any[]>>(`/AdminBillAnalysis/GetSubscriptions/${profileId}`).then(r => r.data),

  adminAdvancedBillAnalysis: (data: object) =>
    client.post<ExecutionResult<any>>('/BillCalculation/AdvancedAnalysis', data).then(r => r.data),

  adminOptimalPurchaseCurve: (data: object) =>
    client.post<ExecutionResult<any>>('/BillCalculation/ManualOptimalPurchaseCurve', data).then(r => r.data),

  adminAdvancedOptimalPurchaseCurve: (data: object) =>
    client.post<ExecutionResult<any>>('/BillCalculation/AdvancedOptimalPurchaseCurve', data).then(r => r.data),

  adminGetRecommendation: (data: object) =>
    client.post<ExecutionResult<OptimizationResult>>('/BillCalculation/GetRecommendation', data).then(r => r.data),

  adminGetOptimalPortfolio: (data: object) =>
    client.post<ExecutionResult<PortfolioOptimizationResult>>('/BillCalculation/GetOptimalPortfolio', data).then(r => r.data),

  createOrderForCustomer: (data: { subscriptionId: number; requestedKwh: number; energyTypeId: number; isPriceRequest: boolean }) =>
    client.post<ExecutionResult<number>>('/AdminOrder/CreateOrderForCustomer', data).then(r => r.data),

  // Dashboard
  getDashboardSummary: () =>
    client.get<ExecutionResult<DashboardSummary>>('/AdminDashboard/Summary').then(r => r.data),

  getDashboardContractsByStatus: () =>
    client.get<ExecutionResult<ContractByStatus[]>>('/AdminDashboard/ContractsByStatus').then(r => r.data),

  getDashboardContractGrowth: () =>
    client.get<ExecutionResult<MonthCount[]>>('/AdminDashboard/ContractGrowth').then(r => r.data),

  getDashboardCustomerGrowth: () =>
    client.get<ExecutionResult<CustomerGrowthRow[]>>('/AdminDashboard/CustomerGrowth').then(r => r.data),

  getDashboardMarketRates: () =>
    client.get<ExecutionResult<DashboardMarketRate[]>>('/AdminDashboard/MarketRates').then(r => r.data),

  getDashboardRecentActivity: () =>
    client.get<ExecutionResult<ActivityRow[]>>('/AdminDashboard/RecentActivity').then(r => r.data),

  // Tooltips
  getTooltips: () =>
    client.get<ExecutionResult<any[]>>('/AdminTooltip/GetList').then(r => r.data),

  createTooltip: (data: { pageKey: string; fieldKey: string; title: string; content: string; isActive: boolean }) =>
    client.post<ExecutionResult>('/AdminTooltip/Insert', data).then(r => r.data),

  updateTooltip: (data: { id: number; pageKey: string; fieldKey: string; title: string; content: string; isActive: boolean }) =>
    client.put<ExecutionResult>('/AdminTooltip/Update', data).then(r => r.data),

  deleteTooltip: (id: number) =>
    client.delete<ExecutionResult>(`/AdminTooltip/Delete/${id}`).then(r => r.data),

  // Profit / Savings report
  getProfitAvailableYears: () =>
    client.get<ExecutionResult<number[]>>('/BillAdmin/GetAvailableYears').then(r => r.data),

  getCustomerNames: () =>
    client.get<ExecutionResult<{ profileId: number; customerName: string }[]>>('/BillAdmin/GetCustomerNames').then(r => r.data),

  getAllProfitSummary: (params: { pageNumber?: number; pageSize?: number; fromYear?: number; fromMonth?: number; toYear?: number; toMonth?: number; customerName?: string } = {}) =>
    client.get<ExecutionResult<PaginationResult<BillProfitRow>>>('/BillAdmin/GetAllProfitSummary', { params }).then(r => r.data),

  getProfitReport: (profileId: number) =>
    client.get<ExecutionResult<ProfitReportResult>>(`/BillAdmin/GetProfitReport/${profileId}`).then(r => r.data),
}
