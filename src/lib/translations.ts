/**
 * Translation system for the AML application
 *
 * Supports Spanish (es) and English (en) languages.
 * All UI text should be extracted here for proper i18n support.
 */

export type Language = "es" | "en";

export const translations = {
	es: {
		// Common
		loading: "Cargando...",
		save: "Guardar",
		cancel: "Cancelar",
		delete: "Eliminar",
		edit: "Editar",
		create: "Crear",
		search: "Buscar...",
		noResults: "No se encontraron resultados",
		actions: "Acciones",
		confirm: "Confirmar",
		back: "Volver",
		next: "Siguiente",
		previous: "Anterior",
		close: "Cerrar",
		yes: "Sí",
		no: "No",
		optional: "Opcional",
		required: "Requerido",

		// Navigation
		navDashboard: "Dashboard",
		navClients: "Clientes",
		navTransactions: "Transacciones",
		navAlerts: "Alertas",
		navReports: "Reportes",
		navSettings: "Configuración",
		navTeam: "Equipo",
		navTransaction: "Transacción",
		navOrganization: "Organización",
		navComingSoon: "Pronto",
		navRiskModels: "Modelos de Riesgo",
		navHistory: "Historial",
		navAnalysis: "Análisis",

		// Breadcrumbs
		breadcrumbHome: "Inicio",
		breadcrumbNew: "Nuevo",
		breadcrumbEdit: "Editar",

		// Sidebar
		sidebarOrganizations: "Organizaciones",
		sidebarCreateOrg: "Crear organización",
		sidebarProfile: "Perfil",
		sidebarLogout: "Cerrar sesión",
		sidebarUser: "Usuario",

		// Organization Dialog
		orgNewTitle: "Nueva organización",
		orgNewDescription:
			"Crea una organización para gestionar tu equipo y datos.",
		orgNamePlaceholder: "Mi organización",
		orgSlugHint: "Usado en la URL",
		orgSlugPlaceholder: "mi-organizacion",
		orgSlugFinal: "Slug final:",
		orgLogoLabel: "Logo (URL opcional)",
		orgCreating: "Creando...",
		orgSwitching: "Cambiando organización...",
		orgSwitchSuccess: "ahora está activa.",
		orgCreateSuccess: "ha sido creada y está activa.",

		// Theme
		themeLight: "Claro",
		themeDark: "Oscuro",
		themeSystem: "Sistema",

		// Language
		languageSpanish: "Español",
		languageEnglish: "English",

		// Stats
		statsOpenAlerts: "Alertas Abiertas",
		statsUrgentReviews: "Revisiones Urgentes",
		statsTotalClients: "Total Clientes",
		statsTotalTransactions: "Total Transacciones",
		statsTotalAlerts: "Total Alertas",
		statsActiveAlerts: "Alertas Activas",
		statsResolvedAlerts: "Alertas Resueltas",
		statsReportsGenerated: "Reportes Generados",

		// Clients
		clientsTitle: "Clientes",
		clientsSubtitle: "Gestión y monitoreo de clientes",
		clientsNew: "Nuevo Cliente",
		clientsSearch: "Buscar clientes...",
		clientsSearchPlaceholder: "Buscar por nombre, RFC, email...",
		clientsLoading: "Cargando clientes...",
		clientsLoadError: "No se pudieron cargar los clientes.",
		clientsLoadMoreError: "No se pudieron cargar más clientes.",
		clientName: "Nombre",
		clientType: "Tipo",
		clientStatus: "Estado",
		clientCreatedAt: "Fecha de registro",
		clientPersonPhysical: "Persona Física",
		clientPersonMoral: "Persona Moral",
		clientTrust: "Fideicomiso",
		clientNoClients: "No hay clientes registrados",
		clientNoClientsDesc: "Crea tu primer cliente para comenzar.",
		clientDeleting: "Eliminando cliente...",
		clientDeleted: "ha sido eliminado del sistema.",
		clientReportDownloaded: "Reporte descargado para",
		clientMarkedSuspicious: "ha sido marcado como sospechoso.",
		clientDeleteTitle: "¿Eliminar cliente?",
		clientDeleteDescription:
			"Esta acción eliminará permanentemente el cliente del sistema. Esta acción no se puede deshacer.",

		// Table Headers
		tableClient: "Cliente",
		tableContact: "Contacto",
		tableLocation: "Ubicación",
		tableRegistration: "Registro",
		tableDate: "Fecha",
		tableAmount: "Monto",
		tableStatus: "Estado",
		tablePriority: "Prioridad",
		tableType: "Tipo",

		// Filters
		filterType: "Tipo",
		filterState: "Estado",
		filterStatus: "Estado",
		filterPriority: "Prioridad",
		filterDate: "Fecha",

		// Actions
		actionViewDetail: "Ver detalle",
		actionEditClient: "Editar cliente",
		actionGenerateReport: "Generar Reporte",
		actionViewTransactions: "Ver transacciones",
		actionViewAlerts: "Ver alertas",
		actionMarkSuspicious: "Marcar como Sospechoso",

		// Transactions
		transactionsTitle: "Transacciones",
		transactionsSubtitle: "Gestión de transacciones de vehículos",
		transactionsNew: "Nueva Transacción",
		transactionsSearch: "Buscar transacciones...",
		transactionDate: "Fecha",
		transactionAmount: "Monto",
		transactionType: "Tipo",
		transactionClient: "Cliente",
		transactionNoTransactions: "No hay transacciones registradas",
		transactionNoTransactionsDesc:
			"Registra tu primera transacción para comenzar.",
		statsTransactionsToday: "Transacciones Hoy",
		statsSuspiciousTransactions: "Transacciones Sospechosas",
		statsTotalVolume: "Volumen Total",
		transactionsLoading: "Cargando transacciones...",
		transactionsLoadError: "No se pudieron cargar las transacciones.",
		transactionsLoadMoreError: "No se pudieron cargar más transacciones.",
		transactionsSearchPlaceholder: "Buscar por cliente, marca, modelo...",

		// Alerts
		alertsTitle: "Alertas",
		alertsSubtitle: "Monitoreo y gestión de alertas AML",
		alertsNew: "Nueva Alerta",
		alertsSearch: "Buscar alertas...",
		alertsSearchPlaceholder: "Buscar por regla, cliente...",
		alertsLoading: "Cargando alertas...",
		alertsLoadError: "No se pudieron cargar las alertas.",
		alertsLoadMoreError: "No se pudieron cargar más alertas.",
		alertStatus: "Estado",
		alertPriority: "Prioridad",
		alertNoAlerts: "No hay alertas",
		alertNoAlertsDesc: "No se han generado alertas de cumplimiento.",
		alertStatusDetected: "Detectadas",
		alertStatusFileGenerated: "Archivo Generado",
		alertStatusSubmitted: "Enviadas",
		alertStatusOverdue: "Vencidas",
		alertStatusCancelled: "Canceladas",
		alertSeverityLow: "Baja",
		alertSeverityMedium: "Media",
		alertSeverityHigh: "Alta",
		alertSeverityCritical: "Crítica",

		// Reports
		reportsTitle: "Reportes",
		reportsGenerate: "Generar reporte",
		reportsSearch: "Buscar reportes...",
		reportType: "Tipo",
		reportPeriod: "Período",
		reportNoReports: "No hay reportes",
		reportNoReportsDesc: "Genera tu primer reporte para comenzar.",

		// Settings
		settingsTitle: "Configuración",
		settingsGeneral: "General",
		settingsOrganization: "Organización",
		settingsNotifications: "Notificaciones",
		settingsSecurity: "Seguridad",

		// Team
		teamTitle: "Equipo",
		teamInvite: "Invitar miembro",
		teamSearch: "Buscar miembros...",
		teamRole: "Rol",
		teamOwner: "Propietario",
		teamAdmin: "Administrador",
		teamMember: "Miembro",
		teamNoMembers: "No hay miembros",
		teamNoMembersDesc: "Invita a tu primer miembro del equipo.",

		// Forms
		formName: "Nombre",
		formEmail: "Correo electrónico",
		formPhone: "Teléfono",
		formAddress: "Dirección",
		formCity: "Ciudad",
		formState: "Estado",
		formCountry: "País",
		formZipCode: "Código postal",
		formRfc: "RFC",
		formCurp: "CURP",
		formBirthDate: "Fecha de nacimiento",
		formGender: "Género",
		formNationality: "Nacionalidad",
		formOccupation: "Ocupación",

		// Phone Input
		phoneInputSearchCountry: "Buscar país...",
		phoneInputNoCountryFound: "No se encontró ningún país.",

		// Validation
		validationRequired: "Este campo es requerido",
		validationInvalidEmail: "Correo electrónico inválido",
		validationMinLength: "Mínimo {min} caracteres",
		validationMaxLength: "Máximo {max} caracteres",

		// Errors
		errorGeneric: "Ha ocurrido un error",
		errorNotFound: "No encontrado",
		errorUnauthorized: "No autorizado",
		errorForbidden: "Acceso denegado",
		errorServerError: "Error del servidor",
		errorNetworkError: "Error de conexión",
		errorLoadingStats: "No se pudieron cargar las estadísticas.",
		errorLoadingData: "No se pudieron cargar los datos.",

		// Success messages
		successSaved: "Guardado exitosamente",
		successDeleted: "Eliminado exitosamente",
		successCreated: "Creado exitosamente",
		successUpdated: "Actualizado exitosamente",
	},
	en: {
		// Common
		loading: "Loading...",
		save: "Save",
		cancel: "Cancel",
		delete: "Delete",
		edit: "Edit",
		create: "Create",
		search: "Search...",
		noResults: "No results found",
		actions: "Actions",
		confirm: "Confirm",
		back: "Back",
		next: "Next",
		previous: "Previous",
		close: "Close",
		yes: "Yes",
		no: "No",
		optional: "Optional",
		required: "Required",

		// Navigation
		navDashboard: "Dashboard",
		navClients: "Clients",
		navTransactions: "Transactions",
		navAlerts: "Alerts",
		navReports: "Reports",
		navSettings: "Settings",
		navTeam: "Team",
		navTransaction: "Transaction",
		navOrganization: "Organization",
		navComingSoon: "Coming soon",
		navRiskModels: "Risk Models",
		navHistory: "History",
		navAnalysis: "Analysis",

		// Breadcrumbs
		breadcrumbHome: "Home",
		breadcrumbNew: "New",
		breadcrumbEdit: "Edit",

		// Sidebar
		sidebarOrganizations: "Organizations",
		sidebarCreateOrg: "Create organization",
		sidebarProfile: "Profile",
		sidebarLogout: "Log out",
		sidebarUser: "User",

		// Organization Dialog
		orgNewTitle: "New organization",
		orgNewDescription: "Create an organization to manage your team and data.",
		orgNamePlaceholder: "My organization",
		orgSlugHint: "Used in the URL",
		orgSlugPlaceholder: "my-organization",
		orgSlugFinal: "Final slug:",
		orgLogoLabel: "Logo (optional URL)",
		orgCreating: "Creating...",
		orgSwitching: "Switching organization...",
		orgSwitchSuccess: "is now active.",
		orgCreateSuccess: "has been created and is now active.",

		// Theme
		themeLight: "Light",
		themeDark: "Dark",
		themeSystem: "System",

		// Language
		languageSpanish: "Español",
		languageEnglish: "English",

		// Stats
		statsOpenAlerts: "Open Alerts",
		statsUrgentReviews: "Urgent Reviews",
		statsTotalClients: "Total Clients",
		statsTotalTransactions: "Total Transactions",
		statsTotalAlerts: "Total Alerts",
		statsActiveAlerts: "Active Alerts",
		statsResolvedAlerts: "Resolved Alerts",
		statsReportsGenerated: "Reports Generated",

		// Clients
		clientsTitle: "Clients",
		clientsSubtitle: "Client management and monitoring",
		clientsNew: "New Client",
		clientsSearch: "Search clients...",
		clientsSearchPlaceholder: "Search by name, Tax ID, email...",
		clientsLoading: "Loading clients...",
		clientsLoadError: "Could not load clients.",
		clientsLoadMoreError: "Could not load more clients.",
		clientName: "Name",
		clientType: "Type",
		clientStatus: "Status",
		clientCreatedAt: "Registration date",
		clientPersonPhysical: "Individual",
		clientPersonMoral: "Legal Entity",
		clientTrust: "Trust",
		clientNoClients: "No clients registered",
		clientNoClientsDesc: "Create your first client to get started.",
		clientDeleting: "Deleting client...",
		clientDeleted: "has been deleted from the system.",
		clientReportDownloaded: "Report downloaded for",
		clientMarkedSuspicious: "has been marked as suspicious.",
		clientDeleteTitle: "Delete client?",
		clientDeleteDescription:
			"This action will permanently delete the client from the system. This action cannot be undone.",

		// Table Headers
		tableClient: "Client",
		tableContact: "Contact",
		tableLocation: "Location",
		tableRegistration: "Registration",
		tableDate: "Date",
		tableAmount: "Amount",
		tableStatus: "Status",
		tablePriority: "Priority",
		tableType: "Type",

		// Filters
		filterType: "Type",
		filterState: "State",
		filterStatus: "Status",
		filterPriority: "Priority",
		filterDate: "Date",

		// Actions
		actionViewDetail: "View detail",
		actionEditClient: "Edit client",
		actionGenerateReport: "Generate Report",
		actionViewTransactions: "View transactions",
		actionViewAlerts: "View alerts",
		actionMarkSuspicious: "Mark as Suspicious",

		// Transactions
		transactionsTitle: "Transactions",
		transactionsSubtitle: "Vehicle transaction management",
		transactionsNew: "New Transaction",
		transactionsSearch: "Search transactions...",
		transactionDate: "Date",
		transactionAmount: "Amount",
		transactionType: "Type",
		transactionClient: "Client",
		transactionNoTransactions: "No transactions registered",
		transactionNoTransactionsDesc:
			"Register your first transaction to get started.",
		statsTransactionsToday: "Transactions Today",
		statsSuspiciousTransactions: "Suspicious Transactions",
		statsTotalVolume: "Total Volume",
		transactionsLoading: "Loading transactions...",
		transactionsLoadError: "Could not load transactions.",
		transactionsLoadMoreError: "Could not load more transactions.",
		transactionsSearchPlaceholder: "Search by client, brand, model...",

		// Alerts
		alertsTitle: "Alerts",
		alertsSubtitle: "AML alert monitoring and management",
		alertsNew: "New Alert",
		alertsSearch: "Search alerts...",
		alertsSearchPlaceholder: "Search by rule, client...",
		alertsLoading: "Loading alerts...",
		alertsLoadError: "Could not load alerts.",
		alertsLoadMoreError: "Could not load more alerts.",
		alertStatus: "Status",
		alertPriority: "Priority",
		alertNoAlerts: "No alerts",
		alertNoAlertsDesc: "No compliance alerts have been generated.",
		alertStatusDetected: "Detected",
		alertStatusFileGenerated: "File Generated",
		alertStatusSubmitted: "Submitted",
		alertStatusOverdue: "Overdue",
		alertStatusCancelled: "Cancelled",
		alertSeverityLow: "Low",
		alertSeverityMedium: "Medium",
		alertSeverityHigh: "High",
		alertSeverityCritical: "Critical",

		// Reports
		reportsTitle: "Reports",
		reportsGenerate: "Generate report",
		reportsSearch: "Search reports...",
		reportType: "Type",
		reportPeriod: "Period",
		reportNoReports: "No reports",
		reportNoReportsDesc: "Generate your first report to get started.",

		// Settings
		settingsTitle: "Settings",
		settingsGeneral: "General",
		settingsOrganization: "Organization",
		settingsNotifications: "Notifications",
		settingsSecurity: "Security",

		// Team
		teamTitle: "Team",
		teamInvite: "Invite member",
		teamSearch: "Search members...",
		teamRole: "Role",
		teamOwner: "Owner",
		teamAdmin: "Admin",
		teamMember: "Member",
		teamNoMembers: "No members",
		teamNoMembersDesc: "Invite your first team member.",

		// Forms
		formName: "Name",
		formEmail: "Email",
		formPhone: "Phone",
		formAddress: "Address",
		formCity: "City",
		formState: "State",
		formCountry: "Country",
		formZipCode: "Zip code",
		formRfc: "Tax ID (RFC)",
		formCurp: "Personal ID (CURP)",
		formBirthDate: "Birth date",
		formGender: "Gender",
		formNationality: "Nationality",
		formOccupation: "Occupation",

		// Phone Input
		phoneInputSearchCountry: "Search country...",
		phoneInputNoCountryFound: "No country found.",

		// Validation
		validationRequired: "This field is required",
		validationInvalidEmail: "Invalid email address",
		validationMinLength: "Minimum {min} characters",
		validationMaxLength: "Maximum {max} characters",

		// Errors
		errorGeneric: "An error occurred",
		errorNotFound: "Not found",
		errorUnauthorized: "Unauthorized",
		errorForbidden: "Access denied",
		errorServerError: "Server error",
		errorNetworkError: "Connection error",
		errorLoadingStats: "Could not load statistics.",
		errorLoadingData: "Could not load data.",

		// Success messages
		successSaved: "Saved successfully",
		successDeleted: "Deleted successfully",
		successCreated: "Created successfully",
		successUpdated: "Updated successfully",
	},
} as const;

export type TranslationKeys = keyof (typeof translations)["es"];

/**
 * Gets the locale string for a language
 */
export function getLocaleForLanguage(lang: Language): string {
	switch (lang) {
		case "es":
			return "es-ES";
		case "en":
			return "en-US";
	}
}

/**
 * Detects the browser language and returns the closest supported language
 */
export function detectBrowserLanguage(): Language {
	if (typeof navigator === "undefined") return "es";

	const browserLang = navigator.language.toLowerCase();

	if (browserLang.startsWith("en")) return "en";
	if (browserLang.startsWith("es")) return "es";

	return "es"; // Default to Spanish
}
