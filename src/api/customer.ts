import client from './client'
import type {
  ExecutionResult,
  CustomerReal,
  CustomerLegal,
  AddAddress,
  CustomerAgent,
  ContractResult,
  SubmitWarrantyRequest,
  BillAnalysisResult,
  OptimalPurchaseCurveResult,
  ManualBillRequest,
  AdvancedBillAnalysisResult,
  TicketSummary,
  TicketMessage,
  AddressResult,
  SubscriptionResult,
  AddSubscriptionRequest,
  PublicRegisterReal,
  PublicRegisterLegal,
  AnnouncementItem,
  CreateTicketRequest,
  AddTicketMessageRequest,
  OrderResult,
  OrderDetailResult,
  CreateOrderRequest,
  SubmitPaymentRequest,
} from '../types'

export const customerApi = {
  // Public registration (no auth)
  publicRegisterReal: (data: PublicRegisterReal) =>
    client.post<ExecutionResult>('/PublicRegistration/RegisterReal', data).then((r) => r.data),

  publicRegisterLegal: (data: PublicRegisterLegal) =>
    client.post<ExecutionResult>('/PublicRegistration/RegisterLegal', data).then((r) => r.data),

  // Profile
  getCustomer: () =>
    client.get<ExecutionResult<CustomerReal | CustomerLegal>>('/CustomerProfile/GetLegalCustomer').then((r) => r.data),

  registerReal: (data: CustomerReal) =>
    client.post<ExecutionResult>('/CustomerProfile/RegisterRealCustomer', data).then((r) => r.data),

  registerLegal: (data: CustomerLegal) =>
    client.post<ExecutionResult>('/CustomerProfile/RegisterLegalCustomer', data).then((r) => r.data),

  getContractPrintData: (contractId: number) =>
    client.get<ExecutionResult<any>>('/AdminContract/GetContractPrintData', { params: { contractId } }).then((r) => r.data),

  // Addresses
  getAddresses: () =>
    client.get<ExecutionResult<AddressResult[]>>('/CustomerProfile/GetCustomerAddresses').then((r) => r.data),

  addAddress: (data: AddAddress) =>
    client.post<ExecutionResult>('/CustomerProfile/AddAddress', data).then((r) => r.data),

  // Subscriptions
  getSubscriptions: () =>
    client.get<ExecutionResult<SubscriptionResult[]>>('/CustomerProfile/GetSubscriptions').then((r) => r.data),

  addSubscription: (data: AddSubscriptionRequest) =>
    client.post<ExecutionResult>('/CustomerProfile/AddSubscription', data).then((r) => r.data),

  // Update profile
  updateReal: (data: CustomerReal) =>
    client.put<ExecutionResult>('/CustomerProfile/UpdateRealCustomer', data).then((r) => r.data),

  updateLegal: (data: CustomerLegal) =>
    client.put<ExecutionResult>('/CustomerProfile/UpdateLegalCustomer', data).then((r) => r.data),

  // Agent
  getAgent: () =>
    client.get<ExecutionResult<CustomerAgent>>('/CustomerProfile/GetCustomerAgent').then((r) => r.data),

  registerAgent: (data: CustomerAgent) =>
    client.post<ExecutionResult>('/CustomerProfile/RegisterCustomerAgent', data).then((r) => r.data),

  updateAgent: (data: CustomerAgent) =>
    client.put<ExecutionResult>('/CustomerProfile/UpdateCustomerAgent', data).then((r) => r.data),

  // Contracts
  getContracts: () =>
    client.post<ExecutionResult<ContractResult[]>>('/Contract/GetContractList').then((r) => r.data),

  submitWarranty: (data: SubmitWarrantyRequest) =>
    client.post<ExecutionResult>('/Contract/SubmitWarranty', data).then((r) => r.data),

  // Bill Analysis
  manualBillAnalysis: (data: ManualBillRequest) =>
    client.post<ExecutionResult<BillAnalysisResult>>('/BillCalculation/ManualAnalysis', data).then((r) => r.data),
  manualOptimalPurchaseCurve: (data: ManualBillRequest) =>
    client.post<ExecutionResult<OptimalPurchaseCurveResult>>('/BillCalculation/ManualOptimalPurchaseCurve', data).then((r) => r.data),
  advancedBillAnalysis: (data: object) =>
    client.post<ExecutionResult<AdvancedBillAnalysisResult>>('/BillCalculation/AdvancedAnalysis', data).then((r) => r.data),

  getSubscriptionRate: (subscriptionId: number, year: number, month: number) =>
    client.get<ExecutionResult>(`/BillCalculation/GetSubscriptionRate/${subscriptionId}/${year}/${month}`).then((r) => r.data),

  getBillHistory: (subscriptionId: number) =>
    client.get<ExecutionResult>(`/BillCalculation/GetBillHistory/${subscriptionId}`).then((r) => r.data),

  // Tariff code selection
  updateTariffCode: (tariffCodeOptionId: number | null) =>
    client.put<ExecutionResult>('/CustomerProfile/UpdateTariffCode', { tariffCodeOptionId }).then((r) => r.data),

  // Address delete
  deleteAddress: (id: number) =>
    client.delete<ExecutionResult>(`/CustomerProfile/DeleteAddress/${id}`).then((r) => r.data),

  // Tickets
  getTickets: () =>
    client.get<ExecutionResult<TicketSummary[]>>('/CustomerProfile/GetTicket').then((r) => r.data),

  getTicketMessages: (ticketId: number) =>
    client.get<ExecutionResult<TicketMessage[]>>(`/CustomerProfile/GetTicketById/${ticketId}`).then((r) => r.data),

  createTicket: (data: CreateTicketRequest) =>
    client.post<ExecutionResult>('/CustomerProfile/CreateTicket', data).then((r) => r.data),

  addTicketMessage: (data: AddTicketMessageRequest) =>
    client.post<ExecutionResult>('/CustomerProfile/AddTicketMessage', data).then((r) => r.data),

  // Orders
  getMyOrders: () =>
    client.get<ExecutionResult<OrderResult[]>>('/Order/GetMyOrders').then((r) => r.data),

  getOrderDetail: (id: number) =>
    client.get<ExecutionResult<OrderDetailResult>>(`/Order/GetOrderDetail/${id}`).then((r) => r.data),

  createOrder: (data: CreateOrderRequest) =>
    client.post<ExecutionResult<number>>('/Order/CreateOrder', data).then((r) => r.data),

  submitPayment: (data: SubmitPaymentRequest) =>
    client.post<ExecutionResult>('/Order/SubmitPayment', data).then((r) => r.data),

  // Announcements
  getAnnouncements: () =>
    client.get<ExecutionResult<AnnouncementItem[]>>('/Lookup/GetActiveAnnouncements').then((r) => r.data),

  getProfileMeta: () =>
    client.get<ExecutionResult<{ identityDocFileId: string | null }>>('/CustomerProfile/GetProfileMeta').then((r) => r.data),

  updateIdentityDoc: (fileId: string | null) =>
    client.post<ExecutionResult>('/CustomerProfile/UpdateIdentityDoc', { fileId }).then((r) => r.data),
}
