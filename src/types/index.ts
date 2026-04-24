export interface ExecutionResult<T = unknown> {
  type: 'Success' | 'Warning' | 'Danger' | 'Info'
  code: number
  caption: string | null
  message: string | null
  result: T
}

export interface PaginationResult<T = unknown> {
  pageNumber: number
  pageSize: number
  totalPages: number
  totalRecords: number
  filteredCount: number
  data: T[]
}

// Auth
export interface LoginRequest {
  mobile: string
  password: string
}

export interface LoginResponse {
  token: string
  role: 'admin' | 'customer'
  fullName: string
}

// Public self-registration
export interface PublicRegisterReal {
  firstName: string
  lastName: string
  nationalCode: string
  mobile: string
  password: string
  familiarityType: number
}

export interface PublicRegisterLegal {
  companyName: string
  nationalId: string
  economicCode: string
  ceoFullName: string
  ceoMobile: string
  mobile: string
  password: string
  familiarityType: number
}

// Customer
export interface CustomerReal {
  id?: number
  firstName: string
  lastName: string
  nationalCode: string
  mobile: string
  familiarityType?: number
  customerTypeId?: number
}

export interface CustomerLegal {
  id?: number
  companyName: string
  nationalId: string
  economicCode: string
  ceo_FullName: string
  ceo_Mobile: string
  familiarityType?: number
  customerTypeId?: number
}

export interface AddressResult {
  id: number
  powerEntityName: string
  cityTitle: string
  provinceTitle: string
  mainAddress: string
  postalCode: string
}

export interface SubscriptionResult {
  id: number
  billIdentifier: string
  contractCapacityKw: number | null
  addressId: number
  mainAddress: string
  powerEntity: string
}

export interface AddSubscriptionRequest {
  addressId: number
  billIdentifier: string
  contractCapacityKw: number | null
}

export interface AddAddress {
  customerProfileId: number
  powerEntityId: number
  cityId: number
  mainAddress: string
  postalCode: string
}

export interface CustomerAgent {
  customerProfileId: number
  fullName: string
  mobile: string
  password: string
}

// Contracts
export interface ContractResult {
  id: number
  contractNumber: string
  contractRate: number
  statusId: number
  status: string
  subscription: string
  startDate: string
  endDate: string
  address: string
  warrantyAmount: number
  warrantyType: string
  warrantyTypeId: number
  warrantyFileId: string | null
}

export interface SubmitWarrantyRequest {
  contractId: number
  amount: number
  typeId: number
  fileId?: string | null
}

export interface ContractConfirm {
  contractId: number
  statusId: number
}

// Admin Contract
export interface AdminContract {
  id: number
  contractNumber: string
  contractRate: number
  statusId: number
  subscriptionId: number
  startDate: string | null
  endDate: string | null
  amount?: number
  fileId?: string | null
  typeId?: number
  customerNationalId?: string
  status?: string
  warrantyFileId?: string | null
}

// Bills
export interface BillAnalysis {
  period: string
  totalConsumption: number
  matinCost: number
  backupCost: number
  saving: number
  savingPercent: number
  demandPenalty: number
}

export interface BillBand {
  name: string
  actualKwh: number
  contractedKwh: number
  excessKwh: number
  deficitKwh: number
  marketRateRial: number
  penaltyRial: number
  creditRial: number
}

export interface BillAnalysisResult {
  monthName: string
  year: number
  totalConsumption: number
  contractCapacityKw: number
  contractedEnergyKwh: number
  contractRateRialPerKwh: number
  peakHoursPerDay: number
  midHoursPerDay: number
  lowHoursPerDay: number
  bands: BillBand[]
  marketPeakRate: number
  marketMidRate: number
  marketLowRate: number
  backupRate: number
  totalDifferentialRial: number
  totalCreditRial: number
  article16Rial: number
  fuelFeeRial: number
  matinBillRial: number
  withoutMatinBillRial: number
  withMatinBillRial: number
  savingRial: number
  savingPercent: number
}

export interface ManualBillRequest {
  subscriptionId: number
  year: number
  month: number
  peakKwh: number
  midKwh: number
  lowKwh: number
  fridayPeakKwh: number
}

// Tickets
export interface TicketSummary {
  id: number
  subject: string
  status: string
  statusId: number
  createdAt: string | null
  messageCount: number
}

export interface TicketMessage {
  id: number
  body: string | null
  fileId: string | null
  senderName: string
  isAdmin: boolean
  createdAt: string | null
}

export interface CreateTicketRequest {
  subject: string
  body: string
}

export interface AddTicketMessageRequest {
  ticketId: number
  body: string
  fileId?: string | null
}

export interface UpdateTicketStatusRequest {
  ticketId: number
  statusId: number
}

// Announcements
export interface AnnouncementItem {
  id: number
  title: string
  contents: string
  publishDate: string
}

export interface AdminAnnouncement {
  id: number
  title: string
  contents: string
  publishDate: string | null
  finishDate: string | null
}

// Admin Tickets
export interface AdminTicketSummary {
  id: number
  subject: string
  status: string
  statusId: number
  customerName: string
  createdAt: string | null
  messageCount: number
}

// Admin Subscription
export interface AdminSubscription {
  id: number
  billIdentifier: string
  contractCapacityKw: number | null
  addressId: number
  mainAddress?: string
  city?: string
}

// Admin tables
export interface AdminLegalCustomer {
  id: number
  nationalId: string
  ceoFullName: string
  companyName: string
  economicCode?: string
  ceoMobile?: string
  familiarityTitle?: string
  familiarityType?: number
  customerTypeId?: number
  isActive?: boolean
}

export interface AdminRealCustomer {
  id: number
  nationalCode: string
  firstName: string
  lastName: string
  mobile: string
  familiarityType?: number
  customerTypeId?: number
  isActive?: boolean
}

export interface AdminAddress {
  id: number
  city?: string
  province?: string
  cityId?: number
  powerEntityId?: number
  postalCode: string
  mainAddress: string
  customerProfileId?: number
}

// Monthly Market Rates
export interface MonthlyMarketRate {
  id: number
  year: number
  month: number
  marketPeak: number
  marketMid: number
  marketLow: number
  backupRate: number
  boardPeak: number
  boardMid: number
  boardLow: number
  greenBoardRate: number
  article16Rate: number
  fuelFee: number
  industrialTariffBase: number
  executiveTariffBase: number
}

// Tariff
export interface Tariff {
  tariffId: number
  tariffTypeId: number
  tariffType?: string
  customerTypeId: number
  customerType?: string
  powerEntitiesId: number
  powerEntity?: string
  effectiveFrom: string | null
}

// TariffSlab
export interface TariffSlab {
  id: number
  tariffId: number
  fromKwh: number
  toKwh: number | null
  multiplier: number
}

// TOU Schedule
export interface HourEntry {
  hourNumber: number
  toutypeId: number
}

// Pending Registrations
export interface PendingUser {
  id: number
  fullName: string | null
  mobile: string
  customerProfileId: number | null
  customerType: number | null
  realName: string | null
  legalName: string | null
  nationalCode: string | null
  nationalId: string | null
}

// Bill Analysis Report (admin)
export interface AdminBillReport {
  id: number
  subscriptionId: number
  billIdentifier: string
  year: number | null
  month: number | null
  peakCons: number | null
  midCons: number | null
  lowCons: number | null
  costWithoutMatin: number | null
  costWithMatin: number | null
  netSaving: number | null
  createdAt: string | null
}
