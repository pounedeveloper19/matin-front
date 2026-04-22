import client from './client'
import type {
  ExecutionResult,
  CustomerReal,
  CustomerLegal,
  AddAddress,
  CustomerAgent,
  ContractResult,
  ContractConfirm,
  BillAnalysis,
  BillAnalysisResult,
  ManualBillRequest,
  TicketSummary,
  TicketMessage,
  AddressResult,
  SubscriptionResult,
  AddSubscriptionRequest,
  PublicRegisterReal,
  PublicRegisterLegal,
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

  // Contracts
  getContracts: () =>
    client.post<ExecutionResult<ContractResult[]>>('/Contract/GetContractList').then((r) => r.data),

  confirmContract: (contractId: number, statusId: number) =>
    client
      .put<ExecutionResult>(`/Contract/ConfirmContract/${contractId}`, { contractId, statusId } as ContractConfirm)
      .then((r) => r.data),

  // Bill Analysis
  getBillAnalysis: (subscriptionId: number) =>
    client
      .get<ExecutionResult<BillAnalysis>>(`/BillCalculation/GetFullBillAnalysis/${subscriptionId}`)
      .then((r) => r.data),

  manualBillAnalysis: (data: ManualBillRequest) =>
    client.post<ExecutionResult<BillAnalysisResult>>('/BillCalculation/ManualAnalysis', data).then((r) => r.data),

  getBillHistory: (subscriptionId: number) =>
    client.get<ExecutionResult>(`/BillCalculation/GetBillHistory/${subscriptionId}`).then((r) => r.data),

  // Tickets
  getTickets: () =>
    client.get<ExecutionResult<TicketSummary[]>>('/CustomerProfile/GetTicket').then((r) => r.data),

  getTicketMessages: (ticketId: number) =>
    client.get<ExecutionResult<TicketMessage[]>>(`/CustomerProfile/GetTicketById/${ticketId}`).then((r) => r.data),
}
